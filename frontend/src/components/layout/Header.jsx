import React, { useState } from 'react';
import { Search, Sparkles, Bell, Plus, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const Header = ({ onOpenAISearch, onOpenNewDeal }) => {
  const { isDark, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  const mockNotifications = [
    { id: 1, title: '🎉 Deal Closed Won!', time: '10m ago', text: 'Figma expanded contract by $64,000 ARR.' },
    { id: 2, title: '🔥 High Intent Lead Alert', time: '1h ago', text: 'Stripe lead scored 92/100 by AI Engine.' },
    { id: 3, title: '⏰ Upcoming Meeting', time: '3h ago', text: 'Stripe MSA Review starts in 3 hours.' },
  ];

  return (
    <header className="h-16 px-8 bg-[#090d16]/70 backdrop-blur-md border-b border-white/10 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input Bar */}
      <div className="flex items-center gap-3 w-96">
        <button
          onClick={onOpenAISearch}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 text-slate-400 hover:text-slate-200 transition-all text-xs group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <span>Ask AI: "Show enterprise deals &gt; $50k"...</span>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-white/10 rounded text-slate-300">⌘K</span>
        </button>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Add Button */}
        <button
          onClick={onOpenNewDeal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Deal</span>
        </button>

        {/* AI Assistant Quick Modal */}
        <button
          onClick={onOpenAISearch}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>AI Insights</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-panel p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h3>
                <span className="text-[10px] text-purple-400 font-semibold cursor-pointer">Mark all as read</span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {mockNotifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-300">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
