// frontend/src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Receipt,
  FileText,
  GitBranch,
  Target,
  BarChart3,
  Settings,
  LogOut,
  User,
  Zap
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const links = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC', 'ACCOUNT_MANAGER', 'FINANCE'] },
    { name: 'Leads', to: '/leads', icon: Users, roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
    { name: 'Clients', to: '/clients', icon: Building2, roles: ['SUPER_ADMIN', 'MANAGER', 'ACCOUNT_MANAGER'] },
    { name: 'Billing', to: '/billing', icon: Receipt, roles: ['SUPER_ADMIN', 'MANAGER', 'FINANCE'] },
    { name: 'Proposals', to: '/proposals', icon: FileText, roles: ['SUPER_ADMIN', 'MANAGER', 'FINANCE', 'SALES_EXEC'] },
    { name: 'Split Mapping', to: '/split-mapping', icon: GitBranch, roles: ['SUPER_ADMIN', 'MANAGER', 'ACCOUNT_MANAGER', 'SALES_EXEC'] },
    { name: 'Targets', to: '/targets', icon: Target, roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] },
    { name: 'Reports', to: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER'] },
    { name: 'Settings', to: '/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
  ];

  const filteredLinks = links.filter((link) => link.roles.includes(user.role));

  const roleLabels = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-500/10 text-red-400 border border-red-500/20' },
    MANAGER: { label: 'Manager', color: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
    TEAM_LEADER: { label: 'Team Leader', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    SALES_EXEC: { label: 'Sales Rep', color: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' },
    ACCOUNT_MANAGER: { label: 'AM User', color: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
    FINANCE: { label: 'Finance', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  };

  const userRoleInfo = roleLabels[user.role] || { label: user.role, color: 'bg-slate-500/10 text-slate-400' };

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-slate-800 bg-primary-dark text-slate-300">
      {/* Brand Header */}
      <div className="flex h-14 items-center border-b border-slate-800 px-5 space-x-2">
        <Zap className="h-5 w-5 text-accent-blue fill-accent-blue" />
        <span className="text-md font-bold text-white tracking-wide">
          The Vertical <span className="text-accent-cyan">AI</span>
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-5 overflow-y-auto">
        {filteredLinks.map((link) => {
          const IconComponent = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 rounded px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-accent-blue text-white border-l-4 border-white'
                    : 'hover:bg-accent-blue/10 hover:text-white'
                }`
              }
            >
              <IconComponent className="h-4.5 w-4.5" />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info / Logout */}
      <div className="border-t border-slate-850 p-4 bg-primary-mid">
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-xs font-semibold text-white truncate">{user.name}</h4>
            <span className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider leading-none ${userRoleInfo.color}`}>
              {userRoleInfo.label}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center space-x-3 rounded px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
