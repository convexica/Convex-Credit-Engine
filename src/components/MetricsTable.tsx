import React from 'react';
import { Tranche, CashFlowPeriod, Scenario } from '@/types';
import { calculateWAL, calculateIRR, calculateModifiedDuration } from '@/lib/waterfall';
import { interpolateYield } from '@/lib/curve';

interface MetricsTableProps {
  tranches: Tranche[];
  data: CashFlowPeriod[];
  scenario: Scenario;
}

const MetricsTable: React.FC<MetricsTableProps> = ({ tranches, data, scenario }) => {
  const totalBalance = tranches.reduce((sum, t) => sum + t.originalBalance, 0);

  return (
    <div className="bg-charcoal rounded-xl border border-white-subtle shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-white-subtle flex justify-between items-center">
        <h2 className="text-sm font-bold uppercase tracking-widest text-convexica-gold">Tranche Performance Analytics</h2>
        <span className="text-[10px] text-slate-text/60 uppercase font-bold tracking-tighter flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-inst-blue animate-pulse"></div>
          Point-on-Curve Matching Active
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-slate-text">
          <thead className="bg-deep-navy/80 text-[10px] font-extrabold uppercase text-slate-text/60 tracking-widest border-b border-white-subtle/20">
            <tr>
              <th className="px-6 py-4">Tranche</th>
              <th className="px-6 py-4">Rating</th>
              <th className="px-6 py-4 text-right">Balance</th>
              <th className="px-6 py-4 text-right">Subord %</th>
              <th className="px-6 py-4 text-right text-res-green/80">Price</th>
              <th className="px-6 py-4 text-right">Yield (IRR)</th>
              <th className="px-6 py-4 text-right text-convexica-gold/70">Spread</th>
              <th className="px-6 py-4 text-right">WAL (Yrs)</th>
              <th className="px-6 py-4 text-right text-risk-red/80">Losses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white-subtle/5">
            {tranches.map((t, index) => {
              const wal = calculateWAL(data, t.id);
              const totalLoss = data.reduce((sum, p) => sum + (p.trancheCashflows[t.id]?.loss || 0), 0);

              // Subordination Calculation: Sum of all tranches AFTER this one in the array
              const subordinationAmt = tranches.slice(index + 1).reduce((sum, sub) => sum + sub.originalBalance, 0);
              const subordinationPct = (subordinationAmt / totalBalance) * 100;

              // Yield Calculation
              const monthlyFlows = data.map(p => {
                  const flow = p.trancheCashflows[t.id];
                  return (flow?.principal || 0) + (flow?.interest || 0);
              });
              const initialInvestment = t.originalBalance * (t.price / 100);
              const yieldIrr = calculateIRR(initialInvestment, monthlyFlows);
              
              // Dynamic Benchmark matching based on Tranche WAL
              const benchmarkRate = interpolateYield(scenario.yieldCurve, wal);
              const spread = yieldIrr - benchmarkRate;

              return (
                <tr key={t.id} className="hover:bg-slate-700/20 transition-all group font-mono text-sm">
                  <td className="px-6 py-5 font-bold text-white font-sans">{t.name}</td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-0.5 bg-deep-navy rounded text-[10px] text-convexica-gold font-extrabold border border-convexica-gold/20">
                      {t.rating}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right text-silver-text">{(t.originalBalance / 1000000).toFixed(1)}M</td>
                  <td className="px-6 py-5 text-right font-bold text-silver-text/60">{subordinationPct.toFixed(1)}%</td>
                  <td className="px-6 py-5 text-right text-res-green/80">{t.price.toFixed(2)}</td>
                  <td className="px-6 py-5 text-right text-res-green font-bold text-base decoration-res-green/20 underline underline-offset-4">{yieldIrr.toFixed(2)}%</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-convexica-gold font-bold">{spread > 0 ? '+' : ''}{(spread * 100).toFixed(0)} bps</span>
                      <span className="text-[9px] text-inst-blue/70 uppercase font-bold tracking-tighter">vs {benchmarkRate.toFixed(2)}% Bench</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right text-white">{wal.toFixed(2)}</td>
                  <td className="px-6 py-5 text-right text-risk-red font-bold">{Math.round(totalLoss).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MetricsTable;