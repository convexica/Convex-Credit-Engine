import { AssetPool, Tranche, Scenario, SensitivityMetric, SensitivityCell } from '@/types';
import { runCashFlowEngine, calculateWAL, calculateIRR } from './waterfall';

/**
 * Generates a 5x5 sensitivity matrix for a given metric and tranche.
 * Evaluates Prepayments (CPR) on the X axis and Defaults (CDR) on the Y axis.
 */
export const generateSensitivityMatrix = (
  pool: AssetPool,
  tranches: Tranche[],
  baseScenario: Scenario,
  trancheId: string,
  metric: SensitivityMetric
): SensitivityCell[] => {
  const cells: SensitivityCell[] = [];
  
  // Institutional standard: +/- variance from base case
  // CPR variance: +/- 5%, 10%
  // CDR variance: +/- 2%, 4% (adjust based on typical pool)
  const cprSteps = [-10, -5, 0, 5, 10];
  const cdrSteps = [-4, -2, 0, 2, 4];
  
  const targetTranche = tranches.find(t => t.id === trancheId);
  if (!targetTranche) return [];

  // Generate 25 scenario runs
  for (const cprDelta of cprSteps) {
    for (const cdrDelta of cdrSteps) {
      // Floor rates at 0%
      const testCpr = Math.max(0, baseScenario.cpr + cprDelta);
      const testCdr = Math.max(0, baseScenario.cdr + cdrDelta);
      
      const testScenario = { ...baseScenario, cpr: testCpr, cdr: testCdr };
      const flows = runCashFlowEngine(pool, tranches, testScenario);
      
      let value = 0;
      
      if (metric === SensitivityMetric.YIELD) {
        // Build monthly cashflows array for the tranche
        const monthlyFlows = flows.map(p => {
          const tFlow = p.trancheCashflows[trancheId];
          return tFlow ? (tFlow.principal + tFlow.interest) : 0;
        });
        const initialInvestment = targetTranche.originalBalance * (targetTranche.price / 100);
        value = calculateIRR(initialInvestment, monthlyFlows);
      } 
      else if (metric === SensitivityMetric.WAL) {
        value = calculateWAL(flows, trancheId);
      }
      else if (metric === SensitivityMetric.LOSS) {
        const totalLoss = flows.reduce((sum, p) => sum + (p.trancheCashflows[trancheId]?.loss || 0), 0);
        value = (totalLoss / targetTranche.originalBalance) * 100;
      }
      
      cells.push({
        cpr: testCpr,
        cdr: testCdr,
        value,
        isBaseCase: cprDelta === 0 && cdrDelta === 0
      });
    }
  }
  
  return cells;
};
