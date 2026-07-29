import React, { useState } from 'react';
import { Building2, DollarSign, Activity, Sparkles, CheckCircle2, Calendar, Mail, FileText, ArrowUpRight, ShieldCheck } from 'lucide-react';

export const Customer360 = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const customer = {
    name: 'Stripe Financial',
    domain: 'stripe.com',
    industry: 'FinTech & Payments',
    size: '500-2000',
    location: 'San Francisco, CA',
    status: 'ACTIVE',
    mrr: 45000.0,
    arr: 540000.0,
    health_score: 94,
    contract_start: 'Jan 15, 2026',
    contract_end: 'Jan 15, 2027',
    ai_summary: 'Stripe Financial is a tier-1 active customer generating $540,000 ARR with 94% platform adoption velocity across 14 RevOps teams.',
    ai_recommended_action: 'Propose multi-year enterprise renewal with 15% volume expansion discount in Q4.'
  };

  const timeline = [
    { type: 'EMAIL', title: 'Legal Counsel Approved Section 4.2 MSA Uptime SLA', date: 'Today at 10:15 AM', author: 'Marcus Vance' },
    { type: 'MEETING', title: 'Executive MSA & SLA Contract Alignment Review', date: 'Yesterday at 2:00 PM', author: 'Alex Morgan' },
    { type: 'DEAL', title: 'Enterprise RevOps Platform Expansion ($120k ARR)', date: '3 days ago', author: 'Pipeline System' },
    { type: 'NOTE', title: 'VP RevOps confirmed Q4 seat expansion sign-off', date: 'Jul 24, 2026', author: 'Alex Morgan' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in">
      {/* Customer 360 Header */}
      <div className="glass-panel p-6 rounded-3xl space-y-6 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-blue-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-purple-500/25">
              SF
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-white">{customer.name}</h1>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {customer.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-3">
                <span className="text-purple-300 font-semibold">{customer.domain}</span>
                <span>• {customer.industry}</span>
                <span>• {customer.location}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Annual Recurring Rev</span>
              <span className="text-2xl font-extrabold text-emerald-400">${customer.arr.toLocaleString()}</span>
            </div>
            <div className="text-right border-l border-white/10 pl-6">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Health Score</span>
              <span className="text-2xl font-extrabold text-purple-300">{customer.health_score}%</span>
            </div>
          </div>
        </div>

        {/* AI Executive Account Summary Banner */}
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Executive Account Summary & Guidance</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">{customer.ai_summary}</p>
          <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Recommended Action: {customer.ai_recommended_action}</span>
          </div>
        </div>
      </div>

      {/* Grid Layout: Financial Details & AI Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Details & Financials */}
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Financial Overview</h2>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-slate-400">Monthly Recurring (MRR)</span>
              <span className="font-bold text-white">${customer.mrr.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-slate-400">Contract Start Date</span>
              <span className="font-semibold text-slate-200">{customer.contract_start}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-slate-400">Contract Renewal Date</span>
              <span className="font-semibold text-slate-200">{customer.contract_end}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-slate-400">Assigned Account Exec</span>
              <span className="font-bold text-purple-300">Alex Morgan</span>
            </div>
          </div>
        </div>

        {/* AI Activity Timeline */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Unified Activity Timeline</h2>
            <span className="text-xs font-semibold text-purple-400">AI Synced</span>
          </div>

          <div className="space-y-4">
            {timeline.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4 hover:border-purple-500/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                  {item.type === 'EMAIL' && <Mail className="w-4 h-4" />}
                  {item.type === 'MEETING' && <Calendar className="w-4 h-4" />}
                  {item.type === 'DEAL' && <DollarSign className="w-4 h-4" />}
                  {item.type === 'NOTE' && <FileText className="w-4 h-4" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-white">{item.title}</h3>
                    <span className="text-[10px] text-slate-400">{item.date}</span>
                  </div>
                  <p className="text-xs text-slate-400">Logged by {item.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
