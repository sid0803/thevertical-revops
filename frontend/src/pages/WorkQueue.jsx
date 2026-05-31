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
  const [cadenceTasks, setCadenceTasks] = useState([]);
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

  // Speech and HUD states
  const [hudActive, setHudActive] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [activeObjections, setActiveObjections] = useState([]);
  const [recognition, setRecognition] = useState(null);

  const OBJECTION_TIPS = {
    expensive: {
      title: "💰 Pricing Objections",
      advice: "Don't justify the price; focus on value. Say: 'I understand price is a concern, but let's look at the ROI this system brings by saving X hours of manual data entry...'"
    },
    price: {
      title: "💰 Pricing Objections",
      advice: "Don't justify the price; focus on value. Say: 'I understand price is a concern, but let's look at the ROI this system brings by saving X hours of manual data entry...'"
    },
    cost: {
      title: "💰 Pricing Objections",
      advice: "Don't justify the price; focus on value. Say: 'I understand price is a concern, but let's look at the ROI this system brings by saving X hours of manual data entry...'"
    },
    competitor: {
      title: "⚔️ Competitor Objections",
      advice: "Acknowledge and differentiate. Say: 'Unlike competitor X, our platform native-integrates CRM with RevOps controls, meaning you don't pay 3rd party sync fees...'"
    },
    later: {
      title: "⏳ Delay Objections (Call Later)",
      advice: "Establish urgency. Say: 'I understand you are busy, but setting up this automation now saves you 10 hours next week. Can we do a 5-min demo tomorrow?'"
    },
    busy: {
      title: "⏳ Delay Objections (Call Later)",
      advice: "Establish urgency. Say: 'I understand you are busy, but setting up this automation now saves you 10 hours next week. Can we do a 5-min demo tomorrow?'"
    },
    "no time": {
      title: "⏳ Delay Objections (Call Later)",
      advice: "Establish urgency. Say: 'I understand you are busy, but setting up this automation now saves you 10 hours next week. Can we do a 5-min demo tomorrow?'"
    }
  };

  const checkObjections = (text) => {
    const matched = [];
    Object.keys(OBJECTION_TIPS).forEach(keyword => {
      if (text.includes(keyword)) {
        matched.push({
          id: Date.now() + Math.random(),
          keyword,
          ...OBJECTION_TIPS[keyword]
        });
      }
    });
    if (matched.length > 0) {
      setActiveObjections(prev => {
        const filtered = prev.filter(m => m.keyword !== matched[0].keyword);
        return [matched[0], ...filtered].slice(0, 3);
      });
    }
  };

  const toggleHud = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (hudActive) {
      recognition.stop();
      setHudActive(false);
    } else {
      setActiveObjections([]);
      setSpeechTranscript('');
      try {
        recognition.start();
        setHudActive(true);
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };

  useEffect(() => {
    fetchQueueData();

    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.toLowerCase();
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            checkObjections(transcript);
          } else {
            interimTranscript += transcript;
          }
        }
        setSpeechTranscript(finalTranscript || interimTranscript);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error', e);
      };

      setRecognition(rec);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognition && hudActive) {
        recognition.stop();
      }
    };
  }, [recognition, hudActive]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const key = e.key.toLowerCase();
      if (key === 'c') {
        e.preventDefault();
        const firstLeadItem = activeList.find(item => item.type === 'lead' || item.type === 'callback' || (item.type === 'task' && item.lead));
        if (firstLeadItem) {
          const lead = firstLeadItem.type === 'task' ? firstLeadItem.lead : firstLeadItem;
          navigate(`/leads/${lead.id}`);
        } else if (hotDeal) {
          navigate(`/leads/${hotDeal.id}`);
        }
      } else if (key === '1') {
        e.preventDefault();
        const firstTask = activeList.find(item => item.type === 'task' && !item.isCompleted);
        if (firstTask) {
          handleMarkComplete(firstTask.id);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSearch('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeList, hotDeal]);

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

      // Fetch active cadence tasks
      let activeCadenceList = [];
      try {
        const cadRes = await api.get('/cadences/active-tasks');
        activeCadenceList = cadRes.data || [];
      } catch (cadErr) {
        console.error('Failed to fetch cadence tasks:', cadErr);
      }
      setCadenceTasks(activeCadenceList);

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

  const handleCompleteCadenceStep = async (enrollmentId) => {
    try {
      await api.put(`/cadences/enrollments/${enrollmentId}/step`);
      fetchQueueData();
    } catch (e) {
      console.error('Failed to complete cadence step:', e);
      alert('Failed to complete cadence step.');
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

  const dueCadenceTasks = cadenceTasks.filter(ct => ct.isDue).map(ct => ({ ...ct, type: 'cadence' }));
  const upcomingCadenceTasks = cadenceTasks.filter(ct => !ct.isDue).map(ct => ({ ...ct, type: 'cadence' }));

  let activeList = [];
  if (activeTab === 'today') {
    activeList = [
      ...todayFollowUps.map(t=>({...t, type: 'task'})),
      ...callbackQueue.map(l=>({...l, type: 'callback'})),
      ...dueCadenceTasks
    ];
  } else if (activeTab === 'overdue') {
    activeList = overdueFollowUps.map(t=>({...t, type: 'task'}));
  } else if (activeTab === 'upcoming') {
    activeList = [
      ...upcomingFollowUps.map(t=>({...t, type: 'task'})),
      ...upcomingCadenceTasks
    ];
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
    const isCadence = item.type === 'cadence';

    if (isCadence) {
      const lead = item.lead;
      const title = `✨ Cadence: ${item.cadenceName} (Step ${item.stepNumber}/${item.totalSteps})`;
      const stepLabel = item.stepType; // CALL, WHATSAPP, EMAIL
      const description = item.template ? `Template: "${item.template}"` : `Follow up with lead via ${stepLabel}`;
      const tagColor = 'border-amber-500';

      return (
        <div 
          key={item.id} 
          className={`glass rounded-xl bg-white border-l-4 p-4 shadow-sm flex items-center justify-between gap-4 transition hover:bg-slate-50/50 ${tagColor}`}
        >
          <div className="space-y-1.5 flex-1 min-w-0" onClick={() => navigate(lead ? `/leads/${lead.id}` : '#')} className="cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800 truncate block max-w-sm">{title}</span>
              <span className="bg-amber-100 text-amber-800 border border-amber-250 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{stepLabel}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-semibold"><Star size={11} className="text-amber-500" /> {lead?.name}</span>
              {lead?.companyName && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lead.companyName}</span>}
              <span className="flex items-center gap-1"><Clock size={11} /> Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN') : 'Callback Requested'}</span>
              {lead?.score !== undefined && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${
                  lead.score >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                  lead.score <= 35 ? 'bg-red-50 text-red-700 border-red-250' :
                  'bg-amber-50 text-amber-700 border-amber-250'
                }`}>
                  ⚡ Score: {lead.score}
                </span>
              )}
            </div>
            {description && <p className="text-xs text-slate-400 line-clamp-1 italic">{description}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => handleCompleteCadenceStep(item.id)}
              className="rounded-lg p-1.5 border border-slate-100 text-emerald-600 hover:bg-emerald-50 transition active:scale-95 flex items-center gap-1 text-xs font-bold" 
              title="Complete Step and Move Next"
            >
              <CheckCircle size={16} />
              <span className="hidden sm:inline">Complete Step</span>
            </button>
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
    }

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
            {lead?.score !== undefined && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${
                lead.score >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                lead.score <= 35 ? 'bg-red-50 text-red-700 border-red-250' :
                'bg-amber-50 text-amber-700 border-amber-250'
              }`}>
                ⚡ Score: {lead.score}
              </span>
            )}
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
          { id: 'today', label: "Today's Work", count: todayFollowUps.length + callbackQueue.length + dueCadenceTasks.length },
          { id: 'overdue', label: "Overdue Dials", count: overdueFollowUps.length, color: 'text-red-650' },
          { id: 'upcoming', label: "Upcoming Dials", count: upcomingFollowUps.length + upcomingCadenceTasks.length },
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

          {/* Objection HUD */}
          <div className="glass rounded-xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hudActive ? 'bg-red-400' : 'bg-slate-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${hudActive ? 'bg-red-500' : 'bg-slate-500'}`}></span>
                </span>
                <span>Objection HUD Assist</span>
              </h3>
              <button
                onClick={toggleHud}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md transition ${
                  hudActive 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {hudActive ? 'Stop HUD' : 'Start HUD'}
              </button>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Enable your mic during calls to transcribe conversations. The HUD automatically detects client objections and suggests flashcards in real-time.
            </p>

            {hudActive && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-1.5">
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Live Transcription Transcript:</div>
                <p className="text-xs text-slate-650 italic line-clamp-2">
                  {speechTranscript || "Listening for speech (e.g. 'expensive', 'competitor', 'later', 'busy')..."}
                </p>
              </div>
            )}

            {activeObjections.length > 0 ? (
              <div className="space-y-3 pt-2">
                {activeObjections.map((obj) => (
                  <div 
                    key={obj.id} 
                    className="border border-red-100 bg-red-50/50 rounded-xl p-3.5 space-y-2 animate-fadeIn"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-red-800 uppercase tracking-wide">{obj.title}</span>
                      <button 
                        onClick={() => setActiveObjections(prev => prev.filter(x => x.id !== obj.id))}
                        className="text-[9px] font-bold text-red-500 hover:text-red-750 uppercase tracking-wider"
                      >
                        Dismiss
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {obj.advice}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              hudActive && (
                <div className="text-center text-xs text-slate-400 italic py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  No active objections detected.
                </div>
              )
            )}
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
                    Lead is in <strong>{hotDeal.stage}</strong> stage and has a score of <strong>{hotDeal.score || 50}</strong>. Recommended window to call is <strong>Now</strong>.
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

      {/* Hotkey Guide */}
      <div className="flex items-center gap-4 justify-between bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-550 shadow-sm">
        <span className="font-bold text-slate-700 flex items-center gap-1.5">⚡ Power-Dialer Keyboard Hotkeys:</span>
        <div className="flex items-center gap-4">
          <span><kbd className="px-2 py-1 rounded bg-white border border-slate-350 shadow-sm font-semibold mr-1">C</kbd> Call Next Lead</span>
          <span><kbd className="px-2 py-1 rounded bg-white border border-slate-350 shadow-sm font-semibold mr-1">1</kbd> Complete First Task</span>
          <span><kbd className="px-2 py-1 rounded bg-white border border-slate-350 shadow-sm font-semibold mr-1">Esc</kbd> Clear Search</span>
        </div>
      </div>
    </div>
  );
}
