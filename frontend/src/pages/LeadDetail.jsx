// frontend/src/pages/LeadDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Building, Phone, Mail, Globe, AlertCircle,
  Check, RefreshCw, MessageSquare, PhoneCall, Activity, Clock,
  Plus, CheckCircle2, Trash2, Paperclip, Upload, Download, FileText,
  Send, ChevronDown, Calendar, User, Tag, AtSign,
  AlertTriangle, Info, Loader2, ExternalLink
} from 'lucide-react';

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

const Instagram = (props) => (
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
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Twitter = (props) => (
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
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: 'DISCOVERY_CALL', label: 'Discovery', icon: '📞', color: 'blue' },
  { key: 'DEMO',           label: 'Demo',      icon: '💻', color: 'purple' },
  { key: 'PROPOSAL',       label: 'Proposal',  icon: '📄', color: 'amber' },
  { key: 'NEGOTIATION',    label: 'Negotiate', icon: '🤝', color: 'orange' },
  { key: 'WIN',            label: 'Won',       icon: '🎉', color: 'emerald' },
  { key: 'LOSS',           label: 'Lost',      icon: '❌', color: 'red' },
];

const MEETING_TYPES = [
  { key: 'PHONE_CALL',      label: 'Phone Call',        icon: '📞' },
  { key: 'ONLINE_MEETING',  label: 'Online Meeting',    icon: '💻' },
  { key: 'FACE_TO_FACE',    label: 'Face-to-Face',      icon: '🤝' },
  { key: 'OFFICE_VISIT',    label: 'Office Visit',      icon: '🏢' },
  { key: 'EMAIL_SENT',      label: 'Email Sent',        icon: '📧' },
  { key: 'WHATSAPP_MSG',    label: 'WhatsApp',          icon: '💬' },
];

const TASK_TYPES = [
  { key: 'FOLLOW_UP', label: 'Follow Up', icon: '🔄' },
  { key: 'CALL',      label: 'Call',      icon: '📞' },
  { key: 'MEETING',   label: 'Meeting',   icon: '🤝' },
  { key: 'EMAIL',     label: 'Email',     icon: '📧' },
  { key: 'DEMO',      label: 'Demo',      icon: '💻' },
  { key: 'OTHER',     label: 'Other',     icon: '📌' },
];

