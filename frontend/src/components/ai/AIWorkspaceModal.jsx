import React, { useState } from 'react';
import { Sparkles, Search, Bot, Zap, Mail, FileText, X, Check, ArrowRight } from 'lucide-react';
import { api, mockData } from '../../services/api';

export const AIWorkspaceModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('nl_search'); // nl_search, scorer, generator
  const [nlQuery, setNlQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Scorer state
  const [companyName, setCompanyName] = useState('Stripe Financial');
  const [dealSize, setDealSize] = useState(120000);
  const [scoreResults, setScoreResults] = useState(null);

  // Generator state
  const [genType, setGenType] = useState('email');
  const [genRecipient, setGenRecipient] = useState('Marcus Vance');
  const [genCompany, setGenCompany] = useState('Stripe Financial');
  const [genContent, setGenContent] = useState('');

  if (!isOpen) return null;

  const handleNLSearch = async (e) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.post('/ai/search', { query: nlQuery });
      setSearchResults(res.data);
    } catch (err) {
      // Mock fallback
      setSearchResults({
        query: nlQuery,
        interpretation: `Filtered revenue objects matching '${nlQuery}'`,
        matched_deals_count: 2,
        deals: mockData.deals.slice(0, 2),
        leads: mockData.leads.slice(0, 1),
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCalculateScore = async () => {
    try {
      const res = await api.post('/ai/score', {
        company_name: companyName,
        deal_size: parseFloat(dealSize),
        engagement_clicks: 14,
        emails_opened: 6,
        decision_maker_present: true,
      });
      setScoreResults(res.data);
    } catch (err) {
      setScoreResults({
        overall_score: 92,
        intent_score: 95,
        urgency_score: 88,
        budget_score: 94,
        engagement_score: 90,
        win_probability: 85,
        recommendations: [
          '🔥 High Urgency: Schedule solution demo within 24 hours.',
          '💰 High Budget Fit: Send Enterprise custom proposal with SLA add-ons.',
        ],
        ai_summary: `High-intent opportunity with ${companyName}. Deal size of $${dealSize.toLocaleString()} aligns with top tier enterprise segment.`,
      });
    }
  };

  const handleGenerateContent = async () => {
    if (genType === 'email') {
      setGenContent(`Subject: Streamlining RevOps efficiency for ${genCompany}

Hi ${genRecipient},

I noticed ${genCompany} is expanding its sales team and wanted to connect. With Vertical RevOps AI, revenue operations teams automate lead scoring, pipeline risk detection, and contract workflows in one unified platform—typically accelerating deal velocity by 32%.

Would you be open to a 15-minute introductory call next Tuesday?

Best,
Alex Morgan | Vertical RevOps AI`);
    } else {
      setGenContent(`# EXECUTIVE PROPOSAL & SOLUTION ARCHITECTURE
Prepared for: ${genRecipient} (${genCompany})
Investment Summary: $${parseFloat(dealSize).toLocaleString()} ARR

## 1. Executive Summary
${genCompany} is modernizing its revenue stack to eliminate deal friction, automate multi-stage pipelines, and achieve 95%+ forecast precision.

## 2. Included Capabilities
  • AI Opportunity Lead Scorer
  • Real-time Deal Health & Churn Risk Engine
  • Drag-and-Drop Pipeline Automation
  • Executive Revenue Analytics Dashboard

## 3. SLA & Support
  • 99.99% Uptime Guarantee
  • 24/7 Enterprise Dedicated Engineer
`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl glass-panel border border-white/10 p-6 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Vertical AI Engine <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">v2.4 Active</span>
              </h2>
              <p className="text-xs text-slate-400">Natural language search, lead scoring, and automated content generation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('nl_search')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'nl_search' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>NL Search</span>
          </button>
          <button
            onClick={() => setActiveTab('scorer')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'scorer' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>AI Lead Scorer</span>
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'generator' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>AI Content Suite</span>
          </button>
        </div>

        {/* Tab 1: Natural Language Search */}
        {activeTab === 'nl_search' && (
          <div className="space-y-4">
            <form onSubmit={handleNLSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={nlQuery}
                  onChange={(e) => setNlQuery(e.target.value)}
                  placeholder="e.g. Show enterprise deals > $50k stuck in negotiation stage..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 text-white text-xs placeholder:text-slate-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-2"
              >
                {isSearching ? 'Searching...' : 'Run Query'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {searchResults && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 animate-in fade-in">
                <p className="text-xs text-purple-300 font-semibold">{searchResults.interpretation}</p>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {searchResults.deals?.map((d) => (
                    <div key={d.id} className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white">{d.title}</h4>
                        <p className="text-[10px] text-slate-400">{d.company_name} • Stage: {d.stage}</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">${d.value?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Lead Scorer */}
        {activeTab === 'scorer' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Deal Value ($)</label>
                <input
                  type="number"
                  value={dealSize}
                  onChange={(e) => setDealSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              onClick={handleCalculateScore}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-500/20"
            >
              Calculate AI Fit & Intent Scores
            </button>

            {scoreResults && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4 animate-in fade-in">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <span className="text-[10px] text-slate-400 block">Overall Score</span>
                    <span className="text-lg font-bold text-purple-400">{scoreResults.overall_score}/100</span>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <span className="text-[10px] text-slate-400 block">Intent</span>
                    <span className="text-lg font-bold text-blue-400">{scoreResults.intent_score}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] text-slate-400 block">Budget Fit</span>
                    <span className="text-lg font-bold text-amber-400">{scoreResults.budget_score}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] text-slate-400 block">Win Prob.</span>
                    <span className="text-lg font-bold text-emerald-400">{scoreResults.win_probability}%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Strategic Guidance</h4>
                  {scoreResults.recommendations.map((rec, i) => (
                    <p key={i} className="text-xs text-slate-300">{rec}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Content Generator */}
        {activeTab === 'generator' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Content Type</label>
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs outline-none"
                >
                  <option value="email">Cold Outbound Email</option>
                  <option value="proposal">Executive Proposal</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={genRecipient}
                  onChange={(e) => setGenRecipient(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Company Name</label>
                <input
                  type="text"
                  value={genCompany}
                  onChange={(e) => setGenCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateContent}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-500/20"
            >
              Generate AI Content
            </button>

            {genContent && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 relative">
                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">{genContent}</pre>
                <button
                  onClick={() => navigator.clipboard.writeText(genContent)}
                  className="absolute top-3 right-3 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
