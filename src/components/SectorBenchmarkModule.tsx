import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const dummyBenchmarkData = [
  { sector: 'Microfinance', defaultRate: 3.5, prepayRate: 15.0 },
  { sector: 'Auto Loans', defaultRate: 2.1, prepayRate: 10.5 },
  { sector: 'Gold Loans', defaultRate: 0.5, prepayRate: 25.0 },
  { sector: 'SME Loans', defaultRate: 4.2, prepayRate: 12.0 },
];

export const SectorBenchmarkModule: React.FC = () => {
  return (
    <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm mb-8">
      <h3 className="text-lg font-semibold text-silver-text mb-4">Sector Benchmarks (Trailing 12M)</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dummyBenchmarkData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="sector" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="defaultRate" name="CDR (%)" fill="#d62728" radius={[4, 4, 0, 0]} />
            <Bar dataKey="prepayRate" name="CPR (%)" fill="#1f77b4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
