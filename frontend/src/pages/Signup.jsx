import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock, Mail, User, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    login(
      {
        id: 2,
        email: email || 'user@company.com',
        full_name: fullName || 'New RevOps Leader',
        role: 'ADMIN',
        company_name: company || 'Enterprise SaaS',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      },
      'demo_jwt_token_999'
    );
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md rounded-3xl glass-panel p-8 shadow-2xl relative z-10 border border-white/10">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Vertical <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">RevOps AI</span>
          </h1>
        </div>

        <h2 className="text-lg font-bold text-white text-center mb-1">Create workspace</h2>
        <p className="text-xs text-slate-400 text-center mb-6">Start your 14-day enterprise trial</p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 text-white text-xs outline-none"
                placeholder="Alex Morgan"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 text-white text-xs outline-none"
                placeholder="alex@company.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Company Name</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 text-white text-xs outline-none"
                placeholder="Acme Technologies"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 text-white text-xs outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
          >
            Create Platform Account
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 font-semibold hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
};
