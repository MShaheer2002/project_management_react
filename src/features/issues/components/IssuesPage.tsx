import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, AlertCircle, MoreHorizontal, Plus, Filter, Search as SearchIcon, ArrowUpDown, Calendar, Building2, CheckSquare, Bug, Zap } from 'lucide-react';
import { useApp } from '@/AppContext';
import { MOCK_ISSUES, MOCK_USERS, MOCK_DEPARTMENTS, MOCK_PROJECTS, MOCK_TEAMS, PRIORITY_COLORS, STATUS_LABELS, ISSUE_TYPE_CONFIG } from '@/constants';
import { Issue, IssueType, Priority, Status } from '@/types';
import { getStoredIssues } from '@/lib/issue-storage';

const TypeBadge: React.FC<{ type: IssueType }> = ({ type }) => {
  const config = ISSUE_TYPE_CONFIG[type];
  return (
    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${config.color}`}>
      {type === 'task' && <CheckSquare size={10} />}
      {type === 'bug' && <Bug size={10} />}
      {type === 'issue' && <Zap size={10} />}
      {config.label}
    </span>
  );
};

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

import { KanbanBoard } from '@/components/board/KanbanBoard';

export const IssuesPage: React.FC<{ projectId?: string; initialViewMode?: 'list' | 'kanban' | 'calendar' }> = ({ projectId, initialViewMode = 'list' }) => {
  const { setSelectedIssueId, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamIdFromQuery = searchParams.get('team') || undefined;
    
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<IssueType | 'all'>('all');
  const [storedIssues, setStoredIssues] = useState<Issue[]>([]);

  useEffect(() => {
    setStoredIssues(getStoredIssues());
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'created_issues') {
        setStoredIssues(getStoredIssues());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const teamLabel = useMemo(() => MOCK_TEAMS.find(t => t.id === teamIdFromQuery)?.name, [teamIdFromQuery]);

  const allIssues = useMemo(() => {
    return [...MOCK_ISSUES, ...storedIssues];
  }, [storedIssues]);

  const filteredIssues = allIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = !projectId || issue.projectId === projectId;
    const matchesTeam = !teamIdFromQuery || issue.teamId === teamIdFromQuery;
    const matchesType = typeFilter === 'all' || issue.type === typeFilter;
    
    const matchesDepartment = departmentFilter === 'all' || 
                             MOCK_TEAMS.find(t => t.id === issue.teamId)?.departmentId === departmentFilter;

    return matchesSearch && matchesProject && matchesDepartment && matchesTeam && matchesType;
  });

  const handleIssueUpdate = (issueId: string, newStatus: Status) => {
    showToast(`Issue ${issueId} moved to ${STATUS_LABELS[newStatus]}`);
    // In a real app, we would update the backend/storage here
  };

  const renderListView = () => (
    <>
      {/* List Header */}
      <div className="grid grid-cols-[40px_100px_1fr_100px_120px_150px_120px_40px] gap-4 px-6 py-2 border-b border-gray-200 dark:border-border-dark text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-black/10">
        <div className="flex justify-center"><ArrowUpDown size={10} /></div>
        <div>ID</div>
        <div>Title</div>
        <div>Type</div>
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
                className="grid grid-cols-[40px_100px_1fr_100px_120px_150px_120px_40px] gap-4 px-6 py-3 border-b border-gray-100 dark:border-border-dark/50 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
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
                  <TypeBadge type={issue.type || 'task'} />
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

  const renderKanbanView = () => (
    <KanbanBoard 
      issues={filteredIssues} 
      onIssueUpdate={handleIssueUpdate}
      onNewIssue={(status) => navigate(`/issues/create?status=${status}`)}
    />
  );

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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 dark:border-border-dark bg-white dark:bg-bg-dark sticky top-0 z-20">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-none">
              {teamLabel ? `${teamLabel} — Issues` : 'All Issues'}
            </h1>
            {teamLabel && (
              <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                Team scope
              </span>
            )}
          </div>
          <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-md p-1 shrink-0">
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
        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end min-w-0">
          <div className="relative flex-1 max-w-[240px] min-w-[140px]">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search issues..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md border border-gray-200 dark:border-border-dark bg-white dark:bg-white/5 shrink-0">
            <Filter size={14} className="text-gray-400" />
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as IssueType | 'all')}
              className="bg-transparent border-none text-xs font-medium outline-none focus:ring-0 appearance-none pr-4 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="task">Tasks</option>
              <option value="bug">Bugs</option>
              <option value="issue">Issues</option>
            </select>
          </div>
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-border-dark bg-white dark:bg-white/5 shrink-0">
            <Building2 size={14} className="text-gray-400" />
            <select 
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-medium outline-none focus:ring-0 appearance-none pr-4 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {MOCK_DEPARTMENTS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 text-sm transition-colors shrink-0">
            <Filter size={14} />
            <span className="hidden sm:inline">Filter</span>
          </button>
          <button 
            onClick={() => navigate('/issues/create')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Issue</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        {viewMode === 'list' && renderListView()}
        {viewMode === 'kanban' && renderKanbanView()}
        {viewMode === 'calendar' && renderCalendarView()}
      </div>
    </div>
  );
};
