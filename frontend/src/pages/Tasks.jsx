import React, { useState } from 'react';
import { CheckSquare, Plus, Clock, AlertCircle } from 'lucide-react';

export const Tasks = () => {
  const [tasks] = useState([
    { id: 1, title: 'Send Revised MSA to Stripe Legal Team', due: 'Tomorrow at 5 PM', priority: 'URGENT', deal: 'Stripe - Enterprise Platform License', status: 'PENDING' },
    { id: 2, title: 'Configure AI Lead Scoring Sandbox for Datadog', due: 'In 2 days', priority: 'HIGH', deal: 'Datadog - AI Sales Module', status: 'IN_PROGRESS' },
    { id: 3, title: 'Follow up with Rachel Stern regarding Snowflake Q4 budget', due: 'Friday at 10 AM', priority: 'MEDIUM', deal: 'Snowflake - Global RevOps OS', status: 'PENDING' },
  ]);

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Action Items & Tasks <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">{tasks.length} Pending</span>
          </h1>
          <p className="text-xs text-slate-400">Automated deal tasks, priority flags, and execution deadlines</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all">
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="glass-panel glass-panel-hover p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{task.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  <span className="text-purple-300 font-medium">{task.deal}</span> • Due: {task.due}
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
              task.priority === 'URGENT' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
