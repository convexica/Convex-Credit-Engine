import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Layers, Activity, Settings, TrendingUp, BarChart3, Database, Download, PieChart, Loader2 } from 'lucide-react';
import DealInput from '@/components/DealInput';
import Visualizer from '@/components/Visualizer';
import MetricsTable from '@/components/MetricsTable';
import AIAnalyst from '@/components/AIAnalyst';
import ExecutiveSummary from '@/components/ExecutiveSummary';
import DataReport from '@/components/DataReport';
import SensitivityMatrix from '@/components/SensitivityMatrix';
const YieldCurveModule = lazy(() => import('@/components/YieldCurveModule'));
const SectorBenchmarkModule = lazy(() => import('@/components/SectorBenchmarkModule'));
import { AssetPool, Tranche, TrancheType, Scenario, PaymentFrequency } from '@/types';
import { runCashFlowEngine } from '@/lib/waterfall';
import { motion, AnimatePresence } from 'framer-motion';

// Default Data
const DEFAULT_POOL: AssetPool = {
  principalBalance: 100000000, // 10 Crores
  wac: 12.0,
  wam: 36,
  paymentFrequency: PaymentFrequency.MONTHLY,
};

const DEFAULT_TRANCHES: Tranche[] = [
  { id: '1', name: 'Series A1 (Senior)', type: TrancheType.SENIOR, originalBalance: 50000000, currentBalance: 50000000, coupon: 8.0, spread: 150, rating: 'AAA', price: 100 },
  { id: '2', name: 'Series A2 (Mezz)', type: TrancheType.MEZZANINE, originalBalance: 30000000, currentBalance: 30000000, coupon: 10.0, spread: 375, rating: 'AA', price: 100 },
  { id: '3', name: 'Equity Tranche', type: TrancheType.EQUITY, originalBalance: 20000000, currentBalance: 20000000, coupon: 0, spread: 0, rating: 'NR', price: 100 },
];

const DEFAULT_SCENARIO: Scenario = {
  cpr: 10,
  cdr: 2.5,
  severity: 40,
  delinquencyLag: 0,
  servicingFee: 0.5,
  recoveryLag: 6,
  turboTriggerPct: 5.0, // Default institutional trigger
  yieldCurve: [
    { tenor: 0.5, rate: 6.50 },
    { tenor: 1.0, rate: 6.75 },
    { tenor: 2.0, rate: 7.00 },
    { tenor: 3.0, rate: 7.25 },
    { tenor: 5.0, rate: 7.50 },
    { tenor: 10.0, rate: 7.80 },
  ],
};

