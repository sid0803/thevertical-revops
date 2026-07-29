import React, { useState } from 'react';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { mockData } from '../services/api';

export const Pipeline = () => {
  const [deals] = useState(mockData.deals);

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          Full Pipeline Stage Manager
        </h1>
        <p className="text-xs text-slate-400">Interactive Kanban pipeline progression across 7 distinct deal stages</p>
      </div>

      <KanbanBoard initialDeals={deals} />
    </div>
  );
};
