import React, { useState } from 'react';
import { Building2, Globe, MapPin, DollarSign, Users, Plus } from 'lucide-react';
import { mockData } from '../services/api';

export const Companies = () => {
  const [companies] = useState(mockData.companies);

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Target Accounts & Companies <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">{companies.length} Registered</span>
          </h1>
          <p className="text-xs text-slate-400">Enterprise accounts, employee size, annual revenue, and geographic distribution</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all">
          <Plus className="w-4 h-4" /> Add Company Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((comp) => (
          <div key={comp.id} className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400">
                  {comp.name[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{comp.name}</h3>
                  <span className="text-xs text-purple-400 font-medium flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {comp.domain}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300 font-semibold">
                {comp.industry}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Employees</span>
                <span className="font-bold text-white">{comp.size}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Annual Rev.</span>
                <span className="font-bold text-emerald-400">${(comp.annual_revenue / 1000000).toFixed(1)}M</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Location</span>
                <span className="font-medium text-slate-300 truncate block">{comp.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