function App() {
  const [pool, setPool] = useState<AssetPool>(DEFAULT_POOL);
  const [tranches, setTranches] = useState<Tranche[]>(DEFAULT_TRANCHES);
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'visuals' | 'analytics' | 'market-data'>('dashboard');

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
            onClick={() => setActiveTab('visuals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'visuals' ? 'bg-convexica-gold/10 text-convexica-gold border border-convexica-gold/30' : 'text-slate-text hover:bg-slate-800'}`}
          >
            <PieChart className="w-5 h-5" /> Visual Analytics
          </button>
           <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-convexica-gold/10 text-convexica-gold border border-convexica-gold/30' : 'text-slate-text hover:bg-slate-800'}`}
          >
            <BarChart3 className="w-5 h-5" /> Data Reports
          </button>
           <div className="pt-4 border-t border-white-subtle mt-4">
             <div className="text-xs uppercase text-slate-text/60 font-bold px-4 mb-2">Market Data</div>
              <button 
                onClick={() => setActiveTab('market-data')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'market-data' ? 'bg-convexica-gold/10 text-convexica-gold border border-convexica-gold/30' : 'text-slate-text hover:bg-slate-800'}`}
              >
                <Database className="w-4 h-4" /> Yield Curves & Benchmarks
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
              {activeTab === 'dashboard' ? 'Deal Structuring & Waterfall' : 
               activeTab === 'visuals' ? 'Visual Performance Analysis' : 
               activeTab === 'analytics' ? 'Analytics & Performance' :
               'Market Data & Benchmarks'}
            </h1>
            <p className="text-slate-text text-sm mt-1">
              {activeTab === 'visuals' ? 'Interactive waterfall and pool performance charts' : 
               activeTab === 'market-data' ? 'Macroeconomic indicators and sector-wide reference data' :
               'Projected Cashflows based on Waterfall logic (Sequential Pay)'}
            </p>
          </div>
          <div className="bg-charcoal px-4 py-2 rounded-full border border-white-subtle text-xs text-slate-text">
             Model: <span className="text-convexica-gold">Standard ABS/MBS</span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <DealInput 
                  pool={pool} setPool={setPool}
                  tranches={tranches} setTranches={setTranches}
                  scenario={scenario} setScenario={setScenario}
              />
              {/* Executive Summary Cards */}
              <ExecutiveSummary tranches={tranches} data={cashFlows} pool={pool} scenario={scenario} />
              
              {/* Metrics Table First */}
              <MetricsTable tranches={tranches} data={cashFlows} scenario={scenario} />
              {/* AI Analyst Second */}
              <AIAnalyst pool={pool} tranches={tranches} scenario={scenario} />
            </motion.div>
          )}

          {activeTab === 'visuals' && (
             <motion.div
                key="visuals"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
             >
                <ExecutiveSummary tranches={tranches} data={cashFlows} pool={pool} scenario={scenario} />
                <Suspense fallback={<div className="h-64 flex items-center justify-center bg-charcoal rounded-xl border border-white-subtle"><Loader2 className="animate-spin text-convexica-gold" /></div>}>
                  <Visualizer data={cashFlows} tranches={tranches} />
                  <SensitivityMatrix pool={pool} tranches={tranches} baseScenario={scenario} />
                </Suspense>
             </motion.div>
          )}

          {activeTab === 'analytics' && (
             <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
             >
               <DataReport 
                 cashFlows={cashFlows} 
                 tranches={tranches} 
                 onDownload={downloadCSV} 
               />
            </motion.div>
          )}

          {activeTab === 'market-data' && (
            <motion.div
                key="market-data"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
            >
              <Suspense fallback={<div className="h-64 flex items-center justify-center bg-charcoal rounded-xl border border-white-subtle"><Loader2 className="animate-spin text-convexica-gold" /></div>}>
                <YieldCurveModule />
                <SectorBenchmarkModule />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legal Disclaimer Footer */}
        <footer className="mt-12 pt-8 border-t border-white-subtle pb-8">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="flex justify-center gap-4 text-xs text-slate-text/60 font-bold uppercase tracking-widest mb-2">
              <span>Security</span>
              <span className="w-1 h-1 bg-slate-text/40 rounded-full my-auto"></span>
              <span>Privacy Policy</span>
              <span className="w-1 h-1 bg-slate-text/40 rounded-full my-auto"></span>
              <span>Terms of Service</span>
            </div>
            <p className="text-[10px] md:text-xs text-slate-text leading-relaxed">
              <span className="text-convexica-gold font-bold">DISCLAIMER:</span> This platform is provided for <span className="text-silver-text font-medium text-[11px]">informational and educational purposes only</span>. 
              The simulations, projections, and AI-generated insights provided herein are based on simplified waterfall logic, historical approximations, and user-provided assumptions. 
              They do not constitute financial, legal, or investment advice.
            </p>
            <p className="text-[10px] md:text-xs text-slate-text/70 leading-relaxed italic">
              Convexica and its affiliates are not responsible for any inaccuracies, errors, omissions, or financial losses resulting from the use of this engine. 
              Projections are inherently uncertain and actual market performance will vary. 
              Please consult with a qualified financial professional before making any structured credit investment decisions.
            </p>
            <div className="text-[9px] text-slate-text/40 pt-4 uppercase tracking-tighter">
              © 2026 CONVEXICA ANALYTICS • ALL RIGHTS RESERVED • INSTITUTIONAL GRADE MODEL V1.2.0
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}

export default App;