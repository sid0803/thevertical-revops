import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Moon, Key, Save, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Settings = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [fullName, setFullName] = useState(user?.full_name || 'Alex Morgan');
  const [email, setEmail] = useState(user?.email || 'demo@verticalrevops.ai');
  const [company, setCompany] = useState(user?.company_name || 'Vertical RevOps AI');
  const [apiKey, setApiKey] = useState('sk_live_vertical_ai_987654321_prod');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1200px] mx-auto animate-in fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          Platform Settings & Profile
        </h1>
        <p className="text-xs text-slate-400">Manage user identity, API integrations, theme preferences, and security credentials</p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold animate-in fade-in">
          ✅ Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-purple-400" /> User Profile Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Organization / Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Theme Preferences */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Moon className="w-4 h-4 text-amber-400" /> Appearance & Glassmorphism Theme
          </h2>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <span className="text-xs font-bold text-white block">Linear Dark Mode</span>
              <span className="text-[11px] text-slate-400">High-contrast dark mode with glowing glass cards</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-purple-600' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* API Credentials */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-400" /> AI Engine API Credentials
          </h2>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Production API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Profile & Settings
        </button>
      </form>
    </div>
  );
};
