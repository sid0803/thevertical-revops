// frontend/src/pages/Billing/CreateInvoice.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, FileText, Calendar, Receipt } from 'lucide-react';

const CreateInvoice = () => {
  const navigate = useNavigate();
  
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    clientId: '',
    baseAmount: '',
    gstRate: '18',
    dueDate: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (err) {
      console.error('Failed to load clients', err);
      setError('Could not load clients list. Verify backend is running.');
    } finally {
      setLoadingClients(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Dynamic GST computations
  const base = parseFloat(formData.baseAmount) || 0;
  const rate = parseFloat(formData.gstRate) || 0;
  const gstAmount = base * (rate / 100);
  const totalAmount = base + gstAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.post('/billing/invoices', {
        clientId: formData.clientId,
        baseAmount: base,
        gstRate: rate,
        dueDate: formData.dueDate || null,
        notes: formData.notes
      });
      navigate('/billing');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumbs */}
      <div>
        <Link to="/billing" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition uppercase tracking-wider">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Invoices</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Generate Client Invoice</h1>
        <p className="text-xs text-slate-500">Create a new invoice and automatically split it into upfront and live payment slabs</p>
      </div>

      {error && (
        <div className="rounded bg-red-50 border border-red-200 p-3.5 text-xs text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm space-y-5">
        
        {/* Client Selection */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Select Client *
          </label>
          <select
            name="clientId"
            required
            value={formData.clientId}
            onChange={handleInputChange}
            disabled={loadingClients}
            className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-accent-blue focus:bg-white disabled:opacity-50"
          >
            <option value="">Choose an account...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.companyName} ({c.contactName})</option>
            ))}
          </select>
        </div>

        {/* Amount and GST */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Base Amount (INR) *
            </label>
            <input
              type="number"
              name="baseAmount"
              required
              min="1"
              value={formData.baseAmount}
              onChange={handleInputChange}
              placeholder="e.g. 140400"
              className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-accent-blue focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              GST Rate *
            </label>
            <select
              name="gstRate"
              required
              value={formData.gstRate}
              onChange={handleInputChange}
              className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-accent-blue focus:bg-white"
            >
              <option value="3">3%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
            </select>
          </div>
        </div>

        {/* Due date */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Initial Slab Due Date
          </label>
          <div className="relative">
            <Calendar className="absolute inset-y-0 left-0 ml-3 h-4 w-4 my-auto text-slate-400" />
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              className="w-full rounded border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-700 outline-none focus:border-accent-blue focus:bg-white"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Billing Description / Notes
          </label>
          <div className="relative">
            <FileText className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
            <textarea
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Provide references or payment terms..."
              className="w-full rounded border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-700 outline-none focus:border-accent-blue focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* Live Calculation Panel */}
        {formData.baseAmount && (
          <div className="rounded bg-slate-50 p-4 border border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Base Billing Amount:</span>
              <span className="font-semibold text-slate-800">₹{base.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>GST ({rate}%):</span>
              <span className="font-semibold text-slate-800">₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-xs font-bold text-slate-700">
              <span>Total Invoice Amount (Gross):</span>
              <span className="text-accent-blue">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider border-t border-dashed border-slate-200 pt-2">
              <span>Default Upfront Slab (50%):</span>
              <span>₹{(totalAmount * 0.5).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              <span>Default Onboarding Slab (50%):</span>
              <span>₹{(totalAmount * 0.5).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="border-t border-slate-100 pt-4 flex items-center space-x-3">
          <Link
            to="/billing"
            className="flex-1 rounded border border-slate-200 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded bg-accent-blue py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-750 transition disabled:opacity-50"
          >
            {submitting ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default CreateInvoice;
