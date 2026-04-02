import React from 'react';
import { AssetPool, Tranche, TrancheType, Scenario } from '@/core/types';
import { Plus, Trash2, PieChart } from 'lucide-react';

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
      name: `Tranche ${String.fromCharCode(65 + tranches.length)}`,
      type: TrancheType.MEZZANINE,
      originalBalance: 10000000,
      currentBalance: 10000000,
      coupon: 8.5,
      spread: 200,
      rating: 'AA',
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
    <div className="space-y-6 text-silver-text">
      
      {/* Asset Pool Section */}
      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-convexica-gold">
          <PieChart className="w-5 h-5" /> Asset Pool
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-text mb-1">Principal Balance</label>
            <input
              type="text"
              value={formatNumber(pool.principalBalance)}
              onChange={(e) => setPool({ ...pool, principalBalance: parseNumber(e.target.value) })}
              className="w-full bg-deep-navy border border-white-subtle rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-convexica-gold outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-text mb-1">WAC (%)</label>
            <input
              type="number"
              step="0.01"
              value={pool.wac}
              onChange={(e) => setPool({ ...pool, wac: Number(e.target.value) })}
              className="w-full bg-deep-navy border border-white-subtle rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-convexica-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-text mb-1">WAM (Months)</label>
            <input
              type="number"
              value={pool.wam}
              onChange={(e) => setPool({ ...pool, wam: Number(e.target.value) })}
              className="w-full bg-deep-navy border border-white-subtle rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-convexica-gold outline-none"
            />
          </div>
        </div>
      </div>

      {/* Scenario Control */}
      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-inst-blue">Scenario Assumptions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-text mb-1">CPR (Prepayment %)</label>
            <input
              type="range" min="0" max="50" step="0.5"
              value={scenario.cpr}
              onChange={(e) => setScenario({ ...scenario, cpr: Number(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-inst-blue"
            />
            <div className="text-right text-xs text-inst-blue mt-1">{scenario.cpr}%</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-text mb-1">CDR (Default %)</label>
            <input
              type="range" min="0" max="20" step="0.1"
              value={scenario.cdr}
              onChange={(e) => setScenario({ ...scenario, cdr: Number(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-risk-red"
            />
             <div className="text-right text-xs text-risk-red mt-1">{scenario.cdr}%</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-text mb-1">Loss Severity (%)</label>
            <input
              type="number"
              value={scenario.severity}
              onChange={(e) => setScenario({ ...scenario, severity: Number(e.target.value) })}
              className="w-full bg-deep-navy border border-white-subtle rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-convexica-gold outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tranches Section */}
      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-convexica-gold">Tranche Structure</h2>
          <div className="text-sm">
            <span className={coverageRatio < 100 ? 'text-risk-red' : 'text-res-green'}>
              Coverage: {coverageRatio.toFixed(2)}%
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          {tranches.map((tranche) => (
            <div key={tranche.id} className="grid grid-cols-12 gap-2 items-center bg-deep-navy p-3 rounded-lg border border-white-subtle">
              <div className="col-span-2">
                <input
                  type="text"
                  value={tranche.name}
                  onChange={(e) => updateTranche(tranche.id, 'name', e.target.value)}
                  className="w-full bg-transparent text-sm font-bold border-none focus:ring-0 text-white"
                />
              </div>
              <div className="col-span-3">
                 <select
                  value={tranche.type}
                  onChange={(e) => updateTranche(tranche.id, 'type', e.target.value)}
                  className="w-full bg-charcoal text-xs border border-white-subtle rounded px-2 py-1 text-slate-text"
                 >
                   {Object.values(TrancheType).map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  placeholder="Balance"
                  value={formatNumber(tranche.originalBalance)}
                  onChange={(e) => updateTranche(tranche.id, 'originalBalance', parseNumber(e.target.value))}
                  className="w-full bg-charcoal text-sm border border-white-subtle rounded px-2 py-1 text-right text-white font-mono"
                />
              </div>
              <div className="col-span-2">
                 <div className="flex items-center">
                    <input
                      type="number"
                      placeholder="Cpn"
                      value={tranche.coupon}
                      onChange={(e) => updateTranche(tranche.id, 'coupon', Number(e.target.value))}
                      className="w-full bg-charcoal text-sm border border-white-subtle rounded px-2 py-1 text-right text-white"
                    />
                    <span className="ml-1 text-xs text-slate-text">%</span>
                 </div>
              </div>
              <div className="col-span-1 border-l border-white-subtle pl-2">
                <input
                  type="text"
                  placeholder="Rating"
                  value={tranche.rating}
                  onChange={(e) => updateTranche(tranche.id, 'rating', e.target.value)}
                  className="w-full bg-transparent text-xs text-center border-none focus:ring-0 text-convexica-gold font-mono"
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <button 
                  onClick={() => removeTranche(tranche.id)}
                  className="text-slate-text hover:text-risk-red transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addTranche}
          className="mt-4 w-full py-2 border-2 border-dashed border-convexica-gold/30 rounded-lg text-convexica-gold hover:bg-convexica-gold/5 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" /> Add Tranche
        </button>
      </div>
    </div>
  );
};

export default DealInput;