// frontend/src/pages/Leads.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Calendar, AlertTriangle, UserPlus, Phone, Mail, FileText, ArrowRight, X, Building } from 'lucide-react';

const Linkedin = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

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
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'tomorrow', 'custom'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Form states (Slide-over drawer)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    personalEmail: '',
    companyName: '',
    companyEmail: '',
    linkedinUrl: '',
    socialMediaUrl: '',
    source: 'Website',
    notes: '',
    assignedToId: '',
  });
  const [formError, setFormError] = useState('');
  const [formWarning, setFormWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bulk import states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [dragOverUpload, setDragOverUpload] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileSelectRef = useRef(null);

  const handleUploadDrop = (e) => {
    e.preventDefault();
    setDragOverUpload(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      setUploadFile(file);
    } else {
      setUploadError('Only CSV files (.csv) are supported');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadError('');
    setUploadSummary(null);
    setProgress(0);

    const formDataToSend = new FormData();
    formDataToSend.append('file', uploadFile);
    formDataToSend.append('overwrite', overwrite ? 'true' : 'false');

    try {
      const response = await api.post('/leads/bulk-upload', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const jobId = response.data.jobId;

      // Start status polling
      const interval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/leads/bulk-upload/status/${jobId}`);
          const job = statusRes.data;
          
          setProgress(job.progress || 0);

          if (job.status === 'completed') {
            clearInterval(interval);
            setUploadSummary(job);
            setUploading(false);
          } else if (job.status === 'failed') {
            clearInterval(interval);
            setUploadError(job.details?.[0]?.message || 'Import failed unexpectedly.');
            setUploading(false);
          }
        } catch (pollErr) {
          clearInterval(interval);
          setUploadError('Failed to poll upload status.');
          setUploading(false);
        }
      }, 500);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to start CSV bulk import.');
      setUploading(false);
    }
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadFile(null);
    setUploadSummary(null);
    setUploadError('');
    setOverwrite(false);
    setProgress(0);
    fetchLeads(); // Refresh leads pipeline
  };

  const downloadTemplateCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "name,phone,personalEmail,companyName,companyEmail,linkedinUrl,socialMediaUrl,source,notes\n"
      + "Ravi Shastri,9876540001,shastri@acme.com,Acme Corporation,work@acme.com,https://linkedin.com/in/shastri,https://twitter.com/shastri,LinkedIn,Interested in concurrent SIP channels\n"
      + "Elena Gilbert,9876540002,elena@salvatore.com,Gilbert Tech,,https://linkedin.com/in/elena,,,Initial call follow-up notes";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "revops_leads_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      if (formData.phone.length >= 10 || (formData.personalEmail && formData.personalEmail.includes('@'))) {
        try {
          // Check local list first to see if phone or email matches
          const match = leads.find(l => 
            l.phone === formData.phone || 
            (formData.personalEmail && l.personalEmail?.toLowerCase() === formData.personalEmail.toLowerCase())
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
  }, [formData.phone, formData.personalEmail, leads]);

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
        personalEmail: '',
        companyName: '',
        companyEmail: '',
        linkedinUrl: '',
        socialMediaUrl: '',
        source: 'Website',
        notes: '',
        assignedToId: '',
      });
      fetchLeads();
    } catch (err) {
      if (err.response?.status === 409) {
        const dupId = err.response.data.existingLeadId;
        const dupName = err.response.data.existingLeadName;
        setFormError(
          <span>
            This lead already exists. View details: <Link to={`/leads/${dupId}`} className="underline font-bold text-blue-600 hover:text-blue-800">{dupName}</Link>
          </span>
        );
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
      (lead.companyName && lead.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.personalEmail && lead.personalEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.companyEmail && lead.companyEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    // Stage filter
    const matchesStage = selectedStage ? lead.stage === selectedStage : true;

    // Assignee filter
    const matchesAssignee = selectedAssignee ? lead.assignedToId === selectedAssignee : true;

    // Date filters
    const leadDate = new Date(lead.createdAt);
    const now = new Date();
    let matchesDate = true;

    if (dateFilter === 'today') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setHours(23, 59, 59, 999);
      matchesDate = leadDate >= start && leadDate <= end;
    } else if (dateFilter === 'yesterday') {
      const start = new Date(now); start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setHours(23, 59, 59, 999);
      matchesDate = leadDate >= start && leadDate <= end;
    } else if (dateFilter === 'tomorrow') {
      const start = new Date(now); start.setDate(start.getDate() + 1); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setHours(23, 59, 59, 999);
      matchesDate = leadDate >= start && leadDate <= end;
    } else if (dateFilter === 'custom') {
      const matchesFrom = dateFrom ? leadDate >= new Date(dateFrom) : true;
      const matchesTo = dateTo ? leadDate <= new Date(new Date(dateTo).setHours(23, 59, 59, 999)) : true;
      matchesDate = matchesFrom && matchesTo;
    }

    return matchesSearch && matchesStage && matchesAssignee && matchesDate;
  });

  const getStageBadgeClass = (stage) => {
    switch (stage) {
      case 'DISCOVERY_CALL': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DEMO': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'PROPOSAL': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'NEGOTIATION': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'WIN': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'LOSS': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const stageLabels = {
    'DISCOVERY_CALL': 'Discovery Call',
    'DEMO': 'Demo',
    'PROPOSAL': 'Proposal',
    'NEGOTIATION': 'Negotiation',
    'WIN': 'Won',
    'LOSS': 'Lost'
  };

  const sources = ['Website', 'Cold Call', 'Referral', 'Inbound', 'LinkedIn', 'Partner'];
  const stages = ['DISCOVERY_CALL', 'DEMO', 'PROPOSAL', 'NEGOTIATION', 'WIN', 'LOSS'];

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads Pipeline</h1>
          <p className="text-sm text-slate-500">Track, qualify, and convert your leads</p>
        </div>
        {['SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'].includes(user.role) && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center space-x-2 rounded border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 transition active:scale-95"
            >
              <span>Import Leads</span>
            </button>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center space-x-2 rounded bg-accent-blue px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-750 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>New Lead</span>
            </button>
          </div>
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
                <option key={s} value={s}>{stageLabels[s] || s}</option>
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
          <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
            <Calendar className="h-4 w-4 text-slate-400 mr-1" />
            <div className="flex items-center space-x-1">
              {['all', 'today', 'yesterday', 'tomorrow', 'custom'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDateFilter(f)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition border
                    ${dateFilter === f ? 'bg-accent-blue text-white border-accent-blue' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-350'}`}
                >
                  {f}
                </button>
              ))}
            </div>

            {dateFilter === 'custom' && (
              <div className="flex items-center space-x-1.5 ml-2 animate-fadeIn">
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
            )}
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
                  <th className="px-6 py-4">Lead / Company</th>
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
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{lead.name}</div>
                      {lead.companyName && <div className="text-xs text-slate-400 font-medium">{lead.companyName}</div>}
                    </td>
                    <td className="px-6 py-4">{lead.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-normal ${getStageBadgeClass(lead.stage)}`}>
                        {stageLabels[lead.stage] || lead.stage}
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
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <span className="text-xs text-slate-500">
                Showing {filteredLeads.length} of {leads.length} leads
              </span>
            </div>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Personal Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute inset-y-0 left-0 ml-2.5 h-4 w-4 my-auto text-slate-400" />
                        <input
                          type="email"
                          name="personalEmail"
                          value={formData.personalEmail}
                          onChange={handleInputChange}
                          placeholder="personal@domain.com"
                          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-accent-blue"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Company Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute inset-y-0 left-0 ml-2.5 h-4 w-4 my-auto text-slate-400" />
                        <input
                          type="email"
                          name="companyEmail"
                          value={formData.companyEmail}
                          onChange={handleInputChange}
                          placeholder="work@company.com"
                          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-accent-blue"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Company Name
                      </label>
                      <div className="relative">
                        <Building className="absolute inset-y-0 left-0 ml-2.5 h-4 w-4 my-auto text-slate-400" />
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          placeholder="e.g. Acme Corp"
                          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-accent-blue"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        LinkedIn URL
                      </label>
                      <div className="relative">
                        <Linkedin className="absolute inset-y-0 left-0 ml-2.5 h-4 w-4 my-auto text-slate-400" />
                        <input
                          type="url"
                          name="linkedinUrl"
                          value={formData.linkedinUrl}
                          onChange={handleInputChange}
                          placeholder="https://linkedin.com/in/..."
                          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-accent-blue"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Social Media Link (Twitter/Instagram/etc.)
                    </label>
                    <input
                      type="url"
                      name="socialMediaUrl"
                      value={formData.socialMediaUrl}
                      onChange={handleInputChange}
                      placeholder="https://twitter.com/..."
                      className="w-full rounded-lg border border-slate-200 py-2.5 px-4 text-xs text-slate-700 outline-none focus:border-accent-blue"
                    />
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

      {/* Bulk Import Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 space-y-4 border border-slate-100 relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                📂 Import Leads in Bulk
              </h3>
              <button onClick={handleCloseUploadModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            {!uploadSummary ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Upload a <strong>CSV file</strong> to import leads in bulk. Please ensure your CSV headers exactly match the template below. Missing assignees will default to your account.
                </p>

                {/* Template Download Option */}
                <div className="flex justify-between items-center bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <span className="text-xs text-slate-600 font-semibold">Download CSV Template:</span>
                  <button
                    type="button"
                    onClick={downloadTemplateCSV}
                    className="flex items-center gap-1 text-[11px] font-bold text-accent-blue hover:text-blue-700 uppercase tracking-wider transition"
                  >
                    CSV Template (.csv)
                  </button>
                </div>

                {/* Overwrite duplicates checkbox */}
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <input
                    type="checkbox"
                    id="overwrite-duplicates"
                    checked={overwrite}
                    onChange={(e) => setOverwrite(e.target.checked)}
                    disabled={uploading}
                    className="h-4 w-4 text-accent-blue focus:ring-accent-blue border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="overwrite-duplicates" className="text-xs text-slate-700 font-semibold select-none cursor-pointer">
                    Update existing records if duplicates are found
                  </label>
                </div>

                {/* Upload drag & drop / Progress */}
                {uploading ? (
                  <div className="border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center space-y-4 bg-slate-50">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
                    <div className="w-full space-y-2 max-w-xs">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Uploading & importing leads...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-accent-blue h-2 rounded-full transition-all duration-305"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOverUpload(true); }}
                    onDragLeave={() => setDragOverUpload(false)}
                    onDrop={handleUploadDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition
                      ${dragOverUpload ? 'border-accent-blue bg-blue-50/50' : 'border-slate-200 bg-slate-50 hover:border-accent-blue hover:bg-blue-50/20'}`}
                    onClick={() => fileSelectRef.current?.click()}
                  >
                    <input
                      ref={fileSelectRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setUploadFile(f);
                      }}
                    />
                    {uploadFile ? (
                      <div className="text-center space-y-1">
                        <span className="text-3xl">📄</span>
                        <p className="text-xs font-bold text-slate-700">{uploadFile.name}</p>
                        <p className="text-[10px] text-slate-400">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadFile(null);
                          }}
                          className="text-[10px] text-red-500 font-semibold hover:underline"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <span className="text-3xl text-slate-400">📤</span>
                        <p className="text-xs font-semibold text-slate-600">Drag & drop your CSV or click to browse</p>
                        <p className="text-[10px] text-slate-400">Supports standard UTF-8 .csv files</p>
                      </div>
                    )}
                  </div>
                )}

                {uploadError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-650">
                    {uploadError}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseUploadModal}
                    disabled={uploading}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadSubmit}
                    disabled={!uploadFile || uploading}
                    className="flex-1 rounded-xl bg-accent-blue py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-750 transition disabled:opacity-50"
                  >
                    Start Import
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result summary dashboard */}
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Import Dashboard</h4>
                
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                    <div className="text-sm font-bold text-slate-800">{uploadSummary.summary.total}</div>
                    <div className="text-[8px] text-slate-400 font-semibold uppercase">Total</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-250 rounded-xl p-2">
                    <div className="text-sm font-bold text-emerald-700">{uploadSummary.summary.imported}</div>
                    <div className="text-[8px] text-emerald-500 font-semibold uppercase">Imported</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-2">
                    <div className="text-sm font-bold text-blue-700">{uploadSummary.summary.updated || 0}</div>
                    <div className="text-[8px] text-blue-500 font-semibold uppercase">Updated</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2">
                    <div className="text-sm font-bold text-amber-700">{uploadSummary.summary.duplicates}</div>
                    <div className="text-[8px] text-amber-500 font-semibold uppercase">Duplicates</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-2">
                    <div className="text-sm font-bold text-red-700">{uploadSummary.summary.failed}</div>
                    <div className="text-[8px] text-red-500 font-semibold uppercase">Failed</div>
                  </div>
                </div>

                {/* Log details */}
                {uploadSummary.details && uploadSummary.details.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Import Logs</h5>
                    <div className="border border-slate-100 rounded-lg max-h-[160px] overflow-y-auto divide-y divide-slate-100 text-[11px] bg-slate-50 p-2">
                      {uploadSummary.details.map((det, idx) => (
                        <div key={idx} className="py-1 flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-500 shrink-0">Row {det.row}:</span>
                          <span className={`flex-1 ${det.status === 'skipped' ? 'text-amber-600' : 'text-red-600'}`}>
                            {det.message}
                          </span>
                          <span className={`text-[9px] font-bold uppercase ${det.status === 'skipped' ? 'text-amber-500' : 'text-red-500'} shrink-0`}>
                            {det.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseUploadModal}
                    className="w-full rounded-xl bg-accent-blue py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-750 transition"
                  >
                    Done & Refresh list
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
