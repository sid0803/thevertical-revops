// frontend/src/pages/Notifications.jsx
import React, { useState } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'FinEdge Capital — proposal follow-up due now', type: 'warning', time: '2h ago' },
    { id: 2, text: 'SwiftLogix deal successfully moved to Negotiation stage', type: 'success', time: '3h ago' },
    { id: 3, text: 'Invoice INV-2026-003 is overdue by 5 days', type: 'danger', time: '5h ago' },
    { id: 4, text: 'New lead "Arun Private Lead" assigned to your account', type: 'info', time: '1d ago' },
    { id: 5, text: 'Handoff SLA meeting window started for TechWave Labs', type: 'warning', time: '2d ago' },
  ]);

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={18} className="text-amber-500" />;
      case 'danger': return <AlertTriangle size={18} className="text-red-500" />;
      case 'success': return <CheckCircle size={18} className="text-emerald-500" />;
      default: return <Info size={18} className="text-accent-blue" />;
    }
  };

  const handleMarkAllRead = () => {
    setNotifications([]);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Notifications</h1>
          <p className="text-sm text-slate-500">Stay updated on lead conversions, task due dates, and billing collections</p>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="text-xs text-accent-blue font-bold uppercase hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="glass rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-650">
          Recent alerts logs
        </div>

        <div className="divide-y divide-slate-100">
          {notifications.length > 0 ? (
            notifications.map(notif => (
              <div key={notif.id} className="p-5 flex gap-4 items-start hover:bg-slate-50/30 transition cursor-pointer">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-slate-800 font-semibold">{notif.text}</div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                    <Clock size={11} />
                    <span>{notif.time}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Bell size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold">No pending alerts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
