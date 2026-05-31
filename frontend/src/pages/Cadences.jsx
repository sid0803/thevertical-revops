// frontend/src/pages/Cadences.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, Plus, Play, Loader2, Target, Phone, 
  MessageSquare, Mail, AlertCircle, Sparkles, CheckCircle 
} from 'lucide-react';

export default function Cadences() {
  const { user } = useAuth();
  const [cadences, setCadences] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Creation State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState([
    { type: 'CALL', delayDays: 0, template: 'Discovery Call: Ask about enterprise CRM integration requirements.' }
  ]);
  const [creating, setCreating] = useState(false);

  // Enrollment State
  const [selectedCadenceId, setSelectedCadenceId] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCadences();
    fetchLeads();
  }, []);

  const fetchCadences = async () => {
    try {
      const res = await api.get('/cadences');
      setCadences(res.data);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch prospecting sequences.');
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads');
      // Only show active leads
      setLeads(res.data.filter(l => l.stage !== 'WIN' && l.stage !== 'LOSS'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => {
    setSteps([...steps, { type: 'CALL', delayDays: 2, template: '' }]);
  };

  const removeStep = (idx) => {
    if (steps.length === 1) return;
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const handleStepChange = (idx, field, value) => {
    const updated = [...steps];
    updated[idx][field] = value;
    setSteps(updated);
  };

  const handleCreateCadence = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/cadences', { name, description, steps });
      setSuccess('Prospecting cadence sequence created successfully!');
      setName('');
      setDescription('');
      setSteps([{ type: 'CALL', delayDays: 0, template: 'Discovery Call: Ask about enterprise CRM integration requirements.' }]);
      fetchCadences();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create cadence.');
    } finally {
      setCreating(false);
    }
  };

  const handleEnrollLeads = async (e) => {
    e.preventDefault();
    if (!selectedCadenceId || selectedLeadIds.length === 0) return;
    setEnrolling(true);
    setError('');
    setSuccess('');
    try {
      await api.post(`/cadences/${selectedCadenceId}/enroll`, { leadIds: selectedLeadIds });
      setSuccess(`Successfully enrolled ${selectedLeadIds.length} leads in the cadence!`);
      setSelectedLeadIds([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll leads.');
    } finally {
      setEnrolling(false);
    }
  };

  const toggleLeadSelection = (leadId) => {
    if (selectedLeadIds.includes(leadId)) {
      setSelectedLeadIds(selectedLeadIds.filter(id => id !== leadId));
    } else {
      setSelectedLeadIds([...selectedLeadIds, leadId]);
    }
  };

  const getStepIcon = (type) => {
    switch (type) {
      case 'CALL': return <Phone size={14} className="text-indigo-500" />;
      case 'WHATSAPP': return <MessageSquare size={14} className="text-emerald-500" />;
      case 'EMAIL': return <Mail size={14} className="text-blue-500" />;
      default: return <Target size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Prospecting Cadences & Sequences</h1>
        <p className="text-sm text-slate-500">Define structured follow-up cadences and enroll leads in multi-channel sales paths</p>
      </div>

      {error && <div className="rounded-xl border border-red-150 bg-red-50 p-4 text-xs font-semibold text-red-650">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-600">{success}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Column: List Cadences */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass rounded-xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Active Prospecting Cadences</h3>
            {cadences.length === 0 ? (
              <div className="text-center py-12 text-slate-450 italic border border-dashed border-slate-200 rounded-xl">
                No sequences defined yet. Use the creator tool to add your first cadence playbook.
              </div>
            ) : (
              <div className="space-y-4">
                {cadences.map(cad => (
                  <div key={cad.id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{cad.name}</h4>
                        {cad.description && <p className="text-xs text-slate-450 mt-0.5">{cad.description}</p>}
                      </div>
                      <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase">
                        {cad.steps.length} Steps
                      </span>
                    </div>

                    {/* Steps visual flow */}
                    <div className="flex flex-wrap items-center gap-2 pt-1.5">
                      {cad.steps.map((step, idx) => (
                        <React.Fragment key={step.id}>
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
                            {getStepIcon(step.type)}
                            <span className="font-bold text-[10px] text-slate-700">
                              Step {step.stepNumber}: {step.type} {step.delayDays > 0 && `(Wait ${step.delayDays}d)`}
                            </span>
                          </div>
                          {idx < cad.steps.length - 1 && <span className="text-slate-350 text-xs">➔</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enroll Leads Form */}
          {cadences.length > 0 && (
            <div className="glass rounded-xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Target size={16} className="text-indigo-500" />
                <span>Enroll Lead Segment</span>
              </h3>
              
              <form onSubmit={handleEnrollLeads} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Select Sequence Playbook</label>
                  <select 
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-accent-blue focus:bg-white"
                    value={selectedCadenceId}
                    onChange={e => setSelectedCadenceId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Cadence Sequence --</option>
                    {cadences.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Select Leads to Enroll</label>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {leads.map(lead => (
                      <div 
                        key={lead.id} 
                        onClick={() => toggleLeadSelection(lead.id)}
                        className={`flex items-center gap-3 p-3 text-xs cursor-pointer hover:bg-slate-50/50 transition ${
                          selectedLeadIds.includes(lead.id) ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedLeadIds.includes(lead.id)}
                          onChange={() => {}} 
                          className="rounded text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-850 block">{lead.name}</span>
                          {lead.companyName && <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{lead.companyName} ({lead.stage})</span>}
                        </div>
                      </div>
                    ))}
                    {leads.length === 0 && (
                      <div className="text-center py-6 text-slate-400 italic">No active leads available for enrollment.</div>
                    )}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={enrolling || selectedLeadIds.length === 0}
                  className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-indigo-650 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-indigo-750 transition active:scale-95 disabled:opacity-50"
                >
                  {enrolling ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  <span>Enroll {selectedLeadIds.length} Selected Leads</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Cadence Sequence Builder */}
        <div className="glass rounded-xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Plus size={16} className="text-accent-blue" />
            <span>Cadence Sequence Builder</span>
          </h3>

          <form onSubmit={handleCreateCadence} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Sequence Name</label>
              <input 
                type="text"
                placeholder="e.g. Inbound Enterprise Cadence"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-accent-blue focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description (Optional)</label>
              <textarea 
                placeholder="Target segment, goals, etc."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-accent-blue focus:bg-white resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Playbook Steps</span>
                <button 
                  type="button" 
                  onClick={addStep}
                  className="text-[10px] font-bold uppercase tracking-wider text-accent-blue hover:text-blue-750"
                >
                  + Add Step
                </button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {steps.map((step, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2 relative">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[10px] text-slate-500 uppercase">Step {idx + 1}</span>
                      {steps.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeStep(idx)}
                          className="text-[9px] font-bold text-red-500 hover:text-red-750 uppercase"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">Step Type</label>
                        <select 
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none"
                          value={step.type}
                          onChange={e => handleStepChange(idx, 'type', e.target.value)}
                        >
                          <option value="CALL">Phone Call</option>
                          <option value="WHATSAPP">WhatsApp</option>
                          <option value="EMAIL">Email</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">Delay (Days)</label>
                        <input 
                          type="number"
                          min={0}
                          value={step.delayDays}
                          onChange={e => handleStepChange(idx, 'delayDays', parseInt(e.target.value) || 0)}
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none text-right"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">Playbook Script / Template</label>
                      <textarea 
                        placeholder="Template text or talking points guide..."
                        value={step.template}
                        onChange={e => handleStepChange(idx, 'template', e.target.value)}
                        rows={2}
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={creating}
              className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-accent-blue py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-750 transition active:scale-95"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              <span>Deploy Sequence Playbook</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
