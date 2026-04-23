import { AssetPool, Tranche, Scenario, CashFlowPeriod, TrancheType } from '@/types';

/**
 * Simplified Sequential Pay Waterfall Engine with Recovery Lag
 */
export const runCashFlowEngine = (
  pool: AssetPool,
  tranches: Tranche[],
  scenario: Scenario
): CashFlowPeriod[] => {
  const periods: CashFlowPeriod[] = [];
  let currentPoolBalance = pool.principalBalance;
  let currentTranches = tranches.map(t => ({ ...t, currentBalance: t.originalBalance }));

  const monthlyRate = pool.wac / 100 / 12;
  const totalMonths = pool.wam;
  const servicingFeeRate = (scenario.servicingFee / 100) / 12;
  const recoveryLag = scenario.recoveryLag;

  // Recovery Queue: [{ periodDue: number, amount: number }]
  const recoveryQueue: { periodDue: number, amount: number }[] = [];

  // Calculate Monthly EMI for the pool
  const emi = (monthlyRate > 0) 
    ? (pool.principalBalance * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    : pool.principalBalance / totalMonths;

  // Monthly breakdown of annual rates
  const smm = 1 - Math.pow(1 - scenario.cpr / 100, 1 / 12); // Single Monthly Mortality (Prepay)
  const mdr = 1 - Math.pow(1 - scenario.cdr / 100, 1 / 12); // Monthly Default Rate

  // Period 0: Initial State (Closing)
  const p0: CashFlowPeriod = {
    period: 0,
    poolBalanceStart: pool.principalBalance,
    poolBalanceEnd: pool.principalBalance,
    poolInterest: 0,
    poolPrincipal: 0,
    poolDefaultAmount: 0,
    poolLoss: 0,
    poolRecovery: 0,
    excessSpread: 0,
    trancheCashflows: {}
  };
  currentTranches.forEach(t => {
      p0.trancheCashflows[t.id] = { interest: 0, principal: 0, balanceEnd: t.originalBalance, loss: 0 };
  });
  periods.push(p0);

  let cumulativeDefaults = 0;
  const initialPoolBalance = pool.principalBalance;

  for (let t = 1; t <= totalMonths + 24; t++) { // Extra time for recovery tail
    if (currentPoolBalance <= 0.01 && recoveryQueue.length === 0) break;

    const startBalance = currentPoolBalance;
    
    // 1. Asset Performance
    const scheduledInterest = startBalance * monthlyRate;
    
    // Principal = EMI - Interest (Simplified amortization)
    let scheduledPrincipal = (startBalance > 0) ? Math.max(0, emi - scheduledInterest) : 0;
    scheduledPrincipal = Math.min(startBalance, scheduledPrincipal);
    
    const defaults = startBalance * mdr;
    cumulativeDefaults += defaults;
    const currentCumulativeDefaultPct = (cumulativeDefaults / initialPoolBalance) * 100;
    
    // Check Turbo Trigger
    const isTurboMode = scenario.turboTriggerPct ? (currentCumulativeDefaultPct >= scenario.turboTriggerPct) : false;

    const prepayments = Math.max(0, (startBalance - scheduledPrincipal - defaults) * smm);
    
    const totalPrincipalAvailable = Math.min(startBalance, scheduledPrincipal + prepayments);
    
    // Defaults go into recovery queue if lag > 0
    const grossLoss = defaults * (scenario.severity / 100);
    const grossRecovery = defaults * (1 - scenario.severity / 100);
    
    if (grossRecovery > 0) {
        recoveryQueue.push({ periodDue: t + recoveryLag, amount: grossRecovery });
    }

    // Check what recoveries are due this month
    let recoveryThisMonth = 0;
    while (recoveryQueue.length > 0 && recoveryQueue[0].periodDue <= t) {
        recoveryThisMonth += recoveryQueue.shift()!.amount;
    }

    const servicingFee = startBalance * servicingFeeRate;
    const availableInterestCash = Math.max(0, scheduledInterest - servicingFee);
    const availablePrincipalCash = totalPrincipalAvailable + recoveryThisMonth;

    currentPoolBalance = Math.max(0, startBalance - totalPrincipalAvailable - defaults);

    // 2. Waterfall Logic (Sequential)
    const periodFlow: CashFlowPeriod = {
      period: t,
      poolBalanceStart: startBalance,
      poolBalanceEnd: currentPoolBalance,
      poolInterest: scheduledInterest,
      poolPrincipal: totalPrincipalAvailable,
      poolDefaultAmount: defaults,
      poolLoss: grossLoss,
      poolRecovery: recoveryThisMonth,
      excessSpread: 0,
      trancheCashflows: {}
    };

    // B. Pay Interest (Sequential)
    let interestPot = availableInterestCash;
    currentTranches.forEach(tranche => {
      if (tranche.currentBalance > 0) {
        const couponPayment = tranche.currentBalance * (tranche.coupon / 100 / 12);
        const paidInterest = Math.min(interestPot, couponPayment);
        interestPot -= paidInterest;
        periodFlow.trancheCashflows[tranche.id] = { interest: paidInterest, principal: 0, balanceEnd: tranche.currentBalance, loss: 0 };
      } else {
        periodFlow.trancheCashflows[tranche.id] = { interest: 0, principal: 0, balanceEnd: 0, loss: 0 };
      }
    });

    // C. Pay Principal (Sequential)
    let principalPot = availablePrincipalCash; 
    currentTranches.forEach(tranche => {
        if (principalPot > 0 && tranche.currentBalance > 0) {
            const paidPrincipal = Math.min(principalPot, tranche.currentBalance);
            periodFlow.trancheCashflows[tranche.id].principal = paidPrincipal;
            tranche.currentBalance -= paidPrincipal;
            periodFlow.trancheCashflows[tranche.id].balanceEnd = tranche.currentBalance;
            principalPot -= paidPrincipal;
        }
    });

    // D. Allocate Losses (Reverse Sequential)
    // Note: Losses are recognized immediately even if recovery comes later
    let lossToAllocate = grossLoss;
    [...currentTranches].reverse().forEach(tranche => {
        if (lossToAllocate > 0 && tranche.currentBalance > 0) {
            const allocated = Math.min(lossToAllocate, tranche.currentBalance);
            tranche.currentBalance -= allocated;
            lossToAllocate -= allocated;
            periodFlow.trancheCashflows[tranche.id].loss = allocated;
            periodFlow.trancheCashflows[tranche.id].balanceEnd = tranche.currentBalance;
        }
    });

    // E. Residual Cash / Turbo Logic
    const totalResidual = interestPot + principalPot;
    periodFlow.excessSpread = totalResidual;

    if (isTurboMode) {
        // Redirection: Pay remaining cash to Senior-most tranche currently active
        const seniorTranche = currentTranches.find(t => t.type === TrancheType.SENIOR && t.currentBalance > 0);
        if (seniorTranche) {
            const turboPaid = Math.min(totalResidual, seniorTranche.currentBalance);
            periodFlow.trancheCashflows[seniorTranche.id].principal += turboPaid;
            seniorTranche.currentBalance -= turboPaid;
            periodFlow.trancheCashflows[seniorTranche.id].balanceEnd = seniorTranche.currentBalance;
        }
    } else {
        // Normal Sequential: Excess Spread to Equity
        const equityTranche = currentTranches.find(t => t.type === TrancheType.EQUITY);
        if (equityTranche) {
            periodFlow.trancheCashflows[equityTranche.id].interest += totalResidual;
        }
    }
    
    periods.push(periodFlow);
  }
  return periods;
};

// ... WAL and IRR helper functions remain unchanged
export const calculateWAL = (flows: CashFlowPeriod[], trancheId: string): number => {
    let totalPrincipal = 0;
    let weightedTime = 0;
    flows.forEach(p => {
        const flow = p.trancheCashflows[trancheId];
        if (flow && flow.principal > 0) {
            totalPrincipal += flow.principal;
            weightedTime += flow.principal * p.period;
        }
    });
    if (totalPrincipal === 0) return 0;
    return (weightedTime / totalPrincipal) / 12;
};

export const calculateIRR = (initialInvestment: number, monthlyFlows: number[]): number => {
    if (initialInvestment <= 0 || monthlyFlows.length === 0) return 0;
    const npv = (rate: number) => {
        let total = -initialInvestment;
        for (let i = 0; i < monthlyFlows.length; i++) {
            total += monthlyFlows[i] / Math.pow(1 + rate, i + 1);
        }
        return total;
    };
    let low = -0.99;
    let high = 10.0;
    let guess = 0.01;
    if (npv(low) * npv(high) > 0) return 0;
    for (let i = 0; i < 40; i++) {
        guess = (low + high) / 2;
        if (npv(guess) > 0) low = guess;
        else high = guess;
    }
    return guess * 12 * 100;
};

/**
 * Calculates the Break-even CDR for the senior-most tranche.
 * This is the maximum CDR the senior tranche can withstand before any principal loss.
 */
export const calculateBreakEvenCDR = (
  pool: AssetPool,
  tranches: Tranche[],
  scenario: Scenario
): number => {
  if (!tranches || tranches.length === 0) return 0;
  
  const seniorTranche = tranches.find(t => t.type === TrancheType.SENIOR) || tranches[0];
  const seniorId = seniorTranche.id;
  
  const getLoss = (testCdr: number) => {
    const flows = runCashFlowEngine(pool, tranches, { ...scenario, cdr: testCdr });
    return flows.reduce((sum, p) => sum + (p.trancheCashflows[seniorId]?.loss || 0), 0);
  };

  let low = 0;
  let high = 100;
  
  // If no loss at 99%, return >99%
  if (getLoss(99) <= 0.01) return 99.9;
  
  // Binary search for the cliff edge
  for (let i = 0; i < 12; i++) {
    let mid = (low + high) / 2;
    if (getLoss(mid) > 0.01) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return low;
};

/**
 * Calculates the Modified Duration for a tranche.
 * D_mod = Macaulay Duration / (1 + y/12)
 * Measures price sensitivity to yield changes.
 */
export const calculateModifiedDuration = (
    flows: CashFlowPeriod[],
    trancheId: string,
    annualYield: number, // Annualized monthly yield (%)
    priceAsPct: number,
    originalBalance: number
): number => {
    if (annualYield === 0 || flows.length === 0) return 0;

    const monthlyYield = annualYield / 100 / 12;
    
    let weightedPVTime = 0;
    let totalPV = 0;

    flows.forEach(p => {
        const flow = p.trancheCashflows[trancheId];
        if (flow) {
            const totalCashflow = flow.principal + flow.interest;
            if (totalCashflow > 0) {
                const years = p.period / 12;
                // PV using the calculated yield as the discount rate
                const pv = totalCashflow / Math.pow(1 + monthlyYield, p.period);
                weightedPVTime += years * pv;
                totalPV += pv;
            }
        }
    });

    if (totalPV === 0) return 0;
    
    const macaulayDuration = weightedPVTime / totalPV;
    return macaulayDuration / (1 + monthlyYield);
};
