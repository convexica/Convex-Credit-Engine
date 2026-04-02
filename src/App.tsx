import React, { useState, useEffect, useMemo } from 'react';
import { Layers, Activity, Settings, TrendingUp, BarChart3, Database, Download } from 'lucide-react';
import DealInput from '@/features/deal-modeling/components/DealInput';
import Visualizer from '@/features/visuals/components/Visualizer';
import MetricsTable from '@/features/analytics/components/MetricsTable';
import AIAnalyst from '@/features/analytics/components/AIAnalyst';
import { AssetPool, Tranche, TrancheType, Scenario, PaymentFrequency } from '@/core/types';
import { runCashFlowEngine } from '@/core/engine/waterfall';

// Default Data
const DEFAULT_POOL: AssetPool = {
  principalBalance: 100000000, // 10 Crores
  wac: 12.0,
  wam: 36,
  paymentFrequency: PaymentFrequency.MONTHLY,
};

const DEFAULT_TRANCHES: Tranche[] = [
  { id: '1', name: 'Series A1 (Senior)', type: TrancheType.SENIOR, originalBalance: 50000000, currentBalance: 50000000, coupon: 8.0, spread: 150, rating: 'AAA' },
  { id: '2', name: 'Series A2 (Mezz)', type: TrancheType.MEZZANINE, originalBalance: 30000000, currentBalance: 30000000, coupon: 10.0, spread: 375, rating: 'AA' },
  { id: '3', name: 'Equity Tranche', type: TrancheType.EQUITY, originalBalance: 20000000, currentBalance: 20000000, coupon: 0, spread: 0, rating: 'NR' },
];

const DEFAULT_SCENARIO: Scenario = {
  cpr: 10,
  cdr: 2.5,
  severity: 40,
  delinquencyLag: 0,
};

