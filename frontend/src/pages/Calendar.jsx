import React from 'react';
import { Calendar as CalendarIcon, Clock, Video, Plus, CheckCircle2 } from 'lucide-react';

export const Calendar = () => {
  const meetings = [
    { id: 1, title: 'Stripe Final Contract & MSA Review', time: '10:00 AM - 11:00 AM', location: 'Google Meet', client: 'Marcus Vance (Stripe)', status: 'CONFIRMED' },
    { id: 2, title: 'Datadog AI Lead Scorer Architecture Review', time: '02:00 PM - 03:00 PM', location: 'Zoom Enterprise', client: 'Sarah Lin (Datadog)', status: 'UPCOMING' },
    { id: 3, title: 'Snowflake Global Pipeline Expansion Call', time: '04:30 PM - 05:15 PM', location: 'Google Meet', client: 'Rachel Stern (Snowflake)', status: 'UPCOMING' },
  ];

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            RevOps Meeting Calendar
          </h1>
          <p className="text-xs text-slate-400">Scheduled executive demos, contract reviews, and automated meeting notes</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all">
          <Plus className="w-4 h-4" /> Schedule Executive Meeting
        </button>
      </div>

      <div className="space-y-4">
        {meetings.map((m) => (
          <div key={m.id} className="glass-panel glass-panel-hover p-6 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{m.title}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-purple-400" /> {m.time}</span>
                  <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5 text-blue-400" /> {m.location}</span>
                  <span className="text-purple-300 font-semibold">{m.client}</span>
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {m.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
