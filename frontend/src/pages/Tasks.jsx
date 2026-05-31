// frontend/src/pages/Tasks.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, AlertTriangle, Calendar, Search, Trash2, CheckCircle } from 'lucide-react';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending'); // 'pending', 'completed', 'overdue'
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Fetch all leads accessible to the user
      const leadsRes = await api.get('/leads');
      const allLeads = leadsRes.data;

      // Query tasks for each lead to comply with BOLA check constraints
      const allTasks = [];
      for (const lead of allLeads) {
        try {
          const tRes = await api.get(`/tasks?leadId=${lead.id}`);
          if (tRes.data?.tasks) {
            allTasks.push(...tRes.data.tasks.map(t => ({
              ...t,
              leadName: lead.name,
              companyName: lead.companyName
            })));
          }
        } catch (e) {
          // Skip leads where access is denied to avoid interrupting list
        }
      }
      setTasks(allTasks);
    } catch (err) {
      console.error(err);
      setError('Failed to aggregate task listings.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/tasks/${id}/complete`);
      fetchTasks();
    } catch (err) {
      alert('Failed to mark task as completed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      alert('Failed to delete task.');
    }
  };

  const getFilteredTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    let list = [];

    if (filter === 'completed') {
      list = tasks.filter(t => t.isCompleted);
    } else if (filter === 'overdue') {
      list = tasks.filter(t => !t.isCompleted && t.isOverdue);
    } else {
      // pending
      list = tasks.filter(t => !t.isCompleted && !t.isOverdue);
    }

    if (search) {
      list = list.filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.companyName && t.companyName.toLowerCase().includes(search.toLowerCase())) ||
        (t.leadName && t.leadName.toLowerCase().includes(search.toLowerCase()))
      );
    }

    return list;
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Follow-up Tasks Checklist</h1>
          <p className="text-sm text-slate-500">Track and manage reminders, meetings, and call lists scheduled for leads</p>
        </div>
        <div className="relative w-full sm:w-60">
          <Search className="absolute inset-y-0 left-0 ml-3 h-4 w-4 my-auto text-slate-400" />
          <input 
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs outline-none focus:border-accent-blue focus:bg-white" 
            placeholder="Search task descriptions..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-250/80 gap-1.5">
        {[
          { id: 'pending', label: 'Pending Checklist', icon: Clock },
          { id: 'overdue', label: 'Overdue Dials', icon: AlertTriangle, color: 'text-red-650' },
          { id: 'completed', label: 'Completed Tasks', icon: CheckCircle2 }
        ].map(tab => {
          const Icon = tab.icon;
          const count = tab.id === 'completed' 
            ? tasks.filter(t => t.isCompleted).length
            : tab.id === 'overdue' 
            ? tasks.filter(t => !t.isCompleted && t.isOverdue).length
            : tasks.filter(t => !t.isCompleted && !t.isOverdue).length;

          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2 -mb-px ${
                filter === tab.id 
                  ? 'border-accent-blue text-accent-blue' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={14} className={tab.color} />
              <span className={tab.color}>{tab.label}</span>
              <span className={`text-[10px] rounded px-1.5 py-0.2 border ${
                filter === tab.id ? 'bg-blue-50 text-accent-blue border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-500">{error}</div>}

      {/* Checklist display */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass rounded-xl bg-white border border-slate-200 p-12 text-center text-slate-400">
          No tasks found matching current checklist selection.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`glass rounded-xl bg-white border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4 transition hover:bg-slate-50/50 ${
                task.isCompleted ? 'opacity-70' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold text-sm ${task.isCompleted ? 'line-through text-slate-450' : 'text-slate-800'}`}>
                    {task.title}
                  </h3>
                  {task.isOverdue && <span className="bg-red-50 text-red-700 border border-red-200 text-[8px] font-bold px-1.5 py-0.2 rounded">OVERDUE</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-semibold">{task.leadName}</span>
                  {task.companyName && <span className="text-[10px] text-slate-400 font-bold uppercase">{task.companyName}</span>}
                  <span className="flex items-center gap-1"><Calendar size={12} /> Due: {new Date(task.dueDate).toLocaleDateString('en-IN')}</span>
                </div>
                {task.description && <p className="text-xs text-slate-400 italic font-medium">{task.description}</p>}
              </div>

              <div className="flex items-center gap-2">
                {!task.isCompleted && (
                  <button 
                    onClick={() => handleComplete(task.id)}
                    className="rounded-lg p-1.5 border border-slate-100 text-emerald-600 hover:bg-emerald-50 transition active:scale-95" 
                    title="Mark Completed"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                {['SUPER_ADMIN', 'TEAM_LEADER'].includes(user.role) && (
                  <button 
                    onClick={() => handleDelete(task.id)}
                    className="rounded-lg p-1.5 border border-slate-100 text-red-650 hover:bg-red-50 transition active:scale-95"
                    title="Delete Reminder"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