function App() {
  const [pool, setPool] = useState<AssetPool>(DEFAULT_POOL);
  const [tranches, setTranches] = useState<Tranche[]>(DEFAULT_TRANCHES);
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');

  const downloadCSV = () => {
    const headers = [
      'Period', 'Pool Balance Start', 'Pool Interest', 'Pool Principal', 'Pool Defaults',
      ...tranches.flatMap(t => [`${t.name} Interest`, `${t.name} Principal`])
    ];

    const rows = cashFlows.map(row => {
      const trancheData = tranches.flatMap(t => {
        const flow = row.trancheCashflows[t.id];
        return [flow?.interest || 0, flow?.principal || 0];
      });
      return [
        row.period,
        row.poolBalanceStart,
        row.poolInterest,
        row.poolPrincipal,
        row.poolDefaultAmount,
        ...trancheData
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `convex_credit_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Run calculation whenever inputs change
  const cashFlows = useMemo(() => {
    return runCashFlowEngine(pool, tranches, scenario);
  }, [pool, tranches, scenario]);

  return (
    <div className="flex min-h-screen bg-deep-navy text-silver-text font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-charcoal border-r border-convexica-gold/30 flex flex-col fixed h-full z-10 hidden md:flex">
        <div className="p-6 border-b border-white-subtle">
          <div className="flex items-center gap-2 text-convexica-gold font-bold text-xl">
            <Layers className="w-8 h-8" />
            <span>Convex <span className="text-white">Credit Engine</span></span>
          </div>
          <p className="text-xs text-slate-text mt-2 uppercase tracking-wider font-medium">By Convexica</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-convexica-gold/10 text-convexica-gold border border-convexica-gold/30' : 'text-slate-text hover:bg-slate-800'}`}
          >
            <Activity className="w-5 h-5" /> Deal Modeler
          </button>
           <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-convexica-gold/10 text-convexica-gold border border-convexica-gold/30' : 'text-slate-text hover:bg-slate-800'}`}
          >
            <BarChart3 className="w-5 h-5" /> Analytics & Reports
          </button>
           <div className="pt-4 border-t border-white-subtle mt-4">
             <div className="text-xs uppercase text-slate-text/60 font-bold px-4 mb-2">Market Data</div>
              <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-text hover:bg-slate-800 text-sm">
                <Database className="w-4 h-4" /> Yield Curves (India)
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-text hover:bg-slate-800 text-sm">
                <TrendingUp className="w-4 h-4" /> Sector Benchmarks
              </button>
           </div>
        </nav>

        <div className="p-4 border-t border-white-subtle">
           <div className="flex items-center gap-2 text-slate-text text-sm">
              <Settings className="w-4 h-4" /> Settings
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-silver-text">
              {activeTab === 'dashboard' ? 'Deal Structuring & Waterfall' : 'Analytics & Performance'}
            </h1>
            <p className="text-slate-text text-sm mt-1">
              Projected Cashflows based on Waterfall logic (Sequential Pay)
            </p>
          </div>
          <div className="bg-charcoal px-4 py-2 rounded-full border border-white-subtle text-xs text-slate-text">
             Model: <span className="text-convexica-gold">Standard ABS/MBS</span>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* Left Column: Inputs & AI */}
              <div className="xl:col-span-5 space-y-8">
                <DealInput 
                  pool={pool} setPool={setPool}
                  tranches={tranches} setTranches={setTranches}
                  scenario={scenario} setScenario={setScenario}
                />
                <AIAnalyst pool={pool} tranches={tranches} scenario={scenario} />
              </div>
              
              {/* Right Column: Visuals */}
              <div className="xl:col-span-7 space-y-8">
                <Visualizer data={cashFlows} tranches={tranches} />
              </div>
            </div>

            {/* Bottom Row: Full Width Metrics */}
            <MetricsTable tranches={tranches} data={cashFlows} />
          </div>
        ) : (
           <div className="space-y-8">
             <div className="bg-charcoal p-6 rounded-xl border border-white-subtle">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-silver-text">Detailed Cash Flow Report</h2>
                 <button 
                   onClick={downloadCSV}
                   className="flex items-center gap-2 px-4 py-2 bg-convexica-gold hover:bg-convexica-gold/80 text-deep-navy rounded-lg text-sm font-bold transition-colors"
                 >
                   <Download className="w-4 h-4" /> Download CSV
                 </button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-xs text-right text-slate-text font-mono">
                   <thead className="bg-slate-900 text-silver-text">
                      <tr>
                        <th className="p-3 text-left">Period</th>
                        <th className="p-3">Pool Bal</th>
                        <th className="p-3 text-inst-blue">Interest</th>
                        <th className="p-3 text-strat-orange">Principal</th>
                        <th className="p-3 text-risk-red">Defaults</th>
                        {tranches.map(t => (
                          <React.Fragment key={t.id}>
                             <th className="p-3 border-l border-white-subtle">{t.name} Int</th>
                             <th className="p-3">{t.name} Prin</th>
                          </React.Fragment>
                        ))}
                      </tr>
                   </thead>
                   <tbody>
                      {cashFlows.slice(0, 24).map((row) => (
                        <tr key={row.period} className="border-b border-white-subtle hover:bg-slate-700/20">
                           <td className="p-3 text-left text-silver-text">M{row.period}</td>
                           <td className="p-3">{Math.round(row.poolBalanceStart).toLocaleString()}</td>
                           <td className="p-3 text-inst-blue/80">{Math.round(row.poolInterest).toLocaleString()}</td>
                           <td className="p-3 text-strat-orange/80">{Math.round(row.poolPrincipal).toLocaleString()}</td>
                           <td className="p-3 text-risk-red/80">{Math.round(row.poolDefaultAmount).toLocaleString()}</td>
                           {tranches.map(t => {
                             const flow = row.trancheCashflows[t.id];
                             return (
                               <React.Fragment key={t.id}>
                                  <td className="p-3 border-l border-white-subtle">{Math.round(flow?.interest || 0).toLocaleString()}</td>
                                  <td className="p-3 text-silver-text font-bold">{Math.round(flow?.principal || 0).toLocaleString()}</td>
                               </React.Fragment>
                             )
                           })}
                        </tr>
                      ))}
                   </tbody>
                 </table>
                 <div className="p-4 text-center text-slate-text italic">Showing first 24 months only for brevity in report view.</div>
               </div>
             </div>
           </div>
        )}

      </main>
    </div>
  );
}

export default App;