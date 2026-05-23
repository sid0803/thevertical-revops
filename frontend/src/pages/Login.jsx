// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Server, ShieldCheck, UserCheck, CreditCard, Users, Briefcase } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
  };

  const handleQuickLogin = async (selectedEmail, selectedPassword) => {
    setError('');
    setLoading(true);
    const result = await login(selectedEmail, selectedPassword);
    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
  };

  const demoAccounts = [
    { name: 'Super Admin', email: 'admin@thevertical.ai', role: 'Super Admin', icon: ShieldCheck, color: 'border-red-500/30 text-red-400 bg-red-500/5' },
    { name: 'TL Arun', email: 'arun@thevertical.ai', role: 'Team Leader', icon: Users, color: 'border-amber-500/30 text-amber-400 bg-amber-500/5' },
    { name: 'Sales Ravi', email: 'ravi@thevertical.ai', role: 'Sales Exec', icon: Briefcase, color: 'border-sky-500/30 text-sky-400 bg-sky-500/5' },
    { name: 'Finance User', email: 'finance@thevertical.ai', role: 'Finance', icon: CreditCard, color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
    { name: 'AM User', email: 'am@thevertical.ai', role: 'Account Mgr', icon: UserCheck, color: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5' },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary-dark">
      {/* Decorative Blur Orbs */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-accent/20 blur-[100px]" />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />

      <div className="w-full max-w-5xl px-4 py-8 md:grid md:grid-cols-2 md:gap-8">
        
        {/* Left Side: Brand Panel */}
        <div className="mb-8 flex flex-col justify-center text-center md:mb-0 md:text-left">
          <div className="mb-6 flex items-center justify-center md:justify-start space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white shadow-lg shadow-accent/40 font-bold text-xl">
              V
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              TheVertical<span className="text-accent">.ai</span>
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Revenue Operating System
          </h1>
          <p className="mt-4 text-base text-slate-400 max-w-md mx-auto md:mx-0">
            Automating the Lead → Client → Billing → Onboarding lifecycle with precision attribution mapping and intelligence.
          </p>
          <div className="mt-8 hidden space-y-4 md:block">
            <div className="flex items-center space-x-3 text-slate-300 text-sm">
              <Server className="h-5 w-5 text-accent" />
              <span>Full Role-Based Access Control (RBAC)</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-300 text-sm">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <span>Automated Billing & GST Calculation</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-300 text-sm">
              <UserCheck className="h-5 w-5 text-accent" />
              <span>Split-Mapping Hand-offs & Expansion Tracking</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="glass-dark rounded-2xl p-8 shadow-2xl relative">
          <h2 className="text-2xl font-bold text-white text-center mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-sm text-center mb-6">Sign in to your RevOps dashboard</p>
          
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-3 pl-10 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-accent focus:bg-slate-900"
                  placeholder="name@thevertical.ai"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-3 pl-10 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-accent focus:bg-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent py-3 font-semibold text-white transition hover:bg-accent-dark disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Login Grid */}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 text-center">
              Quick Login Demo Profiles
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {demoAccounts.map((account) => {
                const IconComponent = account.icon;
                return (
                  <button
                    key={account.email}
                    onClick={() => handleQuickLogin(account.email, 'Password123@')}
                    disabled={loading}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition hover:scale-105 active:scale-95 ${account.color}`}
                  >
                    <IconComponent className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium block truncate max-w-full text-white">
                      {account.name}
                    </span>
                    <span className="text-[10px] opacity-80 block truncate max-w-full">
                      {account.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
