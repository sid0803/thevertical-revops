import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Flame,
  CheckCircle2,
  XCircle,
  Percent,
  Award,
  Sparkles,
  ArrowUpRight,
  Activity,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { StatCard } from '../components/common/StatCard';
import { api, mockData } from '../services/api';

export const Dashboard = ({ onOpenAISearch }) => {
  const [data, setData] = useState(mockData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        // Fallback to mockData
        setData(mockData);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const kpis = data.kpis || mockData.kpis;
  const charts = data.charts || mockData.charts;

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Executive Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Executive Revenue Dashboard
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
              Live Q3 Stream
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time revenue metrics, lead velocity, and AI-driven opportunity forecasts</p>
        </div>

        {/* AI Insight Trigger Banner */}
        <button
          onClick={onOpenAISearch}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl glass-panel hover:border-purple-500/50 transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">AI Deal Health Alert</span>
            <span className="text-[11px] text-purple-300">3 enterprise deals need executive check-in &rarr;</span>
          </div>
        </button>
      </div>

      {/* Grid of 10 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Revenue" value={`$${(kpis.total_revenue || 0).toLocaleString()}`} change="+18.4%" isPositive icon={DollarSign} badge="Q3 Goal" />
        <StatCard title="Monthly Rec. Rev (MRR)" value={`$${(kpis.mrr || 0).toLocaleString()}`} change="+12.1%" isPositive icon={TrendingUp} subtext="Run-rate $1.78M ARR" />
        <StatCard title="Annual Rec. Rev (ARR)" value={`$${(kpis.arr || 0).toLocaleString()}`} change="+15.2%" isPositive icon={Award} subtext="YoY Growth 142%" />
        <StatCard title="New Leads" value={kpis.new_leads} change="+24 this week" isPositive icon={Flame} badge="Inbound Heavy" />
        <StatCard title="Qualified Leads" value={kpis.qualified_leads} change="60.5% SQL Rate" isPositive icon={CheckCircle2} />
        
        <StatCard title="Meetings Conducted" value={kpis.meetings} change="+8 vs last wk" isPositive icon={Calendar} />
        <StatCard title="Deals Won" value={kpis.deals_won} change="24 Closed" isPositive icon={CheckCircle2} badge="Top Tier" />
        <StatCard title="Deals Lost" value={kpis.deals_lost} change="-3% Churn" isPositive={false} icon={XCircle} />
        <StatCard title="Win Conversion Rate" value={`${kpis.conversion_rate}%`} change="+4.2%" isPositive icon={Percent} />
        <StatCard title="Avg Deal Size" value={`$${(kpis.avg_deal_size || 0).toLocaleString()}`} change="+9.5%" isPositive icon={DollarSign} />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue vs Target Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Revenue Progression & Forecast</h2>
              <p className="text-xs text-slate-400">Actual ARR vs Executive Quarter Target ($k)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-purple-400"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Revenue</span>
              <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> Target</span>
            </div>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthly_revenue || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="target" stroke="#475569" strokeWidth={2} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Funnel Chart */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Pipeline Stage Funnel</h2>
            <p className="text-xs text-slate-400">Conversion breakdown across stages</p>
          </div>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={charts.sales_funnel || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="stage" stroke="#94a3b8" tick={{ fontSize: 10 }} width={70} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts: Lead Source & Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Source Pie */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Lead Acquisition Source</h2>
            <p className="text-xs text-slate-400">Attribution distribution by channel</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.lead_sources || []} innerRadius={55} outerRadius={80} paddingAngle={6} dataKey="value">
                  {(charts.lead_sources || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(charts.lead_sources || []).map((source, idx) => (
              <div key={source.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-300 font-medium truncate">{source.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team Leaderboard */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Sales Team Quota Attainment</h2>
              <p className="text-xs text-slate-400">Individual performance metrics & quota progress</p>
            </div>
            <span className="text-xs font-semibold text-purple-400">Q3 Leaderboard</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Sales Exec</th>
                  <th className="pb-3 font-semibold">Deals Closed</th>
                  <th className="pb-3 font-semibold">ARR Generated</th>
                  <th className="pb-3 font-semibold">Quota Attainment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(charts.team_performance || []).map((member) => (
                  <tr key={member.rep} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-bold text-white">{member.rep}</td>
                    <td className="py-3 text-slate-300">{member.deals_closed} Deals</td>
                    <td className="py-3 font-semibold text-emerald-400">${member.revenue.toLocaleString()}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                            style={{ width: `${Math.min(100, member.quota_pct)}%` }}
                          />
                        </div>
                        <span className="font-bold text-purple-300">{member.quota_pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
