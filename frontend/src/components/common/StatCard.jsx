import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({ title, value, change, isPositive, icon: Icon, badge, subtext }) => {
  return (
    <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
      {/* Background Accent Glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-2xl font-bold tracking-tight text-white">{value}</h3>
        {change && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{change}</span>
          </div>
        )}
      </div>

      {subtext && <p className="text-[11px] text-slate-400">{subtext}</p>}
      {badge && (
        <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
          {badge}
        </span>
      )}
    </div>
  );
};
