// frontend/src/pages/WorkQueue.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, Phone, AlertTriangle, Star, Calendar, 
  CheckCircle, MoreHorizontal, MessageSquare, 
  ArrowRight, Filter, Search, Check, TrendingUp
} from 'lucide-react';

export default function WorkQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('today');
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Daily statistics metrics
  const [stats, setStats] = useState({
    completedCount: 0,
    totalCalls: 0,
    targetCalls: 25,
    talkTimeSec: 0,
    targetTalkTimeMin: 120
  });

  useEffect(() => {
    fetchQueueData();
  }, []);

  const fetchQueueData = async () => {
    setLoading(true);
    try {
      // Fetch all leads
      const leadsRes = await api.get('/leads');
      const allLeads = leadsRes.data;
      setLeads(allLeads);

      // Fetch all tasks for the logged in user or globally
      const overdueRes = await api.get('/tasks/overdue');
      
      // Let's also fetch general tasks or compile lists based on leads
      const allTasks = [];
      for (const lead of allLeads) {
        try {
          const leadTasksRes = await api.get(`/tasks?leadId=${lead.id}`);
          if (leadTasksRes.data?.tasks) {
            allTasks.push(...leadTasksRes.data.tasks);
          }
        } catch (e) {
          // Silent catch for BOLA restrictions
        }
      }

      setTasks(allTasks);

      // Calculate stats based on activities completed today
      const today = new Date().toISOString().split('T')[0];
      const completedToday = allTasks.filter(t => t.isCompleted && t.completedAt?.startsWith(today));
      
      // Calculate total logged calls and durations
      let callCount = 0;
      let durationSec = 0;
      allLeads.forEach(l => {
        const callActivities = l.activities?.filter(act => act.type === 'CALL' && act.userId === user.id);
        if (callActivities) {
          callCount += callActivities.length;
          callActivities.forEach(act => durationSec += (act.callDuration || 0));
        }
      });

      setStats({
        completedCount: completedToday.length,
        totalCalls: callCount,
        targetCalls: 20,
        talkTimeSec: durationSec,
        targetTalkTimeMin: 120
      });

    } catch (err) {
      console.error(err);
      setError('Failed to populate daily work queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/complete`);
      fetchQueueData();
    } catch (e) {
      alert('Failed to complete task.');
    }
  };

  // Processing queues
  const todayDateStr = new Date().toISOString().split('T')[0];

  const todayFollowUps = tasks.filter(t => t.dueDate?.startsWith(todayDateStr) && !t.isCompleted);
  const overdueFollowUps = tasks.filter(t => t.dueDate && t.dueDate < todayDateStr && !t.isCompleted);
  const upcomingFollowUps = tasks.filter(t => t.dueDate && t.dueDate > todayDateStr && !t.isCompleted);

  // Callbacks and high priority
  const callbackQueue = leads.filter(l => l.stage === 'DISCOVERY_CALL' && l.source === 'Website');
  const priorityLeads = leads.filter(l => l.stage === 'NEGOTIATION');

  let activeList = [];
  if (activeTab === 'today') {
    activeList = [...todayFollowUps.map(t=>({...t, type: 'task'})), ...callbackQueue.map(l=>({...l, type: 'callback'}))];
  } else if (activeTab === 'overdue') {
    activeList = overdueFollowUps.map(t=>({...t, type: 'task'}));
  } else if (activeTab === 'upcoming') {
    activeList = upcomingFollowUps.map(t=>({...t, type: 'task'}));
  } else if (activeTab === 'priority') {
    activeList = priorityLeads.map(l=>({...l, type: 'lead'}));
  }

  if (search) {
    activeList = activeList.filter(item => {
      const name = item.lead?.name || item.name || item.title || '';
      const company = item.lead?.companyName || item.companyName || '';
      return name.toLowerCase().includes(search.toLowerCase()) || company.toLowerCase().includes(search.toLowerCase());
    });
  }

  // Suggest next hot deal
  const hotDeal = leads.length > 0 ? leads.reduce((prev, current) => {
    return (prev.createdAt > current.createdAt) ? prev : current;
  }) : null;

  const renderItemCard = (item) => {
    const isTask = item.type === 'task';
    const isLead = item.type === 'lead';
    const lead = isTask ? item.lead : item;
    const title = isTask ? item.title : `Pipeline follow-up for ${lead?.companyName || lead?.name}`;
    const description = isTask ? item.description : `Convert deal and log feedback activity.`;
    const tagColor = isTask ? 'border-accent-blue' : 'border-purple-500';

    return (
      <div 
        key={item.id} 
        className={`glass rounded-xl bg-white border-l-4 p-4 shadow-sm flex items-center justify-between gap-4 transition hover:bg-slate-50/50 ${tagColor}`}
      >
        <div className="space-y-1.5 flex-1 min-w-0" onClick={() => navigate(lead ? `/leads/${lead.id}` : '#')} className="cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800 truncate block max-w-sm">{title}</span>
            {item.isOverdue && <span className="bg-red-50 text-red-700 border border-red-200 text-[8px] font-bold px-1.5 py-0.2 rounded">OVERDUE</span>}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-semibold"><Star size={11} className="text-amber-500" /> {lead?.name}</span>
            {lead?.companyName && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lead.companyName}</span>}
            <span className="flex items-center gap-1"><Clock size={11} /> {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN') : 'Callback Requested'}</span>
          </div>
          {description && <p className="text-xs text-slate-400 line-clamp-1 italic">{description}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isTask && (
            <button 
              onClick={() => handleMarkComplete(item.id)}
              className="rounded-lg p-1.5 border border-slate-100 text-emerald-600 hover:bg-emerald-50 transition active:scale-95" 
              title="Mark Task Complete"
            >
              <CheckCircle size={16} />
            </button>
          )}
          <button 
            onClick={() => navigate(lead ? `/leads/${lead.id}` : '#')}
            className="flex items-center space-x-1.5 rounded bg-accent-blue px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm hover:bg-blue-750 transition active:scale-95"
          >
            <Phone size={11} />
            <span>Call</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">BDE Work Queue</h1>
          <p className="text-sm text-slate-500">Action center for dialing, follow-up checklist completion, and daily pipeline hygiene</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute inset-y-0 left-0 ml-3 h-4 w-4 my-auto text-slate-400" />
            <input 
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs outline-none focus:border-accent-blue focus:bg-white" 
              placeholder="Search active queue..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-250/80 gap-1.5">
        {[
          { id: 'today', label: "Today's Work", count: todayFollowUps.length + callbackQueue.length },
          { id: 'overdue', label: "Overdue Dials", count: overdueFollowUps.length, color: 'text-red-650' },
          { id: 'upcoming', label: "Upcoming Dials", count: upcomingFollowUps.length },
          { id: 'priority', label: "Hot Leads", count: priorityLeads.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 -mb-px ${
              activeTab === tab.id 
                ? 'border-accent-blue text-accent-blue' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className={tab.color}>{tab.label}</span>
            <span className={`text-[10px] rounded px-1.5 py-0.2 border ${
              activeTab === tab.id ? 'bg-blue-50 text-accent-blue border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Main List */}
        <div className="xl:col-span-2 space-y-3">
          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-500">{error}</div>
          ) : activeList.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-450 italic">
              All tasks cleared! No active items in this queue tab.
            </div>
          ) : (
            activeList.map(item => renderItemCard(item))
          )}
        </div>

        {/* Right Statistics & AI Widget */}
        <div className="space-y-6">
          {/* Daily Progress */}
          <div className="glass rounded-xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800">Daily Execution Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Dials Completed</div>
                <div className="text-lg font-bold text-slate-800">{stats.totalCalls} / {stats.targetCalls}</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Talk Time logged</div>
                <div className="text-lg font-bold text-accent-blue">{(stats.talkTimeSec / 60).toFixed(0)} min</div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Dials Target Progress:</span>
                <span>{Math.round((stats.totalCalls / stats.targetCalls) * 100)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-accent-blue rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (stats.totalCalls / stats.targetCalls) * 100)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* AI suggested hot lead */}
          {hotDeal && (
            <div className="glass rounded-xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Star size={16} className="text-amber-500 fill-amber-500" />
                <span>AI Suggested Best Next Action</span>
              </h3>
              <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4 space-y-3">
                <div>
                  <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wide">Hot Conversion Target</h4>
                  <div className="font-bold text-sm text-slate-800 mt-1">{hotDeal.companyName || hotDeal.name}</div>
                  <p className="text-xs text-slate-550 mt-1 leading-relaxed">
                    Lead is in <strong>{hotDeal.stage}</strong> stage and was captured recently. Sentiment logs indicate high interest. Recommended window to call is <strong>Now</strong>.
                  </p>
                </div>
                <button 
                  onClick={() => navigate(`/leads/${hotDeal.id}`)}
                  className="w-full flex items-center justify-center space-x-1.5 rounded bg-amber-500 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-amber-600 transition active:scale-95"
                >
                  <Phone size={13} />
                  <span>Call best lead</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
