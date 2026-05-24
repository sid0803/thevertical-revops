// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Server, ShieldCheck, UserCheck, CreditCard, Users, Briefcase, Zap, ShieldAlert } from 'lucide-react';

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
    { name: 'Super Admin', email: 'admin@thevertical.ai', role: 'Admin', icon: ShieldCheck, color: 'border-red-500/20 text-red-400 bg-red-500/5' },
    { name: 'Arun Kumar', email: 'arun@thevertical.ai', role: 'Team Lead', icon: Users, color: 'border-amber-500/20 text-amber-400 bg-amber-500/5' },
    { name: 'Ravi Sharma', email: 'ravi@thevertical.ai', role: 'Sales Exec', icon: Briefcase, color: 'border-blue-500/20 text-blue-400 bg-blue-500/5' },
    { name: 'Deepa Nair', email: 'am@thevertical.ai', role: 'Account AM', icon: UserCheck, color: 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5' },
    { name: 'Finance User', email: 'finance@thevertical.ai', role: 'Finance', icon: CreditCard, color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' },
    { name: 'Raj Manager', email: 'manager@thevertical.ai', role: 'Manager', icon: ShieldAlert, color: 'border-purple-500/20 text-purple-400 bg-purple-500/5' },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary-dark font-sans">
      {/* Decorative Blur Orbs */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-accent-blue/20 blur-[120px]" />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-accent-cyan/10 blur-[120px]" />

      <div className="w-full max-w-5xl px-4 py-8 md:grid md:grid-cols-2 md:gap-12 items-center">
        
        {/* Left Side: Brand Panel */}
        <div className="mb-10 flex flex-col justify-center text-center md:mb-0 md:text-left">
          <div className="mb-6 flex items-center justify-center md:justify-start space-x-2">
            <Zap className="h-8 w-8 text-accent-blue fill-accent-blue" />
            <span className="text-2xl font-bold tracking-wider text-white uppercase">
              The Vertical <span className="text-accent-cyan">AI</span>
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-none">
            Revenue Operating System
          </h1>
          <p className="mt-4 text-sm text-slate-400 max-w-sm mx-auto md:mx-0">
            Automating the Lead → Client → Billing → Onboarding lifecycle with precision attribution mapping and AI revenue intelligence.
          </p>
          <div className="mt-8 hidden space-y-4 md:block">
            <div className="flex items-center space-x-3 text-slate-300 text-xs uppercase tracking-wider font-semibold">
              <Server className="h-4.5 w-4.5 text-accent-cyan" />
              <span>Full Role-Based Access Control (RBAC)</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-300 text-xs uppercase tracking-wider font-semibold">
              <ShieldCheck className="h-4.5 w-4.5 text-accent-cyan" />
              <span>Automated Billing & Slabs Booking</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-300 text-xs uppercase tracking-wider font-semibold">
              <UserCheck className="h-4.5 w-4.5 text-accent-cyan" />
              <span>Split-Mapping Hand-offs & Target Trackers</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="bg-white rounded-xl p-8 shadow-2xl relative border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 text-center mb-1">Welcome Back</h2>
          <p className="text-slate-500 text-xs text-center mb-6">Sign in to your RevOps dashboard</p>
          
          {error && (
            <div className="mb-4 rounded bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-accent-blue focus:bg-white"
                  placeholder="name@thevertical.ai"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-accent-blue focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-accent-blue py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-500/10 active:scale-98"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Login Grid */}
          <div className="mt-8 border-t border-slate-100 pt-5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
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
                    className={`flex flex-col items-center justify-center p-2 rounded border text-center transition hover:scale-103 active:scale-97 ${account.color}`}
                  >
                    <IconComponent className="h-4 w-4 mb-0.5" />
                    <span className="text-[10px] font-bold block truncate max-w-full text-slate-800">
                      {account.name.split(' ')[0]}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider block opacity-75 font-semibold">
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
