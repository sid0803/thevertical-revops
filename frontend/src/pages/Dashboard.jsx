// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  TrendingUp,
  CreditCard,
  AlertOctagon,
  Activity,
  User,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingDown,
  BrainCircuit
} from 'lucide-react';

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
      case 'NEW': return 'bg-gray-500';
      case 'INTERESTED': return 'bg-blue-500';
      case 'PROPOSAL_SHARED': return 'bg-amber-500';
      case 'PAYMENT_COMPLETED': return 'bg-green-500';
      case 'RNR_DNP':
      case 'NOT_INTERESTED': return 'bg-red-500';
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

  return (
    <div className="space-y-6">
      {/* Welcome Header and Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back, {user.name}</h1>
          <p className="text-sm text-slate-500">Here's your Revenue Operations overview for today.</p>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-2 text-xs shadow-sm self-start">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="outline-none text-slate-600 bg-transparent focus:text-slate-800"
          />
          <span className="text-slate-300">|</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="outline-none text-slate-600 bg-transparent focus:text-slate-800"
          />
        </div>
      </div>

      {/* Main KPI metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="glass rounded-xl p-5 bg-white border border-slate-100 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-slate-100 p-3 text-slate-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Pipeline Leads</span>
            <span className="text-2xl font-extrabold text-slate-800">{stats.totalLeads}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass rounded-xl p-5 bg-white border border-slate-100 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-sky-50 p-3 text-accent-blue">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Conversion Rate</span>
            <span className="text-2xl font-extrabold text-slate-800">{stats.conversionRate}%</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass rounded-xl p-5 bg-white border border-slate-100 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-green-50 p-3 text-green-600">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Cash Collected</span>
            <span className="text-2xl font-extrabold text-slate-800">₹{stats.cashCollected.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass rounded-xl p-5 bg-white border border-slate-100 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-red-50 p-3 text-red-500">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">SLA Breached Handoffs</span>
            <span className="text-2xl font-extrabold text-slate-800">{stats.overdueHandoffs}</span>
          </div>
        </div>
      </div>

      {/* Grid: Funnel & AI Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pipeline Funnel Visualizer */}
        <div className="lg:col-span-2 glass rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Sales Stage Funnel Depth</h3>
          <div className="space-y-4">
            {Object.entries(stats.leadsByStage).map(([stage, count]) => {
              const percentage = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0;
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">{stage.replace('_', ' ')}</span>
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
              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/50">
                <span className="font-bold text-accent-blue block mb-1">AI Lead Scoring</span>
                <p className="text-[11px] text-slate-300">
                  <span className="font-semibold text-white">Globex Corp</span> has a <span className="text-green-400 font-bold">94%</span> conversion probability based on 180s call logging activity.
                </p>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/50">
                <span className="font-bold text-accent-blue block mb-1">AI Follow-up Prompt</span>
                <p className="text-[11px] text-slate-300">
                  <span className="font-semibold text-white">Action Required:</span> Send pricing proposal to <span className="font-semibold text-white">Acme Corp</span>. Proposal stage has been active for 4 days.
                </p>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/50">
                <span className="font-bold text-red-400 block mb-1">AI Deal Risk Alert</span>
                <p className="text-[11px] text-slate-300">
                  <span className="font-semibold text-white">Umbrella Corp</span> is flagged as <span className="text-red-400 font-bold">STUCK</span>. Lead created 5 days ago with no call interactions.
                </p>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/50">
                <span className="font-bold text-green-400 block mb-1">AI Expansion Predictor</span>
                <p className="text-[11px] text-slate-300">
                  Predicted month-end expansion revenue: <span className="text-white font-bold">₹1,45,000</span> (Confidence: 89%). Upsell window is optimal for Initech Inc.
                </p>
              </div>
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
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {stats.teamPerformance.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-3 px-3 text-slate-400">{item.role}</td>
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
            <p className="text-center text-xs text-slate-400 py-10">No recent logs recorded.</p>
          ) : (
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {stats.recentActivities.map((act) => (
                <div key={act.id} className="flex items-start space-x-3 text-xs border-b border-slate-50 pb-2.5 last:border-b-0 last:pb-0">
                  <div className="rounded-full bg-slate-100 p-2 text-slate-600 border border-slate-200 shrink-0">
                    <Activity className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700">
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
