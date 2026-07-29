import React from 'react';
import { BarChart3, TrendingUp, Zap, PieChart as PieIcon, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const Analytics = () => {
  const trendData = [
    { period: 'Week 1', velocity: 14.2, arr: 120000 },
    { period: 'Week 2', velocity: 16.5, arr: 180000 },
    { period: 'Week 3', velocity: 18.1, arr: 240000 },
    { period: 'Week 4', velocity: 22.4, arr: 340000 },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          Revenue Intelligence Analytics
        </h1>
        <p className="text-xs text-slate-400">Deep-dive pipeline velocity, win rate attribution, and revenue retention analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl space-y-2">
          <span className="text-xs uppercase font-bold text-slate-400">Avg Sales Cycle Velocity</span>
          <h3 className="text-3xl font-extrabold text-white">18.4 Days</h3>
          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> 32% faster cycle vs target
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-2">
          <span className="text-xs uppercase font-bold text-slate-400">Opportunity Win Rate</span>
          <h3 className="text-3xl font-extrabold text-white">72.5%</h3>
          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +5.8% increase this quarter
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-2">
          <span className="text-xs uppercase font-bold text-slate-400">Net Revenue Retention (NRR)</span>
          <h3 className="text-3xl font-extrabold text-white">142%</h3>
          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Top 5% SaaS Benchmark
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Weekly ARR Acceleration Trend</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="arr" stroke="#10b981" strokeWidth={3} fill="rgba(16, 185, 129, 0.15)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
