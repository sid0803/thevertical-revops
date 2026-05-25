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
  Clock,
  Check,
  PhoneForwarded
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
      const response = await api.post(`/leads/${id}/note`, { description: noteText });
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
      const response = await api.post(`/leads/${id}/call`, {
        description: callDesc,
        duration: parseInt(callDuration) // in minutes matching backend route
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

  const updateStage = async (newStage) => {
    if (!newStage || newStage === lead.stage) return;

    setLogError('');
    setStageLoading(true);
    try {
      await api.put(`/leads/${id}/stage`, { stage: newStage });
      await fetchLeadDetails();
    } catch (err) {
      setLogError(err.response?.data?.message || 'Failed to change stage.');
    } finally {
      setStageLoading(false);
    }
  };

  const handleStageSelectChange = (e) => {
    updateStage(e.target.value);
  };

  const getStageBadgeClass = (stage) => {
    switch (stage) {
      case 'NEW': return 'bg-gray-50 border-gray-200 text-gray-700';
      case 'INTERESTED': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'PROPOSAL_SHARED': return 'bg-amber-50 border-amber-250 text-amber-700';
      case 'PAYMENT_COMPLETED': return 'bg-green-50 border-green-200 text-green-700';
      case 'RNR_DNP':
      case 'NOT_INTERESTED': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'STAGE_CHANGE': return <RefreshCw className="h-3.5 w-3.5 text-amber-500" />;
      case 'NOTE': return <MessageSquare className="h-3.5 w-3.5 text-sky-500" />;
      case 'CALL': return <PhoneCall className="h-3.5 w-3.5 text-emerald-500" />;
      default: return <Activity className="h-3.5 w-3.5 text-slate-500" />;
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
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-750">
        <AlertCircle className="h-10 w-10 mx-auto mb-2 text-red-500" />
        <h2 className="text-sm font-bold">Error loading lead</h2>
        <p className="text-xs mt-1">{error || 'Lead not found.'}</p>
        <button onClick={() => navigate('/leads')} className="mt-4 inline-flex items-center space-x-2 rounded bg-slate-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-700">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Leads</span>
        </button>
      </div>
    );
  }

  const eligibleStages = getEligibleNextStages(lead.stage);
  
  // Pipeline Stepper configuration
  const pipelineSteps = ['NEW', 'INTERESTED', 'PROPOSAL_SHARED', 'PAYMENT_COMPLETED'];
  const currentStepIndex = pipelineSteps.indexOf(lead.stage);
  const isCustomOrClosedOut = currentStepIndex === -1; // e.g. RNR_DNP, NOT_INTERESTED

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link to="/leads" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition uppercase tracking-wider">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Leads Pipeline</span>
        </Link>
      </div>

      {/* Horizontal Visual Stepper */}
      {!isCustomOrClosedOut && (
        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between w-full">
            {pipelineSteps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isActive = idx === currentStepIndex;
              const isEligible = eligibleStages.includes(step);

              return (
                <React.Fragment key={step}>
                  {/* Step Item */}
                  <button
                    disabled={stageLoading || (!isActive && !isEligible)}
                    onClick={() => updateStage(step)}
                    className="flex flex-col items-center focus:outline-none disabled:cursor-not-allowed group"
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border font-bold text-xs transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isActive
                        ? 'bg-accent-blue border-accent-blue text-white ring-4 ring-blue-50'
                        : isEligible
                        ? 'bg-white border-slate-300 text-slate-650 hover:border-accent-blue hover:text-accent-blue'
                        : 'bg-white border-slate-200 text-slate-300'
                    }`}>
                      {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 transition ${
                      isActive ? 'text-accent-blue' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {step.replace('_', ' ')}
                    </span>
                  </button>

                  {/* Divider Line */}
                  {idx < pipelineSteps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-4 bg-slate-100 relative">
                      <div
                        className={`absolute inset-0 bg-emerald-500 transition-all duration-500 ${
                          idx < currentStepIndex ? 'w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning alerts if RNR/Not Interested */}
      {isCustomOrClosedOut && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-red-800">Closed-out Lead State</h4>
            <p className="text-slate-550 text-xs mt-0.5">
              This lead is currently marked as <span className="font-semibold">{lead.stage}</span>. You can select another stage below to resume active sales qualification.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Lead Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-lg bg-white border border-slate-200 p-6 shadow-sm space-y-6">
            {/* Header info */}
            <div>
              <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2 ${getStageBadgeClass(lead.stage)}`}>
                {lead.stage}
              </span>
              <h2 className="text-lg font-bold text-slate-800">{lead.name}</h2>
              {lead.company && <p className="text-xs text-slate-400 mt-1 font-semibold">{lead.company}</p>}
              <p className="text-[10px] text-slate-400 mt-0.5">Lead ID: {lead.id}</p>
            </div>

            {/* Stage Selector Dropdown */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Qualify / Update Stage
              </label>
              {lead.stage === 'PAYMENT_COMPLETED' ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-250 p-3 text-xs text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Deal Closed & Active Client</span>
                </div>
              ) : (
                <select
                  value={lead.stage}
                  onChange={handleStageSelectChange}
                  disabled={stageLoading}
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-accent focus:bg-white disabled:opacity-50 font-bold"
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
              <div className="flex items-center space-x-3 text-xs text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="font-semibold">{lead.phone}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="truncate">{lead.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Source: {lead.source}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-600">
                <User className="h-4 w-4 text-slate-400" />
                <span>Assigned to: {lead.assignedTo ? lead.assignedTo.name : 'Unassigned'}</span>
              </div>
            </div>

            {/* Additional details / description */}
            {lead.notes && (
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description</h4>
                <p className="text-xs text-slate-600 bg-slate-55 rounded-lg p-3 whitespace-pre-line border border-slate-200 leading-relaxed">
                  {lead.notes}
                </p>
              </div>
            )}
          </div>

          {/* Client Box if Payment Completed */}
          {lead.client && (
            <div className="rounded-lg border border-emerald-250 bg-emerald-50/20 p-5 space-y-4 shadow-sm">
              <div className="flex items-center space-x-2 text-emerald-800">
                <Building className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Converted Client Profile</h3>
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
                  <span className="font-semibold">
                    {lead.client.amcEndDate
                      ? new Date(lead.client.amcEndDate).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </span>
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
            <div className="rounded-lg bg-white border border-slate-200 p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Log Activity</h3>
              
              {logError && (
                <div className="rounded bg-red-50 border border-red-200 p-3 text-xs text-red-650 font-semibold">
                  {logError}
                </div>
              )}

              {/* Tabs / Multi form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Note Log Form */}
                <form onSubmit={handleAddNote} className="space-y-3 p-4 bg-slate-50/50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                    <MessageSquare className="h-4 w-4 text-sky-500" />
                    <span>Add Progress Note</span>
                  </div>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows="3"
                    placeholder="Log client feedback, requirements, or reminder details..."
                    className="w-full rounded border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-accent-blue resize-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={logLoading || !noteText.trim()}
                    className="w-full rounded bg-accent-blue py-2 text-xs font-bold text-white hover:bg-blue-750 transition uppercase tracking-wider disabled:opacity-50"
                  >
                    Save Note
                  </button>
                </form>

                {/* Call Log Form */}
                <form onSubmit={handleLogCall} className="space-y-3 p-4 bg-slate-50/50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                    <PhoneForwarded className="h-4 w-4 text-emerald-500" />
                    <span>Log Call Details</span>
                  </div>
                  <input
                    type="text"
                    value={callDesc}
                    onChange={(e) => setCallDesc(e.target.value)}
                    placeholder="Call outcome (e.g. Discussed pricing)"
                    className="w-full rounded border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-accent-blue"
                    required
                  />
                  <div className="relative">
                    <Clock className="absolute inset-y-0 left-0 ml-2.5 h-3.5 w-3.5 my-auto text-slate-400" />
                    <input
                      type="number"
                      value={callDuration}
                      onChange={(e) => setCallDuration(e.target.value)}
                      placeholder="Duration (in minutes)"
                      min="1"
                      className="w-full rounded border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-accent-blue"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={logLoading || !callDesc.trim() || !callDuration}
                    className="w-full rounded bg-accent-blue py-2 text-xs font-bold text-white hover:bg-blue-750 transition uppercase tracking-wider disabled:opacity-50"
                  >
                    Log Call Activity
                  </button>
                </form>

              </div>
            </div>
          )}

          {/* Activities Timeline */}
          <div className="rounded-lg bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Activity Timeline</h3>
            
            {lead.activities.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">No activity recorded for this lead yet.</p>
            ) : (
              <div className="relative border-l border-slate-200 pl-6 space-y-6">
                {lead.activities.map((act) => (
                  <div key={act.id} className="relative">
                    {/* Circle icon marker */}
                    <span className="absolute -left-[35px] top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 border border-slate-200 shadow-sm ring-4 ring-white">
                      {getActivityIcon(act.type)}
                    </span>
                    
                    {/* Activity card */}
                    <div className="rounded-lg bg-slate-50/50 p-4 border border-slate-200 transition hover:border-slate-300">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">
                        <span className="text-slate-650">{act.user ? act.user.name : 'System'}</span>
                        <span>{new Date(act.createdAt).toLocaleDateString('en-IN') + ' ' + new Date(act.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{act.description}</p>
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
