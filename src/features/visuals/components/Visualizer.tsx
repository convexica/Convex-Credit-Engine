import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { CashFlowPeriod, Tranche, TrancheType } from '@/core/types';

interface VisualizerProps {
  data: CashFlowPeriod[];
  tranches: Tranche[];
}

const Visualizer: React.FC<VisualizerProps> = ({ data, tranches }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Trigger pulse effect when data changes
  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 300);
    return () => clearTimeout(timer);
  }, [data]);

  // Transform data for stacked bar chart of principal payments
  // Show every 3rd period for a cleaner look as requested
  const chartData = data.filter((_, i) => i % 3 === 0).map(d => {
    const point: any = { period: d.period };
    // Sort tranches to ensure consistent stack order (Senior at bottom)
    const sortedTranches = [...tranches].sort((a, b) => {
      const order = { 
        [TrancheType.SENIOR]: 1, 
        [TrancheType.MEZZANINE]: 2, 
        [TrancheType.EQUITY]: 3 
      };
      return (order[a.type] || 99) - (order[b.type] || 99);
    });
    sortedTranches.forEach(t => {
      point[t.name] = d.trancheCashflows[t.id]?.principal || 0;
    });
    return point;
  });

  // Legend order: Senior -> Mezzanine -> Equity (Left to Right)
  const sortedTranchesForLegend = [...tranches].sort((a, b) => {
    const order = { 
      [TrancheType.SENIOR]: 1, 
      [TrancheType.MEZZANINE]: 2, 
      [TrancheType.EQUITY]: 3 
    };
    return (order[a.type] || 99) - (order[b.type] || 99);
  });

  const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d4af37', '#8b5cf6'];

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-silver-text">Principal Waterfall (Stack)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%" key={`bar-container-${data.length}-${JSON.stringify(tranches)}`}>
            <BarChart 
              data={chartData} 
              margin={{ top: 10, right: 30, left: 60, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis 
                dataKey="period" 
                stroke="#94a3b8" 
                interval={0} // Show all labels since data is already filtered to every 3rd month
                label={{ value: 'Month', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 10 }} 
              />
              <YAxis stroke="#94a3b8" tickFormatter={(value) => value.toLocaleString()} width={80} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }} 
                formatter={(value: number) => value.toLocaleString()}
              />
              <Legend 
                verticalAlign="bottom" 
                align="center"
                wrapperStyle={{ paddingTop: '20px' }}
              />
              {sortedTranchesForLegend.map((t, index) => (
                <Bar 
                   key={t.id} 
                   dataKey={t.name} 
                   stackId="a" 
                   fill={colors[index % colors.length]} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-silver-text">Collateral Balance</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%" key={`area-container-${data.length}-${data[0]?.poolBalanceStart}-${data[0]?.poolInterest}`}>
            <AreaChart 
              data={data} 
              margin={{ top: 10, right: 30, left: 60, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f77b4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1f77b4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis 
                dataKey="period" 
                stroke="#94a3b8" 
                interval={2} // Show every 3rd label (0, 3, 6, 9...)
                label={{ value: 'Month', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }}
              />
              <YAxis stroke="#94a3b8" tickFormatter={(value) => value.toLocaleString()} width={80} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }} 
                formatter={(value: number) => value.toLocaleString()}
              />
              <Area type="monotone" dataKey="poolBalanceStart" stroke="#1f77b4" fillOpacity={1} fill="url(#colorBal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Visualizer;