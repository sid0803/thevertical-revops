import React, { useState } from 'react';
import { Building2, DollarSign, Activity, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const STAGES = [
  { id: 'NEW', title: 'New', color: 'border-slate-500/40 text-slate-400 bg-slate-500/10' },
  { id: 'QUALIFIED', title: 'Qualified', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
  { id: 'MEETING', title: 'Meeting', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10' },
  { id: 'PROPOSAL', title: 'Proposal', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
  { id: 'NEGOTIATION', title: 'Negotiation', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
  { id: 'WON', title: 'Won', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
  { id: 'LOST', title: 'Lost', color: 'border-rose-500/40 text-rose-400 bg-rose-500/10' },
];

export const KanbanBoard = ({ initialDeals = [], onStageChange }) => {
  const [deals, setDeals] = useState(initialDeals);
  const [draggedDealId, setDraggedDealId] = useState(null);

  const handleDragStart = (e, dealId) => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const dealId = parseInt(e.dataTransfer.getData('text/plain'), 10) || draggedDealId;
    if (!dealId) return;

    setDeals((prevDeals) =>
      prevDeals.map((deal) =>
        deal.id === dealId
          ? {
              ...deal,
              stage: targetStage,
              win_probability: targetStage === 'WON' ? 100 : targetStage === 'LOST' ? 0 : deal.win_probability,
            }
          : deal
      )
    );

    if (onStageChange) {
      onStageChange(dealId, targetStage);
    }
    setDraggedDealId(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 select-none min-h-[600px]">
      {STAGES.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage.id);
        const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

        return (
          <div
            key={stage.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
            className="flex-1 min-w-[280px] max-w-[320px] rounded-2xl glass-panel p-3 flex flex-col justify-between"
          >
            {/* Stage Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.color.split(' ')[2]}`} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">{stage.title}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/10 text-slate-300">
                    {stageDeals.length}
                  </span>
                </div>
                <span className="text-xs font-bold text-purple-400">${stageValue.toLocaleString()}</span>
              </div>

              {/* Deal Cards Container */}
              <div className="space-y-3 min-h-[450px]">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    className="glass-panel glass-panel-hover p-4 rounded-xl cursor-grab active:cursor-grabbing group relative border border-white/10 hover:border-purple-500/40"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wide flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {deal.company_name || 'Enterprise Client'}
                      </span>
                      {deal.risk_flag ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" title={deal.risk_flag} />
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-400">{deal.win_probability}% win</span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                      {deal.title}
                    </h4>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <span className="font-bold text-white">${(deal.value || 0).toLocaleString()}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Activity className="w-3 h-3 text-slate-500" />
                        <span>Health {deal.health_score || 85}%</span>
                      </div>
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-xs text-slate-500 font-medium">
                    Drop deal here
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
