// frontend/src/pages/Billing/InvoiceDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Trash2, CheckCircle2, Plus, Save, Calendar, Check, AlertCircle, Printer, Download } from 'lucide-react';

const InvoiceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [invoice, setInvoice] = useState(null);
  const [slabs, setSlabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/billing/invoices/${id}`);
      setInvoice(response.data);
      setSlabs(response.data.slabs || []);
    } catch (err) {
      setError('Failed to load invoice details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Live total percentages check
  const calculateOutstanding = () => {
    if (!invoice) return { percent: 100, amount: 0 };
    const paidSum = slabs.filter(s => s.isPaid).reduce((sum, s) => sum + s.amount, 0);
    const unpaidSum = slabs.filter(s => !s.isPaid).reduce((sum, s) => sum + s.amount, 0);
    const totalRemaining = Math.max(0, invoice.totalAmount - paidSum);
    const percentageRemaining = Math.max(0, 100 - slabs.reduce((sum, s) => sum + s.percentage, 0));
    return {
      paidSum,
      unpaidSum,
      totalRemaining,
      percentageRemaining
    };
  };

  // Handle cell changes in Excel-like table
  const handleCellChange = (index, field, value) => {
    const updatedSlabs = [...slabs];
    const slab = updatedSlabs[index];
    if (slab.isPaid) return; // Prevent editing paid slabs

    if (field === 'percentage') {
      const pct = parseFloat(value) || 0;
      slab.percentage = pct;
      slab.amount = parseFloat((invoice.totalAmount * (pct / 100)).toFixed(2));
    } else if (field === 'amount') {
      const amt = parseFloat(value) || 0;
      slab.amount = amt;
      slab.percentage = parseFloat(((amt / invoice.totalAmount) * 100).toFixed(2));
    } else {
      slab[field] = value;
    }
    setSlabs(updatedSlabs);
  };

  const handleExportCSV = () => {
    if (!invoice) return;
    const headers = ['Slab Number', 'Percentage (%)', 'Amount (INR)', 'Due Date', 'Status', 'Paid At', 'Notes'];
    const rows = slabs.map(s => [
      s.slabNumber,
      `"${s.percentage}%"`,
      s.amount,
      s.dueDate ? `"${new Date(s.dueDate).toLocaleDateString('en-IN')}"` : 'N/A',
      s.isPaid ? 'Paid' : 'Pending',
      s.paidAt ? `"${new Date(s.paidAt).toLocaleDateString('en-IN')}"` : 'N/A',
      `"${s.paymentNote || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoice_${invoice.invoiceNumber}_slabs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save modified slabs array
  const handleSaveSlabs = async () => {
    setActionError('');
    setActionSuccess('');
    setSaving(true);

    const totalPct = slabs.reduce((sum, s) => sum + parseFloat(s.percentage), 0);
    if (totalPct > 100.01) {
      setActionError(`Validation failed: Combined slab percentages sum up to ${totalPct.toFixed(2)}%, which exceeds 100%`);
      setSaving(false);
      return;
    }

    try {
      const response = await api.put(`/billing/invoices/${id}/slabs`, { slabs });
      setInvoice(response.data);
      setSlabs(response.data.slabs || []);
      setActionSuccess('Slab milestones saved successfully!');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to save slab modifications.');
    } finally {
      setSaving(false);
    }
  };

  // Mark a single slab as PAID
  const handleMarkAsPaid = async (slabId, slabNumber) => {
    if (!window.confirm(`Are you sure you want to mark Slab #${slabNumber} as Paid?`)) return;
    
    setActionError('');
    setActionSuccess('');
    try {
      const response = await api.post(`/billing/invoices/${id}/slabs/${slabId}/pay`);
      setInvoice(response.data);
      setSlabs(response.data.slabs || []);
      setActionSuccess(`Slab #${slabNumber} marked as Paid! Commitment revenue synchronized.`);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to record slab payment.');
    }
  };

  // Add next payment row prefilled
  const handleAddSlabRow = () => {
    const nextSlabNum = slabs.length > 0 ? Math.max(...slabs.map(s => s.slabNumber)) + 1 : 1;
    const { totalRemaining, percentageRemaining } = calculateOutstanding();

    if (totalRemaining <= 0) {
      setActionError('Cannot add payment milestone. Invoice is already fully allocated.');
      return;
    }

    const newSlab = {
      slabNumber: nextSlabNum,
      percentage: parseFloat(percentageRemaining.toFixed(2)),
      amount: parseFloat(totalRemaining.toFixed(2)),
      dueDate: '',
      isPaid: false,
      paymentNote: `Slab ${nextSlabNum} balance`
    };

    setSlabs([...slabs, newSlab]);
    setActionError('');
  };

  // Delete unpaid slab row
  const handleDeleteSlabRow = async (index, slabId) => {
    const updatedSlabs = [...slabs];
    const target = updatedSlabs[index];
    if (target.isPaid) return;

    if (slabId) {
      // Exists in DB, delete via API
      if (!window.confirm('Delete this unpaid slab milestone from database?')) return;
      try {
        const response = await api.delete(`/billing/invoices/${id}/slabs/${slabId}`);
        setInvoice(response.data);
        setSlabs(response.data.slabs || []);
        setActionSuccess('Slab deleted successfully!');
      } catch (err) {
        setActionError(err.response?.data?.message || 'Failed to delete slab.');
      }
    } else {
      // Local addition only
      updatedSlabs.splice(index, 1);
      setSlabs(updatedSlabs);
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

  if (loading || !invoice) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
      </div>
    );
  }

  const { paidSum, totalRemaining, percentageRemaining } = calculateOutstanding();
  const paidPercent = invoice.totalAmount > 0 ? (invoice.paidAmount / invoice.totalAmount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <Link to="/billing" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition uppercase tracking-wider">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Invoices</span>
        </Link>
      </div>

      {/* Action alerts */}
      {actionError && (
        <div className="rounded bg-red-50 border border-red-200 p-3.5 text-xs text-red-600 font-medium flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="rounded bg-green-50 border border-green-200 p-3.5 text-xs text-green-600 font-medium flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Invoice Header details */}
      <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase mb-1.5 ${getStatusBadge(invoice.status)}`}>
              {invoice.status.replace('_', ' ')}
            </span>
            <h2 className="text-lg font-bold text-slate-800">Invoice: {invoice.invoiceNumber}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Account: {invoice.client.companyName} | Contact: {invoice.client.contactName}</p>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-center print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center space-x-1.5 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-750 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center space-x-1.5 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-750 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>

            {['SUPER_ADMIN', 'FINANCE'].includes(user.role) && (
              <button
                onClick={handleSaveSlabs}
                disabled={saving}
                className="flex items-center justify-center space-x-1.5 rounded bg-accent-blue hover:bg-blue-750 text-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 active:scale-95"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Slabs'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Amount Summary Row */}
        <div className="grid grid-cols-3 gap-6 text-slate-600 text-xs border-t border-slate-100 pt-4">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Base Amount</span>
            <span className="text-sm font-extrabold text-slate-800">₹{invoice.baseAmount.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">GST Rate</span>
            <span className="text-sm font-extrabold text-slate-800">{invoice.gstRate}% (₹{invoice.gstAmount.toLocaleString('en-IN')})</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Grand Total Amount</span>
            <span className="text-sm font-extrabold text-accent-blue">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Collections Progress Bar */}
        <div className="space-y-1.5 border-t border-slate-100 pt-4">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-500">Collected: ₹{invoice.paidAmount.toLocaleString('en-IN')}</span>
            <span className="text-slate-800">Outstanding: ₹{invoice.outstandingAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="h-2 w-full rounded bg-slate-100 overflow-hidden flex">
            <div
              className="h-full bg-success transition-all duration-300"
              style={{ width: `${paidPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Slabs interactive table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Milestone Payments Breakdown</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 border border-slate-200">Slab</th>
                <th className="py-3 px-3 border border-slate-200 w-24">Pct (%)</th>
                <th className="py-3 px-3 border border-slate-200 w-44">Amount (₹)</th>
                <th className="py-3 px-3 border border-slate-200 w-40">Due Date</th>
                <th className="py-3 px-3 border border-slate-200 text-center">Status</th>
                <th className="py-3 px-3 border border-slate-200">Paid On</th>
                <th className="py-3 px-3 border border-slate-200">Notes / Refs</th>
                <th className="py-3 px-3 border border-slate-200 text-center w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {slabs.map((slab, index) => {
                const isFieldEditable = !slab.isPaid && ['SUPER_ADMIN', 'FINANCE'].includes(user.role);

                return (
                  <tr key={index} className={`${slab.isPaid ? 'bg-green-50/50' : 'hover:bg-slate-50/55'} transition`}>
                    <td className="py-3 px-3 border border-slate-200 font-bold text-center">#{slab.slabNumber}</td>
                    
                    {/* Percentage input */}
                    <td className="py-2 px-2 border border-slate-200">
                      {isFieldEditable ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={slab.percentage}
                          onChange={(e) => handleCellChange(index, 'percentage', e.target.value)}
                          className="w-full rounded border border-slate-200 bg-white p-1 font-semibold text-slate-700 outline-none focus:border-accent-blue"
                        />
                      ) : (
                        <span className="font-semibold px-1">{slab.percentage}%</span>
                      )}
                    </td>

                    {/* Amount input */}
                    <td className="py-2 px-2 border border-slate-200">
                      {isFieldEditable ? (
                        <div className="relative flex items-center">
                          <span className="absolute left-1.5 text-slate-400 font-bold text-[10px]">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={slab.amount}
                            onChange={(e) => handleCellChange(index, 'amount', e.target.value)}
                            className="w-full rounded border border-slate-200 bg-white p-1 pl-4 font-semibold text-slate-700 outline-none focus:border-accent-blue"
                          />
                        </div>
                      ) : (
                        <span className="font-bold px-1 text-slate-800">₹{slab.amount.toLocaleString('en-IN')}</span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="py-2 px-2 border border-slate-200">
                      {isFieldEditable ? (
                        <input
                          type="date"
                          value={slab.dueDate ? new Date(slab.dueDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleCellChange(index, 'dueDate', e.target.value)}
                          className="w-full rounded border border-slate-200 bg-white p-1 text-slate-700 outline-none focus:border-accent-blue"
                        />
                      ) : (
                        <span className="px-1 text-slate-500">
                          {slab.dueDate ? new Date(slab.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 border border-slate-200 text-center">
                      <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider leading-none ${
                        slab.isPaid
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {slab.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </td>

                    {/* Paid On */}
                    <td className="py-3 px-3 border border-slate-200 text-slate-400 font-medium">
                      {slab.paidAt ? new Date(slab.paidAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>

                    {/* Notes */}
                    <td className="py-2 px-2 border border-slate-200">
                      {isFieldEditable ? (
                        <input
                          type="text"
                          value={slab.paymentNote || ''}
                          onChange={(e) => handleCellChange(index, 'paymentNote', e.target.value)}
                          placeholder="e.g. Bank Ref code"
                          className="w-full rounded border border-slate-200 bg-white p-1 text-slate-700 outline-none focus:border-accent-blue"
                        />
                      ) : (
                        <span className="px-1 text-slate-500 truncate block max-w-xs">{slab.paymentNote || '-'}</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-2 px-2 border border-slate-200 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {slab.isPaid ? (
                          <span className="text-[10px] text-green-600 font-bold flex items-center space-x-0.5">
                            <Check className="h-3.5 w-3.5" />
                            <span>Cleared</span>
                          </span>
                        ) : (
                          <>
                            {['SUPER_ADMIN', 'FINANCE'].includes(user.role) && (
                              <button
                                onClick={() => handleMarkAsPaid(slab.id, slab.slabNumber)}
                                disabled={!slab.id}
                                title={!slab.id ? 'Save slabs first before marking as paid' : ''}
                                className="rounded bg-success text-white font-bold px-2 py-1 text-[10px] uppercase tracking-wider hover:bg-emerald-600 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Mark Paid
                              </button>
                            )}
                            {['SUPER_ADMIN', 'FINANCE'].includes(user.role) && (
                              <button
                                onClick={() => handleDeleteSlabRow(index, slab.id)}
                                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-danger transition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* Outstanding remaining summary row */}
              <tr className="bg-slate-50/50 font-semibold text-slate-700">
                <td colSpan="2" className="py-3 px-3 border border-slate-200 text-right">Outstanding Allocation:</td>
                <td className="py-3 px-3 border border-slate-200 text-accent-blue font-bold">
                  ₹{totalRemaining.toLocaleString('en-IN')} ({percentageRemaining.toFixed(2)}%)
                </td>
                <td colSpan="5" className="py-3 px-3 border border-slate-200"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Add Next Slab Button */}
        {['SUPER_ADMIN', 'FINANCE'].includes(user.role) && totalRemaining > 0 && (
          <button
            onClick={handleAddSlabRow}
            className="flex items-center space-x-1 text-xs font-bold text-accent-blue hover:text-blue-750 py-2 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Next Payment Milestone</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetail;
