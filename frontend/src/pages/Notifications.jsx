import React, { useState } from 'react';
import { Bell, Check, Sparkles, Calendar, DollarSign, UserCheck } from 'lucide-react';
import { mockData } from '../services/api';

export const Notifications = () => {
  const [notifications, setNotifications] = useState(mockData.notifications);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            System Notifications & Alerts
          </h1>
          <p className="text-xs text-slate-400">Real-time alerts for closed deals, meeting reminders, and AI lead scoring updates</p>
        </div>

        <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-all">
          <Check className="w-4 h-4 text-emerald-400" /> Mark All as Read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className={`glass-panel p-5 rounded-2xl flex items-center justify-between transition-all ${n.is_read ? 'opacity-60' : 'border-purple-500/30'}`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {n.title}
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">{n.message}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
              {n.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
