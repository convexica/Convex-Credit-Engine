import { AssetPool, Tranche, Scenario, CashFlowPeriod, TrancheType } from '../types';

/**
 * Simplified Sequential Pay Waterfall Engine
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

  // Calculate Monthly EMI for the pool
  // Formula: [P * r * (1+r)^n] / [(1+r)^n - 1]
  const emi = (monthlyRate > 0) 
    ? (pool.principalBalance * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    : pool.principalBalance / totalMonths;

  // Monthly breakdown of annual rates
  const smm = 1 - Math.pow(1 - scenario.cpr / 100, 1 / 12); // Single Monthly Mortality (Prepay)
  const mdr = 1 - Math.pow(1 - scenario.cdr / 100, 1 / 12); // Monthly Default Rate

  for (let t = 1; t <= totalMonths + 12; t++) { // Run a bit longer to flush tail
    if (currentPoolBalance <= 100) break;

    const startBalance = currentPoolBalance;
    
    // 1. Asset Performance
    const scheduledInterest = startBalance * monthlyRate;
    
    // Scheduled Principal based on EMI
    // Principal = EMI - Interest
    let scheduledPrincipal = (startBalance > 0) ? Math.max(0, emi - scheduledInterest) : 0;
    scheduledPrincipal = Math.min(startBalance, scheduledPrincipal);
    
    const defaults = startBalance * mdr;
    const prepayments = Math.max(0, (startBalance - scheduledPrincipal - defaults) * smm);
    
    const totalPrincipalAvailable = Math.min(startBalance, scheduledPrincipal + prepayments);
    const recovery = defaults * (1 - scenario.severity / 100);
    const loss = defaults * (scenario.severity / 100);

    const availableInterestCash = scheduledInterest;
    const availablePrincipalCash = totalPrincipalAvailable + recovery;

    currentPoolBalance = Math.max(0, startBalance - totalPrincipalAvailable - defaults);

    // 2. Waterfall Logic (Sequential)
    
    const periodFlow: CashFlowPeriod = {
      period: t,
      poolBalanceStart: startBalance,
      poolInterest: scheduledInterest,
      poolPrincipal: totalPrincipalAvailable,
      poolDefaultAmount: defaults,
      poolLoss: loss,
      poolRecovery: recovery,
      trancheCashflows: {}
    };

    // A. Pay Fees (Skipped for MVP)
    
    // B. Pay Interest (Senior -> Mezz -> Equity)
    let interestPot = availableInterestCash;
    
    currentTranches.forEach(tranche => {
      if (tranche.currentBalance > 0) {
        const couponPayment = tranche.currentBalance * (tranche.coupon / 100 / 12);
        const paidInterest = Math.min(interestPot, couponPayment);
        interestPot -= paidInterest;

        periodFlow.trancheCashflows[tranche.id] = {
            interest: paidInterest,
            principal: 0,
            balanceEnd: tranche.currentBalance,
            loss: 0
        };
      } else {
          periodFlow.trancheCashflows[tranche.id] = { interest: 0, principal: 0, balanceEnd: 0, loss: 0 };
      }
    });

    // Excess spread flows to Principal usually, or Equity as profit. 
    // For this model: Excess spread pays down Senior Principal (Turbo) or leaks to Equity.
    // Let's assume standard: Principal receipts pay Senior Principal, then Mezz, etc.
    // AND Excess Spread covers losses, then goes to Equity.
    
    let principalPot = availablePrincipalCash; 
    // Add remaining interest (Excess Spread) to principal pot for loss coverage or payment
    // Simplified: Excess spread simply goes to Equity Yield immediately if no losses? 
    // Let's stick to: Principal Pot pays Principal sequentially.
    
    // C. Pay Principal (Sequential: Senior -> Mezz -> Equity)
    currentTranches.forEach(tranche => {
        if (principalPot > 0 && tranche.currentBalance > 0) {
            const principalNeeded = tranche.currentBalance;
            const paidPrincipal = Math.min(principalPot, principalNeeded);
            
            periodFlow.trancheCashflows[tranche.id].principal = paidPrincipal;
            tranche.currentBalance -= paidPrincipal;
            periodFlow.trancheCashflows[tranche.id].balanceEnd = tranche.currentBalance;
            
            principalPot -= paidPrincipal;
        }
    });

    // D. Allocate Losses (Reverse Sequential: Equity -> Mezz -> Senior)
    let lossToAllocate = loss;
    [...currentTranches].reverse().forEach(tranche => {
        if (lossToAllocate > 0 && tranche.currentBalance > 0) {
            const allocated = Math.min(lossToAllocate, tranche.currentBalance);
            tranche.currentBalance -= allocated;
            lossToAllocate -= allocated;
            periodFlow.trancheCashflows[tranche.id].loss = allocated;
            periodFlow.trancheCashflows[tranche.id].balanceEnd = tranche.currentBalance;
        }
    });

    // E. Residual Cash (Excess Spread + Residual Principal) to Equity
    const equityTranche = currentTranches.find(t => t.type === TrancheType.EQUITY);
    if (equityTranche) {
        if (interestPot > 0) {
            periodFlow.trancheCashflows[equityTranche.id].interest += interestPot;
        }
        if (principalPot > 0) {
            periodFlow.trancheCashflows[equityTranche.id].interest += principalPot;
        }
    }

    periods.push(periodFlow);
  }

  return periods;
};

export const calculateWAL = (flows: CashFlowPeriod[], trancheId: string): number => {
    let totalPrincipal = 0;
    let weightedTime = 0;

    flows.forEach(p => {
        const flow = p.trancheCashflows[trancheId];
        if (flow && flow.principal > 0) {
            totalPrincipal += flow.principal;
            weightedTime += flow.principal * p.period; // Month * Amount
        }
    });

    if (totalPrincipal === 0) return 0;
    return (weightedTime / totalPrincipal) / 12; // In Years
};

/**
 * Simple IRR calculation using Bisection Method
 * Returns annualized yield (Monthly rate * 12)
 */
export const calculateIRR = (initialInvestment: number, monthlyFlows: number[]): number => {
    if (initialInvestment <= 0 || monthlyFlows.length === 0) return 0;

    const npv = (rate: number) => {
        let total = -initialInvestment;
        for (let i = 0; i < monthlyFlows.length; i++) {
            total += monthlyFlows[i] / Math.pow(1 + rate, i + 1);
        }
        return total;
    };

    // Bisection method
    let low = -0.99;
    let high = 1.0; // 100% monthly is huge
    let guess = 0.01;
    
    // Check if a solution exists in range
    if (npv(low) * npv(high) > 0) {
        // If high is not enough, try higher
        high = 10.0;
        if (npv(low) * npv(high) > 0) return 0;
    }

    for (let i = 0; i < 40; i++) {
        guess = (low + high) / 2;
        if (npv(guess) > 0) {
            low = guess;
        } else {
            high = guess;
        }
    }

    return guess * 12 * 100; // Annualized percentage
};
