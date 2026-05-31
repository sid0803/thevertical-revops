// frontend/src/pages/Proposals/ProposalPublicView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  ShieldCheck, FileText, ChevronLeft, ChevronRight, 
  Send, DollarSign, Clock, Sparkles, Building 
} from 'lucide-react';

export default function ProposalPublicView() {
  const { id } = useParams();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [signed, setSigned] = useState(false);

  // Interval reference for page heartbeat tracking
  const currentPageRef = useRef(currentPage);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    fetchPublicProposal();
  }, [id]);

  useEffect(() => {
    if (!proposal) return;

    // Send a page engagement heartbeat every 5 seconds of active view time
    const interval = setInterval(() => {
      if (document.hasFocus()) {
        axios.post(`http://localhost:5000/api/proposals/public/${id}/engage`, {
          pageNumber: currentPageRef.current,
          durationSec: 5
        })
        .catch(err => console.error('Failed to log page heartbeat', err));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [proposal, id]);

  const fetchPublicProposal = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/proposals/public/${id}`);
      setProposal(res.data);
    } catch (err) {
      setError('Proposal not found or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSign = async () => {
    setSigned(true);
    // Optionally update proposal status in the backend
    try {
      await axios.put(`http://localhost:5000/api/proposals/${id}`, { status: 'ACCEPTED' });
    } catch (e) {
      // Ignored for demo
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div>
          <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Loading Secure Proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-150 p-6">
        <div className="glass rounded-2xl max-w-md bg-slate-800/80 border border-slate-700 p-8 text-center space-y-4 shadow-2xl">
          <div className="h-12 w-12 rounded-full bg-red-950 border border-red-500 flex items-center justify-center mx-auto text-red-500">
            <FileText size={24} />
          </div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Access Blocked</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error || "This document could not be retrieved."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Container */}
      <div className="w-full max-w-4xl glass rounded-3xl bg-slate-900 border border-slate-800/80 shadow-2xl overflow-hidden flex flex-col h-[650px] relative">
        
        {/* Header Letterhead */}
        <div className="bg-slate-850/80 border-b border-slate-800 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-base">V</div>
            <div>
              <span className="font-extrabold text-sm tracking-wider text-white">TheVertical.ai</span>
              <span className="text-[10px] text-slate-450 block font-semibold uppercase tracking-widest">Maestro CRM Pro</span>
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider">{proposal.proposalNumber}</span>
            <span className="text-[9px] text-slate-450 block font-bold uppercase tracking-wider">Valid for {proposal.validityDays} Days</span>
          </div>
        </div>

        {/* View Content (Scrollable Page Container) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
          
          {/* PAGE 1: EXECUTIVE SUMMARY */}
          {currentPage === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Page 1: Scope of Engagement</span>
                <h2 className="text-2xl font-light text-white">Executive Partnership Proposal</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dear <strong>{proposal.clientName}</strong> Team,
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                We are delighted to submit this formal proposal outlining the custom enterprise deployment of our 
                <strong> TheVertical.ai Maestro Suite</strong>. Our platform serves as a modern Revenue Operations control hub 
                by unifying visual pipelines, high-velocity dialers, and incentive split-mappings into a single cohesive system.
              </p>
              <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="font-bold text-xs text-indigo-300 uppercase tracking-wider">Primary Objectives</h4>
                <ul className="text-xs text-slate-400 list-disc list-inside space-y-2 leading-relaxed">
                  <li>Deploy automated local-presence dialing queues for all prospecting teams.</li>
                  <li>Enable dynamic SLA handoffs checkpoints with visual Kanban pipeline stages.</li>
                  <li>Implement multi-factor deal risk prioritization charts.</li>
                </ul>
              </div>
              <p className="text-xs text-slate-450 leading-relaxed italic">
                Please proceed to the next page to review the commercial specifications and pricing items.
              </p>
            </div>
          )}

          {/* PAGE 2: COMMERCIAL SPECIFICATIONS */}
          {currentPage === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Page 2: Commercial Specifications</span>
                <h2 className="text-2xl font-light text-white">Pricing & Components</h2>
              </div>
              
              <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/50">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-850 text-slate-400 font-bold uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Component</th>
                      <th className="py-3 px-4 text-center">Billing Type</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Cost/Unit</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-350">
                    {proposal.lineItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-850/20 transition">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div>{item.component}</div>
                          {item.description && <div className="text-[10px] text-slate-450 font-normal mt-0.5">{item.description}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-center text-[10px] font-bold tracking-wider">{item.billingType}</td>
                        <td className="py-3.5 px-4 text-center font-bold">{item.qty}</td>
                        <td className="py-3.5 px-4 text-right">₹{item.costPerUnit.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-white">₹{item.totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAGE 3: ACCEPTANCE & SIGNATURE */}
          {currentPage === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Page 3: Acceptance & final agreement</span>
                <h2 className="text-2xl font-light text-white">Acceptance of Proposal</h2>
              </div>

              {/* Totals Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-850/50 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Subtotal (Excl. GST)</span>
                  <span className="text-lg font-bold text-white block">₹{proposal.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-slate-850/50 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">GST ({proposal.gstRate}%)</span>
                  <span className="text-lg font-bold text-slate-300 block">₹{proposal.gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-slate-850 border border-indigo-900 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-indigo-300 uppercase font-semibold">Grand Total</span>
                  <span className="text-lg font-extrabold text-emerald-400 block">₹{proposal.grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Sign Area */}
              <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                {signed ? (
                  <div className="space-y-2 text-center animate-scaleIn">
                    <div className="h-10 w-10 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-500">
                      <ShieldCheck size={20} />
                    </div>
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Proposal Accepted & Signed</h3>
                    <p className="text-xs text-slate-400">Signed electronically on {new Date().toLocaleDateString('en-IN')}. Thank you!</p>
                  </div>
                ) : (
                  <div className="space-y-4 w-full max-w-sm">
                    <div className="text-xs text-slate-450 leading-relaxed">
                      By clicking "Accept & Authorize", you agree to the rates and terms detailed in this proposal.
                    </div>
                    <button 
                      onClick={handleAcceptSign}
                      className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-750 transition active:scale-95"
                    >
                      <ShieldCheck size={16} />
                      <span>Accept & Authorize</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-850/80 border-t border-slate-800 p-5 flex items-center justify-between shrink-0">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-xs font-bold text-slate-350 hover:bg-slate-800 hover:text-white transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>
          
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map(page => (
              <span 
                key={page} 
                className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${currentPage === page ? 'bg-indigo-500 w-3.5' : 'bg-slate-700'}`} 
              />
            ))}
          </div>

          <button 
            disabled={currentPage === 3}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-xs font-bold text-slate-350 hover:bg-slate-800 hover:text-white transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
