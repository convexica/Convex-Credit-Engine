import React from 'react';
import { AssetPool, Tranche, TrancheType, Scenario } from '@/types';
import { 
  Plus, 
  Trash2, 
  PieChart, 
  ShieldAlert, 
  History, 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  Activity 
} from 'lucide-react';

interface DealInputProps {
  pool: AssetPool;
  setPool: (p: AssetPool) => void;
  tranches: Tranche[];
  setTranches: (t: Tranche[]) => void;
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
}

const DealInput: React.FC<DealInputProps> = ({
  pool,
  setPool,
  tranches,
  setTranches,
  scenario,
  setScenario
}) => {
  const addTranche = () => {
    const newTranche: Tranche = {
      id: Date.now().toString(),
      name: `Tranche ${String.fromCharCode(64 + (tranches.length + 1))}`,
      type: TrancheType.MEZZANINE,
      originalBalance: pool.principalBalance * 0.1,
      currentBalance: pool.principalBalance * 0.1,
      coupon: 8.5,
      spread: 200,
      rating: 'AA',
      price: 100
    };
    setTranches([...tranches, newTranche]);
  };

  const updateTranche = (id: string, field: keyof Tranche, value: any) => {
    setTranches(tranches.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTranche = (id: string) => {
    setTranches(tranches.filter(t => t.id !== id));
  };

  const totalTrancheValue = tranches.reduce((sum, t) => sum + Number(t.originalBalance), 0);
  const coverageRatio = (pool.principalBalance / totalTrancheValue) * 100;

  const formatNumber = (num: number) => num.toLocaleString();
  const parseNumber = (str: string) => Number(str.replace(/,/g, ''));

  return (
    <div className="space-y-4 text-silver-text max-w-[1600px] mx-auto">
      
      {/* Top Section: Pool, Scenario, and Market Data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Asset Pool - Card (3/12) */}
        <div className="lg:col-span-3 bg-charcoal p-5 rounded-xl border border-white-subtle shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-convexica-gold flex items-center gap-2">
              <PieChart className="w-4 h-4" /> Asset Pool
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-text/50 mb-1.5 tracking-widest">Principal Balance</label>
              <input
                type="text"
                value={formatNumber(pool.principalBalance)}
                onChange={(e) => setPool({ ...pool, principalBalance: parseNumber(e.target.value) })}
                className="w-full bg-deep-navy border border-white-subtle/30 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-convexica-gold/50 outline-none font-mono text-lg font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-text/50 mb-1 tracking-widest">WAC</label>
                <input type="number" step="0.01" value={pool.wac} onChange={(e) => setPool({ ...pool, wac: Number(e.target.value) })} className="w-full bg-deep-navy/50 border border-white-subtle/20 rounded-md px-2 py-1.5 text-white outline-none text-sm font-mono" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-text/50 mb-1 tracking-widest">WAM</label>
                <input type="number" value={pool.wam} onChange={(e) => setPool({ ...pool, wam: Number(e.target.value) })} className="w-full bg-deep-navy/50 border border-white-subtle/20 rounded-md px-2 py-1.5 text-white outline-none text-sm font-mono" />
              </div>
            </div>
          </div>
        </div>

        {/* Scenario Assumptions - Grid (6/12) */}
        <div className="lg:col-span-6 bg-charcoal p-5 rounded-xl border border-white-subtle shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-widest text-inst-blue mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Scenario Assumptions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            {/* CPR */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-0.5">
                <label className="text-[11px] font-bold text-slate-text/80 uppercase tracking-tight">CPR</label>
                <div className="relative">
                  <input type="number" step="0.5" value={scenario.cpr} onChange={(e) => setScenario({ ...scenario, cpr: Number(e.target.value) })} className="w-16 bg-inst-blue/5 border border-inst-blue/20 text-xs font-mono font-bold text-inst-blue rounded px-1.5 py-0.5 text-right pr-4 outline-none" />
                  <span className="absolute right-1 top-1 text-[9px] text-inst-blue/50">%</span>
                </div>
              </div>
              <input type="range" min="0" max="50" step="0.5" value={scenario.cpr} onChange={(e) => setScenario({ ...scenario, cpr: Number(e.target.value) })} className="w-full h-1 bg-deep-navy rounded-lg appearance-none cursor-pointer accent-inst-blue" />
            </div>

            {/* CDR */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-0.5">
                <label className="text-[11px] font-bold text-slate-text/80 uppercase tracking-tight">CDR</label>
                <div className="relative">
                  <input type="number" step="0.1" value={scenario.cdr} onChange={(e) => setScenario({ ...scenario, cdr: Number(e.target.value) })} className="w-16 bg-risk-red/5 border border-risk-red/20 text-xs font-mono font-bold text-risk-red rounded px-1.5 py-0.5 text-right pr-4 outline-none" />
                  <span className="absolute right-1 top-1 text-[9px] text-risk-red/50">%</span>
                </div>
              </div>
              <input type="range" min="0" max="50" step="0.1" value={scenario.cdr} onChange={(e) => setScenario({ ...scenario, cdr: Number(e.target.value) })} className="w-full h-1 bg-deep-navy rounded-lg appearance-none cursor-pointer accent-risk-red" />
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-0.5">
                <label className="text-[11px] font-bold text-slate-text/80 uppercase tracking-tight">Severity</label>
                <div className="relative">
                  <input type="number" step="1" value={scenario.severity} onChange={(e) => setScenario({ ...scenario, severity: Number(e.target.value) })} className="w-16 bg-convexica-gold/5 border border-convexica-gold/20 text-xs font-mono font-bold text-convexica-gold rounded px-1.5 py-0.5 text-right pr-4 outline-none" />
                  <span className="absolute right-1 top-1 text-[9px] text-convexica-gold/50">%</span>
                </div>
              </div>
              <input type="range" min="0" max="100" step="1" value={scenario.severity} onChange={(e) => setScenario({ ...scenario, severity: Number(e.target.value) })} className="w-full h-1 bg-deep-navy rounded-lg appearance-none cursor-pointer accent-convexica-gold" />
            </div>

            {/* Fee */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-0.5">
                <label className="text-[11px] font-bold text-slate-text/80 uppercase tracking-tight">Serv. Fee</label>
                <div className="relative">
                  <input type="number" step="0.05" value={scenario.servicingFee} onChange={(e) => setScenario({ ...scenario, servicingFee: Number(e.target.value) })} className="w-16 bg-inst-blue/5 border border-inst-blue/20 text-xs font-mono font-bold text-inst-blue rounded px-1.5 py-0.5 text-right pr-4 outline-none" />
                  <span className="absolute right-1 top-1 text-[9px] text-inst-blue/50">%</span>
                </div>
              </div>
              <input type="range" min="0" max="5" step="0.05" value={scenario.servicingFee} onChange={(e) => setScenario({ ...scenario, servicingFee: Number(e.target.value) })} className="w-full h-1 bg-deep-navy rounded-lg appearance-none cursor-pointer accent-inst-blue" />
            </div>

            {/* Lag */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-0.5">
                <label className="text-[11px] font-bold text-slate-text/80 uppercase tracking-tight">Lag</label>
                <div className="relative">
                  <input type="number" step="1" value={scenario.recoveryLag} onChange={(e) => setScenario({ ...scenario, recoveryLag: Number(e.target.value) })} className="w-16 bg-risk-red/5 border border-risk-red/20 text-xs font-mono font-bold text-risk-red rounded px-1.5 py-0.5 text-right pr-4 outline-none" />
                  <span className="absolute right-1 top-1 text-[9px] text-risk-red/50">M</span>
                </div>
              </div>
              <input type="range" min="0" max="36" step="1" value={scenario.recoveryLag} onChange={(e) => setScenario({ ...scenario, recoveryLag: Number(e.target.value) })} className="w-full h-1 bg-deep-navy rounded-lg appearance-none cursor-pointer accent-risk-red" />
            </div>

            {/* Turbo Trigger */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-0.5">
                <label className="text-[11px] font-bold text-slate-text/80 uppercase tracking-tight">Turbo</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.5" 
                    value={scenario.turboTriggerPct || 0} 
                    onChange={(e) => setScenario({ ...scenario, turboTriggerPct: Number(e.target.value) })} 
                    className="w-16 bg-convexica-gold/5 border border-convexica-gold/20 text-xs font-mono font-bold text-convexica-gold rounded px-1.5 py-0.5 text-right pr-4 outline-none" 
                  />
                  <span className="absolute right-1 top-1 text-[9px] text-convexica-gold/50">%</span>
                </div>
              </div>
              <input type="range" min="0" max="25" step="0.5" value={scenario.turboTriggerPct || 0} onChange={(e) => setScenario({ ...scenario, turboTriggerPct: Number(e.target.value) })} className="w-full h-1 bg-deep-navy rounded-lg appearance-none cursor-pointer accent-convexica-gold" />
            </div>
          </div>
        </div>

        {/* Market Data - Card (3/12) */}
        <div className="lg:col-span-3 bg-charcoal p-5 rounded-xl border border-white-subtle shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-widest text-convexica-gold mb-5 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Market Data
          </h2>
          <div className="space-y-3">
            <div className="p-2.5 bg-deep-navy/30 rounded-lg border border-white-subtle/10 mb-3 text-center">
              <span className="text-[9px] uppercase font-bold text-slate-text/40 tracking-widest">Reference Yield Curve</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {(scenario.yieldCurve || []).map((pt, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase font-extrabold text-slate-text/50">{pt.tenor}Y</span>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.05" 
                      value={pt.rate} 
                      onChange={(e) => {
                        const newCurve = [...scenario.yieldCurve];
                        newCurve[idx].rate = Number(e.target.value);
                        setScenario({ ...scenario, yieldCurve: newCurve });
                      }}
                      className="w-full bg-inst-blue/5 border border-inst-blue/20 text-xs font-mono font-bold text-inst-blue rounded px-1.5 py-1 text-right pr-5 outline-none focus:border-inst-blue/50 transition-all" 
                    />
                    <span className="absolute right-1 top-1 text-[9px] text-inst-blue/40">%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-white-subtle/5 flex items-center justify-center gap-1.5 opacity-60">
              <ShieldCheck className="w-3 h-3 text-res-green" />
              <span className="text-[8px] uppercase font-bold tracking-tighter text-slate-text">Interpolation Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tranches Section - High Density Table */}
      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-convexica-gold">Tranche Structure</h2>
          <div className="text-sm p-1.5 px-4 bg-deep-navy rounded-lg border border-white-subtle">
            <span className={coverageRatio < 100 ? 'text-risk-red' : 'text-res-green'}>
              Deal Coverage: <span className="font-mono font-bold">{coverageRatio.toFixed(2)}%</span>
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
           {/* Headers */}
           <div className="grid grid-cols-12 gap-4 px-4 pb-2 text-[10px] uppercase font-extrabold text-slate-text/40 tracking-[0.1em] border-b border-white-subtle/10">
              <div className="col-span-3">Tranche Name</div>
              <div className="col-span-2">Class Type</div>
              <div className="col-span-1 text-center">Rating</div>
              <div className="col-span-1 text-right">Pool %</div>
              <div className="col-span-2 text-right">Original Balance</div>
              <div className="col-span-1 text-right">Coupon</div>
              <div className="col-span-1 text-right">Subord</div>
              <div className="col-span-1 flex justify-end"></div>
           </div>

          {tranches.map((tranche, idx) => {
            const poolPercent = (tranche.originalBalance / pool.principalBalance) * 100;
            
            const order = { [TrancheType.SENIOR]: 1, [TrancheType.MEZZANINE]: 2, [TrancheType.EQUITY]: 3 };
            const subordinateValue = tranches.reduce((sum, t) => {
               if ((order[t.type] || 9) > (order[tranche.type] || 9)) return sum + t.originalBalance;
               return sum;
            }, 0);
            const subordPercent = (subordinateValue / pool.principalBalance) * 100;

            return (
               <div key={tranche.id} className="grid grid-cols-12 gap-4 items-center bg-deep-navy/30 p-3.5 rounded-xl border border-white-subtle/10 hover:border-convexica-gold/20 hover:bg-deep-navy/50 transition-all group/row">
                {/* Name */}
                <div className="col-span-3">
                  <input 
                    type="text" 
                    value={tranche.name} 
                    onChange={(e) => updateTranche(tranche.id, 'name', e.target.value)} 
                    className="w-full bg-transparent text-sm font-bold border-none p-0 focus:ring-0 text-white placeholder:text-white/20" 
                  />
                </div>

                {/* Type Pill */}
                <div className="col-span-2">
                  <select 
                    value={tranche.type} 
                    onChange={(e) => updateTranche(tranche.id, 'type', e.target.value)} 
                    className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border cursor-pointer outline-none transition-all appearance-none text-center min-w-[110px]
                      ${tranche.type === TrancheType.SENIOR ? 'bg-inst-blue/5 text-inst-blue border-inst-blue/20 hover:bg-inst-blue/10' : 
                        tranche.type === TrancheType.MEZZANINE ? 'bg-convexica-gold/5 text-convexica-gold border-convexica-gold/20 hover:bg-convexica-gold/10' : 
                        'bg-risk-red/5 text-risk-red border-risk-red/20 hover:bg-risk-red/10'}`}
                  >
                    {Object.values(TrancheType).map(t => <option key={t} value={t} className="bg-charcoal text-white">{t}</option>)}
                  </select>
                </div>

                {/* Rating */}
                <div className="col-span-1 text-center">
                  <input type="text" value={tranche.rating} onChange={(e) => updateTranche(tranche.id, 'rating', e.target.value)} className="w-full bg-transparent text-sm text-center border-none p-0 focus:ring-0 text-convexica-gold/80 font-mono font-bold" />
                </div>

                {/* % Pool */}
                <div className="col-span-1 text-right">
                   <span className="text-xs font-mono text-slate-text/60">{poolPercent.toFixed(1)}%</span>
                </div>

                {/* Balance */}
                <div className="col-span-2">
                  <input type="text" value={formatNumber(tranche.originalBalance)} onChange={(e) => updateTranche(tranche.id, 'originalBalance', parseNumber(e.target.value))} className="w-full bg-charcoal/40 text-sm border border-white-subtle/10 rounded-lg px-3 py-2 text-right text-white font-mono outline-none focus:border-convexica-gold/30 focus:ring-1 focus:ring-convexica-gold/10" />
                </div>

                {/* Coupon */}
                <div className="col-span-1">
                  <div className="relative">
                    <input type="number" step="0.01" value={tranche.coupon} onChange={(e) => updateTranche(tranche.id, 'coupon', Number(e.target.value))} className="w-full bg-charcoal/40 text-sm border border-white-subtle/10 rounded-lg px-2 py-2 text-right text-white font-mono outline-none focus:border-convexica-gold/30" />
                    <span className="absolute -right-3 top-2.5 text-[10px] text-slate-text/40">%</span>
                  </div>
                </div>

                {/* Subordination */}
                <div className="col-span-1 text-right">
                   <span className="text-xs font-mono text-inst-blue/70 font-bold">{subordPercent.toFixed(1)}%</span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end opacity-0 group-hover/row:opacity-100 transition-opacity">
                  <button onClick={() => removeTranche(tranche.id)} className="p-2 text-slate-text/40 hover:text-risk-red transition-all transform hover:scale-110">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={addTranche} className="mt-6 w-full py-4 border border-dashed border-convexica-gold/20 rounded-xl text-convexica-gold hover:bg-convexica-gold/5 transition-all flex items-center justify-center gap-3 font-bold text-sm uppercase tracking-widest group">
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" /> New Tranche Structure
        </button>
      </div>
    </div>
  );
};

export default DealInput;