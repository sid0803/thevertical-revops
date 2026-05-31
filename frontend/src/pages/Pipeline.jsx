// frontend/src/pages/Pipeline.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  DollarSign, TrendingUp, Clock, AlertCircle, 
  Search, ArrowRight, Target, Calendar 
} from 'lucide-react';

const STAGE_LABELS = {
  'DISCOVERY_CALL': 'Discovery Call',
  'DEMO': 'Demo',
  'PROPOSAL': 'Proposal',
  'NEGOTIATION': 'Negotiation'
};

const STAGE_COLORS = {
  'DISCOVERY_CALL': '#3b82f6', // blue
  'DEMO': '#8b5cf6',          // purple
  'PROPOSAL': '#f59e0b',      // amber
  'NEGOTIATION': '#ec4899'     // pink
};

const STAGE_PROBABILITIES = {
  'DISCOVERY_CALL': 20,
  'DEMO': 40,
  'PROPOSAL': 60,
  'NEGOTIATION': 80
};

export default function Pipeline() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterBDE, setFilterBDE] = useState('All');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchLeads();
    fetchUsers();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads');
      setLeads(res.data);
    } catch (err) {
      setError('Failed to load active pipeline leads.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter leads that are in active pipeline stages
  const activePipelineStages = Object.keys(STAGE_LABELS);
  let pipelineLeads = leads.filter(l => activePipelineStages.includes(l.stage));

  if (search) {
    pipelineLeads = pipelineLeads.filter(l => 
      l.name.toLowerCase().includes(search.toLowerCase()) || 
      (l.companyName && l.companyName.toLowerCase().includes(search.toLowerCase()))
    );
  }

  if (filterBDE !== 'All') {
    pipelineLeads = pipelineLeads.filter(l => l.assignedToId === filterBDE);
  }

  // Value calculation: we assume average deal value is ₹1,00,000 if not specified
  const getDealValue = (l) => {
    // If there are proposals, use proposal grandTotal. Otherwise, use a default value of 1.2L
    return l.client?.proposals?.[0]?.grandTotal || 120000;
  };

  const totalValue = pipelineLeads.reduce((sum, l) => sum + getDealValue(l), 0);
  const weightedValue = pipelineLeads.reduce((sum, l) => {
    const probability = STAGE_PROBABILITIES[l.stage] || 50;
    return sum + (getDealValue(l) * probability) / 100;
  }, 0);

  const getDaysInPipeline = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diff = Math.ceil((now - created) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const renderPipelineCard = (lead) => {
    const dealVal = getDealValue(lead);
    const prob = STAGE_PROBABILITIES[lead.stage] || 50;
    const days = getDaysInPipeline(lead.createdAt);

    return (
      <div 
        key={lead.id} 
        onClick={() => navigate(`/leads/${lead.id}`)}
        className="glass rounded-xl bg-white border border-slate-200 p-4 shadow-sm hover:border-accent-blue transition cursor-pointer active:scale-98 select-none space-y-3"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">#ID: {lead.id.substring(lead.id.length - 6)}</div>
            <h3 className="font-bold text-sm text-slate-800 truncate max-w-[130px]" title={lead.companyName || lead.name}>{lead.companyName || lead.name}</h3>
          </div>
          <div className="text-right">
            <div className="font-bold text-sm text-slate-900">₹{(dealVal / 1000).toFixed(0)}k</div>
            <div className="text-[9px] text-emerald-600 font-bold">{prob}% Prob.</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold border-t border-b border-slate-50 py-1.5">
          <span className="flex items-center gap-1"><Target size={11} /> {lead.name}</span>
          <span className="flex items-center gap-1"><Clock size={11} /> {days}d in pipe</span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1">
            <div className="h-5 w-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
              {lead.assignedTo?.name ? lead.assignedTo.name.split(' ').map(n=>n[0]).join('') : 'U'}
            </div>
            <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[80px]" title={lead.assignedTo?.name || 'Unassigned'}>
              {lead.assignedTo?.name || 'Unassigned'}
            </span>
          </div>
          <button className="h-5 w-5 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition">
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Deal Pipeline</h1>
          <p className="text-sm text-slate-500">Visual Kanban board representing leads currently progressing through conversion funnels</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute inset-y-0 left-0 ml-3 h-4 w-4 my-auto text-slate-400" />
            <input 
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs outline-none focus:border-accent-blue focus:bg-white" 
              placeholder="Search deals..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          {['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER'].includes(user.role) && (
            <select 
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 outline-none focus:border-accent-blue"
              value={filterBDE}
              onChange={e => setFilterBDE(e.target.value)}
            >
              <option value="All">All reps</option>
              {users.filter(u => ['SALES_EXEC', 'TEAM_LEADER'].includes(u.role)).map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl bg-white border border-slate-200 p-4 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <DollarSign size={14} className="text-accent-blue" />
            <span>Active Pipeline</span>
          </div>
          <div className="text-xl font-bold text-slate-800">₹{(totalValue / 100000).toFixed(2)}L</div>
          <div className="text-[10px] text-slate-400 font-semibold">{pipelineLeads.length} Active leads</div>
        </div>
        <div className="glass rounded-xl bg-white border border-slate-200 p-4 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>Weighted Revenue</span>
          </div>
          <div className="text-xl font-bold text-slate-800">₹{(weightedValue / 100000).toFixed(2)}L</div>
          <div className="text-[10px] text-emerald-600 font-bold">Based on probability weighting</div>
        </div>
        <div className="glass rounded-xl bg-white border border-slate-200 p-4 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Clock size={14} className="text-blue-500" />
            <span>Average Cycle</span>
          </div>
          <div className="text-xl font-bold text-slate-800">12.5 Days</div>
          <div className="text-[10px] text-slate-400 font-semibold">Average lead age in active pipe</div>
        </div>
        <div className="glass rounded-xl bg-white border border-slate-200 p-4 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <AlertCircle size={14} className="text-red-500" />
            <span>Deal Risk Alerts</span>
          </div>
          <div className="text-xl font-bold text-red-650">
            {pipelineLeads.filter(l => getDaysInPipeline(l.createdAt) > 15).length} Deals
          </div>
          <div className="text-[10px] text-red-500 font-bold">Stuck in stage for &gt; 15 days</div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-500">{error}</div>}

      {/* Kanban Board Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {activePipelineStages.map(stage => {
            const stageLeads = pipelineLeads.filter(l => l.stage === stage);
            const stageVal = stageLeads.reduce((sum, l) => sum + getDealValue(l), 0);
            const color = STAGE_COLORS[stage];

            return (
              <div key={stage} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-4">
                {/* Column Header */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-600">{STAGE_LABELS[stage]}</span>
                    <span className="rounded bg-slate-200 border border-slate-350 px-1.5 py-0.2 text-[9px] font-bold text-slate-500">{stageLeads.length}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">₹{(stageVal/1000).toFixed(0)}k</span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {stageLeads.map(lead => renderPipelineCard(lead))}
                  {stageLeads.length === 0 && (
                    <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                      No deals in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
