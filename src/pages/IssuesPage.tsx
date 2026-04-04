import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, MoreHorizontal, Plus, Filter, Search as SearchIcon, ArrowUpDown, Calendar } from 'lucide-react';
import { useApp } from '../AppContext';
import { MOCK_ISSUES, MOCK_USERS, PRIORITY_COLORS, STATUS_LABELS } from '../constants';
import { Priority, Status } from '../types';

const PriorityIcon: React.FC<{ priority: Priority }> = ({ priority }) => {
  switch (priority) {
    case 'urgent': return <AlertCircle size={14} className="text-red-500" />;
    case 'high': return <AlertCircle size={14} className="text-orange-500" />;
    case 'medium': return <AlertCircle size={14} className="text-blue-500" />;
    case 'low': return <AlertCircle size={14} className="text-gray-400" />;
  }
};

const StatusIcon: React.FC<{ status: Status }> = ({ status }) => {
  switch (status) {
    case 'done': return <CheckCircle2 size={14} className="text-green-500" />;
    case 'in-progress': return <Clock size={14} className="text-blue-500" />;
    case 'review': return <Clock size={14} className="text-purple-500" />;
    case 'todo': return <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400" />;
    case 'backlog': return <div className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-gray-400" />;
  }
};

export const IssuesPage: React.FC<{ projectId?: string; initialViewMode?: 'list' | 'kanban' | 'calendar' }> = ({ projectId, initialViewMode = 'list' }) => {
  const { setSelectedIssueId, setView } = useApp();
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIssues = MOCK_ISSUES.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = !projectId || issue.projectId === projectId;
    return matchesSearch && matchesProject;
  });

  const renderListView = () => (
    <>
      {/* List Header */}
      <div className="grid grid-cols-[40px_100px_1fr_120px_150px_120px_40px] gap-4 px-6 py-2 border-b border-gray-200 dark:border-border-dark text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-black/10">
        <div className="flex justify-center"><ArrowUpDown size={10} /></div>
        <div>ID</div>
        <div>Title</div>
        <div>Status</div>
        <div>Assignee</div>
        <div>Priority</div>
        <div></div>
      </div>

      {/* Issue List */}
      <div className="flex-1 overflow-y-auto">
        {filteredIssues.length > 0 ? (
          filteredIssues.map(issue => {
            const assignee = MOCK_USERS.find(u => u.id === issue.assigneeId);
            return (
              <div 
                key={issue.id}
                onClick={() => setSelectedIssueId(issue.id)}
                className="grid grid-cols-[40px_100px_1fr_120px_150px_120px_40px] gap-4 px-6 py-3 border-b border-gray-100 dark:border-border-dark/50 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
              >
                <div className="flex justify-center items-center">
                  <PriorityIcon priority={issue.priority} />
                </div>
                <div className="text-xs font-mono text-gray-400 flex items-center">{issue.id}</div>
                <div className="flex flex-col justify-center">
                  <span className="text-sm font-medium truncate">{issue.title}</span>
                  <div className="flex gap-1 mt-1">
                    {issue.labels.map(l => (
                      <span key={l} className="text-[10px] px-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">{l}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center gap-2 text-xs">
                    <StatusIcon status={issue.status} />
                    <span>{STATUS_LABELS[issue.status]}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  {assignee ? (
                    <div className="flex items-center gap-2 text-xs">
                      <img src={assignee.avatar} className="w-5 h-5 rounded-full" alt={assignee.name} />
                      <span className="truncate">{assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Unassigned</span>
                  )}
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${PRIORITY_COLORS[issue.priority]}`}>
                    {issue.priority}
                  </span>
                </div>
                <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <SearchIcon size={48} className="mb-4 opacity-10" />
            <p className="text-sm">No issues found matching your search.</p>
          </div>
        )}
      </div>
    </>
  );

  const renderKanbanView = () => {
    const columns: Status[] = ['backlog', 'todo', 'in-progress', 'review', 'done'];
    return (
      <div className="flex-1 overflow-x-auto p-6 bg-gray-50/30 dark:bg-black/10">
        <div className="flex gap-6 h-full min-w-max">
          {columns.map(status => (
            <div key={status} className="w-80 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <StatusIcon status={status} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">{STATUS_LABELS[status]}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-500">
                    {filteredIssues.filter(i => i.status === status).length}
                  </span>
                </div>
                <button 
                  onClick={() => setView('create-issue')}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400"
                >
                  <Plus size={14} />
                </button>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-hide">
                {filteredIssues.filter(i => i.status === status).map(issue => {
                  const assignee = MOCK_USERS.find(u => u.id === issue.assigneeId);
                  return (
                    <div 
                      key={issue.id}
                      onClick={() => setSelectedIssueId(issue.id)}
                      className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-4 shadow-sm hover:border-primary/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-gray-400">{issue.id}</span>
                        <PriorityIcon priority={issue.priority} />
                      </div>
                      <h4 className="text-sm font-medium mb-3 line-clamp-2">{issue.title}</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {issue.labels.slice(0, 2).map(l => (
                            <span key={l} className="text-[9px] px-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">{l}</span>
                          ))}
                        </div>
                        {assignee && <img src={assignee.avatar} className="w-5 h-5 rounded-full" alt={assignee.name} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCalendarView = () => (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-border-dark border border-gray-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 dark:bg-black/20 p-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {day}
          </div>
        ))}
        {Array.from({ length: 35 }).map((_, i) => {
          const day = i - 3; // Mocking current month starting on Wednesday
          const issuesForDay = day > 0 && day <= 31 ? filteredIssues.filter(iss => iss.id.endsWith(day.toString())) : [];
          
          return (
            <div key={i} className="bg-white dark:bg-card-dark min-h-[120px] p-2 flex flex-col gap-1">
              {day > 0 && day <= 31 && (
                <>
                  <span className="text-xs font-medium text-gray-400 mb-1">{day}</span>
                  {issuesForDay.map(iss => (
                    <div 
                      key={iss.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedIssueId(iss.id); }}
                      className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-medium text-primary truncate cursor-pointer hover:bg-primary/20 transition-colors"
                    >
                      {iss.id}: {iss.title}
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold">All Issues</h1>
          <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-md p-1">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              List
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-800 shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Board
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-800 shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Calendar
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search issues..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm outline-none w-64 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 text-sm transition-colors">
            <Filter size={14} />
            <span>Filter</span>
          </button>
          <button 
            onClick={() => setView('create-issue')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            <span>New Issue</span>
          </button>
        </div>
      </header>

      {viewMode === 'list' && renderListView()}
      {viewMode === 'kanban' && renderKanbanView()}
      {viewMode === 'calendar' && renderCalendarView()}
    </div>
  );
};
