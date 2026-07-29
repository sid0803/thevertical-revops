import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Contact,
  Flame,
  Briefcase,
  Kanban,
  Calendar,
  CheckSquare,
  BarChart3,
  Bot,
  Bell,
  Settings,
  Sparkles,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users, badge: 'Active' },
    { name: 'Companies', path: '/companies', icon: Building2 },
    { name: 'Contacts', path: '/contacts', icon: Contact },
    { name: 'Leads', path: '/leads', icon: Flame, badge: 'Hot' },
    { name: 'Deals', path: '/deals', icon: Briefcase },
    { name: 'Pipeline', path: '/pipeline', icon: Kanban },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Bot, isAI: true },
    { name: 'Notifications', path: '/notifications', icon: Bell, count: 3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 bg-[#090d16]/90 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between z-40 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Vertical <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">RevOps Platform</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 py-4 space-y-1 max-h-[calc(100vh-140px)] overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? item.isAI
                        ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/40 text-white font-semibold shadow-md shadow-purple-500/10'
                        : 'bg-white/10 text-white font-semibold border border-white/10 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${item.isAI ? 'text-purple-400' : ''}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {item.badge}
                  </span>
                )}
                {item.count && (
                  <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-rose-500 text-white">
                    {item.count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-white/10 bg-slate-900/50">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
              alt="User Avatar"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/40"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Alex Morgan'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'demo@verticalrevops.ai'}</p>
            </div>
          </div>
          <button onClick={logout} title="Logout" className="text-slate-400 hover:text-rose-400 p-1 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
