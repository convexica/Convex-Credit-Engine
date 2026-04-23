import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { CashFlowPeriod, Tranche, TrancheType } from '@/types';

interface VisualizerProps {
  data: CashFlowPeriod[];
  tranches: Tranche[];
}

const Visualizer: React.FC<VisualizerProps> = ({ data, tranches }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 300);
    return () => clearTimeout(timer);
  }, [data]);

  // Institutional Priority: Senior -> Mezzanine -> Equity
  const seniorTranches = tranches.filter(t => t.type === TrancheType.SENIOR);
  const mezzTranches = tranches.filter(t => t.type === TrancheType.MEZZANINE);
  const equityTranches = tranches.filter(t => t.type === TrancheType.EQUITY);
  
  // Fixed order for stack and legend
  const institutionalOrder = [...seniorTranches, ...mezzTranches, ...equityTranches];

  // Hard-mapped colors for consistency
  const colorMap: Record<string, string> = {
    [TrancheType.SENIOR]: '#1f77b4',    // Blue
    [TrancheType.MEZZANINE]: '#ff7f0e',  // Orange
    [TrancheType.EQUITY]: '#2ca02c',      // Green
  };

  // Transform data for stacked bar chart - START FROM M1
  const chartData = data
    .filter((d) => d.period > 0) // Strictly skip T0/M0
    .filter((d, i) => i % 3 === 0 || i < 12) 
    .map(d => {
      const point: any = { period: `M${d.period}`, periodValue: d.period };
      institutionalOrder.forEach(t => {
        point[t.name] = d.trancheCashflows[t.id]?.principal || 0;
      });
      return point;
    });

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-silver-text">Principal Waterfall (Stack)</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%" key={`bar-container-${data.length}`}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 60, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis 
                dataKey="period" 
                stroke="#94a3b8" 
                interval="auto"
                height={60}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <YAxis stroke="#94a3b8" tickFormatter={(v) => v.toLocaleString()} width={80} tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }} 
                formatter={(v: number) => Math.round(v).toLocaleString()} 
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: '30px' }}
                content={() => (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', paddingTop: '16px' }}>
                    {institutionalOrder.map((t) => (
                      <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                        <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: colorMap[t.type] || '#8b5cf6', borderRadius: '2px' }} />
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
              />
              {institutionalOrder.map((t) => (
                <Bar key={t.id} dataKey={t.name} stackId="a" fill={colorMap[t.type] || '#8b5cf6'} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-silver-text">Collateral Performance (Factor & Defaults)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%" key={`area-container-${data.length}`}>
            <AreaChart data={data} margin={{ top: 10, right: 60, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorFactor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f77b4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#1f77b4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis 
                dataKey="period" 
                stroke="#94a3b8" 
                interval={Math.ceil(data.length / 12)} 
                tickFormatter={(v) => v === 0 ? 'T0' : `M${v}`}
                tick={{ fontSize: 10 }}
              />
              {/* Left Y-Axis: Pool Factor (0 to 1.0) */}
              <YAxis 
                yId="left"
                stroke="#1f77b4" 
                domain={[0, 1]}
                tickFormatter={(v) => v.toFixed(2)}
                width={40} 
                tick={{ fontSize: 10 }} 
                label={{ value: 'Pool Factor', angle: -90, position: 'insideLeft', fill: '#1f77b4', fontSize: 10, offset: 0 }}
              />
              {/* Right Y-Axis: Cumulative Defaults % */}
              <YAxis 
                yId="right"
                orientation="right"
                stroke="#d62728" 
                domain={[0, 'auto']}
                tickFormatter={(v) => `${v.toFixed(1)}%`}
                width={40} 
                tick={{ fontSize: 10 }} 
                label={{ value: 'Cum. Default %', angle: 90, position: 'insideRight', fill: '#d62728', fontSize: 10, offset: 0 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }} 
                formatter={(v: number, name: string) => [
                  name === 'Factor' ? v.toFixed(4) : `${v.toFixed(2)}%`,
                  name
                ]}
              />
              <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
              <Area 
                yId="left"
                type="monotone" 
                dataKey={(d) => d.poolBalanceEnd / data[0].poolBalanceStart} 
                stroke="#1f77b4" 
                fillOpacity={1} 
                fill="url(#colorFactor)" 
                name="Factor" 
                strokeWidth={2}
              />
              <Area 
                yId="right"
                type="monotone" 
                dataKey={(d, i) => {
                  const cumDefault = data.slice(0, i + 1).reduce((sum, p) => sum + p.poolDefaultAmount, 0);
                  return (cumDefault / data[0].poolBalanceStart) * 100;
                }} 
                stroke="#d62728" 
                fill="transparent" 
                name="Cum. Default" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Visualizer;