// frontend/src/pages/Billing.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Receipt, IndianRupee, CreditCard, Clock, FileText, CheckCircle, HelpCircle, X } from 'lucide-react';

const Billing = () => {
  const { user } = useAuth();
  
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [gstSlabs, setGstSlabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Invoice modal states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    clientId: '',
    amount: '',
    gstSlabId: '',
    dueDate: '',
  });
  const [invoiceError, setInvoiceError] = useState('');
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);

  // Payment modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    slabNumber: '1',
    notes: '',
  });
  const [paymentError, setPaymentError] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchGstSlabs();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/billing/invoices');
      setInvoices(response.data);
    } catch (err) {
      setError('Failed to load invoices.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (err) {
      console.error('Failed to load clients', err);
    }
  };

  const fetchGstSlabs = async () => {
    try {
      const response = await api.get('/billing/gst-slabs');
      setGstSlabs(response.data);
    } catch (err) {
      console.error('Failed to load GST slabs', err);
    }
  };

  const handleInvoiceInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setInvoiceError('');
    setInvoiceSubmitting(true);

    try {
      await api.post('/billing/invoices', invoiceData);
      setIsInvoiceModalOpen(false);
      setInvoiceData({ clientId: '', amount: '', gstSlabId: '', dueDate: '' });
      fetchInvoices();
    } catch (err) {
      setInvoiceError(err.response?.data?.message || 'Failed to create invoice.');
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentSubmitting(true);

    try {
      await api.post(`/billing/invoices/${selectedInvoice.id}/pay`, paymentData);
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      setPaymentData({ amount: '', slabNumber: '1', notes: '' });
      fetchInvoices();
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    
    // Determine the next payment slab
    const nextSlab = invoice.payments ? invoice.payments.length + 1 : 1;
    
    // Calculate remaining amount
    const paidAmount = invoice.payments ? invoice.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
    const remaining = invoice.totalAmount - paidAmount;

    setPaymentData({
      amount: remaining.toString(),
      slabNumber: nextSlab.toString(),
      notes: `Slab ${nextSlab} payment`,
    });
    setIsPaymentModalOpen(true);
  };

  // Live GST maths for modal display
  const getSelectedGstDetails = () => {
    if (!invoiceData.amount || !invoiceData.gstSlabId) return { gstAmount: 0, total: 0, rate: 0, type: '' };
    const slab = gstSlabs.find(s => s.id === invoiceData.gstSlabId);
    if (!slab) return { gstAmount: 0, total: 0, rate: 0, type: '' };
    
    const base = parseFloat(invoiceData.amount) || 0;
    const gstAmount = base * (slab.rate / 100);
    const total = base + gstAmount;
    return { gstAmount, total, rate: slab.rate, type: slab.type };
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
      case 'PARTIALLY_PAID': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'SENT': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Summarize invoices
  const summary = invoices.reduce((acc, inv) => {
    const paid = inv.payments ? inv.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
    acc.totalBilled += inv.totalAmount;
    acc.totalCollected += paid;
    acc.totalOutstanding += (inv.totalAmount - paid);
    acc.invoiceCount += 1;
    if (inv.status !== 'PAID') acc.pendingCount += 1;
    return acc;
  }, { totalBilled: 0, totalCollected: 0, totalOutstanding: 0, invoiceCount: 0, pendingCount: 0 });

  // Client-side filtering logic
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter ? inv.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const gstPreview = getSelectedGstDetails();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Invoices</h1>
          <p className="text-sm text-slate-500">Manage client invoices, slab payments, and GST bookkeeping</p>
        </div>
        {['SUPER_ADMIN', 'FINANCE'].includes(user.role) && (
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center space-x-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-white shadow-lg shadow-accent/20 hover:bg-accent-dark transition active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span>Create Invoice</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="glass rounded-xl p-5 bg-white border border-slate-100 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-slate-100 p-3 text-slate-600">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Total Invoiced</span>
            <span className="text-xl font-bold text-slate-800">₹{summary.totalBilled.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass rounded-xl p-5 bg-white border border-slate-100 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-green-50 p-3 text-green-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Total Collected</span>
            <span className="text-xl font-bold text-slate-800">₹{summary.totalCollected.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass rounded-xl p-5 bg-white border border-slate-100 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Outstanding Receivables</span>
            <span className="text-xl font-bold text-slate-800">₹{summary.totalOutstanding.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass rounded-xl p-5 bg-white border border-slate-100 flex items-center space-x-4 shadow-sm">
          <div className="rounded-lg bg-sky-50 p-3 text-sky-600">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Pending Invoices</span>
            <span className="text-xl font-bold text-slate-800">{summary.pendingCount} / {summary.invoiceCount}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-4 bg-white border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-0 ml-3 h-5 w-5 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number or client company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-accent focus:bg-white"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 outline-none focus:border-accent"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
            <option value="PAID">PAID</option>
            <option value="OVERDUE">OVERDUE</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-100 bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
          No invoices found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-500">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Base Amount</th>
                  <th className="px-6 py-4">GST Rate/Type</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                {filteredInvoices.map((inv) => {
                  const paid = inv.payments ? inv.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
                  const balance = inv.totalAmount - paid;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{inv.client.companyName}</td>
                      <td className="px-6 py-4">₹{inv.amount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-xs">
                        <div>{inv.gstRate}%</div>
                        <div className="text-[10px] text-slate-400">{inv.gstType === 'CGST_SGST' ? 'CGST + SGST' : 'IGST'}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-normal ${getStatusBadge(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.status !== 'PAID' && ['SUPER_ADMIN', 'FINANCE'].includes(user.role) ? (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="rounded bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-dark transition shadow shadow-accent/10 active:scale-95"
                          >
                            Pay Slab
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Fully Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Invoice */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsInvoiceModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl z-10 border border-slate-100 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Generate Client Invoice</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {invoiceError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {invoiceError}
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Select Client *
                </label>
                <select
                  name="clientId"
                  required
                  value={invoiceData.clientId}
                  onChange={handleInvoiceInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent"
                >
                  <option value="">Choose an account...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName} ({c.contactName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Base Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="1"
                    value={invoiceData.amount}
                    onChange={handleInvoiceInputChange}
                    placeholder="e.g. 100000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    GST Rate / Slab *
                  </label>
                  <select
                    name="gstSlabId"
                    required
                    value={invoiceData.gstSlabId}
                    onChange={handleInvoiceInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent"
                  >
                    <option value="">Select slab...</option>
                    {gstSlabs.map(s => (
                      <option key={s.id} value={s.id}>{s.label} ({s.rate}%)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={invoiceData.dueDate}
                  onChange={handleInvoiceInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent"
                />
              </div>

              {/* Dynamic maths breakdown panel */}
              {invoiceData.amount && invoiceData.gstSlabId && (
                <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span className="font-semibold text-slate-800">₹{(parseFloat(invoiceData.amount) || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST Amount ({gstPreview.rate}% {gstPreview.type === 'CGST_SGST' ? 'CGST+SGST' : 'IGST'}):</span>
                    <span className="font-semibold text-slate-800">₹{gstPreview.gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                    <span className="font-bold text-slate-700">Total Invoice Value:</span>
                    <span className="font-bold text-accent">₹{gstPreview.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 font-semibold text-slate-500 hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={invoiceSubmitting}
                  className="flex-1 rounded-lg bg-accent py-2.5 font-semibold text-white hover:bg-accent-dark transition disabled:opacity-50"
                >
                  {invoiceSubmitting ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal: Record Payment */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-30 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl z-10 border border-slate-100 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Record Payment</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Invoice: {selectedInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {paymentError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {paymentError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="1"
                    max={selectedInvoice.totalAmount}
                    value={paymentData.amount}
                    onChange={handlePaymentInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Milestone Slab *
                  </label>
                  <input
                    type="number"
                    name="slabNumber"
                    required
                    min="1"
                    value={paymentData.slabNumber}
                    onChange={handlePaymentInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Payment Reference Notes
                </label>
                <textarea
                  name="notes"
                  rows="2"
                  value={paymentData.notes}
                  onChange={handlePaymentInputChange}
                  placeholder="e.g. Bank transfer ID, Slab 2 milestone clearance"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 font-semibold text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="flex-1 rounded-lg bg-accent py-2.5 font-semibold text-white hover:bg-accent-dark transition disabled:opacity-50"
                >
                  {paymentSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
