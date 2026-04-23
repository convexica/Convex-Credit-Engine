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

  // Transform data for stacked bar chart
  const chartData = data.filter((d, i) => i === 0 || i % 3 === 0).map(d => {
    const point: any = { period: d.period === 0 ? 'T0' : `M${d.period}`, periodValue: d.period };
    const sortedTranches = [...tranches].sort((a, b) => {
      const order = { [TrancheType.SENIOR]: 1, [TrancheType.MEZZANINE]: 2, [TrancheType.EQUITY]: 3 };
      return (order[a.type] || 99) - (order[b.type] || 99);
    });
    sortedTranches.forEach(t => {
      point[t.name] = d.trancheCashflows[t.id]?.principal || 0;
    });
    return point;
  });

  // Force Legend Order explicitly: Senior -> Mezz -> Equity
  const legendOrder = ['senior', 'mezzanine', 'equity'];
  const sortedTranchesForLegend = [...tranches].sort((a, b) => {
      const idxA = legendOrder.findIndex(o => a.type.toLowerCase().includes(o));
      const idxB = legendOrder.findIndex(o => b.type.toLowerCase().includes(o));
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d4af37', '#8b5cf6'];

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-silver-text">Principal Waterfall (Stack)</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%" key={`bar-container-${data.length}`}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 60, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis 
                dataKey="period" 
                stroke="#94a3b8" 
                interval="auto"
                height={60}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                label={{ value: 'Period', position: 'insideBottom', offset: 0, fill: '#94a3b8', fontSize: 10 }} 
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
                // We map specifically to ensure order is locked
                payload={sortedTranchesForLegend.map((t, i) => ({
                    value: t.name,
                    type: 'rect',
                    id: t.id,
                    color: colors[i % colors.length]
                }))}
              />
              {sortedTranchesForLegend.map((t, index) => (
                <Bar key={t.id} dataKey={t.name} stackId="a" fill={colors[index % colors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-silver-text">Collateral Balance</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%" key={`area-container-${data.length}`}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 60, bottom: 20 }}>
              <defs>
                <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f77b4" stopOpacity={0.8}/><stop offset="95%" stopColor="#1f77b4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis 
                dataKey="period" 
                stroke="#94a3b8" 
                interval={Math.ceil(data.length / 10)} // Dynamic interval to avoid clash
                tickFormatter={(v) => v === 0 ? 'T0' : `M${v}`}
                tick={{ fontSize: 10 }}
                label={{ value: 'Month', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} 
              />
              <YAxis stroke="#94a3b8" tickFormatter={(v) => v.toLocaleString()} width={80} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }} formatter={(v: number) => Math.round(v).toLocaleString()} />
              <Area type="monotone" dataKey="poolBalanceStart" stroke="#1f77b4" fillOpacity={1} fill="url(#colorBal)" name="Balance" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Visualizer;