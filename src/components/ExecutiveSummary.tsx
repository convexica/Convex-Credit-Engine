import React from 'react';
import { CashFlowPeriod, Tranche, AssetPool, Scenario } from '@/types';
import { Activity, ShieldCheck, Gauge, TrendingUp, AlertTriangle } from 'lucide-react';
import { calculateBreakEvenCDR } from '@/lib/waterfall';

interface ExecutiveSummaryProps {
  data: CashFlowPeriod[];
  tranches: Tranche[];
  pool: AssetPool;
  scenario: Scenario;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ data, tranches, pool, scenario }) => {
  // Guard for empty data
  if (!data || data.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 opacity-50 grayscale">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-charcoal p-4 rounded-xl border border-white-subtle shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-white-subtle/10 rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="w-20 h-2 bg-white-subtle/20 rounded" />
              <div className="w-24 h-4 bg-white-subtle/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 1. Deal WAL (Weighted Average Life)
  const calculateDealWAL = () => {
    let totalPrincipalTime = 0;
    let totalPrincipal = 0;
    
    data.forEach(period => {
      let periodPrincipal = 0;
      if (period.trancheCashflows) {
        Object.values(period.trancheCashflows).forEach(flow => {
          periodPrincipal += (flow?.principal || 0);
        });
      }
      
      totalPrincipalTime += periodPrincipal * (period.period / 12);
      totalPrincipal += periodPrincipal;
    });
    
    return totalPrincipal > 0 ? totalPrincipalTime / totalPrincipal : 0;
  };

  // 2. Total Excess Spread (Lifetime)
  const calculateTotalExcessSpread = () => {
    return data.reduce((sum, period) => sum + (period.excessSpread || 0), 0);
  };

  // 3. Loss Coverage Ratio (LCR)
  const calculateLCR = () => {
    const totalDefaults = data.reduce((sum, period) => sum + (period.poolDefaultAmount || 0), 0);
    const lifetimeExcessSpread = calculateTotalExcessSpread();
    const equityBalance = tranches.find(t => t.type === 'EQUITY')?.originalBalance || 0;
    
    if (totalDefaults === 0) return 99.9;
    const lcr = (equityBalance + lifetimeExcessSpread) / totalDefaults;
    return isNaN(lcr) ? 0 : lcr;
  };

  // 4. Net Cumulative Loss %
  const calculateLifetimeLossRate = () => {
    const totalDefaults = data.reduce((sum, period) => sum + (period.poolDefaultAmount || 0), 0);
    const initialPool = data[0]?.poolBalanceStart || 1;
    return (totalDefaults / initialPool) * 100;
  };

  const dealWal = calculateDealWAL();
  const totalExcessSpread = calculateTotalExcessSpread();
  const lcr = calculateLCR();
  const beCDR = calculateBreakEvenCDR(pool, tranches, scenario);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Deal WAL Card */}
      <div className="bg-charcoal p-5 rounded-xl border border-white-subtle shadow-sm flex items-center gap-5">
        <div className="p-3 bg-inst-blue/10 rounded-lg text-inst-blue">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs uppercase font-bold text-slate-text/70 tracking-widest mb-1">Deal WAL</p>
          <p className="text-2xl font-bold text-white font-mono">{dealWal.toFixed(2)} <span className="text-sm font-normal text-slate-text">Yrs</span></p>
        </div>
      </div>

      {/* Loss Coverage Card */}
      <div className="bg-charcoal p-5 rounded-xl border border-white-subtle shadow-sm flex items-center gap-5">
        <div className="p-3 bg-res-green/10 rounded-lg text-res-green">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs uppercase font-bold text-slate-text/70 tracking-widest mb-1">Loss Coverage</p>
          <div className="flex items-baseline gap-2">
             <p className="text-2xl font-bold text-white font-mono">{lcr.toFixed(2)}x</p>
             <span className={`text-xs font-bold px-1.5 py-0.5 rounded bg-black/20 ${lcr > 2 ? 'text-res-green' : 'text-risk-red'}`}>
               {lcr > 2 ? 'ROBUST' : 'CRITICAL'}
             </span>
          </div>
        </div>
      </div>

      {/* Excess Spread Card */}
      <div className="bg-charcoal p-5 rounded-xl border border-white-subtle shadow-sm flex items-center gap-5">
        <div className="p-3 bg-convexica-gold/10 rounded-lg text-convexica-gold">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs uppercase font-bold text-slate-text/70 tracking-widest mb-1">Total Excess Spread</p>
          <p className="text-2xl font-bold text-white font-mono">{(totalExcessSpread / 1000000).toFixed(2)}M</p>
        </div>
      </div>

      {/* Break-even CDR Card */}
      <div className="bg-charcoal p-5 rounded-xl border border-white-subtle shadow-sm flex items-center gap-5">
        <div className="p-3 bg-risk-red/10 rounded-lg text-risk-red">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs uppercase font-bold text-slate-text/70 tracking-widest mb-1">Break-even CDR</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-white font-mono">{beCDR.toFixed(2)}%</p>
            <span className="text-[10px] font-bold text-slate-text/50 uppercase">Max Stress</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
