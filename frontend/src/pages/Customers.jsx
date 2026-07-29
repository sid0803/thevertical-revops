import React, { useState } from 'react';
import { Users, Search, Plus, Building2, DollarSign, Activity, CheckCircle, ShieldAlert } from 'lucide-react';
import { mockData } from '../services/api';

export const Customers = () => {
  const [customers] = useState(mockData.customers);
  const [search, setSearch] = useState('');

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Active Customers <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">{customers.length} Accounts</span>
          </h1>
          <p className="text-xs text-slate-400">Customer account status, health scores, and recurring ARR expansion metrics</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all">
          <Plus className="w-4 h-4" /> Add Customer Account
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter customers by company name..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> {c.company_name}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                c.status === 'EXPANDING' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              }`}>
                {c.status}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white">{c.name}</h3>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Monthly MRR</span>
                <span className="font-bold text-white">${c.mrr.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Annual ARR</span>
                <span className="font-bold text-emerald-400">${c.arr.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
              <span className="text-slate-400 text-[11px]">Health Score</span>
              <span className="font-extrabold text-purple-300">{c.health_score}% (Healthy)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
