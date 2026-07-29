import React from 'react';
import { Sparkles, Zap, Search, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AIWorkspaceModal } from '../components/ai/AIWorkspaceModal';

export const AIWorkspace = () => {
  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Vertical AI Intelligence Hub <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">Active Studio</span>
          </h1>
          <p className="text-xs text-slate-400">Natural language search, intent scoring algorithms, automated proposals, and risk detection</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel glass-panel-hover p-6 rounded-3xl space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">NL Pipeline Query</h3>
          <p className="text-xs text-slate-400">Search leads and deals using natural English prompts.</p>
        </div>

        <div className="glass-panel glass-panel-hover p-6 rounded-3xl space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">AI Lead Scorer</h3>
          <p className="text-xs text-slate-400">Calculates Intent, Urgency, Budget, and Win Probability.</p>
        </div>

        <div className="glass-panel glass-panel-hover p-6 rounded-3xl space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">AI Proposal Suite</h3>
          <p className="text-xs text-slate-400">Generate executive proposals and cold emails instantly.</p>
        </div>

        <div className="glass-panel glass-panel-hover p-6 rounded-3xl space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Deal Churn Risk Scanner</h3>
          <p className="text-xs text-slate-400">Flag stalled deals and recommend next best sales actions.</p>
        </div>
      </div>

      <AIWorkspaceModal isOpen={true} onClose={() => {}} />
    </div>
  );
};
