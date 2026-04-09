import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Map, Plus, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { MOCK_PROJECTS, MOCK_TEAMS } from '../constants';

export const RoadmapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('team') || undefined;
  const projects = useMemo(
    () => (teamId ? MOCK_PROJECTS.filter(p => p.teamId === teamId) : MOCK_PROJECTS),
    [teamId]
  );
  const teamName = useMemo(() => MOCK_TEAMS.find(t => t.id === teamId)?.name, [teamId]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{teamName ? `${teamName} — Roadmap` : 'Roadmap'}</h1>
            {teamName && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                Team scope
              </span>
            )}
          </div>
          <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-md p-1">
            <button className="px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 rounded shadow-sm">Quarterly</button>
            <button className="px-3 py-1 text-xs font-medium text-gray-400">Monthly</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-4">
            <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400"><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium">Q1 2024</span>
            <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400"><ChevronRight size={16} /></button>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={14} />
            <span>Add Project</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="min-w-[1200px] h-full flex flex-col">
          {/* Timeline Header */}
          <div className="flex border-b border-gray-200 dark:border-border-dark bg-gray-50/50 dark:bg-black/10">
            <div className="w-64 border-r border-gray-200 dark:border-border-dark p-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Projects
            </div>
            <div className="flex-1 flex">
              {months.slice(0, 3).map(month => (
                <div key={month} className="flex-1 border-r border-gray-200 dark:border-border-dark p-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">
                  {month}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Body */}
          <div className="flex-1 divide-y divide-gray-100 dark:divide-border-dark">
            {projects.map((project, idx) => (
              <div key={project.id} className="flex group">
                <div className="w-64 border-r border-gray-200 dark:border-border-dark p-4 flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{project.name}</span>
                  <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400"><MoreHorizontal size={14} /></button>
                </div>
                <div className="flex-1 relative flex items-center p-4">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex">
                    <div className="flex-1 border-r border-gray-100 dark:border-border-dark/30" />
                    <div className="flex-1 border-r border-gray-100 dark:border-border-dark/30" />
                    <div className="flex-1" />
                  </div>
                  
                  {/* Project Bar */}
                  <div 
                    className={`h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center px-3 relative z-10 transition-all hover:bg-primary/30 cursor-pointer`}
                    style={{ 
                      width: `${40 + (idx * 15)}%`,
                      marginLeft: `${idx * 10}%`
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-primary truncate">{project.name}</span>
                      <span className="text-[10px] text-primary/70 font-bold">{project.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
