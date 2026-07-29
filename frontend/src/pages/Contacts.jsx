import React, { useState } from 'react';
import { Contact, Mail, Phone, Building2, Plus } from 'lucide-react';
import { mockData } from '../services/api';

export const Contacts = () => {
  const [contacts] = useState(mockData.contacts);

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Key Decision Makers & Contacts <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">{contacts.length} Executives</span>
          </h1>
          <p className="text-xs text-slate-400">Executive directory, title mappings, phone numbers, and enterprise affiliations</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all">
          <Plus className="w-4 h-4" /> Add Executive Contact
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contacts.map((cont) => (
          <div key={cont.id} className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                {cont.first_name[0]}{cont.last_name[0]}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{cont.first_name} {cont.last_name}</h3>
                <p className="text-xs font-medium text-purple-300">{cont.title}</p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{cont.company_name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{cont.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{cont.phone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