const TABS = ['Activity', 'Tasks', 'Files', 'Gmail', 'WhatsApp'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStageConfig = (key) => PIPELINE_STAGES.find(s => s.key === key) || { key, label: key, icon: '●', color: 'slate' };

const stageBadge = (stage) => {
  const map = {
    DISCOVERY_CALL: 'bg-blue-50 text-blue-700 border-blue-200',
    DEMO:           'bg-purple-50 text-purple-700 border-purple-200',
    PROPOSAL:       'bg-amber-50 text-amber-700 border-amber-200',
    NEGOTIATION:    'bg-orange-50 text-orange-700 border-orange-200',
    WIN:            'bg-emerald-50 text-emerald-700 border-emerald-200',
    LOSS:           'bg-red-50 text-red-700 border-red-200',
  };
  return map[stage] || 'bg-slate-50 text-slate-700 border-slate-200';
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const formatDateTime = (d) => `${formatDate(d)}, ${formatTime(d)}`;

const isOverdue = (dueDate) => new Date(dueDate) < new Date();

const dueDateLabel = (dueDate) => {
  const d = new Date(dueDate);
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const dDay = new Date(d); dDay.setHours(0,0,0,0);

  if (dDay.getTime() === today.getTime()) return 'Today';
  if (dDay.getTime() === tomorrow.getTime()) return 'Tomorrow';
  if (d < new Date()) return `Overdue · ${formatDate(d)}`;
  return formatDate(d);
};

const getFileIcon = (mimeType = '') => {
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📗';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('text')) return '📄';
  return '📎';
};

// ─── Main Component ───────────────────────────────────────────────────────────

const LeadDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Activity');

  // Stage
  const [stageLoading, setStageLoading] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [pendingStage, setPendingStage] = useState(null);
  const [lossReason, setLossReason] = useState('');
  const [stageError, setStageError] = useState('');

  // Activity tab state
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [noteText, setNoteText] = useState('');
  const [callDesc, setCallDesc] = useState('');
  const [callDuration, setCallDuration] = useState('');
  const [meetingType, setMeetingType] = useState('PHONE_CALL');
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState('');

  // Task tab state
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', taskType: 'FOLLOW_UP', dueDate: '' });
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Files tab state
  const [files, setFiles] = useState([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Gmail tab state
  const [emailLogs, setEmailLogs] = useState([]);
  const [newEmail, setNewEmail] = useState({ subject: '', body: '', direction: 'SENT', toEmail: '' });
  const [emailLoading, setEmailLoading] = useState(false);

  // WhatsApp tab state
  const [waMsgs, setWaMsgs] = useState([]);
  const [newWa, setNewWa] = useState({ message: '', direction: 'SENT' });
  const [waLoading, setWaLoading] = useState(false);

  const canEdit = ['SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC'].includes(user?.role);

  useEffect(() => { fetchLead(); }, [id]);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leads/${id}`);
      const data = res.data;
      setLead(data);
      setTasks(data.tasks || []);
      setFiles(data.files || []);

      // Separate email and WhatsApp activities
      const emails = (data.activities || []).filter(a => a.type === 'EMAIL');
      const wa = (data.activities || []).filter(a => a.type === 'WHATSAPP');
      setEmailLogs(emails);
      setWaMsgs(wa);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load lead details.');
    } finally {
      setLoading(false);
    }
  };

  // ── Stage change ──────────────────────────────────────────────────────────

  const handleStageClick = (stageKey) => {
    if (stageLoading || lead.stage === stageKey) return;
    if (lead.stage === 'WIN') return;
    setPendingStage(stageKey);
    setShowStageModal(true);
    setLossReason('');
    setStageError('');
  };

  const confirmStageChange = async () => {
    if (!pendingStage) return;
    if (pendingStage === 'LOSS' && !lossReason.trim()) {
      setStageError('Please provide a reason for loss'); return;
    }
    setStageLoading(true);
    setStageError('');
    try {
      await api.put(`/leads/${id}/stage`, {
        stage: pendingStage,
        lossReason: pendingStage === 'LOSS' ? lossReason : undefined
      });
      setShowStageModal(false);
      setPendingStage(null);
      await fetchLead();
    } catch (err) {
      setStageError(err.response?.data?.message || 'Failed to update stage');
    } finally {
      setStageLoading(false);
    }
  };

  // ── Activity tab ──────────────────────────────────────────────────────────

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setLogLoading(true); setLogError('');
    try {
      const res = await api.post(`/leads/${id}/note`, { description: noteText });
      setLead(prev => ({ ...prev, activities: [res.data, ...prev.activities] }));
      setNoteText('');
    } catch (err) { setLogError(err.response?.data?.message || 'Failed to add note'); }
    finally { setLogLoading(false); }
  };

  const handleLogCall = async (e) => {
    e.preventDefault();
    if (!callDesc.trim() || !callDuration) return;
    setLogLoading(true); setLogError('');
    try {
      const res = await api.post(`/leads/${id}/call`, {
        description: callDesc, duration: parseInt(callDuration), meetingType
      });
      setLead(prev => ({ ...prev, activities: [res.data, ...prev.activities] }));
      setCallDesc(''); setCallDuration('');
    } catch (err) { setLogError(err.response?.data?.message || 'Failed to log call'); }
    finally { setLogLoading(false); }
  };

  // ── Task tab ──────────────────────────────────────────────────────────────

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.dueDate) return;
    setTaskLoading(true); setTaskError('');
    try {
      const res = await api.post('/tasks', { leadId: id, ...newTask });
      const created = res.data;
      setTasks(prev => [...prev, created]);
      setNewTask({ title: '', description: '', taskType: 'FOLLOW_UP', dueDate: '' });
      setShowTaskForm(false);
    } catch (err) { setTaskError(err.response?.data?.message || 'Failed to create task'); }
    finally { setTaskLoading(false); }
  };

  // Shortcut: set dueDate to today/tomorrow
  const setTaskDateShortcut = (type) => {
    const d = new Date();
    if (type === 'tomorrow') d.setDate(d.getDate() + 1);
    if (type === 'next_week') d.setDate(d.getDate() + 7);
    const iso = d.toISOString().slice(0, 16);
    setNewTask(prev => ({ ...prev, dueDate: iso }));
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/complete`);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: true, completedAt: new Date().toISOString() } : t));
    } catch (err) { alert(err.response?.data?.message || 'Failed to complete task'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) { alert('Failed to delete task'); }
  };

  // ── Files tab ──────────────────────────────────────────────────────────────

  const handleFileUpload = async (file) => {
    if (!file) return;
    setFileUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/files/upload/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFiles(prev => [res.data, ...prev]);
    } catch (err) { alert(err.response?.data?.message || 'Upload failed'); }
    finally { setFileUploading(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Delete this file?')) return;
    try {
      await api.delete(`/files/${fileId}`);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) { alert('Failed to delete file'); }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('File download error:', err);
      alert('Failed to download file.');
    }
  };

  // ── Gmail tab ─────────────────────────────────────────────────────────────

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.subject || !newEmail.body) return;
    setEmailLoading(true);
    try {
      const res = await api.post(`/leads/${id}/email-log`, newEmail);
      setEmailLogs(prev => [res.data, ...prev]);
      setNewEmail({ subject: '', body: '', direction: 'SENT', toEmail: '' });
    } catch (err) { alert(err.response?.data?.message || 'Failed to log email'); }
    finally { setEmailLoading(false); }
  };

  // ── WhatsApp tab ──────────────────────────────────────────────────────────

  const handleSendWa = async (e) => {
    e.preventDefault();
    if (!newWa.message) return;
    setWaLoading(true);
    try {
      const res = await api.post(`/leads/${id}/whatsapp-log`, newWa);
      setWaMsgs(prev => [res.data, ...prev]);
      setNewWa({ message: '', direction: 'SENT' });
    } catch (err) { alert('Failed to log message'); }
    finally { setWaLoading(false); }
  };

  // ── Render guards ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-400" />
        <p className="text-sm font-semibold text-red-700">{error || 'Lead not found.'}</p>
        <button onClick={() => navigate('/leads')} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">
          ← Back to Leads
        </button>
      </div>
    );
  }

  const currentStageIdx = PIPELINE_STAGES.findIndex(s => s.key === lead.stage);
  const isWonOrLost = ['WIN', 'LOSS'].includes(lead.stage);
  const activeActivities = (lead.activities || []).filter(a => {
    if (activityFilter === 'ALL') return !['EMAIL', 'WHATSAPP'].includes(a.type);
    return a.type === activityFilter;
  });

  // Task grouping
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);
  const tomorrowStart = new Date(todayEnd); tomorrowStart.setDate(tomorrowStart.getDate() + 1); tomorrowStart.setHours(0,0,0,0);
  const tomorrowEnd = new Date(tomorrowStart); tomorrowEnd.setHours(23,59,59,999);

  const taskGroups = {
    overdue:   tasks.filter(t => !t.isCompleted && (t.isOverdue || new Date(t.dueDate) < now)),
    today:     tasks.filter(t => !t.isCompleted && !t.isOverdue && new Date(t.dueDate) >= todayStart && new Date(t.dueDate) <= todayEnd),
    tomorrow:  tasks.filter(t => !t.isCompleted && new Date(t.dueDate) >= tomorrowStart && new Date(t.dueDate) <= tomorrowEnd),
    upcoming:  tasks.filter(t => !t.isCompleted && new Date(t.dueDate) > tomorrowEnd && !t.isOverdue),
    completed: tasks.filter(t => t.isCompleted),
  };

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link to="/leads" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider transition">
        <ArrowLeft className="h-3.5 w-3.5" />Back to Leads Pipeline
      </Link>

      {/* ── Pipeline Stepper ─────────────────────────────────────────────── */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-5">
        <div className="flex items-center w-full gap-1">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isActive = lead.stage === stage.key;
            const isDone = !isWonOrLost && idx < currentStageIdx;
            const isLoss = lead.stage === 'LOSS' && stage.key !== 'LOSS';
            const isClickable = canEdit && !isActive && lead.stage !== 'WIN';

            return (
              <React.Fragment key={stage.key}>
                <button
                  onClick={() => isClickable && handleStageClick(stage.key)}
                  disabled={!isClickable}
                  title={stage.label}
                  className={`flex flex-col items-center gap-1 flex-shrink-0 rounded-lg p-2 transition-all focus:outline-none disabled:cursor-not-allowed
                    ${isActive
                      ? 'bg-accent-blue text-white shadow-md scale-105'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : isClickable
                      ? 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-accent-blue hover:text-accent-blue'
                      : 'bg-slate-50 text-slate-300 border border-slate-100'
                    }`}
                >
                  <span className="text-base leading-none">{isDone ? '✓' : stage.icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wide whitespace-nowrap">{stage.label}</span>
                </button>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className="flex-1 h-0.5 bg-slate-100 relative min-w-0">
                    <div className={`absolute inset-0 transition-all duration-500 ${isDone ? 'bg-emerald-400' : 'bg-transparent'}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {lead.stage === 'LOSS' && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-700">Lead Lost</p>
              <p className="text-xs text-red-600 mt-0.5">Reason: {lead.lossReason || 'Not specified'}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Layout: Left card + Right tabs ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Lead Info Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
            {/* Stage badge + Name */}
            <div>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2 ${stageBadge(lead.stage)}`}>
                {getStageConfig(lead.stage).icon} {getStageConfig(lead.stage).label}
              </span>
              <h2 className="text-xl font-bold text-slate-800">{lead.name}</h2>
              {lead.companyName && <p className="text-sm text-slate-500 font-semibold mt-0.5">{lead.companyName}</p>}
              <p className="text-[10px] text-slate-400 mt-0.5">Lead ID: {lead.id}</p>
            </div>

            {/* Contact Info */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Info</h4>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold">{lead.phone}</span>
              </div>
              {lead.personalEmail && (
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{lead.personalEmail}</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Connect Actions</h4>
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/91${lead.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(lead.name)},%20this%20is%20${encodeURIComponent(user?.name || '')}%20from%20TheVertical.ai.%20Just%2520following%2520up%2520on%2520our%2520conversation.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center space-x-1.5 rounded bg-emerald-600 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-emerald-700 transition text-center"
                >
                  <span>WhatsApp</span>
                </a>
                {lead.personalEmail && (
                  <a
                    href={`mailto:${lead.personalEmail}?subject=Following%20up%20from%20TheVertical.ai&body=Hi%20${encodeURIComponent(lead.name)},`}
                    className="flex-1 flex items-center justify-center space-x-1.5 rounded bg-blue-600 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-blue-750 transition text-center"
                  >
                    <span>Send Email</span>
                  </a>
                )}
              </div>
            </div>

            {/* Company Info */}
            {(lead.companyEmail || lead.companyName) && (
              <div className="border-t border-slate-100 pt-4 space-y-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Company Info</h4>
                {lead.companyName && (
                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold">{lead.companyName}</span>
                  </div>
                )}
                {lead.companyEmail && (
                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <AtSign className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{lead.companyEmail}</span>
                  </div>
                )}
              </div>
            )}

            {/* Social */}
            {(lead.linkedinUrl || lead.socialMediaUrl) && (
              <div className="border-t border-slate-100 pt-4 space-y-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Social</h4>
                {lead.linkedinUrl && (
                  <a href={lead.linkedinUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2.5 text-xs text-blue-600 hover:text-blue-700 transition">
                    <Linkedin className="h-3.5 w-3.5 shrink-0" />
                    <span>LinkedIn Profile</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                )}
                {lead.socialMediaUrl && (
                  <a href={lead.socialMediaUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2.5 text-xs text-pink-600 hover:text-pink-700 transition">
                    <Instagram className="h-3.5 w-3.5 shrink-0" />
                    <span>Social Media</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                )}
              </div>
            )}

            {/* Meta */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-500">
                <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Source: <span className="font-semibold">{lead.source}</span></span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-500">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Assigned: <span className="font-semibold">{lead.assignedTo?.name || 'Unassigned'}</span></span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Created: {formatDate(lead.createdAt)}</span>
              </div>
            </div>

            {/* Notes */}
            {lead.notes && (
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Notes</h4>
                <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                  {lead.notes}
                </p>
              </div>
            )}
          </div>

          {/* Client Box if Won */}
          {lead.client && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Client Account Created</h3>
              </div>
              <div className="space-y-1 text-xs text-emerald-800">
                <div className="flex justify-between">
                  <span className="opacity-70">Company:</span>
                  <span className="font-bold">{lead.client.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Contact:</span>
                  <span className="font-bold">{lead.client.contactName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">AMC Ends:</span>
                  <span className="font-bold">{lead.client.amcEndDate ? formatDate(lead.client.amcEndDate) : 'N/A'}</span>
                </div>
              </div>
              <Link to="/clients" className="block text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 transition">
                Go to Account Management →
              </Link>
            </div>
          )}
        </div>

        {/* Right: 5-Tab Panel */}
        <div className="lg:col-span-2 space-y-0">
          {/* Tab Bar */}
          <div className="flex items-center bg-white border border-slate-200 rounded-t-xl overflow-hidden">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all
                  ${activeTab === tab
                    ? 'border-accent-blue text-accent-blue bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                {tab === 'Tasks' && taskGroups.overdue.length > 0
                  ? <span className="relative">{tab}<span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-bold">{taskGroups.overdue.length}</span></span>
                  : tab}
              </button>
            ))}
          </div>

          <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-5 min-h-[400px]">

            {/* ── TAB 1: Activity ─────────────────────────────────────────── */}
            {activeTab === 'Activity' && (
              <div className="space-y-5">
                {/* Log forms */}
                {canEdit && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Note form */}
                    <form onSubmit={handleAddNote} className="space-y-2.5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <MessageSquare className="h-3.5 w-3.5 text-sky-500" /> Add Note
                      </div>
                      <textarea
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        rows={3}
                        placeholder="Log call outcome, client feedback, next steps..."
                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-accent-blue resize-none"
                      />
                      <button disabled={logLoading || !noteText.trim()}
                        className="w-full rounded-lg bg-accent-blue py-2 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50">
                        Save Note
                      </button>
                    </form>

                    {/* Call/Meeting Log form */}
                    <form onSubmit={handleLogCall} className="space-y-2.5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <PhoneCall className="h-3.5 w-3.5 text-emerald-500" /> Log Interaction
                      </div>
                      {/* Meeting Type Selector */}
                      <div className="grid grid-cols-3 gap-1">
                        {MEETING_TYPES.map(mt => (
                          <button key={mt.key} type="button"
                            onClick={() => setMeetingType(mt.key)}
                            className={`rounded-lg py-1.5 text-[10px] font-bold text-center transition border
                              ${meetingType === mt.key
                                ? 'bg-accent-blue text-white border-accent-blue'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-accent-blue'}`}>
                            {mt.icon} {mt.label}
                          </button>
                        ))}
                      </div>
                      <input
                        value={callDesc} onChange={e => setCallDesc(e.target.value)}
                        placeholder="What was discussed / outcome?"
                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-accent-blue"
                      />
                      <div className="relative">
                        <Clock className="absolute inset-y-0 left-2.5 my-auto h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="number" min="1" value={callDuration}
                          onChange={e => setCallDuration(e.target.value)}
                          placeholder="Duration (minutes)"
                          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-xs text-slate-700 outline-none focus:border-accent-blue"
                        />
                      </div>
                      <button disabled={logLoading || !callDesc.trim() || !callDuration}
                        className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50">
                        Log Interaction
                      </button>
                    </form>
                  </div>
                )}

                {logError && <p className="text-xs text-red-600 font-semibold">{logError}</p>}

                {/* Activity filter pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['ALL', 'NOTE', 'CALL', 'STAGE_CHANGE'].map(f => (
                    <button key={f} onClick={() => setActivityFilter(f)}
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition border
                        ${activityFilter === f ? 'bg-accent-blue text-white border-accent-blue' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                      {f === 'ALL' ? '📋 All' : f === 'NOTE' ? '📝 Notes' : f === 'CALL' ? '📞 Calls' : '🔄 Stage'}
                    </button>
                  ))}
                </div>

                {/* Timeline */}
                <div className="relative">
                  {activeActivities.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-slate-400">
                      <Activity className="h-8 w-8 mb-2" />
                      <p className="text-xs font-semibold">No activity recorded yet</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-slate-100 pl-6 space-y-4">
                      {activeActivities.map(act => {
                        const iconMap = {
                          STAGE_CHANGE: <RefreshCw className="h-3 w-3 text-amber-500" />,
                          NOTE:         <MessageSquare className="h-3 w-3 text-sky-500" />,
                          CALL:         <PhoneCall className="h-3 w-3 text-emerald-500" />,
                        };
                        return (
                          <div key={act.id} className="relative">
                            <span className="absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm">
                              {iconMap[act.type] || <Activity className="h-3 w-3 text-slate-400" />}
                            </span>
                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 hover:border-slate-300 transition">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-semibold">
                                <span className="text-slate-600">{act.user?.name || 'System'}</span>
                                <span>{formatDateTime(act.createdAt)}</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed">{act.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 2: Tasks ─────────────────────────────────────────────── */}
            {activeTab === 'Tasks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasks & Follow-ups</h3>
                  {canEdit && (
                    <button onClick={() => setShowTaskForm(!showTaskForm)}
                      className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition">
                      <Plus className="h-3.5 w-3.5" /> New Task
                    </button>
                  )}
                </div>

                {/* New Task Form */}
                {showTaskForm && canEdit && (
                  <form onSubmit={handleCreateTask} className="space-y-3 p-4 rounded-xl border border-dashed border-accent-blue bg-blue-50/30">
                    <div className="flex items-center gap-2 text-xs font-bold text-accent-blue uppercase tracking-wider">
                      <Plus className="h-3.5 w-3.5" /> Create Task
                    </div>
                    <input
                      value={newTask.title}
                      onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                      placeholder="Task title (e.g. Follow up with Rajesh)"
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-accent-blue"
                      required
                    />
                    <textarea
                      value={newTask.description}
                      onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                      rows={2} placeholder="Description (optional)"
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-accent-blue resize-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Task Type</label>
                        <select value={newTask.taskType} onChange={e => setNewTask(p => ({ ...p, taskType: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 outline-none focus:border-accent-blue">
                          {TASK_TYPES.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Due Date</label>
                        <input type="datetime-local" value={newTask.dueDate}
                          onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 outline-none focus:border-accent-blue"
                          required
                        />
                      </div>
                    </div>
                    {/* Date shortcuts */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quick:</span>
                      {[['today','Today'],['tomorrow','Tomorrow'],['next_week','Next Week']].map(([k,l]) => (
                        <button key={k} type="button" onClick={() => setTaskDateShortcut(k)}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-bold text-slate-600 hover:border-accent-blue hover:text-accent-blue transition">
                          {l}
                        </button>
                      ))}
                    </div>
                    {taskError && <p className="text-xs text-red-600 font-semibold">{taskError}</p>}
                    <div className="flex gap-2">
                      <button type="submit" disabled={taskLoading}
                        className="flex-1 rounded-lg bg-accent-blue py-2 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50">
                        {taskLoading ? 'Creating...' : 'Create Task'}
                      </button>
                      <button type="button" onClick={() => setShowTaskForm(false)}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Task Groups */}
                {['overdue','today','tomorrow','upcoming','completed'].map(group => {
                  const groupTasks = taskGroups[group];
                  if (groupTasks.length === 0) return null;
                  const labels = {
                    overdue: { label: '🔴 Overdue', cls: 'text-red-600', bg: 'bg-red-50 border-red-200' },
                    today: { label: '📅 Today', cls: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
                    tomorrow: { label: '📅 Tomorrow', cls: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
                    upcoming: { label: '📅 Upcoming', cls: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
                    completed: { label: '✅ Completed', cls: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
                  };
                  const conf = labels[group];
                  return (
                    <div key={group}>
                      <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${conf.cls}`}>{conf.label} ({groupTasks.length})</h4>
                      <div className="space-y-2">
                        {groupTasks.map(task => (
                          <div key={task.id} className={`flex items-start gap-3 rounded-xl border p-3 transition ${conf.bg}`}>
                            <div className="mt-0.5">
                              {task.isCompleted
                                ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                : group === 'overdue'
                                ? <AlertTriangle className="h-4 w-4 text-red-500" />
                                : <Clock className="h-4 w-4 text-slate-400" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {TASK_TYPES.find(t => t.key === task.taskType)?.icon} {task.title}
                              </p>
                              {task.description && <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>}
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                                <span>📅 {dueDateLabel(task.dueDate)}</span>
                                <span>👤 {task.assignedTo?.name}</span>
                                {task.isCompleted && task.completedAt && <span>✅ Done {formatDate(task.completedAt)}</span>}
                              </div>
                            </div>
                            {!task.isCompleted && canEdit && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => handleCompleteTask(task.id)}
                                  className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-600 transition">
                                  Done
                                </button>
                                <button onClick={() => handleDeleteTask(task.id)}
                                  className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-red-500 hover:border-red-200 transition">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {tasks.length === 0 && (
                  <div className="flex flex-col items-center py-10 text-slate-400">
                    <CheckCircle2 className="h-8 w-8 mb-2" />
                    <p className="text-xs font-semibold">No tasks yet. Create your first task!</p>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: Files ─────────────────────────────────────────────── */}
            {activeTab === 'Files' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attachments & Files</h3>

                {canEdit && (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition
                      ${dragOver ? 'border-accent-blue bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-accent-blue hover:bg-blue-50/30'}`}
                  >
                    <input ref={fileInputRef} type="file" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                    {fileUploading ? (
                      <><Loader2 className="h-6 w-6 animate-spin text-accent-blue" /><p className="text-xs text-accent-blue font-semibold">Uploading...</p></>
                    ) : (
                      <><Upload className="h-6 w-6 text-slate-400" />
                      <p className="text-xs font-semibold text-slate-500">Drag & drop or click to upload</p>
                      <p className="text-[10px] text-slate-400">PDF, Word, Excel, Images — max 20MB</p></>
                    )}
                  </div>
                )}

                {files.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-slate-400">
                    <Paperclip className="h-8 w-8 mb-2" />
                    <p className="text-xs font-semibold">No files attached yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map(file => (
                      <div key={file.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 hover:border-slate-300 transition">
                        <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{file.fileName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatBytes(file.fileSize)} · Uploaded by {file.uploadedBy?.name} · {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleDownloadFile(file.id, file.fileName)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:text-accent-blue hover:border-accent-blue transition cursor-pointer"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          {canEdit && (
                            <button onClick={() => handleDeleteFile(file.id)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-red-500 hover:border-red-200 transition"
                              title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 4: Gmail ─────────────────────────────────────────────── */}
            {activeTab === 'Gmail' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">📧 Email Thread</h3>
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                    Manual Log Mode — Gmail API Coming Soon
                  </div>
                </div>

                {canEdit && (
                  <form onSubmit={handleSendEmail} className="space-y-3 rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Direction</label>
                        <select value={newEmail.direction} onChange={e => setNewEmail(p => ({ ...p, direction: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 outline-none focus:border-accent-blue">
                          <option value="SENT">📤 Sent (you sent)</option>
                          <option value="RECEIVED">📥 Received (they replied)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">To / From Email</label>
                        <input value={newEmail.toEmail} onChange={e => setNewEmail(p => ({ ...p, toEmail: e.target.value }))}
                          placeholder={lead.personalEmail || lead.companyEmail || 'email@company.com'}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 outline-none focus:border-accent-blue" />
                      </div>
                    </div>
                    <input value={newEmail.subject} onChange={e => setNewEmail(p => ({ ...p, subject: e.target.value }))}
                      placeholder="Subject line"
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-accent-blue" required />
                    <textarea value={newEmail.body} onChange={e => setNewEmail(p => ({ ...p, body: e.target.value }))}
                      rows={4} placeholder="Email body..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-accent-blue resize-none" required />
                    <button disabled={emailLoading}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50">
                      <Send className="h-3.5 w-3.5" /> Log Email
                    </button>
                  </form>
                )}

                {/* Email thread */}
                <div className="space-y-2">
                  {emailLogs.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-slate-400">
                      <Mail className="h-8 w-8 mb-2" />
                      <p className="text-xs font-semibold">No emails logged yet</p>
                    </div>
                  ) : emailLogs.map(email => {
                    let parsed = { subject: email.description, body: '', direction: 'SENT', toEmail: '' };
                    try { parsed = JSON.parse(email.description); } catch {}
                    const isSent = parsed.direction === 'SENT';
                    return (
                      <div key={email.id} className={`rounded-xl border p-4 ${isSent ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isSent ? 'text-blue-600' : 'text-slate-500'}`}>
                            {isSent ? '📤 Sent by you' : '📥 Received'} {parsed.toEmail && `· ${parsed.toEmail}`}
                          </span>
                          <span className="text-[10px] text-slate-400">{formatDateTime(email.createdAt)}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 mb-1">{parsed.subject}</p>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{parsed.body}</p>
                        <p className="text-[10px] text-slate-400 mt-2">Logged by {email.user?.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TAB 5: WhatsApp ───────────────────────────────────────────── */}
            {activeTab === 'WhatsApp' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">💬 WhatsApp Conversation</h3>
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                    Manual Log Mode
                  </div>
                </div>

                {/* Chat bubbles */}
                <div className="bg-[#e5ddd5] rounded-xl p-4 min-h-[200px] space-y-2.5 max-h-[320px] overflow-y-auto">
                  {waMsgs.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-slate-500">
                      <p className="text-xs font-semibold">No messages logged yet</p>
                    </div>
                  ) : [...waMsgs].reverse().map(msg => {
                    let parsed = { message: msg.description, direction: 'SENT' };
                    try { parsed = JSON.parse(msg.description); } catch {}
                    const isSent = parsed.direction === 'SENT';
                    return (
                      <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-xl px-3 py-2 shadow-sm
                          ${isSent ? 'bg-[#dcf8c6] rounded-br-sm' : 'bg-white rounded-bl-sm'}`}>
                          <p className="text-xs text-slate-800 leading-relaxed">{parsed.message}</p>
                          <p className="text-[9px] text-slate-400 mt-1 text-right">
                            {formatTime(msg.createdAt)} {isSent && '✓✓'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {canEdit && (
                  <form onSubmit={handleSendWa} className="flex items-center gap-2">
                    <select value={newWa.direction} onChange={e => setNewWa(p => ({ ...p, direction: e.target.value }))}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 outline-none focus:border-accent-blue shrink-0">
                      <option value="SENT">📤 Sent</option>
                      <option value="RECEIVED">📥 Received</option>
                    </select>
                    <input value={newWa.message} onChange={e => setNewWa(p => ({ ...p, message: e.target.value }))}
                      placeholder="Type message to log..."
                      className="flex-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-accent-blue"
                    />
                    <button disabled={waLoading || !newWa.message}
                      className="rounded-lg bg-emerald-600 p-2.5 text-white hover:bg-emerald-700 transition disabled:opacity-50">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Stage Confirmation Modal ──────────────────────────────────────── */}
      {showStageModal && pendingStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <div className="text-center">
              <span className="text-3xl">{getStageConfig(pendingStage).icon}</span>
              <h3 className="text-sm font-bold text-slate-800 mt-2">Move to {getStageConfig(pendingStage).label}?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will move <strong>{lead.name}</strong> from <strong>{getStageConfig(lead.stage).label}</strong> to <strong>{getStageConfig(pendingStage).label}</strong>.
              </p>
            </div>

            {pendingStage === 'LOSS' && (
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Why was this lead lost? *
                </label>
                <textarea
                  value={lossReason} onChange={e => setLossReason(e.target.value)}
                  rows={3} placeholder="e.g. Price too high, went with competitor, no budget..."
                  className="w-full rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-slate-700 outline-none focus:border-red-400 resize-none"
                />
              </div>
            )}

            {pendingStage === 'WIN' && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
                🎉 Marking as Won will automatically create a Client Account and trigger the handoff workflow.
              </div>
            )}

            {stageError && <p className="text-xs text-red-600 font-semibold text-center">{stageError}</p>}

            <div className="flex gap-2">
              <button onClick={() => { setShowStageModal(false); setPendingStage(null); }}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={confirmStageChange} disabled={stageLoading}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white transition disabled:opacity-50
                  ${pendingStage === 'LOSS' ? 'bg-red-500 hover:bg-red-600' : pendingStage === 'WIN' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-accent-blue hover:bg-blue-700'}`}>
                {stageLoading ? 'Updating...' : `Confirm → ${getStageConfig(pendingStage).label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetail;
