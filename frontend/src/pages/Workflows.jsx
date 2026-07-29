import React, { useState } from 'react';
import { Zap, Play, CheckCircle2, Plus, ArrowRight, ShieldCheck, MessageSquare, Mail, UserCheck } from 'lucide-react';

export const Workflows = () => {
  const [workflows] = useState([
    {
      id: 1,
      name: 'Qualified Lead Auto-Assignment & Outreach',
      trigger: 'Lead Status becomes QUALIFIED',
      actions: [
        'Assign Senior SDR (Alex Morgan)',
        'Create Task "Schedule Discovery Demo" (Due in 24 hours)',
        'Generate Personalized AI Outreach Email',
        'Dispatch Slack Alert to #revops-deals'
      ],
      is_active: true,
      total_runs: 142
    },
    {
      id: 2,
      name: 'Stalled Deal Risk Mitigation',
      trigger: 'Deal Stage in PROPOSAL > 14 Days',
      actions: [
        'Flag Deal Health Risk ("Proposal Stalled")',
        'Create Executive Re-engagement Task',
        'Notify RevOps VP via Email'
      ],
      is_active: true,
      total_runs: 28
    },
    {
      id: 3,
      name: 'Deal Won Customer Provisioning',
      trigger: 'Deal Stage becomes WON',
      actions: [
        'Convert Lead to Active Customer Account',
        'Generate Executive Onboarding Proposal',
        'Send Welcome Email with Portal Access',
        'Create 60-Day SLA Onboarding Ticket'
      ],
      is_active: true,
      total_runs: 24
    }
  ]);

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            RevOps Workflow Automation Engine <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">{workflows.length} Active Rules</span>
          </h1>
          <p className="text-xs text-slate-400">Automate lead assignments, deal risk mitigation, and Slack notifications</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all">
          <Plus className="w-4 h-4" /> Create Workflow Rule
        </button>
      </div>

      <div className="space-y-4">
        {workflows.map((wf) => (
          <div key={wf.id} className="glass-panel glass-panel-hover p-6 rounded-3xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{wf.name}</h3>
                  <p className="text-xs text-purple-300 font-semibold flex items-center gap-1">
                    <Play className="w-3 h-3 text-purple-400" /> Trigger: {wf.trigger}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium">{wf.total_runs} Executions</span>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              </div>
            </div>

            {/* Workflow Steps Visual Chain */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Automated Action Sequence</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {wf.actions.map((act, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="truncate">{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
