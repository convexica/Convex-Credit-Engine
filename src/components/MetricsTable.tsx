import React from 'react';
import { Tranche, CashFlowPeriod } from '../types';
import { calculateWAL, calculateIRR } from '../utils/calculations';

interface MetricsTableProps {
  tranches: Tranche[];
  data: CashFlowPeriod[];
}

const MetricsTable: React.FC<MetricsTableProps> = ({ tranches, data }) => {
  return (
    <div className="bg-charcoal rounded-xl border border-white-subtle shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-white-subtle">
        <h3 className="text-lg font-semibold text-silver-text">Tranche Analytics</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-text">
          <thead className="text-xs uppercase bg-deep-navy text-slate-text">
            <tr>
              <th className="px-6 py-3">Tranche</th>
              <th className="px-6 py-3">Rating</th>
              <th className="px-6 py-3 text-right">Original Bal</th>
              <th className="px-6 py-3 text-right">Coupon</th>
              <th className="px-6 py-3 text-right text-res-green">Yield (IRR)</th>
              <th className="px-6 py-3 text-right">WAL (Yrs)</th>
              <th className="px-6 py-3 text-right">Total Principal</th>
              <th className="px-6 py-3 text-right">Total Interest</th>
              <th className="px-6 py-3 text-right text-risk-red">Losses</th>
            </tr>
          </thead>
          <tbody>
            {tranches.map((t) => {
              const wal = calculateWAL(data, t.id);
              const totalPrin = data.reduce((sum, p) => sum + (p.trancheCashflows[t.id]?.principal || 0), 0);
              const totalInt = data.reduce((sum, p) => sum + (p.trancheCashflows[t.id]?.interest || 0), 0);
              const totalLoss = data.reduce((sum, p) => sum + (p.trancheCashflows[t.id]?.loss || 0), 0);

              // Calculate IRR
              const monthlyFlows = data.map(p => {
                  const flow = p.trancheCashflows[t.id];
                  return (flow?.principal || 0) + (flow?.interest || 0);
              });
              const yieldIrr = calculateIRR(t.originalBalance, monthlyFlows);

              return (
                <tr key={t.id} className="border-b border-white-subtle hover:bg-slate-700/20">
                  <td className="px-6 py-4 font-medium text-silver-text">{t.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-deep-navy rounded text-xs text-convexica-gold font-mono border border-white-subtle">
                      {t.rating}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">{t.originalBalance.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">{t.coupon.toFixed(2)}%</td>
                  <td className="px-6 py-4 text-right text-res-green font-bold">{yieldIrr.toFixed(2)}%</td>
                  <td className="px-6 py-4 text-right">{wal.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">{Math.round(totalPrin).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">{Math.round(totalInt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-risk-red">{Math.round(totalLoss).toLocaleString()}</td>
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