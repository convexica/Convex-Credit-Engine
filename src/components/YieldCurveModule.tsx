import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const dummyYieldData = [
  { maturity: '3M', yield: 6.85 },
  { maturity: '6M', yield: 7.02 },
  { maturity: '1Y', yield: 7.15 },
  { maturity: '2Y', yield: 7.20 },
  { maturity: '3Y', yield: 7.25 },
  { maturity: '5Y', yield: 7.32 },
  { maturity: '10Y', yield: 7.45 },
];

export const YieldCurveModule: React.FC = () => {
  return (
    <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm mb-8">
      <h3 className="text-lg font-semibold text-silver-text mb-4">Indian G-Sec Yield Curve</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dummyYieldData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d4af37" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="maturity" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} domain={['dataMin - 0.2', 'dataMax + 0.2']} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }} />
            <Area type="monotone" dataKey="yield" stroke="#d4af37" fillOpacity={1} fill="url(#colorYield)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
