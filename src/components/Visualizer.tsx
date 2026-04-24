import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line } from 'recharts';
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

  // 1. Transform data for Principal Waterfall - START FROM M1
  const waterfallData = data
    .filter((d) => d.period > 0)
    .filter((d, i) => i % 3 === 0 || i < 12) 
    .map(d => {
      const point: any = { period: `M${d.period}`, periodValue: d.period };
      institutionalOrder.forEach(t => {
        point[t.name] = d.trancheCashflows[t.id]?.principal || 0;
      });
      return point;
    });

  // 2. Pre-calculate performance metrics for Collateral chart - START FROM M0
  let runningDefaultTotal = 0;
  const performanceData = data.map((d) => {
    runningDefaultTotal += d.poolDefaultAmount;
    return {
      ...d,
      displayPeriod: d.period === 0 ? 'M0' : `M${d.period}`,
      factor: d.poolBalanceEnd / data[0].poolBalanceStart,
      cumDefaultPct: (runningDefaultTotal / data[0].poolBalanceStart) * 100
    };
  });

  // 3. Pre-calculate Credit Enhancement Evolution - START FROM M0
  const ceData = data.map((d) => {
    let seniorBal = 0;
    let mezzBal = 0;
    let equityBal = 0;
    let totalBal = 0;

    tranches.forEach(t => {
      const bal = d.trancheCashflows[t.id]?.balanceEnd || 0;
      totalBal += bal;
      if (t.type === TrancheType.SENIOR) seniorBal += bal;
      if (t.type === TrancheType.MEZZANINE) mezzBal += bal;
      if (t.type === TrancheType.EQUITY) equityBal += bal;
    });

    // CE = Total Subordinated Balance / Total Pool Balance
    const seniorCE = totalBal > 0 ? ((mezzBal + equityBal) / totalBal) * 100 : 0;
    const mezzCE = totalBal > 0 ? (equityBal / totalBal) * 100 : 0;

    return {
      period: d.period === 0 ? 'M0' : `M${d.period}`,
      seniorCE,
      mezzCE,
    };
  });

  // 4. Pre-calculate Excess Spread vs Losses
  const spreadData = data
    .filter(d => d.period > 0)
    .map(d => ({
       period: `M${d.period}`,
       excessSpread: d.excessSpread,
       netLoss: -d.poolLoss // Negative to hang below the X-axis waterline
    }));

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
      {/* Principal Waterfall Chart */}
      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-silver-text">Principal Waterfall (Stack)</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%" key={`bar-container-${data.length}`}>
            <BarChart data={waterfallData} margin={{ top: 10, right: 30, left: 60, bottom: 60 }}>
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

      {/* 2. Pool Factor Amortization Chart */}
      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-silver-text">Pool Factor Amortization (Principal Decline)</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%" key={`factor-container-${data.length}`}>
            <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorFactorSolo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f77b4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1f77b4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis 
                dataKey="displayPeriod" 
                stroke="#94a3b8" 
                interval={Math.ceil(data.length / 10)} 
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                stroke="#1f77b4" 
                domain={[0, 1]}
                tickFormatter={(v) => v.toFixed(2)}
                width={45} 
                tick={{ fontSize: 10 }} 
                label={{ value: 'Factor', angle: -90, position: 'insideLeft', fill: '#1f77b4', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }} 
                formatter={(v: number) => [v.toFixed(4), 'Pool Factor']}
              />
              <Area 
                type="monotone" 
                dataKey="factor" 
                stroke="#1f77b4" 
                fillOpacity={1} 
                fill="url(#colorFactorSolo)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Cumulative Default Burn Chart */}
      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-silver-text">Cumulative Default Burn (Credit Performance)</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%" key={`default-container-${data.length}`}>
            <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorDefaultSolo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d62728" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#d62728" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis 
                dataKey="displayPeriod" 
                stroke="#94a3b8" 
                interval={Math.ceil(data.length / 10)} 
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                stroke="#d62728" 
                domain={[0, 'auto']}
                tickFormatter={(v) => `${v.toFixed(1)}%`}
                width={45} 
                tick={{ fontSize: 10 }} 
                label={{ value: 'Default %', angle: -90, position: 'insideLeft', fill: '#d62728', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }} 
                formatter={(v: number) => [`${v.toFixed(2)}%`, 'Cumulative Default']}
              />
              <Area 
                type="monotone" 
                dataKey="cumDefaultPct" 
                stroke="#d62728" 
                fillOpacity={1} 
                fill="url(#colorDefaultSolo)" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* 4. Credit Enhancement (CE) Evolution Chart */}
      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-silver-text">Credit Enhancement Evolution (Loss Coverage)</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%" key={`ce-container-${data.length}`}>
            <LineChart data={ceData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis 
                dataKey="period" 
                stroke="#94a3b8" 
                interval={Math.ceil(data.length / 10)} 
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                stroke="#94a3b8" 
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                width={45} 
                tick={{ fontSize: 10 }} 
                label={{ value: 'CE %', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }} 
                formatter={(v: number, name: string) => [`${v.toFixed(2)}%`, name === 'seniorCE' ? 'Senior CE' : 'Mezzanine CE']}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: '20px' }}
                content={() => (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', paddingTop: '16px' }}>
                     <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                       <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: colorMap[TrancheType.SENIOR], borderRadius: '2px' }} />
                       Senior CE
                     </span>
                     <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                       <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: colorMap[TrancheType.MEZZANINE], borderRadius: '2px' }} />
                       Mezzanine CE
                     </span>
                  </div>
                )}
              />
              <Line type="monotone" dataKey="seniorCE" stroke={colorMap[TrancheType.SENIOR]} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="mezzCE" stroke={colorMap[TrancheType.MEZZANINE]} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Excess Spread vs. Net Loss Chart */}
      <div className="bg-charcoal p-6 rounded-xl border border-white-subtle shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-silver-text">Excess Spread vs. Net Losses (First Line of Defense)</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%" key={`spread-container-${data.length}`}>
            <BarChart data={spreadData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis 
                dataKey="period" 
                stroke="#94a3b8" 
                interval={Math.ceil(data.length / 10)} 
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                stroke="#94a3b8" 
                tickFormatter={(v) => Math.abs(v).toLocaleString(undefined, { notation: "compact", compactDisplay: "short" })}
                width={45} 
                tick={{ fontSize: 10 }} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }} 
                formatter={(v: number, name: string) => [Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 }), name === 'excessSpread' ? 'Excess Spread' : 'Net Loss']}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: '20px' }}
                content={() => (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', paddingTop: '16px' }}>
                     <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                       <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#eab308', borderRadius: '2px' }} />
                       Excess Spread (Defense)
                     </span>
                     <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                       <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#d62728', borderRadius: '2px' }} />
                       Net Loss (Attack)
                     </span>
                  </div>
                )}
              />
              <Bar dataKey="excessSpread" fill="#eab308" stackId="stack" />
              <Bar dataKey="netLoss" fill="#d62728" stackId="stack" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Visualizer;