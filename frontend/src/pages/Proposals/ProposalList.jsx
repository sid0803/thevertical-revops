// frontend/src/pages/Proposals/ProposalList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Plus,
  Loader2,
  Calendar,
  AlertCircle,
  FileCheck,
  Send,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const ProposalList = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [convertingId, setConvertingId] = useState(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isSalesOrAdmin = ['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'].includes(user?.role);
  const isFinanceOrAdmin = ['SUPER_ADMIN', 'MANAGER', 'FINANCE'].includes(user?.role);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/proposals');
      setProposals(response.data);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('Failed to fetch proposals. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/proposals/${id}/send`);
      fetchProposals();
    } catch (err) {
      console.error('Error sending proposal:', err);
      alert(err.response?.data?.message || 'Failed to send proposal');
    }
  };

  const handleConvert = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to convert this proposal to a live invoice? This will set its status to ACCEPTED and create 50/50 billing slabs.')) {
      return;
    }
    try {
      setConvertingId(id);
      const response = await api.post(`/proposals/${id}/convert`);
      const newInvoice = response.data;
      alert(`Successfully converted proposal to invoice ${newInvoice.invoiceNumber}!`);
      navigate(`/billing`);
    } catch (err) {
      console.error('Error converting proposal:', err);
      alert(err.response?.data?.message || 'Failed to convert proposal. Ensure a client is linked.');
    } finally {
      setConvertingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700">
            <FileCheck className="h-3 w-3" />
            Accepted
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
            <Send className="h-3 w-3" />
            Sent
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
            <AlertCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-700">
            <FileText className="h-3 w-3" />
            Draft
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Widget */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Proposals & Custom Pricing</h1>
          <p className="text-xs text-slate-500">
            Build, review, and convert dynamic multi-tier client proposals with modular GST selectors.
          </p>
        </div>
        {isSalesOrAdmin && (
          <button
            onClick={() => navigate('/proposals/new')}
            className="flex items-center space-x-2 rounded bg-accent-blue px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-blue-750 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create Proposal</span>
          </button>
        )}
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-650">
          {error}
        </div>
      )}

      {/* Main Proposals Grid/List */}
      {proposals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-12 text-center bg-white shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-sm font-semibold text-slate-800">No proposals yet</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
            Get started by creating a customizable proposal with detailed SIM, concurrent trunks, and voice minute slabs.
          </p>
          {isSalesOrAdmin && (
            <button
              onClick={() => navigate('/proposals/new')}
              className="mt-4 inline-flex items-center gap-2 rounded bg-accent-blue/10 hover:bg-accent-blue/20 border border-accent-blue/20 px-4 py-2 text-xs font-bold text-accent-blue transition uppercase tracking-wider"
            >
              <Plus className="h-4 w-4" />
              Build First Proposal
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-500">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Proposal Details</th>
                  <th className="px-6 py-3.5">Client Name</th>
                  <th className="px-6 py-3.5">Created On</th>
                  <th className="px-6 py-3.5">Subtotal</th>
                  <th className="px-6 py-3.5">Grand Total</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                {proposals.map((prop) => (
                  <tr
                    key={prop.id}
                    onClick={() => navigate(`/proposals/${prop.id}`)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 group-hover:text-accent-blue transition-colors">
                        {prop.proposalNumber}
                      </div>
                      <div className="text-slate-400 text-[10px] mt-0.5">
                        Validity: {prop.validityDays} Days
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-700">
                        {prop.clientName || 'Custom Client'}
                      </div>
                      {prop.client && (
                        <div className="text-[9px] text-accent-blue font-bold uppercase tracking-wider mt-0.5">
                          Linked Account
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(prop.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-650 font-medium">
                      ₹{prop.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      ₹{prop.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      <div className="text-[9px] text-slate-400 font-normal mt-0.5">
                        ({prop.gstRate}% GST incl.)
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(prop.status)}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {prop.status === 'DRAFT' && (
                          <button
                            onClick={(e) => handleSend(prop.id, e)}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 transition uppercase tracking-wider"
                            title="Mark as Sent"
                          >
                            <Send className="h-3 w-3 text-blue-500" />
                            Send
                          </button>
                        )}
                        {prop.status !== 'ACCEPTED' && prop.clientId && isFinanceOrAdmin && (
                          <button
                            onClick={(e) => handleConvert(prop.id, e)}
                            disabled={convertingId === prop.id}
                            className="inline-flex items-center gap-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 px-2 py-1 text-[10px] font-bold text-emerald-700 transition uppercase tracking-wider"
                            title="Convert to Invoice"
                          >
                            {convertingId === prop.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <TrendingUp className="h-3 w-3 text-emerald-600" />
                            )}
                            Convert
                          </button>
                        )}
                        <Link
                          to={`/proposals/${prop.id}`}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 transition uppercase tracking-wider"
                        >
                          <span>Manage</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
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

export default ProposalList;
