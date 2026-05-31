// frontend/src/pages/UserCreation.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Search, Edit2, X, CheckCircle, Shield, 
  UserCheck, User, Eye, EyeOff, Lock, Users as UsersIcon 
} from 'lucide-react';

const ROLE_CONFIG = {
  'SUPER_ADMIN': { label: 'Super Admin', color: '#6366f1', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', icon: Shield },
  'TEAM_LEADER': { label: 'Team Leader', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)', icon: UserCheck },
  'SALES_EXEC': { label: 'Sales Exec', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', icon: User },
  'ACCOUNT_MANAGER': { label: 'Account Manager', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', icon: UserCheck },
  'FINANCE': { label: 'Finance Desk', color: '#ec4899', bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.3)', icon: Shield },
  'MANAGER': { label: 'Manager', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', icon: UserCheck },
};

const PERMISSIONS = {
  'SUPER_ADMIN': { dashboard: ['view', 'export'], leads: ['view', 'edit', 'delete', 'assign'], clients: ['view', 'edit', 'delete'], users: ['view', 'create', 'edit', 'disable'], billing: ['view', 'create', 'edit'], settings: ['view', 'edit'] },
  'TEAM_LEADER': { dashboard: ['view'], leads: ['view', 'edit', 'assign'], clients: ['view', 'edit'], users: ['view'], billing: ['view'], settings: ['view'] },
  'SALES_EXEC': { dashboard: ['view'], leads: ['view', 'edit'], clients: ['view'], users: [], billing: [], settings: [] },
  'ACCOUNT_MANAGER': { dashboard: ['view'], leads: ['view'], clients: ['view', 'edit'], users: [], billing: [], settings: [] },
  'FINANCE': { dashboard: ['view'], leads: [], clients: ['view'], users: [], billing: ['view', 'create', 'edit'], settings: [] },
  'MANAGER': { dashboard: ['view'], leads: ['view'], clients: ['view'], users: ['view'], billing: ['view'], settings: [] },
};

function UserModal({ editUser, onClose, onSave, tls }) {
  const [form, setForm] = useState(editUser || {
    name: '', email: '', password: '', role: 'SALES_EXEC', teamLeaderId: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-800">{editUser ? 'Edit User Profile' : 'Create New User Account'}</h2>
          <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-650 font-semibold">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name *</label>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent-blue" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Neha Singh" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address *</label>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent-blue" type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="neha@thevertical.ai" />
          </div>
          {!editUser && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Password *</label>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent-blue" type="password" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">System Role *</label>
              <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent-blue" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                {Object.keys(ROLE_CONFIG).map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
              </select>
            </div>
            {form.role === 'SALES_EXEC' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Reporting TL</label>
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent-blue" value={form.teamLeaderId || ''} onChange={e => setForm(p => ({ ...p, teamLeaderId: e.target.value || null }))}>
                  <option value="">No TL Assigned</option>
                  {tls.map(tl => <option key={tl.id} value={tl.id}>{tl.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button type="button" className="flex-1 rounded-lg border border-slate-200 py-2.5 font-semibold text-slate-500 hover:bg-slate-50 transition" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 rounded bg-accent-blue py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-750 transition disabled:opacity-50">
              {submitting ? 'Saving...' : (editUser ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PermissionsPanel({ role }) {
  const perms = PERMISSIONS[role] || {};
  return (
    <div className="space-y-3 mt-4">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Module Permissions Summary</div>
      <div className="space-y-2">
        {Object.entries(perms).map(([module, actions]) => (
          <div key={module} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <span className="font-bold text-slate-700 capitalize">{module}</span>
            <div className="flex gap-1.5 flex-wrap">
              {['view', 'create', 'edit', 'delete', 'assign'].map(action => (
                <span key={action} className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${
                  actions.includes(action) ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  {actions.includes(action) ? '✓' : '✗'} {action}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UserCreation() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('SUPER_ADMIN');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch user list from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    await api.post('/users', formData);
    fetchUsers();
  };

  const handleUpdate = async (formData) => {
    await api.put(`/users/${editUser.id}`, formData);
    fetchUsers();
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/users/${id}/status`, { isActive: !currentStatus });
      fetchUsers();
    } catch (err) {
      alert('Failed to change user status.');
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'All' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const tls = users.filter(u => u.role === 'TEAM_LEADER');

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management Control</h1>
          <p className="text-sm text-slate-500">Configure roles, permissions, and active statuses for RevOps staff</p>
        </div>
        <button className="flex items-center space-x-2 rounded bg-accent-blue px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-750 transition active:scale-95" onClick={() => setShowAdd(true)}>
          <Plus size={15} />
          <span>Create User</span>
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-500">{error}</div>}

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main User List Table */}
          <div className="xl:col-span-2 space-y-4">
            <div className="glass rounded-xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute inset-y-0 left-0 ml-3 h-5 w-5 my-auto text-slate-400" />
                <input className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-accent-blue focus:bg-white" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 outline-none focus:border-accent-blue w-full sm:w-auto" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                <option value="All">All Roles</option>
                {Object.keys(ROLE_CONFIG).map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
              </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                    {filtered.map(user => {
                      const cfg = ROLE_CONFIG[user.role];
                      const Icon = cfg?.icon || User;
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{user.name}</div>
                            <div className="text-xs text-slate-400 font-medium">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ background: cfg?.bg, color: cfg?.color, borderColor: cfg?.border }}>
                              <Icon size={10} />
                              <span>{cfg?.label || user.role}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-normal ${
                              user.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-250' : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {user.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={() => setEditUser(user)}><Edit2 size={14} /></button>
                              <button className="rounded p-1 hover:bg-slate-100" onClick={() => handleToggleStatus(user.id, user.isActive)} style={{ color: user.isActive ? '#ef4444' : '#10b981' }}>
                                {user.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right sidebar: Hierarchy & Permissions Panel */}
          <div className="space-y-6">
            {/* Team hierarchy */}
            <div className="glass rounded-xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <UsersIcon size={16} className="text-accent-blue" />
                <span>Sales Team Hierarchies</span>
              </h3>
              <div className="space-y-4">
                {tls.map(tl => {
                  const bdes = users.filter(u => u.teamLeaderId === tl.id);
                  return (
                    <div key={tl.id} className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="avatar h-7 w-7 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">{tl.name.split(' ').map(n=>n[0]).join('')}</div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{tl.name}</div>
                          <div className="text-[10px] text-slate-400">Team Leader</div>
                        </div>
                      </div>
                      <div className="pl-4 space-y-1.5 border-l border-slate-100">
                        {bdes.map(bde => (
                          <div key={bde.id} className="flex items-center gap-2 text-xs py-1 text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                            <span>{bde.name}</span>
                            <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 border rounded ml-auto ${
                              bde.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}>{bde.isActive ? 'Active' : 'Disabled'}</span>
                          </div>
                        ))}
                        {bdes.length === 0 && <div className="text-[10px] text-slate-400 italic py-1 pl-4">No team members reporting yet.</div>}
                      </div>
                    </div>
                  );
                })}
                {tls.length === 0 && <div className="text-xs text-slate-400 italic text-center py-4">No Team Leaders configured in system.</div>}
              </div>
            </div>

            {/* Role Permissions Checker */}
            <div className="glass rounded-xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Lock size={16} className="text-accent-blue" />
                <span>Permission Verification Matrix</span>
              </h3>
              <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-accent-blue" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                {Object.keys(ROLE_CONFIG).map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
              </select>
              <PermissionsPanel role={selectedRole} />
            </div>
          </div>
        </div>
      )}

      {showAdd && <UserModal onClose={() => setShowAdd(false)} onSave={handleCreate} tls={tls} />}
      {editUser && <UserModal editUser={editUser} onClose={() => setEditUser(null)} onSave={handleUpdate} tls={tls} />}
    </div>
  );
}
