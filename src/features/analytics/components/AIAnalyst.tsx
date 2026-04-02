import React, { useState } from 'react';
import { Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { AssetPool, Tranche, Scenario } from '@/core/types';
import { analyzeDealStructure, suggestOptimizations } from '@/infrastructure/ai/geminiProvider';

interface AIAnalystProps {
  pool: AssetPool;
  tranches: Tranche[];
  scenario: Scenario;
}

const AIAnalyst: React.FC<AIAnalystProps> = ({ pool, tranches, scenario }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'analysis' | 'optimize'>('analysis');

  const handleAnalyze = async () => {
    setLoading(true);
    setMode('analysis');
    const result = await analyzeDealStructure(pool, tranches, scenario);
    setAnalysis(result);
    setLoading(false);
  };

  const handleOptimize = async () => {
      setLoading(true);
      setMode('optimize');
      const result = await suggestOptimizations(pool, tranches);
      setAnalysis(result);
      setLoading(false);
  }

  return (
    <div className="bg-charcoal p-6 rounded-xl border border-convexica-gold/30 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-silver-text flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-convexica-gold" /> 
          AI Structure Analyst
        </h3>
        <div className="flex gap-2">
             <button
                onClick={handleOptimize}
                disabled={loading}
                className="text-xs px-3 py-1.5 bg-deep-navy hover:bg-slate-800 rounded-lg text-silver-text border border-white-subtle transition-colors"
             >
                Suggest Optimization
             </button>
            <button
            onClick={handleAnalyze}
            disabled={loading}
            className="text-xs px-3 py-1.5 bg-convexica-gold hover:bg-convexica-gold/80 rounded-lg text-deep-navy font-bold transition-colors flex items-center gap-1"
            >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
            Analyze Deal
            </button>
        </div>
      </div>

      {analysis ? (
        <div className="bg-deep-navy/50 p-4 rounded-lg border border-white-subtle">
           <h4 className="text-xs uppercase font-bold text-convexica-gold mb-2">
               {mode === 'analysis' ? 'Structure Report' : 'Optimization Suggestions'}
           </h4>
          <p className="text-sm text-silver-text whitespace-pre-line leading-relaxed">
            {analysis}
          </p>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-text text-sm">
          <p>Run analysis to get insights on credit enhancement and risks from Gemini 3.</p>
        </div>
      )}
    </div>
  );
};

export default AIAnalyst;