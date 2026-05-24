// frontend/src/pages/Targets/TargetsDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Target,
  Phone,
  Clock,
  CircleDollarSign,
  UserCheck,
  Save,
  Loader2,
  Calendar,
  ChevronRight,
  TrendingUp,
  User,
  Users
} from 'lucide-react';

const TargetsDashboard = () => {
  const { user } = useAuth();
  
  const isTLOrAbove = ['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER'].includes(user?.role);
  const isRep = user?.role === 'SALES_EXEC';

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Rep State
  const [repProgress, setRepProgress] = useState(null);
  const [repLoading, setRepLoading] = useState(false);

  // TL State
  const [teamProgress, setTeamProgress] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState(null);
  const [editValues, setEditValues] = useState({
    callTarget: 0,
    talkTimeTarget: 0,
    revenueTarget: 0,
    leadTarget: 0
  });

  const [savingTarget, setSavingTarget] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (isRep) {
      fetchRepProgress();
    }
    if (isTLOrAbove) {
      fetchTeamProgress();
    }
  }, [currentMonth]);

  const fetchRepProgress = async () => {
    try {
      setRepLoading(true);
      const res = await api.get(`/targets/progress?month=${currentMonth}`);
      setRepProgress(res.data);
    } catch (err) {
      console.error('Error fetching rep progress:', err);
    } finally {
      setRepLoading(false);
    }
  };

  const fetchTeamProgress = async () => {
    try {
      setTeamLoading(true);
      const res = await api.get(`/targets/team?month=${currentMonth}`);
      setTeamProgress(res.data);
    } catch (err) {
      console.error('Error fetching team progress:', err);
    } finally {
      setTeamLoading(false);
    }
  };

  const startEditing = (item) => {
    setEditingTargetId(item.rep.id);
    setEditValues({
      callTarget: item.target.callTarget || 0,
      talkTimeTarget: item.target.talkTimeTarget || 0,
      revenueTarget: item.target.revenueTarget || 0,
      leadTarget: item.target.leadTarget || 0
    });
  };

  const cancelEditing = () => {
    setEditingTargetId(null);
  };

  const handleEditChange = (field, value) => {
    setEditValues(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const saveTarget = async (repId) => {
    try {
      setSavingTarget(true);
      setMessage({ text: '', type: '' });

      const payload = {
        assignedToId: repId,
        month: currentMonth,
        callTarget: editValues.callTarget,
        talkTimeTarget: editValues.talkTimeTarget,
        revenueTarget: editValues.revenueTarget,
        leadTarget: editValues.leadTarget
      };

      await api.post('/targets', payload);
      setMessage({ text: 'Target updated successfully!', type: 'success' });
      setEditingTargetId(null);
      fetchTeamProgress();
    } catch (err) {
      console.error('Error saving target:', err);
      setMessage({ text: err.response?.data?.message || 'Failed to update target', type: 'error' });
    } finally {
      setSavingTarget(false);
    }
  };

  // Progress Ring Component
  const ProgressRing = ({ percentage, colorClass, size = 120, strokeWidth = 8, children }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const boundedPct = Math.min(Math.max(percentage, 0), 100);
    const strokeDashoffset = circumference - (boundedPct / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          {/* Track ring */}
          <circle
            className="text-slate-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress ring */}
          <circle
            className={`transition-all duration-500 ease-out ${colorClass}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          {children}
        </div>
      </div>
    );
  };

  const formatPercentage = (actual, target) => {
    if (!target) return actual > 0 ? 100 : 0;
    return Math.round((actual / target) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Month Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Target className="h-5.5 w-5.5 text-accent-blue" />
            Performance & Target Dashboard
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Track metrics and monthly quotas across calls, talk time, conversions, and paid billing revenue.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded px-3 py-1.5 self-start shadow-sm">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="bg-transparent text-xs text-slate-650 border-none focus:outline-none cursor-pointer font-bold"
          />
        </div>
      </div>

      {message.text && (
        <div className={`rounded p-4 text-xs font-semibold ${
          message.type === 'success' ? 'border border-emerald-250 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-750'
        }`}>
          {message.text}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          REPRESENTATIVE / SALES EXEC VIEW: PROGRESS RINGS
          ──────────────────────────────────────────────────────── */}
      {isRep && (
        <div className="space-y-6">
          {repLoading ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
            </div>
          ) : repProgress ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Call Count */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col items-center text-center space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-550 font-bold text-xs uppercase tracking-wider">
                  <Phone className="h-4 w-4 text-sky-550" />
                  Calls Placed
                </div>
                <ProgressRing
                  percentage={formatPercentage(repProgress.actual.calls, repProgress.target.callTarget)}
                  colorClass="text-sky-500"
                >
                  <span className="text-xl font-black text-slate-800">{repProgress.actual.calls}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Target: {repProgress.target.callTarget}</span>
                </ProgressRing>
                <div className="text-xs font-bold text-slate-700">
                  {formatPercentage(repProgress.actual.calls, repProgress.target.callTarget)}% of target met
                </div>
              </div>

              {/* Card 2: Talk Time */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col items-center text-center space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-550 font-bold text-xs uppercase tracking-wider">
                  <Clock className="h-4 w-4 text-amber-550" />
                  Talk Time (Mins)
                </div>
                <ProgressRing
                  percentage={formatPercentage(repProgress.actual.talkTime, repProgress.target.talkTimeTarget)}
                  colorClass="text-amber-500"
                >
                  <span className="text-xl font-black text-slate-800">{repProgress.actual.talkTime}m</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Target: {repProgress.target.talkTimeTarget}m</span>
                </ProgressRing>
                <div className="text-xs font-bold text-slate-700">
                  {formatPercentage(repProgress.actual.talkTime, repProgress.target.talkTimeTarget)}% of target met
                </div>
              </div>

              {/* Card 3: Lead Conversions */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col items-center text-center space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-550 font-bold text-xs uppercase tracking-wider">
                  <UserCheck className="h-4 w-4 text-purple-550" />
                  Conversions
                </div>
                <ProgressRing
                  percentage={formatPercentage(repProgress.actual.leads, repProgress.target.leadTarget)}
                  colorClass="text-purple-500"
                >
                  <span className="text-xl font-black text-slate-800">{repProgress.actual.leads}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Target: {repProgress.target.leadTarget}</span>
                </ProgressRing>
                <div className="text-xs font-bold text-slate-700">
                  {formatPercentage(repProgress.actual.leads, repProgress.target.leadTarget)}% of target met
                </div>
              </div>

              {/* Card 4: Revenue Collected */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col items-center text-center space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-550 font-bold text-xs uppercase tracking-wider">
                  <CircleDollarSign className="h-4 w-4 text-emerald-550" />
                  Slab Revenue Paid
                </div>
                <ProgressRing
                  percentage={formatPercentage(repProgress.actual.revenue, repProgress.target.revenueTarget)}
                  colorClass="text-emerald-500"
                >
                  <span className="text-base font-black text-slate-800">₹{Math.round(repProgress.actual.revenue / 1000)}K</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Target: ₹{Math.round(repProgress.target.revenueTarget / 1000)}K</span>
                </ProgressRing>
                <div className="text-xs font-bold text-slate-700">
                  {formatPercentage(repProgress.actual.revenue, repProgress.target.revenueTarget)}% of target met
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 border border-slate-200 rounded-lg bg-white shadow-sm">
              No targets assigned to you for this month.
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          TEAM LEADER / MANAGER / SUPER ADMIN VIEW: ASSIGNMENT SHEET
          ──────────────────────────────────────────────────────── */}
      {isTLOrAbove && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2 uppercase tracking-wider">
            <Users className="h-4.5 w-4.5 text-accent-blue" />
            <h2>Team Progress Matrix & Target Control Sheet</h2>
          </div>

          {teamLoading ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
            </div>
          ) : teamProgress.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border border-slate-200 rounded-lg bg-white shadow-sm">
              No sales representatives assigned under your hierarchy for this month.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-slate-500">
                  <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Sales Rep</th>
                      <th className="px-6 py-3.5">Calls Target</th>
                      <th className="px-6 py-3.5">Talk Time</th>
                      <th className="px-6 py-3.5">Conversions</th>
                      <th className="px-6 py-3.5">Revenue Target (INR)</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                    {teamProgress.map((item) => {
                      const isEditing = editingTargetId === item.rep.id;

                      const callsPct = formatPercentage(item.actual.calls, item.target.callTarget);
                      const timePct = formatPercentage(item.actual.talkTime, item.target.talkTimeTarget);
                      const leadsPct = formatPercentage(item.actual.leads, item.target.leadTarget);
                      const revPct = formatPercentage(item.actual.revenue, item.target.revenueTarget);

                      return (
                        <tr key={item.rep.id} className="hover:bg-slate-55/35 transition-colors">
                          {/* Name */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600 font-bold">
                                <User className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-800">{item.rep.name}</div>
                                <div className="text-slate-400 text-[10px]">{item.rep.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Calls Target */}
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editValues.callTarget}
                                onChange={(e) => handleEditChange('callTarget', e.target.value)}
                                className="w-20 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:bg-white font-semibold"
                              />
                            ) : (
                              <div>
                                <span className="font-bold text-slate-800">{item.actual.calls}</span>
                                <span className="text-slate-400"> / {item.target.callTarget || 0}</span>
                                <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                  <div className="bg-sky-500 h-full rounded-full" style={{ width: `${Math.min(callsPct, 100)}%` }} />
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Talk Time */}
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editValues.talkTimeTarget}
                                onChange={(e) => handleEditChange('talkTimeTarget', e.target.value)}
                                className="w-20 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:bg-white font-semibold"
                              />
                            ) : (
                              <div>
                                <span className="font-bold text-slate-800">{item.actual.talkTime}m</span>
                                <span className="text-slate-400 font-semibold"> / {item.target.talkTimeTarget || 0}m</span>
                                <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(timePct, 100)}%` }} />
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Conversions */}
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editValues.leadTarget}
                                onChange={(e) => handleEditChange('leadTarget', e.target.value)}
                                className="w-20 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:bg-white font-semibold"
                              />
                            ) : (
                              <div>
                                <span className="font-bold text-slate-800">{item.actual.leads}</span>
                                <span className="text-slate-400"> / {item.target.leadTarget || 0}</span>
                                <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(leadsPct, 100)}%` }} />
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Revenue Target */}
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editValues.revenueTarget}
                                onChange={(e) => handleEditChange('revenueTarget', e.target.value)}
                                className="w-28 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:bg-white font-semibold"
                              />
                            ) : (
                              <div>
                                <span className="font-bold text-slate-800">₹{item.actual.revenue.toLocaleString('en-IN')}</span>
                                <span className="text-slate-400"> / ₹{(item.target.revenueTarget || 0).toLocaleString('en-IN')}</span>
                                <div className="w-32 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(revPct, 100)}%` }} />
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => saveTarget(item.rep.id)}
                                  disabled={savingTarget}
                                  className="inline-flex items-center gap-1 rounded bg-accent-blue px-2.5 py-1 text-[10px] font-bold text-white hover:bg-blue-750 uppercase tracking-wider"
                                >
                                  {savingTarget ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditing(item)}
                                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-605 transition uppercase tracking-wider"
                              >
                                Adjust Targets
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TargetsDashboard;
