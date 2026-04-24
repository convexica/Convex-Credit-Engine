import React, { useState, useMemo } from 'react';
import { AssetPool, Tranche, Scenario, SensitivityMetric } from '@/types';
import { generateSensitivityMatrix } from '@/lib/sensitivity';
import { ChevronDown } from 'lucide-react';

interface Props {
  pool: AssetPool;
  tranches: Tranche[];
  baseScenario: Scenario;
}

const SensitivityMatrix: React.FC<Props> = ({ pool, tranches, baseScenario }) => {
  const [selectedTrancheId, setSelectedTrancheId] = useState<string>(tranches[0]?.id || '');
  const [selectedMetric, setSelectedMetric] = useState<SensitivityMetric>(SensitivityMetric.YIELD);

  const matrixData = useMemo(() => {
    if (!selectedTrancheId) return [];
    return generateSensitivityMatrix(pool, tranches, baseScenario, selectedTrancheId, selectedMetric);
  }, [pool, tranches, baseScenario, selectedTrancheId, selectedMetric]);

  const uniqueCprs = Array.from(new Set(matrixData.map(d => d.cpr))).sort((a, b) => a - b);
  const uniqueCdrs = Array.from(new Set(matrixData.map(d => d.cdr))).sort((a, b) => a - b);

  const values = matrixData.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const getCellBackground = (value: number) => {
    if (maxVal === minVal) return 'rgba(30, 41, 59, 0.5)'; // Neutral slate
    
    const ratio = (value - minVal) / (maxVal - minVal);
    
    if (selectedMetric === SensitivityMetric.LOSS) {
       // Losses: 0 is neutral, anything > 0 gets redder
       if (value === 0) return 'rgba(30, 41, 59, 0.5)'; 
       return `rgba(214, 39, 40, ${Math.max(0.2, ratio * 0.8)})`; // Risk Red
    }
    
    if (selectedMetric === SensitivityMetric.YIELD) {
       // Yield: Higher is greener, lower is redder
       if (ratio > 0.5) {
          const intensity = (ratio - 0.5) * 2 * 0.6; // Scale up to 0.6 opacity max
          return `rgba(44, 160, 44, ${intensity})`; // Green
       } else {
          const intensity = (1 - (ratio * 2)) * 0.6;
          return `rgba(214, 39, 40, ${intensity})`; // Red
       }
    }
    
    if (selectedMetric === SensitivityMetric.WAL) {
        // WAL: Heatmap blue
        return `rgba(31, 119, 180, ${Math.max(0.1, ratio * 0.6)})`; // Inst Blue
    }
    
    return 'rgba(30, 41, 59, 0.5)';
  };

  const formatValue = (val: number) => {
    if (selectedMetric === SensitivityMetric.WAL) return val.toFixed(2);
    return `${val.toFixed(2)}%`;
  };

  return (
    <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-silver-text">Sensitivity Analysis (5x5)</h3>
          <p className="text-xs text-slate-text mt-1">Stress testing structural boundaries across macro scenarios.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <select 
              value={selectedTrancheId} 
              onChange={(e) => setSelectedTrancheId(e.target.value)}
              className="appearance-none bg-deep-navy border border-white-subtle/20 text-silver-text text-sm rounded-md pl-4 pr-10 py-2 focus:outline-none focus:border-convexica-gold cursor-pointer"
            >
              {tranches.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-text pointer-events-none" />
          </div>
          
          <div className="relative">
            <select 
              value={selectedMetric} 
              onChange={(e) => setSelectedMetric(e.target.value as SensitivityMetric)}
              className="appearance-none bg-deep-navy border border-white-subtle/20 text-silver-text text-sm rounded-md pl-4 pr-10 py-2 focus:outline-none focus:border-convexica-gold cursor-pointer"
            >
              {Object.values(SensitivityMetric).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-text pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header row: CPRs */}
          <div className="flex items-center mb-2">
            <div className="w-24 shrink-0 text-center text-xs font-bold text-slate-text">CDR \ CPR</div>
            <div className="flex-1 flex border-b border-white-subtle/10 pb-2">
              {uniqueCprs.map(cpr => (
                <div key={cpr} className="flex-1 text-center font-bold text-silver-text text-xs">
                  {cpr.toFixed(1)}%
                </div>
              ))}
            </div>
          </div>
          
          {/* Grid Rows: CDRs */}
          <div className="flex flex-col gap-1">
            {uniqueCdrs.map(cdr => {
              const rowCells = uniqueCprs.map(cpr => matrixData.find(d => d.cpr === cpr && d.cdr === cdr)!);
              return (
                <div key={cdr} className="flex items-center gap-1">
                  <div className="w-24 shrink-0 text-right pr-4 font-bold text-silver-text text-xs border-r border-white-subtle/10">
                    {cdr.toFixed(1)}%
                  </div>
                  <div className="flex-1 flex gap-1">
                    {rowCells.map((cell, idx) => (
                      <div 
                        key={idx}
                        style={{ backgroundColor: getCellBackground(cell.value) }}
                        className={`flex-1 p-3 rounded text-center text-sm font-mono transition-all hover:brightness-125 cursor-default ${cell.isBaseCase ? 'ring-2 ring-convexica-gold ring-inset font-bold text-white' : 'text-silver-text/90'}`}
                        title={`CDR: ${cell.cdr.toFixed(1)}%, CPR: ${cell.cpr.toFixed(1)}%`}
                      >
                        {formatValue(cell.value)}
                        {cell.isBaseCase && <div className="text-[9px] uppercase tracking-wider text-convexica-gold/80 mt-1">Base</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensitivityMatrix;
