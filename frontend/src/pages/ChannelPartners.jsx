// frontend/src/pages/ChannelPartners.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Users, Handshake, ArrowRight, Building, Phone, Mail } from 'lucide-react';

export default function ChannelPartners() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPartnerData();
  }, []);

  const fetchPartnerData = async () => {
    setLoading(true);
    try {
      const lRes = await api.get('/leads');
      const uRes = await api.get('/users');
      setLeads(lRes.data);
      setUsers(uRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load partner channel leads.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToTL = async (leadId, tlUserId) => {
    try {
      await api.put(`/leads/${leadId}`, { assignedToId: tlUserId || null });
      fetchPartnerData();
    } catch (err) {
      alert('Failed to reassign partner lead.');
    }
  };

  // Filter for partner leads that are still active
  const partnerLeads = leads.filter(l => l.source === 'Partner' && l.stage !== 'WIN' && l.stage !== 'LOSS');
  const tls = users.filter(u => u.role === 'TEAM_LEADER');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Channel Partner Leads</h1>
        <p className="text-sm text-slate-500">Distribute inbound leads referred from channel partner networks to Team Leaders</p>
      </div>

      <div className="glass rounded-xl bg-white border border-slate-200 p-6 shadow-sm flex items-center gap-4 border-l-4 border-l-accent-blue">
        <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center text-accent-blue">
          <Handshake size={22} />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-800">Partner Referral & Routing Hub</h3>
          <p className="text-xs text-slate-500">Review incoming partner deals and assign them to respective Team Leaders for BDE delegation.</p>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-500">{error}</div>}

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
        </div>
      ) : partnerLeads.length === 0 ? (
        <div className="glass rounded-xl bg-white border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <Users size={32} className="mx-auto text-slate-300" />
          <h3 className="font-semibold text-sm">No Pending Partner Leads</h3>
          <p className="text-xs text-slate-550">All channel partner leads have been successfully delegated or resolved.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-500">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Lead / Company</th>
                  <th className="px-6 py-4">Contact Details</th>
                  <th className="px-6 py-4">Current Stage</th>
                  <th className="px-6 py-4">Delegate To Leader</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                {partnerLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1">
                        <Building size={14} className="text-slate-400" />
                        <span>{lead.companyName || 'N/A'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Est Value: ₹1.2L</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-semibold text-slate-700">{lead.name}</div>
                      <div className="text-slate-500">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        {lead.stage}
                      </span>
                      <div className="text-[10px] text-slate-400 font-semibold mt-1">Assignee: {lead.assignedTo?.name || 'Hold'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select 
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 outline-none focus:border-accent-blue"
                          value={lead.assignedToId || ''}
                          onChange={(e) => handleAssignToTL(lead.id, e.target.value)}
                        >
                          <option value="">Hold (Unassigned)</option>
                          {tls.map(tl => (
                            <option key={tl.id} value={tl.id}>{tl.name}</option>
                          ))}
                        </select>
                        <ArrowRight size={14} className="text-slate-400" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
