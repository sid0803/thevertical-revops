import React, { useState } from 'react';
import { Briefcase, Kanban, Table, Plus, DollarSign, Filter, Search } from 'lucide-react';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { mockData } from '../services/api';

export const Deals = () => {
  const [viewMode, setViewMode] = useState('kanban'); // kanban, table
  const [deals, setDeals] = useState(mockData.deals);
  const [search, setSearch] = useState('');

  const totalPipeline = deals.reduce((sum, d) => sum + (d.value || 0), 0);

  const handleStageChange = (dealId, newStage) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
  };

  const filteredDeals = deals.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.company_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Revenue Deals Pipeline <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">${totalPipeline.toLocaleString()} ARR</span>
          </h1>
          <p className="text-xs text-slate-400">Drag and drop deal stages, win probabilities, and value distribution</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'kanban' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all">
            <Plus className="w-4 h-4" /> New Deal
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals by title or company..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Main View */}
      {viewMode === 'kanban' ? (
        <KanbanBoard initialDeals={filteredDeals} onStageChange={handleStageChange} />
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden p-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="p-3 font-semibold">Deal Title</th>
                <th className="p-3 font-semibold">Company</th>
                <th className="p-3 font-semibold">Stage</th>
                <th className="p-3 font-semibold">Deal Value</th>
                <th className="p-3 font-semibold">Win Prob.</th>
                <th className="p-3 font-semibold">Health Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDeals.map((d) => (
                <tr key={d.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-bold text-white">{d.title}</td>
                  <td className="p-3 text-purple-300">{d.company_name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-slate-300">
                      {d.stage}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-emerald-400">${(d.value || 0).toLocaleString()}</td>
                  <td className="p-3 text-slate-300">{d.win_probability}%</td>
                  <td className="p-3 font-semibold text-purple-400">{d.health_score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
