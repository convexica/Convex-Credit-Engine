import React from 'react';
import { Tranche, CashFlowPeriod } from '@/types';
import { calculateWAL, calculateIRR, calculateModifiedDuration } from '@/lib/waterfall';

interface MetricsTableProps {
  tranches: Tranche[];
  data: CashFlowPeriod[];
}

const MetricsTable: React.FC<MetricsTableProps> = ({ tranches, data }) => {
  return (
    <div className="bg-charcoal rounded-xl border border-white-subtle shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-white-subtle">
        <h2 className="text-sm font-bold uppercase tracking-widest text-convexica-gold">Tranche Performance Analytics</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-slate-text">
          <thead className="bg-deep-navy/80 text-xs font-extrabold uppercase text-slate-text/60 tracking-widest border-b border-white-subtle/20">
            <tr>
              <th className="px-6 py-4">Tranche</th>
              <th className="px-6 py-4">Rating</th>
              <th className="px-6 py-4 text-right">Original Bal</th>
              <th className="px-6 py-4 text-right text-res-green/80">Price</th>
              <th className="px-6 py-4 text-right">Coupon</th>
              <th className="px-6 py-4 text-right text-res-green">Yield (IRR)</th>
              <th className="px-6 py-4 text-right">WAL (Yrs)</th>
              <th className="px-6 py-4 text-right text-inst-blue">Duration</th>
              <th className="px-6 py-4 text-right text-risk-red/80">Losses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white-subtle/5">
            {tranches.map((t) => {
              const wal = calculateWAL(data, t.id);
              const totalLoss = data.reduce((sum, p) => sum + (p.trancheCashflows[t.id]?.loss || 0), 0);

              // Calculate IRR using Price% of Par
              const monthlyFlows = data.map(p => {
                  const flow = p.trancheCashflows[t.id];
                  return (flow?.principal || 0) + (flow?.interest || 0);
              });
              const initialInvestment = t.originalBalance * (t.price / 100);
              const yieldIrr = calculateIRR(initialInvestment, monthlyFlows);
              
              const modDur = calculateModifiedDuration(data, t.id, yieldIrr, t.price, t.originalBalance);

              return (
                <tr key={t.id} className="hover:bg-slate-700/20 transition-all group">
                  <td className="px-6 py-5 font-bold text-white text-sm">{t.name}</td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-deep-navy rounded-lg text-xs text-convexica-gold font-mono font-extrabold border border-convexica-gold/30">
                      {t.rating}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-mono text-sm text-silver-text font-medium">{(t.originalBalance / 1000000).toFixed(1)}M</td>
                  <td className="px-6 py-5 text-right text-res-green font-mono font-bold text-sm">{t.price.toFixed(2)}</td>
                  <td className="px-6 py-5 text-right text-sm text-slate-text font-mono">{t.coupon.toFixed(2)}%</td>
                  <td className="px-6 py-5 text-right text-res-green font-bold text-base font-mono underline decoration-res-green/20 underline-offset-4">{yieldIrr.toFixed(2)}%</td>
                  <td className="px-6 py-5 text-right text-sm font-mono text-white">{wal.toFixed(2)}</td>
                  <td className="px-6 py-5 text-right text-sm font-mono text-inst-blue font-bold">{modDur.toFixed(2)}</td>
                  <td className="px-6 py-5 text-right text-risk-red font-mono font-bold text-sm">{Math.round(totalLoss).toLocaleString()}</td>
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