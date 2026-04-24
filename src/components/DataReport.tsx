import React from 'react';
import { Download } from 'lucide-react';
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
    acc.poolLoss += period.poolLoss;
    acc.poolRecovery += period.poolRecovery;
    acc.poolServicingFee += period.poolServicingFee;
    acc.excessSpread += period.excessSpread;
    
    tranches.forEach(t => {
      if (!acc.tranches[t.id]) acc.tranches[t.id] = { interest: 0, principal: 0, loss: 0 };
      const flow = period.trancheCashflows[t.id];
      acc.tranches[t.id].interest += (flow?.interest || 0);
      acc.tranches[t.id].principal += (flow?.principal || 0);
      acc.tranches[t.id].loss += (flow?.loss || 0);
    });
    
    return acc;
  }, { 
    poolInterest: 0, 
    poolPrincipal: 0, 
    poolDefaults: 0, 
    poolLoss: 0, 
    poolRecovery: 0, 
    poolServicingFee: 0, 
    excessSpread: 0,
    tranches: {} as Record<string, { interest: number, principal: number, loss: number }> 
  });

  return (
    <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-silver-text">Detailed Cash Flow Report</h2>
          <p className="text-slate-text text-sm mt-1">Institutional-grade audit trail accounting for all cash inflows, fee leakage, and credit losses.</p>
        </div>
        <button 
          onClick={onDownload}
          className="flex items-center gap-2 px-6 py-2 bg-convexica-gold hover:bg-convexica-gold/80 text-deep-navy rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-convexica-gold/20"
        >
          <Download className="w-4 h-4" /> Download Full CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white-subtle/10 max-h-[700px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-[10px] text-right text-slate-text font-mono border-collapse whitespace-nowrap">
          <thead className="bg-deep-navy text-silver-text sticky top-0 z-30">
            {/* Grouped Header */}
            <tr>
              <th className="p-2 border-b border-white-subtle/20 bg-deep-navy"></th>
              <th colSpan={7} className="p-2 text-center border-b border-white-subtle/20 bg-slate-800/40 font-bold uppercase tracking-widest text-[9px] text-silver-text/60">Pool Level Analysis</th>
              {tranches.map(t => (
                <th key={t.id} colSpan={4} className="p-2 text-center border-l border-b border-white-subtle/20 bg-slate-800/20 font-bold uppercase tracking-widest text-[9px] text-silver-text/60">
                  {t.name}
                </th>
              ))}
              <th className="p-2 border-b border-white-subtle/20 bg-deep-navy"></th>
            </tr>
            {/* Detailed Header */}
            <tr>
              <th className="p-2 text-left font-bold uppercase border-b border-white-subtle/20 bg-deep-navy sticky left-0 z-40 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">Period</th>
              <th className="p-2 font-bold uppercase border-b border-white-subtle/20">Pool Bal</th>
              <th className="p-2 font-bold uppercase border-b border-white-subtle/20 text-inst-blue">Gross Int</th>
              <th className="p-2 font-bold uppercase border-b border-white-subtle/20 text-inst-blue italic">Srv Fee</th>
              <th className="p-2 font-bold uppercase border-b border-white-subtle/20 text-strat-orange">Net Prin</th>
              <th className="p-2 font-bold uppercase border-b border-white-subtle/20 text-risk-red">Defaults</th>
              <th className="p-2 font-bold uppercase border-b border-white-subtle/20 text-risk-red">Net Loss</th>
              <th className="p-2 font-bold uppercase border-b border-white-subtle/20 text-green-400">Recovery</th>
              {tranches.map(t => (
                <React.Fragment key={t.id}>
                  <th className="p-2 border-l border-white-subtle/20 font-bold uppercase border-b border-white-subtle/20">Int</th>
                  <th className="p-2 font-bold uppercase border-b border-white-subtle/20">Prin</th>
                  <th className="p-2 font-bold uppercase border-b border-white-subtle/20 text-risk-red">Loss</th>
                  <th className="p-2 font-bold uppercase border-b border-white-subtle/20 text-silver-text">Balance</th>
                </React.Fragment>
              ))}
              <th className="p-2 font-bold uppercase border-b border-white-subtle/20 text-convexica-gold">Residual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white-subtle/5">
            {cashFlows.map((row) => (
              <tr key={row.period} className="hover:bg-slate-700/20 transition-colors">
                <td className="p-2 text-left text-silver-text font-bold sticky left-0 z-20 bg-charcoal shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  {row.period === 0 ? 'Closing' : `M${row.period}`}
                </td>
                <td className="p-2 text-silver-text/90">
                  {row.poolBalanceEnd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </td>
                <td className="p-2 text-inst-blue/70">
                  {row.poolInterest > 0 ? row.poolInterest.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                </td>
                <td className="p-2 text-inst-blue/50 italic">
                  {row.poolServicingFee > 0 ? row.poolServicingFee.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                </td>
                <td className="p-2 text-strat-orange/70">
                  {row.poolPrincipal > 0 ? row.poolPrincipal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                </td>
                <td className="p-2 text-risk-red/70">
                  {row.poolDefaultAmount > 0 ? row.poolDefaultAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                </td>
                <td className="p-2 text-risk-red/90 font-bold">
                  {row.poolLoss > 0 ? row.poolLoss.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                </td>
                <td className="p-2 text-green-400/70">
                  {row.poolRecovery > 0 ? row.poolRecovery.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                </td>
                {tranches.map(t => {
                  const flow = row.trancheCashflows[t.id];
                  return (
                    <React.Fragment key={t.id}>
                      <td className="p-2 border-l border-white-subtle/10 text-slate-text/60">
                        {flow?.interest > 0 ? Math.round(flow.interest).toLocaleString() : '-'}
                      </td>
                      <td className="p-2 text-silver-text font-medium">
                        {flow?.principal > 0 ? Math.round(flow.principal).toLocaleString() : '-'}
                      </td>
                      <td className="p-2 text-risk-red/80 font-bold">
                        {flow?.loss > 0 ? Math.round(flow.loss).toLocaleString() : '-'}
                      </td>
                      <td className="p-2 text-silver-text font-bold bg-white-subtle/5">
                        {row.period === 0 ? t.originalBalance.toLocaleString() : (flow?.balanceEnd || 0).toLocaleString()}
                      </td>
                    </React.Fragment>
                  )
                })}
                <td className="p-2 text-convexica-gold/80 font-bold">
                  {row.excessSpread > 0 ? row.excessSpread.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-deep-navy/90 font-bold text-silver-text border-t-2 border-convexica-gold/30 sticky bottom-0 z-30">
            <tr>
              <td className="p-2 text-left uppercase sticky left-0 z-40 bg-deep-navy">Totals</td>
              <td className="p-2">-</td>
              <td className="p-2 text-inst-blue">{Math.round(totals.poolInterest).toLocaleString()}</td>
              <td className="p-2 text-inst-blue/50 italic">{Math.round(totals.poolServicingFee).toLocaleString()}</td>
              <td className="p-2 text-strat-orange">{Math.round(totals.poolPrincipal).toLocaleString()}</td>
              <td className="p-2 text-risk-red">{Math.round(totals.poolDefaults).toLocaleString()}</td>
              <td className="p-2 text-risk-red">{Math.round(totals.poolLoss).toLocaleString()}</td>
              <td className="p-2 text-green-400">{Math.round(totals.poolRecovery).toLocaleString()}</td>
              {tranches.map(t => (
                <React.Fragment key={t.id}>
                  <td className="p-2 border-l border-white-subtle/20 text-slate-text">{Math.round(totals.tranches[t.id]?.interest || 0).toLocaleString()}</td>
                  <td className="p-2 text-silver-text">{Math.round(totals.tranches[t.id]?.principal || 0).toLocaleString()}</td>
                  <td className="p-2 text-risk-red">{Math.round(totals.tranches[t.id]?.loss || 0).toLocaleString()}</td>
                  <td className="p-2 text-silver-text">-</td>
                </React.Fragment>
              ))}
              <td className="p-2 text-convexica-gold">{Math.round(totals.excessSpread).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default DataReport;
