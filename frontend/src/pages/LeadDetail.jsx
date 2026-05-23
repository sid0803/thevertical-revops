// frontend/src/pages/LeadDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  FileText,
  User,
  Activity,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  AlertCircle,
  Building,
  CheckCircle2,
  Clock
} from 'lucide-react';

const LeadDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Log activity states
  const [noteText, setNoteText] = useState('');
  const [callDesc, setCallDesc] = useState('');
  const [callDuration, setCallDuration] = useState(''); // in minutes
  const [logError, setLogError] = useState('');
  const [logLoading, setLogLoading] = useState(false);
  const [stageLoading, setStageLoading] = useState(false);

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const fetchLeadDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/leads/${id}`);
      setLead(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load lead details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setLogError('');
    setLogLoading(true);
    try {
      const response = await api.post(`/leads/${id}/note`, { content: noteText });
      setLead(prev => ({
        ...prev,
        activities: [response.data, ...prev.activities]
      }));
      setNoteText('');
    } catch (err) {
      setLogError(err.response?.data?.message || 'Failed to add note.');
    } finally {
      setLogLoading(false);
    }
  };

  const handleLogCall = async (e) => {
    e.preventDefault();
    if (!callDesc.trim() || !callDuration) return;

    setLogError('');
    setLogLoading(true);
    try {
      const durationSecs = parseInt(callDuration) * 60;
      const response = await api.post(`/leads/${id}/call`, {
        description: callDesc,
        duration: durationSecs
      });
      setLead(prev => ({
        ...prev,
        activities: [response.data, ...prev.activities]
      }));
      setCallDesc('');
      setCallDuration('');
    } catch (err) {
      setLogError(err.response?.data?.message || 'Failed to log call.');
    } finally {
      setLogLoading(false);
    }
  };

  const handleStageChange = async (e) => {
    const newStage = e.target.value;
    if (!newStage || newStage === lead.stage) return;

    setLogError('');
    setStageLoading(true);
    try {
      await api.put(`/leads/${id}/stage`, { stage: newStage });
      // Reload to fetch the new activities and client details if converted
      await fetchLeadDetails();
    } catch (err) {
      setLogError(err.response?.data?.message || 'Failed to change stage.');
    } finally {
      setStageLoading(false);
    }
  };

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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'STAGE_CHANGE': return <RefreshCw className="h-4 w-4 text-amber-500" />;
      case 'NOTE': return <MessageSquare className="h-4 w-4 text-sky-500" />;
      case 'CALL': return <PhoneCall className="h-4 w-4 text-emerald-500" />;
      default: return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  // Determine which stages are allowed next based on strict rules
  const getEligibleNextStages = (current) => {
    if (current === 'PAYMENT_COMPLETED') return []; // Final, locked
    if (current === 'RNR_DNP' || current === 'NOT_INTERESTED') {
      return ['NEW', 'INTERESTED', 'PROPOSAL_SHARED', 'PAYMENT_COMPLETED', 'RNR_DNP', 'NOT_INTERESTED'];
    }

    const eligible = ['RNR_DNP', 'NOT_INTERESTED'];
    if (current === 'NEW') eligible.push('INTERESTED');
    if (current === 'INTERESTED') eligible.push('PROPOSAL_SHARED');
    if (current === 'PROPOSAL_SHARED') eligible.push('PAYMENT_COMPLETED');

    return eligible;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-500">
        <AlertCircle className="h-10 w-10 mx-auto mb-2" />
        <h2 className="text-lg font-bold">Error loading lead</h2>
        <p className="text-sm mt-1">{error || 'Lead not found.'}</p>
        <button onClick={() => navigate('/leads')} className="mt-4 inline-flex items-center space-x-2 rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-700">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Leads</span>
        </button>
      </div>
    );
  }

  const eligibleStages = getEligibleNextStages(lead.stage);

  return (
    <div className="space-y-6">
      {/* Back button and breadcrumbs */}
      <div>
        <Link to="/leads" className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-700 transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Leads Pipeline</span>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Lead Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-xl p-6 shadow-sm space-y-6 bg-white border border-slate-100">
            {/* Header info */}
            <div>
              <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold mb-2 ${getStageBadgeClass(lead.stage)}`}>
                {lead.stage}
              </span>
              <h2 className="text-xl font-bold text-slate-900">{lead.name}</h2>
              <p className="text-xs text-slate-400 mt-1">Lead ID: {lead.id}</p>
            </div>

            {/* Stage Selector */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Qualify / Update Stage
              </label>
              {lead.stage === 'PAYMENT_COMPLETED' ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Deal Closed & Active Client</span>
                </div>
              ) : (
                <select
                  value={lead.stage}
                  onChange={handleStageChange}
                  disabled={stageLoading}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent disabled:opacity-50"
                >
                  <option value={lead.stage}>Current: {lead.stage}</option>
                  {eligibleStages.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Contacts Info */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center space-x-3 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{lead.phone}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="truncate">{lead.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Source: {lead.source}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-600">
                <User className="h-4 w-4 text-slate-400" />
                <span>Assigned to: {lead.assignedTo ? lead.assignedTo.name : 'Unassigned'}</span>
              </div>
            </div>

            {/* Additional details / description */}
            {lead.notes && (
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description</h4>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-line border border-slate-100">
                  {lead.notes}
                </p>
              </div>
            )}
          </div>

          {/* Client Box if Payment Completed */}
          {lead.client && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-5 space-y-4">
              <div className="flex items-center space-x-2 text-emerald-800">
                <Building className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm">Converted Client Profile</h3>
              </div>
              <div className="space-y-1.5 text-xs text-emerald-800">
                <div className="flex justify-between">
                  <span className="opacity-80">Company:</span>
                  <span className="font-semibold">{lead.client.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Contact:</span>
                  <span className="font-semibold">{lead.client.contactName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">AMC Ends:</span>
                  <span className="font-semibold">{new Date(lead.client.amcEndDate).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
              <Link
                to="/clients"
                className="block text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
              >
                Go to Accounts Management →
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Logging tools & Activities Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logging Box */}
          {['SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'].includes(user.role) && lead.stage !== 'PAYMENT_COMPLETED' && (
            <div className="glass rounded-xl p-6 shadow-sm bg-white border border-slate-100 space-y-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Log Activity</h3>
              
              {logError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  {logError}
                </div>
              )}

              {/* Tabs / Multi form */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Note Log Form */}
                <form onSubmit={handleAddNote} className="space-y-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-2 text-slate-700 font-semibold text-xs uppercase tracking-wide">
                    <MessageSquare className="h-4 w-4 text-sky-500" />
                    <span>Add Progress Note</span>
                  </div>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows="3"
                    placeholder="Log client feedback, requirements, or reminder details..."
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 outline-none focus:border-accent resize-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={logLoading || !noteText.trim()}
                    className="w-full rounded-lg bg-accent py-2 text-xs font-bold text-white hover:bg-accent-dark transition disabled:opacity-50"
                  >
                    Save Note
                  </button>
                </form>

                {/* Call Log Form */}
                <form onSubmit={handleLogCall} className="space-y-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-2 text-slate-700 font-semibold text-xs uppercase tracking-wide">
                    <PhoneCall className="h-4 w-4 text-emerald-500" />
                    <span>Log Call Details</span>
                  </div>
                  <input
                    type="text"
                    value={callDesc}
                    onChange={(e) => setCallDesc(e.target.value)}
                    placeholder="Call outcome (e.g. Discussed pricing)"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 outline-none focus:border-accent"
                    required
                  />
                  <div className="relative">
                    <Clock className="absolute inset-y-0 left-0 ml-2.5 h-4 w-4 my-auto text-slate-400" />
                    <input
                      type="number"
                      value={callDuration}
                      onChange={(e) => setCallDuration(e.target.value)}
                      placeholder="Duration (in minutes)"
                      min="1"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-accent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={logLoading || !callDesc.trim() || !callDuration}
                    className="w-full rounded-lg bg-accent py-2 text-xs font-bold text-white hover:bg-accent-dark transition disabled:opacity-50"
                  >
                    Log Call Activity
                  </button>
                </form>

              </div>
            </div>
          )}

          {/* Activities Timeline */}
          <div className="glass rounded-xl p-6 shadow-sm bg-white border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Activity Timeline</h3>
            
            {lead.activities.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">No activity recorded for this lead yet.</p>
            ) : (
              <div className="relative border-l-2 border-slate-100 pl-6 space-y-6">
                {lead.activities.map((act) => (
                  <div key={act.id} className="relative">
                    {/* Circle icon marker */}
                    <span className="absolute -left-10 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 border-2 border-slate-200 shadow-sm ring-4 ring-white">
                      {getActivityIcon(act.type)}
                    </span>
                    
                    {/* Activity card */}
                    <div className="rounded-lg bg-slate-50/50 p-4 border border-slate-100 transition hover:border-slate-200">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-semibold text-slate-600">{act.user ? act.user.name : 'System'}</span>
                        <span>{new Date(act.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}</span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{act.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeadDetail;
