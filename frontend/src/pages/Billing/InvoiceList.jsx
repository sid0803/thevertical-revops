// frontend/src/pages/Billing/InvoiceList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Filter, Receipt, IndianRupee, CreditCard, Clock, FileText, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react';

const InvoiceList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchInvoices();
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
      case 'PARTIALLY_PAID': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Summarize invoices
  const summary = invoices.reduce((acc, inv) => {
    acc.totalBilled += inv.totalAmount;
    acc.totalCollected += inv.paidAmount;
    acc.totalOutstanding += inv.outstandingAmount;
    acc.invoiceCount += 1;
    if (inv.status === 'OVERDUE') acc.overdueCount += 1;
    return acc;
  }, { totalBilled: 0, totalCollected: 0, totalOutstanding: 0, invoiceCount: 0, overdueCount: 0 });

  // Client-side filtering logic
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter ? inv.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Billing Ledger</h1>
          <p className="text-xs text-slate-500">Track client invoicing and payment milestone schedules</p>
        </div>
        {['SUPER_ADMIN', 'FINANCE'].includes(user.role) && (
          <Link
            to="/billing/new"
            className="flex items-center space-x-2 rounded bg-accent-blue px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-750 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create Invoice</span>
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 flex items-center space-x-4 shadow-sm">
          <div className="rounded bg-slate-100 p-2.5 text-slate-600">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Booked</span>
            <span className="text-lg font-extrabold text-slate-800">₹{summary.totalBilled.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 flex items-center space-x-4 shadow-sm">
          <div className="rounded bg-emerald-50 p-2.5 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Cash Collected</span>
            <span className="text-lg font-extrabold text-slate-800">₹{summary.totalCollected.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 flex items-center space-x-4 shadow-sm">
          <div className="rounded bg-amber-50 p-2.5 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Receivables</span>
            <span className="text-lg font-extrabold text-slate-800">₹{summary.totalOutstanding.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 flex items-center space-x-4 shadow-sm">
          <div className="rounded bg-red-50 p-2.5 text-red-500">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Overdue Invoices</span>
            <span className="text-lg font-extrabold text-slate-800">{summary.overdueCount}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-0 ml-3 h-4 w-4 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number or client company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-700 outline-none transition focus:border-accent-blue focus:bg-white"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 outline-none focus:border-accent-blue"
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
        <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-500 font-medium">
          {error}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-400">
          No invoices found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-500">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Invoice No</th>
                  <th className="px-6 py-3.5">Client</th>
                  <th className="px-6 py-3.5">Base Amount</th>
                  <th className="px-6 py-3.5">GST Rate</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Paid</th>
                  <th className="px-6 py-3.5">Outstanding</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{inv.client.companyName}</td>
                    <td className="px-6 py-4 font-medium">₹{inv.baseAmount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">{inv.gstRate}%</td>
                    <td className="px-6 py-4 font-bold text-slate-800">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-emerald-600 font-bold">₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-slate-800 font-bold">₹{inv.outstandingAmount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold leading-normal uppercase tracking-wider ${getStatusBadge(inv.status)}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(inv.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/billing/${inv.id}`}
                        className="inline-flex items-center space-x-1 font-bold text-accent-blue hover:text-blue-700"
                      >
                        <span>Manage Slabs</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
