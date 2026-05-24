// frontend/src/pages/Clients.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Building2, User, Phone, Mail, Clock, Calendar, Edit3, ShieldAlert, Award, FileText, CheckCircle2, X } from 'lucide-react';

const Clients = () => {
  const { user } = useAuth();
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Commitment edit modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [commitmentData, setCommitmentData] = useState({
    agentCount: '',
    talkTimeTarget: '',
    revenueCommitment: '',
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (err) {
      setError('Failed to load client profiles.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (client) => {
    if (!client.commitment) return;
    setSelectedCommitment(client.commitment);
    setCommitmentData({
      agentCount: client.commitment.agentCount.toString(),
      talkTimeTarget: client.commitment.talkTimeTarget.toString(),
      revenueCommitment: client.commitment.revenueCommitment.toString(),
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCommitmentData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateCommitment = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      await api.put(`/split/commitments/${selectedCommitment.id}`, commitmentData);
      setIsModalOpen(false);
      setSelectedCommitment(null);
      fetchClients();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update commitment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to calculate days remaining in commitment window
  const getDaysRemaining = (endDateStr) => {
    const end = new Date(endDateStr);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Accounts & Client Portfolios</h1>
        <p className="text-sm text-slate-500">Monitor active contracts, AMC lifecycles, and agent call targets</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-500">
          {error}
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
          No clients converted yet. Leads must complete payment closure to show here.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {clients.map((client) => {
            const daysLeft = client.commitment ? getDaysRemaining(client.commitment.windowEnd) : 0;
            const initialBilled = client.invoices ? client.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) : 0;

            return (
              <div key={client.id} className="glass rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Upper Section */}
                <div className="p-6 border-b border-slate-100 space-y-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">{client.companyName}</h3>
                        <p className="text-xs text-slate-400">Contact: {client.contactName}</p>
                      </div>
                    </div>

                    {/* AMC Badge */}
                    <div className="text-right">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        Active AMC
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1">
                        Ends: {new Date(client.amcEndDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Contact Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Sales Rep: {client.lead?.assignedTo?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="h-3.5 w-3.5 text-slate-400" />
                      <span>AM Owner: AM User</span>
                    </div>
                  </div>

                  {/* Commitment Progress Section */}
                  {client.commitment && (
                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                          <Clock className="h-4 w-4 text-accent-blue" />
                          <span>60-Day SLA Commitment Window</span>
                        </h4>
                        {['SUPER_ADMIN', 'ACCOUNT_MANAGER'].includes(user.role) && (
                          <button
                            onClick={() => openEditModal(client)}
                            className="text-xs text-accent-blue font-semibold hover:text-blue-750 flex items-center space-x-1"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Edit Targets</span>
                          </button>
                        )}
                      </div>

                      {/* SLA metrics */}
                      <div className="grid grid-cols-3 gap-4 text-center border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Active Agents</span>
                          <span className="text-sm font-bold text-slate-800">{client.commitment.agentCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Daily Talk-Time Target</span>
                          <span className="text-sm font-bold text-slate-800">{client.commitment.talkTimeTarget} min</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Attribution Window</span>
                          <span className="text-sm font-bold text-accent-blue">{daysLeft} days left</span>
                        </div>
                      </div>

                      {/* Cumulative talk-time progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500">Cumulative Talk Time logged:</span>
                          <span className="text-slate-800 font-bold">{client.commitment.actualTalkTime} minutes</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-accent-blue rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                100,
                                client.commitment.talkTimeTarget > 0
                                  ? (client.commitment.actualTalkTime / (client.commitment.talkTimeTarget * 60)) * 100
                                  : 0
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Handoff Status Footer */}
                {client.handoff && (
                  <div className={`px-6 py-3 border-t flex items-center justify-between text-xs font-semibold ${
                    client.handoff.status === 'COMPLETED' 
                      ? 'bg-green-50/80 border-green-100 text-green-700' 
                      : client.handoff.status === 'BREACHED'
                      ? 'bg-red-50/80 border-red-100 text-red-700'
                      : 'bg-amber-50/80 border-amber-100 text-amber-700'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {client.handoff.status === 'COMPLETED' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500" />
                      )}
                      <span>Handoff SLA Status: {client.handoff.status}</span>
                    </div>
                    <span className="text-[10px] opacity-80 uppercase tracking-wide">
                      {client.handoff.status === 'COMPLETED' ? 'Onboarded' : 'Action Required'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Commitment Modal */}
      {isModalOpen && selectedCommitment && (
        <div className="fixed inset-0 z-30 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl z-10 border border-slate-100 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Edit SLA Commitment Targets</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {modalError}
              </div>
            )}

            <form onSubmit={handleUpdateCommitment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Active Agent Count *
                </label>
                <input
                  type="number"
                  name="agentCount"
                  required
                  min="0"
                  value={commitmentData.agentCount}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Daily Talk-Time Target (Minutes per day) *
                </label>
                <input
                  type="number"
                  name="talkTimeTarget"
                  required
                  min="0"
                  value={commitmentData.talkTimeTarget}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Revenue Commitment (₹) *
                </label>
                <input
                  type="number"
                  name="revenueCommitment"
                  required
                  min="0"
                  value={commitmentData.revenueCommitment}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent-blue"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 font-semibold text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded bg-accent-blue py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-750 transition disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save Targets'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
