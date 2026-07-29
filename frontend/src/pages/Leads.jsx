import React, { useState } from 'react';
import { Flame, Sparkles, Zap, Plus, Building2, ArrowUpRight } from 'lucide-react';
import { mockData } from '../services/api';

export const Leads = ({ onOpenAISearch }) => {
  const [leads] = useState(mockData.leads);

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Inbound & Outbound Leads <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">{leads.length} Active Opportunities</span>
          </h1>
          <p className="text-xs text-slate-400">AI-scored lead pipeline, multi-dimensional intent scoring, and value estimation</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAISearch}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition-all"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Batch Lead Scorer</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {leads.map((lead) => (
          <div key={lead.id} className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/30 flex items-center justify-center font-black text-lg text-purple-300">
                  {lead.score}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-white">{lead.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {lead.status}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-300">
                      {lead.source}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{lead.company_name} • Contact: {lead.contact_name}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Deal Value</span>
                <span className="text-xl font-bold text-emerald-400">${lead.value.toLocaleString()}</span>
              </div>
            </div>

            {/* AI Multi-Score Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Intent Score</span>
                <span className="font-bold text-purple-400">{lead.intent_score}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Urgency Score</span>
                <span className="font-bold text-blue-400">{lead.urgency_score}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Budget Score</span>
                <span className="font-bold text-amber-400">{lead.budget_score}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Engagement</span>
                <span className="font-bold text-emerald-400">{lead.engagement_score}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
