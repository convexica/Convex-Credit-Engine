import React, { useState } from 'react';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { CashFlowPeriod, Tranche } from '@/types';

interface DataReportProps {
  cashFlows: CashFlowPeriod[];
  tranches: Tranche[];
  onDownload: () => void;
}

const DataReport: React.FC<DataReportProps> = ({ cashFlows, tranches, onDownload }) => {
  // Calculate Lifetime Totals for Summary Row
  const totals = cashFlows.reduce((acc, period) => {
    acc.poolInterest += period.poolInterest;
    acc.poolPrincipal += period.poolPrincipal;
    acc.poolDefaults += period.poolDefaultAmount;
    
    tranches.forEach(t => {
      if (!acc.tranches[t.id]) acc.tranches[t.id] = { interest: 0, principal: 0 };
      const flow = period.trancheCashflows[t.id];
      acc.tranches[t.id].interest += (flow?.interest || 0);
      acc.tranches[t.id].principal += (flow?.principal || 0);
    });
    
    return acc;
  }, { poolInterest: 0, poolPrincipal: 0, poolDefaults: 0, tranches: {} as Record<string, { interest: number, principal: number }> });

  return (
    <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-silver-text">Detailed Cash Flow Report</h2>
          <p className="text-slate-text text-sm mt-1">Full lifetime principal and interest distribution across the capital stack.</p>
        </div>
        <button 
          onClick={onDownload}
          className="flex items-center gap-2 px-6 py-2 bg-convexica-gold hover:bg-convexica-gold/80 text-deep-navy rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-convexica-gold/20"
        >
          <Download className="w-4 h-4" /> Download Full CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white-subtle/10 max-h-[600px] overflow-y-auto">
        <table className="w-full text-xs text-right text-slate-text font-mono border-collapse">
          <thead className="bg-deep-navy text-silver-text sticky top-0 z-20">
            <tr>
              <th className="p-4 text-left font-bold uppercase tracking-wider border-b border-white-subtle/20 bg-deep-navy">Period</th>
              <th className="p-4 font-bold uppercase tracking-wider border-b border-white-subtle/20 bg-deep-navy">Pool Bal (End)</th>
              <th className="p-4 font-bold uppercase tracking-wider border-b border-white-subtle/20 text-inst-blue bg-deep-navy">Interest</th>
              <th className="p-4 font-bold uppercase tracking-wider border-b border-white-subtle/20 text-strat-orange bg-deep-navy">Principal</th>
              <th className="p-4 font-bold uppercase tracking-wider border-b border-white-subtle/20 text-risk-red bg-deep-navy">Defaults</th>
              {tranches.map(t => (
                <React.Fragment key={t.id}>
                  <th className="p-4 border-l border-white-subtle/20 font-bold uppercase tracking-wider border-b border-white-subtle/20 bg-deep-navy">{t.name} Int</th>
                  <th className="p-4 font-bold uppercase tracking-wider border-b border-white-subtle/20 bg-deep-navy">{t.name} Prin</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white-subtle/5">
            {cashFlows.map((row) => (
              <tr key={row.period} className="hover:bg-slate-700/20 transition-colors">
                <td className="p-4 text-left text-silver-text font-bold">{row.period === 0 ? 'Closing' : `M${row.period}`}</td>
                <td className="p-4 text-silver-text/90 font-medium">
                  {row.poolBalanceEnd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </td>
                <td className="p-4 text-inst-blue/70">
                  {row.poolInterest > 0 ? row.poolInterest.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                </td>
                <td className="p-4 text-strat-orange/70">
                  {row.poolPrincipal > 0 ? row.poolPrincipal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                </td>
                <td className="p-4 text-risk-red/70">
                  {row.poolDefaultAmount > 0 ? row.poolDefaultAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                </td>
                {tranches.map(t => {
                  const flow = row.trancheCashflows[t.id];
                  return (
                    <React.Fragment key={t.id}>
                      <td className="p-4 border-l border-white-subtle/10 text-slate-text/60">
                        {flow?.interest > 0 ? Math.round(flow.interest).toLocaleString() : '-'}
                      </td>
                      <td className="p-4 text-silver-text font-bold">
                        {flow?.principal > 0 ? Math.round(flow.principal).toLocaleString() : '-'}
                      </td>
                    </React.Fragment>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-deep-navy/80 font-bold text-silver-text border-t-2 border-convexica-gold/30 sticky bottom-0 z-20">
            <tr>
              <td className="p-4 text-left uppercase">Lifetime Totals</td>
              <td className="p-4">-</td>
              <td className="p-4 text-inst-blue">{Math.round(totals.poolInterest).toLocaleString()}</td>
              <td className="p-4 text-strat-orange">{Math.round(totals.poolPrincipal).toLocaleString()}</td>
              <td className="p-4 text-risk-red">{Math.round(totals.poolDefaults).toLocaleString()}</td>
              {tranches.map(t => (
                <React.Fragment key={t.id}>
                  <td className="p-4 border-l border-white-subtle/20 text-slate-text">{Math.round(totals.tranches[t.id]?.interest || 0).toLocaleString()}</td>
                  <td className="p-4 text-silver-text">{Math.round(totals.tranches[t.id]?.principal || 0).toLocaleString()}</td>
                </React.Fragment>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default DataReport;
