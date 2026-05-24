// frontend/src/pages/Leads.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Calendar, AlertTriangle, UserPlus, Phone, Mail, FileText, ArrowRight, X } from 'lucide-react';

const Leads = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Form states (Slide-over drawer)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Website',
    notes: '',
    assignedToId: '',
  });
  const [formError, setFormError] = useState('');
  const [formWarning, setFormWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeads();
    fetchUsers();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await api.get('/leads');
      setLeads(response.data);
    } catch (err) {
      setError('Failed to load leads.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  // Check for duplicates in real-time as user types in the form
  useEffect(() => {
    const checkDuplicate = async () => {
      if (formData.phone.length >= 10 || (formData.email && formData.email.includes('@'))) {
        try {
          // Check local list first to see if phone or email matches
          const match = leads.find(l => 
            l.phone === formData.phone || 
            (formData.email && l.email?.toLowerCase() === formData.email.toLowerCase())
          );
          if (match) {
            setFormWarning(`Warning: Lead already exists (ID: ${match.name}, Stage: ${match.stage})`);
          } else {
            setFormWarning('');
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setFormWarning('');
      }
    };
    checkDuplicate();
  }, [formData.phone, formData.email, leads]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await api.post('/leads', formData);
      setIsDrawerOpen(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        source: 'Website',
        notes: '',
        assignedToId: '',
      });
      fetchLeads();
    } catch (err) {
      if (err.response?.status === 409) {
        setFormError('A lead with this phone number or email already exists.');
      } else {
        setFormError(err.response?.data?.message || 'Failed to create lead.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Client-side filtering logic
  const filteredLeads = leads.filter(lead => {
    // Search filter
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()));

    // Stage filter
    const matchesStage = selectedStage ? lead.stage === selectedStage : true;

    // Assignee filter
    const matchesAssignee = selectedAssignee ? lead.assignedToId === selectedAssignee : true;

    // Date filters
    const leadDate = new Date(lead.createdAt);
    const matchesFrom = dateFrom ? leadDate >= new Date(dateFrom) : true;
    // Set to end of the day for up to date comparisons
    const matchesTo = dateTo ? leadDate <= new Date(new Date(dateTo).setHours(23, 59, 59, 999)) : true;

    return matchesSearch && matchesStage && matchesAssignee && matchesFrom && matchesTo;
  });

  const getStageBadgeClass = (stage) => {
    switch (stage) {
      case 'NEW': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'INTERESTED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PROPOSAL_SHARED': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PAYMENT_COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'RNR_DNP':
      case 'NOT_INTERESTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const sources = ['Website', 'Cold Call', 'Referral', 'Inbound', 'LinkedIn', 'Partner'];
  const stages = ['NEW', 'INTERESTED', 'PROPOSAL_SHARED', 'PAYMENT_COMPLETED', 'RNR_DNP', 'NOT_INTERESTED'];

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads Pipeline</h1>
          <p className="text-sm text-slate-500">Track, qualify, and convert your leads</p>
        </div>
        {['SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'].includes(user.role) && (
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center space-x-2 rounded bg-accent-blue px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-750 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Lead</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="glass rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-0 ml-3 h-5 w-5 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-accent-blue focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 outline-none focus:border-accent-blue"
            >
              <option value="">All Stages</option>
              {stages.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {(user.role === 'SUPER_ADMIN' || user.role === 'MANAGER' || user.role === 'TEAM_LEADER') && (
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 outline-none focus:border-accent-blue"
            >
              <option value="">All Assignees</option>
              {users.filter(u => ['SALES_EXEC', 'TEAM_LEADER'].includes(u.role)).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role === 'TEAM_LEADER' ? 'TL' : 'Rep'})</option>
              ))}
            </select>
          )}

          {/* Date range inputs */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 outline-none focus:border-accent-blue"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 outline-none focus:border-accent-blue"
            />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-100 bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-500">
          {error}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
          No leads found matching current criteria.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-500">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900">{lead.name}</td>
                    <td className="px-6 py-4">{lead.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-normal ${getStageBadgeClass(lead.stage)}`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {lead.assignedTo ? (
                        <div>
                          <div className="font-medium text-slate-700">{lead.assignedTo.name}</div>
                          <div className="text-[10px] text-slate-400">{lead.assignedTo.role === 'TEAM_LEADER' ? 'Leader' : 'Rep'}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{lead.source}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <span className="text-xs text-slate-500">
              Showing {filteredLeads.length} of {leads.length} leads
            </span>
          </div>
        </div>
      )}

      {/* Slide-over Drawer for Creating Lead */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-30 overflow-hidden">
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md transform bg-white shadow-2xl transition duration-300 ease-in-out">
              <div className="flex h-full flex-col overflow-y-auto py-6">
                
                {/* Drawer Header */}
                <div className="px-6 flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">Add New Lead</h3>
                  <button onClick={() => setIsDrawerOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleCreateLead} className="flex-1 px-6 py-6 space-y-5">
                  {formError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                      {formError}
                    </div>
                  )}

                  {formWarning && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                      <span>{formWarning}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Name *
                    </label>
                    <div className="relative">
                      <UserPlus className="absolute inset-y-0 left-0 ml-3 h-5 w-5 my-auto text-slate-400" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Lead full name"
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-accent-blue"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Contact Phone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute inset-y-0 left-0 ml-3 h-5 w-5 my-auto text-slate-400" />
                      <input
                        type="text"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-accent-blue"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute inset-y-0 left-0 ml-3 h-5 w-5 my-auto text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="example@domain.com"
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-accent-blue"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Lead Source *
                      </label>
                      <select
                        name="source"
                        required
                        value={formData.source}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-accent-blue"
                      >
                        {sources.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {(user.role === 'SUPER_ADMIN' || user.role === 'TEAM_LEADER') && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Assign To
                        </label>
                        <select
                          name="assignedToId"
                          value={formData.assignedToId}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-accent-blue"
                        >
                          <option value="">Unassigned</option>
                          {users.filter(u => ['SALES_EXEC', 'TEAM_LEADER'].includes(u.role)).map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Notes / Description
                    </label>
                    <div className="relative">
                      <FileText className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                      <textarea
                        name="notes"
                        rows="4"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Add initial notes or request info..."
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-accent-blue resize-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5 flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex-1 rounded-lg border border-slate-200 py-2.5 font-semibold text-slate-500 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 rounded bg-accent-blue py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-750 transition disabled:opacity-50"
                    >
                      {submitting ? 'Creating...' : 'Create Lead'}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
