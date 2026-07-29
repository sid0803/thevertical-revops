import React, { useState } from 'react';
import { Mail, Sparkles, Send, CheckCircle2, Building2, User, RefreshCw } from 'lucide-react';

export const EmailInbox = () => {
  const [emails] = useState([
    {
      id: 1,
      sender_name: "Marcus Vance",
      sender_email: "marcus.vance@stripe.com",
      company_name: "Stripe Financial",
      subject: "Re: Section 4.2 Legal Review & MSA Approval",
      snippet: "Our legal counsel approved the 99.99% uptime SLA language. Please send the final executable contract for signing...",
      timestamp: "10:15 AM",
      unread: true,
      ai_summary: "Customer legal approved MSA terms. Ready for contract e-signature.",
      ai_recommended_action: "Send final contract for electronic signature.",
      ai_suggested_reply: "Hi Marcus,\n\nFantastic news! I am sending the final executable MSA via DocuSign right now.\n\nBest,\nAlex Morgan"
    },
    {
      id: 2,
      sender_name: "Sarah Lin",
      sender_email: "sarah.lin@datadoghq.com",
      company_name: "Datadog Cloud",
      subject: "Datadog AI Lead Scorer Technical Evaluation",
      snippet: "We reviewed the AI scoring documentation. Can we schedule a 30-minute architecture deep-dive next Tuesday?",
      timestamp: "Yesterday",
      unread: false,
      ai_summary: "Prospect requested technical architecture deep-dive call next Tuesday.",
      ai_recommended_action: "Schedule 30-min Zoom call for Tuesday 2 PM.",
      ai_suggested_reply: "Hi Sarah,\n\nWe would be delighted to host the architecture review. Does Tuesday at 2:00 PM EST work for your team?\n\nBest,\nAlex Morgan"
    }
  ]);

  const [selectedEmail, setSelectedEmail] = useState(emails[0]);
  const [replyText, setReplyText] = useState(emails[0].ai_suggested_reply);
  const [sentMessage, setSentMessage] = useState('');

  const handleSelectEmail = (e) => {
    setSelectedEmail(e);
    setReplyText(e.ai_suggested_reply);
    setSentMessage('');
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    setSentMessage('✅ Reply sent & logged to CRM Activity Timeline!');
    setTimeout(() => setSentMessage(''), 4000);
  };

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          AI Sales Email Inbox <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">CRM Synced</span>
        </h1>
        <p className="text-xs text-slate-400">Integrated email inbox with automated AI summaries, recommended actions, and one-click AI replies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[650px]">
        {/* Email List */}
        <div className="glass-panel p-4 rounded-3xl space-y-3 overflow-y-auto">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Inbox Messages</h2>
          {emails.map((e) => (
            <div
              key={e.id}
              onClick={() => handleSelectEmail(e)}
              className={`p-4 rounded-2xl cursor-pointer transition-all ${
                selectedEmail.id === e.id ? 'bg-purple-600/30 border border-purple-500/40' : 'bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{e.sender_name}</span>
                <span className="text-[10px] text-slate-400">{e.timestamp}</span>
              </div>
              <p className="text-xs font-semibold text-purple-300 mb-1">{e.company_name}</p>
              <p className="text-xs text-slate-200 line-clamp-1">{e.subject}</p>
            </div>
          ))}
        </div>

        {/* Selected Email View */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-start pb-4 border-b border-white/10 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">{selectedEmail.subject}</h2>
                <p className="text-xs text-slate-400">
                  From: <span className="text-white font-semibold">{selectedEmail.sender_name}</span> ({selectedEmail.sender_email})
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-slate-300">
                {selectedEmail.company_name}
              </span>
            </div>

            {/* AI Summary Banner */}
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI Email Summary & Recommended Action</span>
              </div>
              <p className="text-xs text-slate-200">{selectedEmail.ai_summary}</p>
              <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Recommended Action: {selectedEmail.ai_recommended_action}
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
              "{selectedEmail.snippet}"
            </p>
          </div>

          {/* AI Reply Form */}
          <form onSubmit={handleSendReply} className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI-Generated One-Click Reply
              </span>
              {sentMessage && <span className="text-xs font-bold text-emerald-400">{sentMessage}</span>}
            </div>

            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-purple-500 font-mono"
            />

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Dispatch Reply & Log to CRM
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
