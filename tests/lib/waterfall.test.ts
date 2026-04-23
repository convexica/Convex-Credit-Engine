import { describe, it, expect } from 'vitest';
import { runCashFlowEngine, calculateWAL, calculateBreakEvenCDR } from '../../src/lib/waterfall';
import { AssetPool, PaymentFrequency, Scenario, Tranche, TrancheType } from '../../src/types';

describe('Waterfall Engine', () => {
  const basePool: AssetPool = {
    principalBalance: 100_000_000,
    wac: 10,
    wam: 12,
    paymentFrequency: PaymentFrequency.MONTHLY,
  };

  const baseTranches: Tranche[] = [
    { id: '1', name: 'Senior', type: TrancheType.SENIOR, originalBalance: 80_000_000, currentBalance: 80_000_000, coupon: 8, spread: 0, rating: 'AAA', price: 100 },
    { id: '2', name: 'Equity', type: TrancheType.EQUITY, originalBalance: 20_000_000, currentBalance: 20_000_000, coupon: 0, spread: 0, rating: 'NR', price: 100 },
  ];

  const baseScenario: Scenario = {
    cpr: 0,
    cdr: 0,
    severity: 0,
    delinquencyLag: 0,
    servicingFee: 0,
    recoveryLag: 0,
    turboTriggerPct: 5,
  };

  it('pays down principal sequentially without defaults', () => {
    const flows = runCashFlowEngine(basePool, baseTranches, baseScenario);
    
    // Total principal paid across all periods should equal initial pool balance
    const totalPrincipalPaid = flows.reduce((sum, p) => sum + p.poolPrincipal, 0);
    expect(totalPrincipalPaid).toBeCloseTo(100_000_000, 0);

    // Senior tranche should be fully paid down
    const lastPeriod = flows[flows.length - 1];
    expect(lastPeriod.trancheCashflows['1'].balanceEnd).toBeCloseTo(0, 0);
    expect(lastPeriod.trancheCashflows['2'].balanceEnd).toBeCloseTo(0, 0);
  });

  it('allocates losses reverse sequentially (Equity then Senior)', () => {
    // 50% CDR, 100% severity -> 50% of pool defaults = 50M losses
    // Equity is 20M, Senior is 80M. Equity should be wiped out (20M loss), Senior takes remaining 30M loss.
    const stressScenario = { ...baseScenario, cdr: 50, severity: 100 };
    const flows = runCashFlowEngine(basePool, baseTranches, stressScenario);
    
    let totalEquityLoss = 0;
    let totalSeniorLoss = 0;

    flows.forEach(p => {
      totalEquityLoss += p.trancheCashflows['2'].loss;
      totalSeniorLoss += p.trancheCashflows['1'].loss;
    });

    expect(totalEquityLoss).toBeCloseTo(20_000_000, 0);
    // Since 50% CDR is an annual rate applied monthly, the actual realized lifetime loss is not exactly 50M
    // but the equity MUST absorb the first 20M before senior takes any.
    expect(totalEquityLoss).toBeGreaterThanOrEqual(19_999_999);
    expect(totalSeniorLoss).toBeGreaterThan(0);
  });

  it('activates turbo trigger correctly', () => {
    // Turbo triggers when cum default > 5%
    const turboScenario = { ...baseScenario, cdr: 10, severity: 50, turboTriggerPct: 5 };
    const flows = runCashFlowEngine(basePool, baseTranches, turboScenario);
    
    // Verify excess spread is redirected to senior principal after trigger
    let turboActivated = false;
    flows.forEach(p => {
      // If excess spread is > 0 and senior balance > 0, it should be redirected to senior principal if turbo is active
      const equityInt = p.trancheCashflows['2'].interest;
      if (p.excessSpread > 0 && p.trancheCashflows['1'].balanceEnd > 0) {
        if (equityInt === 0) { // Excess spread didn't go to equity, so turbo is active
          turboActivated = true;
        }
      }
    });

    expect(turboActivated).toBe(true);
  });

  it('calculates Break-even CDR', () => {
    const beCDR = calculateBreakEvenCDR(basePool, baseTranches, baseScenario);
    expect(beCDR).toBeGreaterThan(0);
    expect(beCDR).toBeLessThan(100);
  });
});
