import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, ArrowRight, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { api } from '../../services/api';

export const SalesCopilotDrawer = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello Alex! I am your AI Sales Copilot. Ask me anything about your revenue pipeline, lead priority, or deal health.',
      type: 'GREETING'
    }
  ]);

  if (!isOpen) return null;

  const promptPills = [
    { label: '📞 Which leads should I call today?', query: 'Which leads should I call today?' },
    { label: '⚠️ Show deals stuck > 30 days', query: 'Show deals stuck in negotiation > 30 days' },
    { label: '📄 Generate proposal for Stripe', query: 'Generate custom proposal for Stripe Financial' },
    { label: '📝 Summarize Datadog meeting notes', query: 'Summarize meeting notes for Datadog' }
  ];

  const handleSend = async (queryText) => {
    const textToSend = queryText || prompt;
    if (!textToSend.trim()) return;

    const userMsg = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await api.post('/ai/copilot', { prompt: textToSend });
      const aiData = res.data;
      
      const assistantMsg = {
        role: 'assistant',
        content: aiData.answer,
        type: aiData.type,
        items: aiData.items || [],
        suggested_action: aiData.suggested_action,
        proposal: aiData.proposal_preview,
        summary: aiData.summary
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      // Mock fallback
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `AI Copilot insights for '${textToSend}': Scanned active pipeline. Stripe Financial ($120k ARR) is ready for executive closing.`,
          type: 'GENERAL',
          suggested_action: 'Dispatch revised MSA via DocuSign.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-full glass-panel border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                Sales Copilot <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">Gemini LLM Active</span>
              </h2>
              <p className="text-[11px] text-slate-400">Contextual CRM assistant & deal automation engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 select-none">
          {promptPills.map((pill, i) => (
            <button
              key={i}
              onClick={() => handleSend(pill.query)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/40 text-[11px] font-semibold text-slate-300 hover:text-white whitespace-nowrap transition-all"
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-2 ${
                m.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-none'
              }`}>
                <p className="leading-relaxed">{m.content}</p>

                {/* Structured Lead Items */}
                {m.items && m.items.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    {m.items.map((item, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{item.title || item.company}</span>
                          <span className="font-extrabold text-emerald-400">{item.score ? `${item.score}/100` : `$${item.value?.toLocaleString()}`}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{item.reason || item.risk}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Action Pill */}
                {m.suggested_action && (
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-2 text-purple-300 text-[11px] font-semibold mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Action: {m.suggested_action}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 items-center text-xs text-purple-400 font-semibold p-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Copilot analyzing pipeline...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Copilot: 'Which leads should I call?'..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 text-white text-xs placeholder:text-slate-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
