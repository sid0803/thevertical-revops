// frontend/src/pages/SplitMapping.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  GitBranch,
  CheckSquare,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  Mail,
  Users,
  Briefcase,
  Play
} from 'lucide-react';

const SplitMapping = () => {
  const { user } = useAuth();
  
  const [handoffs, setHandoffs] = useState([]);
  const [attributions, setAttributions] = useState([]);
  const [activeTab, setActiveTab] = useState('handoffs');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [handoffsRes, attributionsRes] = await Promise.all([
        api.get('/split/handoffs'),
        api.get('/split/attribution')
      ]);
      setHandoffs(handoffsRes.data);
      setAttributions(attributionsRes.data);
    } catch (err) {
      setError('Failed to load split-mapping data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle checklist checkbox
  const handleChecklistToggle = async (handoffId, itemKey, currentValue) => {
    if (!['SUPER_ADMIN', 'ACCOUNT_MANAGER'].includes(user.role)) return;

    try {
      const handoff = handoffs.find(h => h.id === handoffId);
      if (!handoff) return;

      const payload = {
        introMailSent: handoff.introMailSent,
        meetingDone: handoff.meetingDone,
        onboardingDone: handoff.onboardingDone,
        activationDone: handoff.activationDone,
        [itemKey]: !currentValue
      };

      const response = await api.put(`/split/handoffs/${handoffId}`, payload);
      
      // Update local state
      setHandoffs(prev => prev.map(h => h.id === handoffId ? response.data : h));
      
      // Reload attribution report as well in case status changes trigger new splits
      const attributionsRes = await api.get('/split/attribution');
      setAttributions(attributionsRes.data);
    } catch (err) {
      console.error('Failed to update handoff checklist:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'BREACHED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Split-Mapping Engine</h1>
        <p className="text-sm text-slate-500">Track client handoffs, SLA statuses, and revenue credit attributions</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('handoffs')}
          className={`flex items-center space-x-2 px-6 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'handoffs'
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          <span>Handoff SLA Checklist</span>
        </button>
        <button
          onClick={() => setActiveTab('attribution')}
          className={`flex items-center space-x-2 px-6 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'attribution'
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <GitBranch className="h-4 w-4" />
          <span>Revenue Attribution Reports</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-500">
          {error}
        </div>
      ) : activeTab === 'handoffs' ? (
        /* TAB: HANDOFFS */
        handoffs.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            No handoff tickets available. Converted deals automatically create onboarding tickets.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {handoffs.map((handoff) => {
              const checklistItems = [
                { key: 'introMailSent', label: 'Introductory Welcome Email Sent' },
                { key: 'meetingDone', label: 'Kick-off Call / Handoff Meeting (48 hrs SLA)' },
                { key: 'onboardingDone', label: 'Product Training & Provisioning (5 days SLA)' },
                { key: 'activationDone', label: 'Account Activation Complete' }
              ];

              // Calculate checklist completed count
              const completedCount = 
                (handoff.introMailSent ? 1 : 0) +
                (handoff.meetingDone ? 1 : 0) +
                (handoff.onboardingDone ? 1 : 0) +
                (handoff.activationDone ? 1 : 0);

              const percent = (completedCount / 4) * 100;

              return (
                <div key={handoff.id} className="glass rounded-xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
                  {/* Client Info */}
                  <div className="md:w-1/3 space-y-2">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(handoff.status)}`}>
                      {handoff.status}
                    </span>
                    <h3 className="font-bold text-lg text-slate-800">{handoff.client.companyName}</h3>
                    <p className="text-xs text-slate-400">Owner AM: AM User</p>
                    <div className="text-xs text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Lead Rep:</span>
                        <span className="font-semibold text-slate-700">{handoff.client.lead?.assignedTo?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{new Date(handoff.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="space-y-1 mt-4">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>Setup progress:</span>
                        <span>{completedCount} / 4 tasks</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SLA checklist checklist */}
                  <div className="flex-1 space-y-2.5 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Onboarding SLA Checklist</h4>
                    <div className="space-y-2">
                      {checklistItems.map((item) => (
                        <label
                          key={item.key}
                          className={`flex items-center space-x-3 rounded-lg border p-2.5 transition text-sm cursor-pointer ${
                            handoff[item.key]
                              ? 'bg-slate-50/50 border-slate-200 text-slate-700'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 font-medium'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={handoff[item.key]}
                            disabled={!['SUPER_ADMIN', 'ACCOUNT_MANAGER'].includes(user.role)}
                            onChange={() => handleChecklistToggle(handoff.id, item.key, handoff[item.key])}
                            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent disabled:opacity-50"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Handoff SLA warning icon */}
                  {handoff.slaBreached && (
                    <div className="flex items-center justify-center shrink-0 p-3 bg-red-50 text-red-500 rounded-xl border border-red-200 h-16 w-16 mx-auto md:mx-0">
                      <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* TAB: ATTRIBUTION */
        attributions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            No attribution ledger entries available. Invoices must be generated to calculate revenue splits.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-500">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Revenue Type</th>
                    <th className="px-6 py-4">Total Revenue</th>
                    <th className="px-6 py-4">Sales Rep (Share)</th>
                    <th className="px-6 py-4">AM Owner (Share)</th>
                    <th className="px-6 py-4">Rules Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                  {attributions.map((ledger, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">{ledger.companyName}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{ledger.invoiceNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          ledger.revenueType === 'INITIAL_SALE'
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : ledger.revenueType === 'JOINT_EXPANSION'
                            ? 'bg-purple-50 border-purple-200 text-purple-700'
                            : 'bg-green-50 border-green-200 text-green-700'
                        }`}>
                          {ledger.revenueType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">₹{ledger.totalRevenue.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-semibold text-slate-700">{ledger.salesExecName}</div>
                        <div className="text-emerald-600 font-bold mt-0.5">₹{ledger.salesShare.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-semibold text-slate-700">{ledger.amName}</div>
                        <div className="text-emerald-600 font-bold mt-0.5">₹{ledger.amShare.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                        {ledger.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default SplitMapping;
