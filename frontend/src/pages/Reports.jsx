// frontend/src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { BarChart3, TrendingUp, DollarSign, Award, ArrowUpRight, AwardIcon, Sparkles } from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();
  
  const [data, setData] = useState(null);
  const [attributions, setAttributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [summaryRes, attributionsRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/split/attribution')
      ]);
      setData(summaryRes.data);
      setAttributions(attributionsRes.data);
    } catch (err) {
      setError('Failed to load reports.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  // Calculate sum totals
  const totalBilled = attributions.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalSalesShare = attributions.reduce((sum, item) => sum + item.salesShare, 0);
  const totalAmShare = attributions.reduce((sum, item) => sum + item.amShare, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports Ledger</h1>
        <p className="text-sm text-slate-500">Analyze overall team performance, deal cycles, and commission logs</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass rounded-xl p-5 bg-white border border-slate-100 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-slate-100 p-3 text-slate-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Booked Deal Revenue</span>
            <span className="text-xl font-bold text-slate-800">₹{totalBilled.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 bg-white border border-slate-100 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-sky-50 p-3 text-accent">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Attributed Sales Share</span>
            <span className="text-xl font-bold text-slate-800">₹{totalSalesShare.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="glass rounded-xl p-5 bg-white border border-slate-100 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-green-50 p-3 text-green-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Attributed AM Share</span>
            <span className="text-xl font-bold text-slate-800">₹{totalAmShare.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Funnel Breakdown */}
        <div className="lg:col-span-1 glass rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Deal Conversion Ratios</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-xs text-slate-500">Pipeline Conversion Rate:</span>
              <span className="text-sm font-bold text-accent">{data.conversionRate}%</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-xs text-slate-500">Total Leads:</span>
              <span className="text-sm font-bold text-slate-800">{data.totalLeads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Closed Deals:</span>
              <span className="text-sm font-bold text-slate-800">{data.leadsByStage.PAYMENT_COMPLETED}</span>
            </div>
          </div>
        </div>

        {/* Rep leaderboard performance */}
        <div className="lg:col-span-2 glass rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Reps & Leads Funnel Conversion</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">Team Member</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3 text-center">Leads Managed</th>
                  <th className="py-3 px-3 text-center">Conversion Ratio</th>
                  <th className="py-3 px-3 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {data.teamPerformance.map((rep, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800">{rep.name}</td>
                    <td className="py-3 px-3 text-slate-400">{rep.role}</td>
                    <td className="py-3 px-3 text-center font-medium">{rep.leads}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">{rep.conversionRate}%</td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">₹{rep.revenue.toLocaleString('en-IN')}</td>
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

export default Reports;
