// frontend/src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Settings, Plus, Percent, RefreshCw, ToggleLeft, ToggleRight, X, ShieldAlert } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  
  const [slabs, setSlabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    rate: '',
    type: 'CGST_SGST',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSlabs();
  }, []);

  const fetchSlabs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/billing/gst-slabs');
      setSlabs(response.data);
    } catch (err) {
      setError('Failed to load GST settings.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSlab = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await api.post('/billing/gst-slabs', formData);
      setIsModalOpen(false);
      setFormData({ label: '', rate: '', type: 'CGST_SGST' });
      fetchSlabs();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create GST slab.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSlab = async (slabId, currentStatus) => {
    try {
      await api.put(`/billing/gst-slabs/${slabId}`, { isActive: !currentStatus });
      setSlabs(prev => prev.map(s => s.id === slabId ? { ...s, isActive: !currentStatus } : s));
    } catch (err) {
      console.error('Failed to toggle slab status:', err);
    }
  };

  if (user.role !== 'SUPER_ADMIN') {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-500">
        <ShieldAlert className="h-10 w-10 mx-auto mb-2" />
        <h2 className="text-lg font-bold">Access Denied</h2>
        <p className="text-sm mt-1">Only Super Admins can access global settings pages.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Global System Settings</h1>
          <p className="text-sm text-slate-500">Configure tax rates, billing modules, and global workflows</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-white shadow-lg shadow-accent/20 hover:bg-accent-dark transition active:scale-95"
        >
          <Plus className="h-5 w-5" />
          <span>Add GST Slab</span>
        </button>
      </div>

      {/* Main Settings Card */}
      <div className="glass rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-2 text-slate-700 font-semibold border-b border-slate-100 pb-3">
          <Percent className="h-5 w-5 text-accent" />
          <h2 className="text-sm font-bold uppercase tracking-wider">GST Slabs & Bookkeeping Slabs</h2>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
          </div>
        ) : slabs.length === 0 ? (
          <p className="text-xs text-slate-400">No GST slabs configured. Slabs are needed to calculate billing invoices.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Label</th>
                  <th className="py-3 px-4">Rate (%)</th>
                  <th className="py-3 px-4">Tax Type</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {slabs.map((slab) => (
                  <tr key={slab.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{slab.label}</td>
                    <td className="py-3.5 px-4 font-bold">{slab.rate}%</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded font-semibold text-[10px] ${
                        slab.type === 'CGST_SGST' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {slab.type === 'CGST_SGST' ? 'CGST + SGST (Intrastate)' : 'IGST (Interstate)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded font-semibold text-[10px] ${
                        slab.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {slab.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleSlab(slab.id, slab.isActive)}
                        className="text-slate-400 hover:text-slate-600 transition"
                      >
                        {slab.isActive ? (
                          <ToggleRight className="h-7 w-7 text-accent" />
                        ) : (
                          <ToggleLeft className="h-7 w-7 text-slate-300" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create GST Slab */}
      {isModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl z-10 border border-slate-100 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Add Bookkeeping GST Slab</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSlab} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Slab Label / Name *
                </label>
                <input
                  type="text"
                  name="label"
                  required
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder="e.g. GST 18% (CGST + SGST)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Tax Rate (%) *
                  </label>
                  <input
                    type="number"
                    name="rate"
                    required
                    step="0.1"
                    min="0"
                    value={formData.rate}
                    onChange={handleInputChange}
                    placeholder="e.g. 18"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    GST Mapping Type *
                  </label>
                  <select
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent"
                  >
                    <option value="CGST_SGST">CGST + SGST (Local)</option>
                    <option value="IGST">IGST (Interstate)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 font-semibold text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-accent py-2.5 font-semibold text-white hover:bg-accent-dark transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Slab'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
