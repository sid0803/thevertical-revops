// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  TrendingUp,
  AlertOctagon,
  Activity,
  User,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingDown,
  BrainCircuit,
  IndianRupee,
  PhoneCall,
  CheckCircle,
  Target,
  Clock,
  AlertTriangle,
  Zap,
  DollarSign,
  BarChart2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, [dateFrom, dateTo]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      let url = '/dashboard/summary';
      const params = [];
      if (dateFrom) params.push(`from=${dateFrom}`);
      if (dateTo) params.push(`to=${dateTo}`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await api.get(url);
      setStats(response.data);
    } catch (err) {
      setError('Failed to load dashboard statistics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'DISCOVERY_CALL': return 'bg-gray-500';
      case 'DEMO': return 'bg-blue-500';
      case 'PROPOSAL': return 'bg-amber-500';
      case 'NEGOTIATION': return 'bg-indigo-500';
      case 'WIN': return 'bg-green-500';
      case 'LOSS': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 1: SALES_EXEC (BDE) Dashboard Layout
  // ----------------------------------------------------
  if (user.role === 'SALES_EXEC') {
    const personalPerformance = stats.teamPerformance?.find(p => p.name === user.name) || {
      leads: 0,
      converted: 0,
      conversionRate: 0,
      revenue: 0
    };

    const monthlyTarget = 500000;
    const achievedSoFar = personalPerformance.revenue;
    const remaining = Math.max(0, monthlyTarget - achievedSoFar);
    const progressPercent = Math.min(100, (achievedSoFar / monthlyTarget) * 100);

    // Mock focus item metrics linked where possible
    const followUpsToday = Math.max(1, stats.recentActivities.filter(a => a.userId === user.id).length);
    const callbacksToday = Math.max(0, stats.totalLeads - personalPerformance.converted);
    const highPriorityCount = stats.leadsByStage.NEGOTIATION || 0;
    const overdueCount = stats.overdueHandoffs || 0;

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="text-[10px] text-accent-blue font-bold uppercase tracking-wider block mb-1">BDE Performance Dashboard</span>
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back, {user.name.split(' ')[0]}!</h1>
            <p className="text-xs text-slate-500">Track your calls, targets, and live lead pipeline status</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2 bg-white border border-slate-250 rounded-lg p-2 text-xs shadow-sm">
              <Zap className="h-4 w-4 text-purple-600 animate-pulse" />
              <span className="font-bold text-slate-700">Account Health: <span className="text-emerald-600">Active</span></span>
            </div>
          </div>
        </div>

        {/* Execution Focus Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass rounded-xl p-5 bg-white border-l-4 border-indigo-500 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Scheduled Tasks</span>
            <span className="text-2xl font-extrabold text-slate-800">{followUpsToday}</span>
            <span className="text-[10px] text-slate-400 block">Actions due today</span>
          </div>

          <div className="glass rounded-xl p-5 bg-white border-l-4 border-sky-500 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Active Deals</span>
            <span className="text-2xl font-extrabold text-slate-800">{callbacksToday}</span>
            <span className="text-[10px] text-slate-400 block">Pending closures</span>
          </div>

          <div className="glass rounded-xl p-5 bg-white border-l-4 border-amber-500 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Negotiations</span>
            <span className="text-2xl font-extrabold text-slate-800">{highPriorityCount}</span>
            <span className="text-[10px] text-slate-400 block">High priority leads</span>
          </div>

          <div className="glass rounded-xl p-5 bg-white border-l-4 border-red-500 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Overdue Alerts</span>
            <span className="text-2xl font-extrabold text-slate-800">{overdueCount}</span>
            <span className="text-[10px] text-slate-400 block">Action SLA breached</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Target Tracker */}
          <div className="glass rounded-xl p-6 bg-slate-900 text-white border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Target className="h-32 w-32 text-white" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Personal Target Tracker</h3>
            
            <div className="text-center space-y-2">
              <span className="text-xs text-slate-400 block uppercase tracking-wide">Monthly Revenue Target: ₹{(monthlyTarget/100000).toFixed(1)}L</span>
              <span className="text-4xl font-extrabold block text-emerald-400">₹{(achievedSoFar/100000).toFixed(2)}L</span>
              <span className="text-xs text-slate-300 font-bold block">{progressPercent.toFixed(1)}% Achieved</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-350">
                <span>Progress toward goal</span>
                <span>₹{(remaining/100000).toFixed(2)}L Left</span>
              </div>
              <div className="h-3 w-full bg-slate-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 flex items-center space-x-3">
              <Zap className="h-5 w-5 text-amber-400 shrink-0" />
              <p className="text-xs text-slate-300 leading-relaxed">
                You are on track! Log notes and calls under the <strong>Work Queue</strong> page to maintain deal momentum.
              </p>
            </div>
          </div>

          {/* Pipeline Snapshot */}
          <div className="lg:col-span-2 glass rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">My Active Funnel Distribution</h3>
            <div className="space-y-4">
              {Object.entries(stats.leadsByStage)
                .filter(([stage]) => stage !== 'LOSS')
                .map(([stage, count]) => {
                  const percentage = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0;
                  return (
                    <div key={stage} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-650">{stage.replace('_', ' ')}</span>
                        <span className="text-slate-800 font-bold">{count} leads</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-lg overflow-hidden flex">
                        <div
                          className={`h-full rounded-lg transition-all duration-500 ${getStageColor(stage)}`}
                          style={{ width: `${Math.max(5, percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Dynamic Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI insights card */}
          <div className="glass rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BrainCircuit className="h-4 w-4 text-purple-600" />
              <span>AI Pipeline Insights</span>
            </h3>
            <div className="space-y-3">
              {stats.aiInsights?.slice(0, 2).map((ins, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-slate-800 uppercase text-[9px] tracking-wide block">{ins.title}</span>
                  <p className="text-slate-600 leading-relaxed">{ins.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Dialed Activity Logs */}
          <div className="lg:col-span-2 glass rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">My Recent Dial Logs</h3>
            <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
              {stats.recentActivities
                .filter(act => act.userId === user.id)
                .map((act) => (
                  <div key={act.id} className="flex items-start space-x-3 text-xs border-b border-slate-50 pb-2.5 last:border-b-0 last:pb-0">
                    <div className="rounded-full bg-slate-50 p-2 border border-slate-150 shrink-0">
                      <PhoneCall className="h-3.5 w-3.5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700">
                        Logged a <span className="font-semibold">{act.type}</span>: {act.description}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(act.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              {stats.recentActivities.filter(act => act.userId === user.id).length === 0 && (
                <p className="text-center text-xs text-slate-450 italic py-12">No recent call records logged. Enable dialer in work queue.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: TEAM_LEADER Dashboard Layout
  // ----------------------------------------------------
  if (user.role === 'TEAM_LEADER') {
    // Generate trend points from existing activities count
    const activityTrend = [
      { name: 'Mon', calls: 35, conversions: 2 },
      { name: 'Tue', calls: 48, conversions: 3 },
      { name: 'Wed', calls: stats.recentActivities.length * 3 || 30, conversions: stats.totalLeads - stats.pendingInvoices || 1 },
      { name: 'Thu', calls: 52, conversions: 4 },
      { name: 'Fri', calls: 65, conversions: 5 }
    ];

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block mb-1">Performance Control Panel</span>
            <h1 className="text-2xl font-bold text-slate-900">Team Performance Overview</h1>
            <p className="text-xs text-slate-500">Real-time indicators, outcomes, and activity compliance tracking</p>
          </div>
        </div>

        {/* Effort & Activity Indicators */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-l-2 border-indigo-500 pl-2">
            A. Leading Indicators (Effort & Activity)
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-1">
              <PhoneCall className="h-5 w-5 text-indigo-500" />
              <span className="text-2xl font-extrabold text-slate-800">{stats.recentActivities.length * 3}</span>
              <span className="text-xs text-slate-500 block uppercase font-semibold text-[10px]">Total Calls Made</span>
            </div>
            
            <div className="glass rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-1">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-extrabold text-slate-800">{stats.leadsByStage.DEMO || 0}</span>
              <span className="text-xs text-slate-500 block uppercase font-semibold text-[10px]">Meetings Scheduled</span>
            </div>

            <div className="glass rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-1">
              <Clock className="h-5 w-5 text-sky-500" />
              <span className="text-2xl font-extrabold text-slate-800">10 mins</span>
              <span className="text-xs text-slate-500 block uppercase font-semibold text-[10px]">Avg Response Time</span>
            </div>

            <div className="glass rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-1">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-extrabold text-slate-800">92%</span>
              <span className="text-xs text-slate-500 block uppercase font-semibold text-[10px]">Task Compliance</span>
            </div>
          </div>
        </div>

        {/* Outcomes & Funnel Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-l-2 border-emerald-500 pl-2">
              B. Lagging Indicators (Outcomes)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Closed Revenue (MTD)</span>
                <span className="text-xl font-extrabold text-emerald-600">₹{stats.totalRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Win Rate %</span>
                <span className="text-xl font-extrabold text-slate-800">{stats.conversionRate}%</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-700 block">Conversion Funnel Stages</span>
              <div className="space-y-2">
                {Object.entries(stats.leadsByStage).map(([stage, count]) => {
                  const percentage = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0;
                  return (
                    <div key={stage} className="flex justify-between items-center text-xs border border-slate-100 p-2 rounded bg-slate-50/50">
                      <span className="text-slate-500 font-medium">{stage}</span>
                      <span className="font-bold text-slate-800">{count} ({Math.round(percentage)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pipeline value health */}
          <div className="glass rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-l-2 border-amber-500 pl-2">
              C. Pipeline Value & Health
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Pipeline Value</span>
                <span className="text-xl font-extrabold text-amber-600">₹{(stats.totalRevenue * 1.5).toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Weighted Value</span>
                <span className="text-xl font-extrabold text-slate-800">₹{stats.totalRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <span className="text-xs font-bold text-slate-700 block">Deal Stage Weights</span>
              <div className="flex gap-1.5 h-7 rounded overflow-hidden">
                <div style={{ flex: 4 }} className="bg-indigo-500 text-[9px] text-white flex items-center justify-center font-bold">EARLY (40%)</div>
                <div style={{ flex: 3 }} className="bg-purple-500 text-[9px] text-white flex items-center justify-center font-bold">MID (30%)</div>
                <div style={{ flex: 3 }} className="bg-emerald-500 text-[9px] text-white flex items-center justify-center font-bold">LATE (30%)</div>
              </div>

              <div className="p-3 bg-red-50/50 border border-red-100 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-xs text-red-700">
                  <strong>{stats.overdueHandoffs} Handoff SLA Breaches</strong> detected. Action is required.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BDE Leaderboard & Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Visibility table */}
          <div className="lg:col-span-2 glass rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">D. Team Activity Visibility</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">BDE Name</th>
                    <th className="py-2.5 px-3 text-center">Leads</th>
                    <th className="py-2.5 px-3 text-center">Conv %</th>
                    <th className="py-2.5 px-3 text-right">Revenue Closed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650">
                  {stats.teamPerformance.map((bde, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{bde.name}</td>
                      <td className="py-2.5 px-3 text-center">{bde.leads}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{bde.conversionRate}%</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">₹{bde.revenue.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Trends */}
          <div className="glass rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">E. Performance Trends</h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityTrend}>
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" name="Team Calls" dataKey="calls" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 3: SUPER_ADMIN & MANAGER Dashboard Layout
  // ----------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Welcome Header and Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back, {user.name}</h1>
          <p className="text-sm text-slate-500">Here's your Revenue Operations overview for today.</p>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center space-x-2 bg-white border border-slate-250 rounded-lg p-2 text-xs shadow-sm self-start">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="outline-none text-slate-650 bg-transparent focus:text-slate-850"
          />
          <span className="text-slate-350">|</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="outline-none text-slate-650 bg-transparent focus:text-slate-850"
          />
        </div>
      </div>

      {/* Main KPI metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="glass rounded-xl p-5 bg-white border border-slate-200 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-slate-100 p-3 text-slate-650">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-450 block font-semibold uppercase tracking-wider">Pipeline Leads</span>
            <span className="text-2xl font-extrabold text-slate-800">{stats.totalLeads}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass rounded-xl p-5 bg-white border border-slate-200 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-sky-50 p-3 text-accent-blue">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-455 block font-semibold uppercase tracking-wider">Conversion Rate</span>
            <span className="text-2xl font-extrabold text-slate-800">{stats.conversionRate}%</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass rounded-xl p-5 bg-white border border-slate-200 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-455 block font-semibold uppercase tracking-wider">Cash Collected</span>
            <span className="text-2xl font-extrabold text-slate-850">₹{stats.cashCollected.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass rounded-xl p-5 bg-white border border-slate-200 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-red-50 p-3 text-red-500">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-455 block font-semibold uppercase tracking-wider">SLA Breached Handoffs</span>
            <span className="text-2xl font-extrabold text-slate-800">{stats.overdueHandoffs}</span>
          </div>
        </div>
      </div>

      {/* Grid: Funnel & AI Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pipeline Funnel Visualizer */}
        <div className="lg:col-span-2 glass rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Sales Stage Funnel Depth</h3>
          <div className="space-y-4">
            {Object.entries(stats.leadsByStage).map(([stage, count]) => {
              const percentage = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0;
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-650">{stage.replace('_', ' ')}</span>
                    <span className="text-slate-800">{count} leads ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-lg overflow-hidden flex">
                    <div
                      className={`h-full rounded-lg transition-all duration-500 ${getStageColor(stage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Intelligence Panel */}
        <div className="glass rounded-xl p-6 bg-slate-900 text-slate-100 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
          {/* Decorative Sparkle BG */}
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <BrainCircuit className="h-32 w-32 text-white" />
          </div>

          <div className="flex items-center space-x-2 text-sky-400 border-b border-slate-800 pb-3">
            <Sparkles className="h-5 w-5 text-accent-blue animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider">AI Copilot Intelligence</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Insights */}
            <div className="space-y-3">
              {stats.aiInsights && stats.aiInsights.length > 0 ? (
                stats.aiInsights.map((insight, idx) => (
                  <div key={idx} className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/50 animate-fadeIn">
                    <span className={`font-bold block mb-1 ${insight.color || 'text-sky-400'}`}>{insight.title}</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {insight.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500 py-6">No insights available at this time.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Leaderboard & Recent Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Performance Leaderboard */}
        <div className="glass rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Attribution Leaderboard</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">Salesperson</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3 text-center">Leads</th>
                  <th className="py-3 px-3 text-center">Conv. %</th>
                  <th className="py-3 px-3 text-right">Attributed Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-650">
                {stats.teamPerformance.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-3 px-3 text-slate-450">{item.role}</td>
                    <td className="py-3 px-3 text-center font-medium">{item.leads}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">{item.conversionRate}%</td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">₹{item.revenue.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Recent Activity Log */}
        <div className="glass rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Activity Logs</h3>
          
          {stats.recentActivities.length === 0 ? (
            <p className="text-center text-xs text-slate-450 py-10">No recent logs recorded.</p>
          ) : (
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {stats.recentActivities.map((act) => (
                <div key={act.id} className="flex items-start space-x-3 text-xs border-b border-slate-50 pb-2.5 last:border-b-0 last:pb-0">
                  <div className="rounded-full bg-slate-50 p-2 border border-slate-150 shrink-0">
                    <Activity className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-900">{act.user ? act.user.name : 'System'}</span>
                      {' '}{act.description}{' '}
                      for lead{' '}
                      <Link to={`/leads/${act.leadId}`} className="font-bold text-accent-blue hover:underline">
                        {act.lead?.name}
                      </Link>
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(act.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
