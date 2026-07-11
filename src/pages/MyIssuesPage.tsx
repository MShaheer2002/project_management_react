import React, { useDeferredValue, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  CheckSquare,
  Filter,
  Kanban,
  List,
  MoreHorizontal,
  Search,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '../AppContext';
import { PRIORITY_COLORS, ISSUE_TYPE_CONFIG } from '../constants';
import { getStatusLabel, isStatusFinal } from '@shared/constants/statuses';
import { useWorkspaceStatuses } from '@shared/hooks/useWorkspaceStatuses';
import { formatCalendarDate } from '@shared/utils/date';
import { Issue, IssueType, Status } from '../types';
import { KanbanBoard } from '../components/board/KanbanBoard';
import { useIssuesDirectory, useUpdateAnyIssueStatus } from '@/features/issues';

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

export const MyIssuesPage: React.FC = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const workspaceStatuses = useWorkspaceStatuses();
  const { setSelectedIssueId, showToast } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'assigned' | 'created' | 'completed'>('assigned');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<IssueType | 'all'>('all');
  const deferredSearch = useDeferredValue(search);

  const finalStatusKeys = workspaceStatuses.filter((s) => s.isFinal).map((s) => s.key);
  const issuesQuery = useIssuesDirectory(
    {
      q: deferredSearch.trim() || undefined,
      type: typeFilter === 'all' ? undefined : typeFilter,
      assigneeId: activeTab === 'assigned' || activeTab === 'completed' ? currentUser?.id : undefined,
      creatorId: activeTab === 'created' ? currentUser?.id : undefined,
      status: activeTab === 'completed' ? (finalStatusKeys[0] ?? 'done') : undefined,
      sort: 'updatedAt:desc',
      limit: 30,
    },
    { enabled: Boolean(currentUser?.id) }
  );
  const updateAnyIssueStatus = useUpdateAnyIssueStatus();

  const allIssues = useMemo(() => {
    const issuesById = new Map<string, Issue>();
    issuesQuery.data?.pages.forEach((page) => {
      page.items.forEach((issue) => {
        issuesById.set(issue.id, issue);
      });
    });
    return Array.from(issuesById.values());
  }, [issuesQuery.data]);

  const myIssues = useMemo(() => {
    if (activeTab === 'assigned') {
      return allIssues.filter((issue) => !isStatusFinal(workspaceStatuses, issue.status));
    }
    return allIssues;
  }, [activeTab, allIssues, workspaceStatuses]);

  const handleIssueUpdate = async (issueId: string, newStatus: Status) => {
    try {
      await updateAnyIssueStatus.mutateAsync({ issueId, status: newStatus });
      showToast(`Issue moved to ${getStatusLabel(workspaceStatuses, newStatus)}.`, 'success');
      return true;
    } catch {
      showToast('Failed to update issue status.', 'error');
      return false;
    }
  };

  const renderListView = () => (
    <div className="flex-1 overflow-y-auto">
      {myIssues.length > 0 ? (
        <div className="divide-y divide-gray-100 dark:divide-border-dark">
          {myIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => setSelectedIssueId(issue.entityId ?? issue.id)}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${issue.priority === 'urgent' ? 'bg-red-500' : 'bg-primary'}`} />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{issue.title}</span>
                    <TypeBadge type={issue.type || 'task'} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-mono uppercase flex-wrap">
                    <span>{issue.id}</span>
                    <span>•</span>
                    <span>{issue.project?.name || 'No Project'}</span>
                    <span>•</span>
                    <span>{getStatusLabel(workspaceStatuses, issue.status)}</span>
                    {(issue.subtaskStats?.total || issue.subtasks?.length) ? (
                      <>
                        <span>•</span>
                        <span>
                          {issue.subtaskStats?.completed ?? issue.subtasks?.filter((subtask) => subtask.completed).length ?? 0}/
                          {issue.subtaskStats?.total ?? issue.subtasks?.length ?? 0} subtasks
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${PRIORITY_COLORS[issue.priority]}`}>
                  {issue.priority}
                </span>
                <span className="text-xs text-gray-400 w-24 text-right">
                  {formatCalendarDate(issue.dueDate, undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })}
                </span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400">
                    <CheckCircle2 size={16} />
                  </button>
                  <button type="button" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <CheckSquare size={32} />
          </div>
          <h1 className="text-xl font-bold">No issues found</h1>
          <p className="text-sm text-gray-400 mt-2 max-w-xs">There are no issues matching the current tab and filters.</p>
        </div>
      )}
    </div>
  );

  if (issuesQuery.isLoading && myIssues.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Loading your issues...
      </div>
    );
  }

  if (issuesQuery.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle size={26} className="text-red-500" />
        <div className="space-y-1">
          <h1 className="text-lg font-bold">Failed to load issues</h1>
          <p className="text-sm text-gray-400">The My Issues request did not complete.</p>
        </div>
        <button
          type="button"
          onClick={() => issuesQuery.refetch()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 dark:border-border-dark bg-white dark:bg-bg-dark sticky top-0 z-20">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold truncate max-w-[150px] sm:max-w-none">My Issues</h1>
            <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
              <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{myIssues.length} issues</span>
            </div>
          </div>
          <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-md p-1 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className="flex items-center gap-1.5">
                <List size={14} />
                <span>List</span>
              </div>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'board' ? 'bg-white dark:bg-gray-800 shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className="flex items-center gap-1.5">
                <Kanban size={14} />
                <span>Board</span>
              </div>
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end min-w-0">
          <div className="relative flex-1 max-w-[240px] min-w-[140px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search issues..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md border border-gray-200 dark:border-border-dark bg-white dark:bg-white/5 shrink-0">
            <Filter size={14} className="text-gray-400" />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as IssueType | 'all')}
              className="bg-transparent border-none text-xs font-medium outline-none focus:ring-0 appearance-none pr-4 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="task">Tasks</option>
              <option value="bug">Bugs</option>
              <option value="issue">Issues</option>
            </select>
          </div>
        </div>
      </header>

      <div className="flex gap-8 px-6 border-b border-gray-200 dark:border-border-dark bg-gray-50/50 dark:bg-black/10 shrink-0">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`py-3 text-sm font-medium transition-colors relative ${activeTab === 'assigned' ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
          Assigned to Me
          {activeTab === 'assigned' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button
          onClick={() => setActiveTab('created')}
          className={`py-3 text-sm font-medium transition-colors relative ${activeTab === 'created' ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
          Created by Me
          {activeTab === 'created' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`py-3 text-sm font-medium transition-colors relative ${activeTab === 'completed' ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
          Completed
          {activeTab === 'completed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {viewMode === 'list' ? (
          renderListView()
        ) : (
          <KanbanBoard
            issues={myIssues}
            onIssueUpdate={handleIssueUpdate}
            onNewIssue={() => {}}
            hideNewIssueButton={true}
          />
        )}

        {issuesQuery.hasNextPage && (
          <div className="border-t border-gray-100 px-6 py-3 dark:border-border-dark">
            <button
              type="button"
              onClick={() => issuesQuery.fetchNextPage()}
              disabled={issuesQuery.isFetchingNextPage}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-border-dark dark:text-gray-300 dark:hover:bg-white/5"
            >
              {issuesQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
