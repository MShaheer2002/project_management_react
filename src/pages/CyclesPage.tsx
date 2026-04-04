import React from 'react';
import { RotateCcw, Plus, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { MOCK_CYCLES } from '../constants';

import { useApp } from '../AppContext';

export const CyclesPage: React.FC = () => {
  const { setActiveModal } = useApp();
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Cycles</h1>
          <span className="text-xs text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
            {MOCK_CYCLES.length} total
          </span>
        </div>
        <button 
          onClick={() => setActiveModal('create-cycle')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          <span>Create Cycle</span>
        </button>
      </header>

      <div className="p-6 space-y-8 overflow-y-auto">
        {/* Current Cycle */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Current Cycle</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_CYCLES.filter(c => c.status === 'current').map(cycle => (
              <div key={cycle.id} className="bg-white dark:bg-card-dark border border-primary/30 rounded-xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-lg">
                  Active
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <RotateCcw size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">{cycle.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar size={12} />
                      <span>{cycle.startDate} - {cycle.endDate}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Progress</span>
                    <span className="font-bold">{cycle.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${cycle.progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-gray-400">{cycle.issueCount} issues</span>
                    <button className="text-primary font-bold hover:underline">View issues</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming & Completed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Upcoming Cycles</h2>
            <div className="space-y-3">
              {MOCK_CYCLES.filter(c => c.status === 'upcoming').map(cycle => (
                <div key={cycle.id} className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-4 flex items-center justify-between hover:border-primary/30 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                      <Clock size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{cycle.name}</h4>
                      <p className="text-xs text-gray-400">{cycle.startDate} - {cycle.endDate}</p>
                    </div>
                  </div>
                  <Plus size={16} className="text-gray-300" />
                </div>
              ))}
              {MOCK_CYCLES.filter(c => c.status === 'upcoming').length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-gray-200 dark:border-border-dark rounded-xl text-gray-400 text-sm">
                  No upcoming cycles planned.
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Completed Cycles</h2>
            <div className="space-y-3">
              {MOCK_CYCLES.filter(c => c.status === 'completed').map(cycle => (
                <div key={cycle.id} className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-4 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{cycle.name}</h4>
                      <p className="text-xs text-gray-400">{cycle.issueCount} issues completed</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-green-500">100%</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
