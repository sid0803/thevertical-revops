// frontend/src/pages/Proposals/ProposalBuilder.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Save,
  Printer,
  Trash2,
  Plus,
  Send,
  TrendingUp,
  Loader2,
  Sparkles,
  AlertCircle,
  FileCheck
} from 'lucide-react';

const ProposalBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isNew = !id;
  const isFinanceOrAdmin = ['SUPER_ADMIN', 'MANAGER', 'FINANCE'].includes(user?.role);

  // Form State
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [validityDays, setValidityDays] = useState(15);
  const [gstRate, setGstRate] = useState(18);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [proposalNumber, setProposalNumber] = useState('');
  const [companyProfile, setCompanyProfile] = useState(null);

  // Line items state
  const [lineItems, setLineItems] = useState([
    { component: 'AI Voice Agent (One-Time)', description: 'Core Voice Engine setup', qty: 1, costPerUnit: 45000, billingType: 'ONE_TIME' },
    { component: 'SIM Cost (One-Time)', description: 'SIM card integration fee', qty: 2, costPerUnit: 500, billingType: 'ONE_TIME' },
    { component: 'Per Concurrent Channel/Month', description: 'Concurrent SIP trunks', qty: 2, costPerUnit: 1100, billingType: 'MONTHLY' },
    { component: 'Minute Consumption', description: 'Pre-paid talk-time minutes slab', qty: 10000, costPerUnit: 3, billingType: 'CONSUMPTION' }
  ]);

  // Loading & UI State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchCompanyProfile();
    if (!isNew) {
      fetchProposalDetails();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      const res = await api.get('/company-profile');
      setCompanyProfile(res.data);
    } catch (err) {
      console.error('Error fetching company profile:', err);
    }
  };

  const fetchProposalDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/proposals/${id}`);
      const data = res.data;
      
      setProposalNumber(data.proposalNumber);
      setSelectedClientId(data.clientId || '');
      setClientName(data.clientName);
      setValidityDays(data.validityDays);
      setGstRate(data.gstRate);
      setNotes(data.notes || '');
      setStatus(data.status);
      setLineItems(data.lineItems.map(item => ({
        id: item.id,
        component: item.component,
        description: item.description || '',
        qty: item.qty,
        costPerUnit: item.costPerUnit,
        billingType: item.billingType
      })));
    } catch (err) {
      console.error('Error fetching proposal details:', err);
      setError('Failed to fetch proposal details.');
    } finally {
      setLoading(false);
    }
  };

  // Math totals calculation live
  const calculateTotals = () => {
    let oneTimeTotal = 0;
    let monthlyTotal = 0;
    let consumptionTotal = 0;

    lineItems.forEach(item => {
      const qty = parseFloat(item.qty) || 0;
      const cpu = parseFloat(item.costPerUnit) || 0;
      const total = qty * cpu;

      if (item.billingType === 'ONE_TIME') oneTimeTotal += total;
      if (item.billingType === 'MONTHLY') monthlyTotal += total;
      if (item.billingType === 'CONSUMPTION') consumptionTotal += total;
    });

    const subtotal = oneTimeTotal + monthlyTotal + consumptionTotal;
    const gstAmount = subtotal * (gstRate / 100);
    const grandTotal = subtotal + gstAmount;

    return {
      oneTimeTotal,
      monthlyTotal,
      consumptionTotal,
      subtotal,
      gstAmount,
      grandTotal
    };
  };

  const totals = calculateTotals();

  // Handlers
  const handleClientChange = (e) => {
    const cid = e.target.value;
    setSelectedClientId(cid);
    if (cid === '') {
      setClientName('');
    } else {
      const client = clients.find(c => c.id === cid);
      if (client) {
        setClientName(client.companyName);
      }
    }
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { component: 'Custom Service', description: '', qty: 1, costPerUnit: 0, billingType: 'ONE_TIME' }
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length === 1) return;
    const updated = lineItems.filter((_, idx) => idx !== index);
    setLineItems(updated);
  };

  const handleSave = async () => {
    if (!clientName.trim()) {
      setError('Client name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const payload = {
        clientId: selectedClientId || null,
        clientName: clientName.trim(),
        validityDays: parseInt(validityDays) || 15,
        gstRate: parseFloat(gstRate),
        notes,
        lineItems
      };

      if (isNew) {
        const res = await api.post('/proposals', payload);
        setSuccess('Proposal created successfully!');
        setTimeout(() => navigate(`/proposals/${res.data.id}`), 1000);
      } else {
        await api.put(`/proposals/${id}`, payload);
        setSuccess('Proposal updated successfully!');
        fetchProposalDetails();
      }
    } catch (err) {
      console.error('Error saving proposal:', err);
      setError(err.response?.data?.message || 'Failed to save proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async () => {
    try {
      setSubmitting(true);
      await api.post(`/proposals/${id}/send`);
      setSuccess('Proposal status marked as SENT!');
      fetchProposalDetails();
    } catch (err) {
      console.error('Error sending proposal:', err);
      setError(err.response?.data?.message || 'Failed to send proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvert = async () => {
    if (!window.confirm('Convert this proposal to a live invoice? This creates a draft invoice with 50/50 payment slabs.')) {
      return;
    }

    try {
      setConverting(true);
      setError('');
      const res = await api.post(`/proposals/${id}/convert`);
      alert(`Converted successfully to invoice ${res.data.invoiceNumber}!`);
      navigate(`/billing`);
    } catch (err) {
      console.error('Error converting proposal:', err);
      setError(err.response?.data?.message || 'Failed to convert proposal. Verify client link.');
    } finally {
      setConverting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isReadOnly = status === 'ACCEPTED';

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:bg-white print:p-0 print:text-black">
      {/* Action Navigation Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to="/proposals"
            className="flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isNew ? 'New Custom Proposal' : `Proposal ${proposalNumber}`}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {isNew ? 'Create a customized quote for dynamic client needs' : `Status: ${status}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isNew && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 transition"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
          )}

          {!isReadOnly && (
            <button
              onClick={handleSave}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded bg-accent-blue px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-750 transition active:scale-95 shadow-md shadow-accent-blue/10"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Proposal
            </button>
          )}

          {status === 'DRAFT' && !isNew && (
            <button
              onClick={handleSend}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md active:scale-95"
            >
              <Send className="h-4 w-4" />
              Mark as Sent
            </button>
          )}

          {status !== 'ACCEPTED' && !isNew && selectedClientId && isFinanceOrAdmin && (
            <button
              onClick={handleConvert}
              disabled={converting}
              className="inline-flex items-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md active:scale-95"
            >
              {converting ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
              Convert to Invoice
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-650 print:hidden">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-600 print:hidden">
          {success}
        </div>
      )}

      {/* Main Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Details & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Letterhead Block */}
          {companyProfile && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:border-none print:p-0 border-b-4 border-b-accent-blue/30 pb-6">
              <div className="flex items-center gap-4">
                {companyProfile.logoUrl ? (
                  <img src={companyProfile.logoUrl} alt="Logo" className="h-10 w-auto max-w-[140px] object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-accent-blue/10 flex items-center justify-center font-bold text-accent-blue text-lg">
                    {companyProfile.companyName[0]}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-bold text-slate-900 print:text-black">{companyProfile.companyName}</h2>
                  {companyProfile.website && (
                    <p className="text-[10px] text-slate-500 print:text-slate-700">{companyProfile.website}</p>
                  )}
                </div>
              </div>
              <div className="text-left sm:text-right text-[10px] text-slate-500 print:text-black space-y-0.5">
                {companyProfile.address && <p>{companyProfile.address}</p>}
                {(companyProfile.city || companyProfile.state || companyProfile.pincode) && (
                  <p>
                    {[companyProfile.city, companyProfile.state, companyProfile.pincode].filter(Boolean).join(', ')}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-2 sm:justify-end text-[10px]">
                  {companyProfile.phone && <span>Phone: {companyProfile.phone}</span>}
                  {companyProfile.email && <span>Email: {companyProfile.email}</span>}
                </div>
                {companyProfile.gstNumber && (
                  <p className="font-semibold text-slate-700 print:text-black">GSTIN: {companyProfile.gstNumber}</p>
                )}
              </div>
            </div>
          )}

          {/* Section: Proposal Details */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4 print:border-none print:p-0">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 print:text-black">
              <Sparkles className="h-4 w-4 text-accent-cyan print:hidden" />
              Client Info & Validity
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="print:hidden">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Link Client Account (Optional)</label>
                <select
                  value={selectedClientId}
                  onChange={handleClientChange}
                  disabled={isReadOnly}
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-750 outline-none focus:border-accent-blue focus:bg-white disabled:opacity-50"
                >
                  <option value="">-- Dynamic Client Name Only --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 print:text-slate-500">Client / Company Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client company name"
                  disabled={isReadOnly || !!selectedClientId}
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-750 outline-none focus:border-accent-blue focus:bg-white disabled:opacity-70 print:bg-transparent print:border-none print:text-black print:px-0 print:font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 print:text-slate-500">Validity Days</label>
                <input
                  type="number"
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-750 outline-none focus:border-accent-blue focus:bg-white disabled:opacity-50 print:bg-transparent print:border-none print:text-black print:px-0"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 print:text-slate-500">GST Slab (%)</label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(parseFloat(e.target.value))}
                  disabled={isReadOnly}
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-750 outline-none focus:border-accent-blue focus:bg-white disabled:opacity-50 print:bg-transparent print:border-none print:text-black print:px-0"
                >
                  <option value={3}>3% (Special Services)</option>
                  <option value={12}>12% (Standard Telecom/Software)</option>
                  <option value={18}>18% (Standard IT Services)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Interactive Spreadsheet Line Items Table */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4 print:border-none print:p-0">
            <div className="flex items-center justify-between print:hidden">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pricing Matrix</h2>
              {!isReadOnly && (
                <button
                  onClick={addLineItem}
                  className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-650 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Custom Item
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs print:text-xs text-slate-500">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase print:border-black print:text-black">
                    <th className="py-3 px-2">Component</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2 text-right">Qty</th>
                    <th className="py-3 px-2 text-right">Cost/Unit (₹)</th>
                    <th className="py-3 px-2 text-right">Total (₹)</th>
                    <th className="py-3 px-2 text-center print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40 print:hover:bg-transparent">
                      <td className="py-3 px-2 max-w-[200px]">
                        <input
                          type="text"
                          value={item.component}
                          onChange={(e) => handleLineItemChange(idx, 'component', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full bg-transparent border-none text-slate-800 focus:outline-none focus:ring-1 focus:ring-accent-blue font-semibold print:text-black"
                          placeholder="Component Name"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full bg-transparent border-none text-slate-400 text-[10px] focus:outline-none focus:ring-1 focus:ring-accent-blue mt-0.5 print:text-slate-500"
                          placeholder="Component description details"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={item.billingType}
                          onChange={(e) => handleLineItemChange(idx, 'billingType', e.target.value)}
                          disabled={isReadOnly}
                          className="bg-transparent border-none text-slate-650 text-xs focus:outline-none focus:ring-1 focus:ring-accent-blue print:text-black"
                        >
                          <option value="ONE_TIME">One-Time</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="CONSUMPTION">Consumption</option>
                        </select>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleLineItemChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                          disabled={isReadOnly}
                          className="w-16 bg-transparent border-none text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-accent-blue print:text-black font-semibold"
                        />
                      </td>
                      <td className="py-3 px-2 text-right">
                        <input
                          type="number"
                          value={item.costPerUnit}
                          onChange={(e) => handleLineItemChange(idx, 'costPerUnit', parseFloat(e.target.value) || 0)}
                          disabled={isReadOnly}
                          className="w-24 bg-transparent border-none text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-accent-blue print:text-black font-semibold"
                        />
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-slate-800 print:text-black">
                        ₹{(item.qty * item.costPerUnit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-center print:hidden">
                        {!isReadOnly && lineItems.length > 1 && (
                          <button
                            onClick={() => removeLineItem(idx)}
                            className="text-slate-400 hover:text-red-500 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Summary Panel */}
        <div className="space-y-6">
          {/* Summary Panel */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4 print:border-none print:p-0">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-black">
              Proposal Totals Summary
            </h2>
            
            <div className="space-y-3 divide-y divide-slate-100 print:divide-slate-200 text-xs">
              <div className="flex justify-between text-slate-550 py-1.5 print:text-slate-600">
                <span>One-Time Charges:</span>
                <span className="font-semibold text-slate-700 print:text-black">
                  ₹{totals.oneTimeTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-550 py-1.5 print:text-slate-600">
                <span>Monthly Recurring:</span>
                <span className="font-semibold text-slate-700 print:text-black">
                  ₹{totals.monthlyTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-550 py-1.5 print:text-slate-600">
                <span>Consumption Estimate:</span>
                <span className="font-semibold text-slate-700 print:text-black">
                  ₹{totals.consumptionTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold py-2.5 border-t border-slate-100 print:text-black">
                <span>Subtotal (Excl. GST):</span>
                <span>₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-550 py-1.5 print:text-slate-600">
                <span>GST ({gstRate}%):</span>
                <span className="font-semibold text-slate-700 print:text-black">
                  ₹{totals.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-3 border-t border-slate-200 print:border-black print:text-black">
                <span>Grand Total (INR):</span>
                <span className="text-accent-blue print:text-black text-base">
                  ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3 print:border-none print:p-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-black">Remarks & Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isReadOnly}
              rows={4}
              placeholder="Enter special validity terms, SLA parameters or milestone configurations..."
              className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-750 outline-none focus:border-accent-blue focus:bg-white disabled:opacity-50 resize-none print:bg-transparent print:border-none print:text-black print:px-0"
            />
          </div>

          {/* Client Accept Banner / Warning */}
          {status === 'ACCEPTED' && (
            <div className="rounded-lg border border-emerald-250 bg-emerald-50 p-4 flex items-start gap-3 print:hidden">
              <FileCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-800">Accepted Proposal</h4>
                <p className="text-slate-500 text-[11px] mt-1 leading-normal">
                  This proposal is officially locked. If converted, billing slabs will track milestones accordingly.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalBuilder;
