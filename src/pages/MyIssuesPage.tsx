import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  Bug,
  ChevronDown,
  CheckCircle2,
  CheckSquare,
  Clock,
  Filter,
  FolderKanban,
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
import { canDeleteIssues } from '@shared/permissions';
import { WorkflowStatusSelect } from '@shared/components/ui/WorkflowStatusSelect';
import { useWorkspaceStatuses } from '@shared/hooks/useWorkspaceStatuses';
import { getApiErrorMessage } from '@shared/services';
import { checkTransitionAllowed } from '@shared/utils/workflowTransitions';
import { formatCalendarDate } from '@shared/utils/date';
import { Issue, IssueType, Status, WorkspaceStatus } from '../types';
import { KanbanBoard } from '../components/board/KanbanBoard';
import { useDeleteAnyIssue, useIssuesDirectory, useUpdateAnyIssueStatus } from '@/features/issues';
import { useProjectOptions, useProjectWorkflows } from '@features/projects';
import { AssignIssuesToCycleDialog } from '@features/cycles';

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
  const role = useAuthStore((s) => s.workspace?.role);
  const ownWorkflowStatuses = useWorkspaceStatuses();
  const { setSelectedIssueId, showToast } = useApp();
  const navigate = useNavigate();
  const canDelete = canDeleteIssues(role);
  const [activeTab, setActiveTab] = useState<'assigned' | 'created' | 'completed'>('assigned');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<IssueType | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [activeIssueMenuId, setActiveIssueMenuId] = useState<string | null>(null);
  const [assignmentDraft, setAssignmentDraft] = useState<{ issueIds: string[]; teamId?: string } | null>(null);
  const [collapsedStatusKeys, setCollapsedStatusKeys] = useState<string[]>([]);
  const deferredSearch = useDeferredValue(search);

  const finalStatusKeys = ownWorkflowStatuses.filter((s) => s.isFinal).map((s) => s.key);
  const projectOptionsQuery = useProjectOptions({ sort: 'name:asc', limit: 100 });
  const projectOptions = projectOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const issuesQuery = useIssuesDirectory(
    {
      q: deferredSearch.trim() || undefined,
      type: typeFilter === 'all' ? undefined : typeFilter,
      projectId: projectFilter === 'all' ? undefined : projectFilter,
      assigneeId: activeTab === 'assigned' || activeTab === 'completed' ? currentUser?.id : undefined,
      creatorId: activeTab === 'created' ? currentUser?.id : undefined,
      status: activeTab === 'completed' ? (finalStatusKeys[0] ?? 'done') : undefined,
      sort: 'updatedAt:desc',
      limit: 30,
    },
    { enabled: Boolean(currentUser?.id) }
  );
  const updateAnyIssueStatus = useUpdateAnyIssueStatus();
  const deleteAnyIssue = useDeleteAnyIssue();

  const allIssues = useMemo(() => {
    const issuesById = new Map<string, Issue>();
    issuesQuery.data?.pages.forEach((page) => {
      page.items.forEach((issue) => {
        issuesById.set(issue.id, issue);
      });
    });
    return Array.from(issuesById.values());
  }, [issuesQuery.data]);

  // My Issues always spans every project the user is assigned to/created issues in,
  // so it needs the same cross-project workflow resolution as the All Issues view —
  // each project can have its own override, and a status like "cvzvc" from one
  // project shouldn't be invisible just because it's not in the workspace default.
  const distinctIssueProjectIds = useMemo(
    () => [...new Set(allIssues.map((issue) => issue.projectId))],
    [allIssues]
  );
  const projectWorkflowsById = useProjectWorkflows(distinctIssueProjectIds);
  const workspaceStatuses = useMemo<WorkspaceStatus[]>(() => {
    const merged = new Map<string, WorkspaceStatus>();
    ownWorkflowStatuses.forEach((status) => merged.set(status.key, status));
    projectWorkflowsById.forEach((workflow) => {
      workflow.statuses.forEach((status) => {
        if (!merged.has(status.key)) merged.set(status.key, status);
      });
    });
    return [...merged.values()].sort((a, b) => a.order - b.order);
  }, [ownWorkflowStatuses, projectWorkflowsById]);

  const myIssues = useMemo(() => {
    if (activeTab === 'assigned') {
      return allIssues.filter((issue) => !isStatusFinal(workspaceStatuses, issue.status));
    }
    return allIssues;
  }, [activeTab, allIssues, workspaceStatuses]);
  const visibleIssueIds = useMemo(() => myIssues.map((issue) => issue.id), [myIssues]);
  const allVisibleSelected = visibleIssueIds.length > 0 && visibleIssueIds.every((issueId) => selectedIssueIds.includes(issueId));
  const someVisibleSelected = visibleIssueIds.some((issueId) => selectedIssueIds.includes(issueId));
  const listStatusGroups = useMemo(
    () =>
      workspaceStatuses
        .filter((status) => status.visibility.list !== false)
        .map((status) => ({
          status,
          items: myIssues.filter((issue) => issue.status === status.key),
        }))
        .filter((group) => group.items.length > 0),
    [myIssues, workspaceStatuses]
  );

  useEffect(() => {
    setSelectedIssueIds((current) => current.filter((issueId) => myIssues.some((issue) => issue.id === issueId)));
  }, [myIssues]);

  const handleIssueUpdate = async (issueId: string, newStatus: Status) => {
    const issue = allIssues.find((item) => item.id === issueId);
    if (issue && role) {
      const issueOwnStatuses = projectWorkflowsById.get(issue.projectId)?.statuses ?? ownWorkflowStatuses;
      const check = checkTransitionAllowed(issueOwnStatuses, {
        currentStatusKey: issue.status,
        nextStatusKey: newStatus,
        actorRole: role,
        actorUserId: currentUser?.id,
        assigneeId: issue.assigneeId,
        creatorId: issue.creatorId,
      });
      if (check.allowed === false) {
        showToast(check.reason, 'error');
        return false;
      }
    }

    try {
      await updateAnyIssueStatus.mutateAsync({ issueId, status: newStatus });
      return true;
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update issue status.', 'error');
      return false;
    }
  };

  const toggleIssueSelection = (issueId: string) => {
    setSelectedIssueIds((current) =>
      current.includes(issueId) ? current.filter((id) => id !== issueId) : [...current, issueId]
    );
  };

  const toggleSelectAllVisible = () => {
    setSelectedIssueIds((current) => {
      if (allVisibleSelected) {
        return current.filter((issueId) => !visibleIssueIds.includes(issueId));
      }

      return [...new Set([...current, ...visibleIssueIds])];
    });
  };

  const openAssignDialog = (issueIds: string[]) => {
    const selectedIssues = myIssues.filter((issue) => issueIds.includes(issue.id));
    const teamIds = [...new Set(selectedIssues.map((issue) => issue.teamId).filter(Boolean))];

    if (selectedIssues.length === 0) {
      showToast('Select at least one issue first.', 'error', 'Validation');
      return;
    }

    if (teamIds.length !== 1) {
      showToast('Selected issues must belong to the same team to add them into a cycle.', 'error', 'Team mismatch');
      return;
    }

    setActiveIssueMenuId(null);
    setAssignmentDraft({ issueIds, teamId: teamIds[0] });
  };

  const toggleStatusSection = (statusKey: string) => {
    setCollapsedStatusKeys((current) =>
      current.includes(statusKey) ? current.filter((key) => key !== statusKey) : [...current, statusKey]
    );
  };

  const handleDeleteIssues = async (issueIds: string[]) => {
    if (!canDelete) {
      showToast('Delete is restricted to admins and owners.', 'error', 'Permission denied');
      return;
    }

    if (issueIds.length === 0) {
      showToast('Select at least one issue first.', 'error', 'Validation');
      return;
    }

    const confirmed = window.confirm(
      issueIds.length === 1
        ? 'Delete this issue permanently?'
        : `Delete ${issueIds.length} selected issues permanently?`
    );
    if (!confirmed) return;

    try {
      await Promise.all(issueIds.map((issueId) => deleteAnyIssue.mutateAsync(issueId)));
      showToast(`${issueIds.length} issue${issueIds.length === 1 ? '' : 's'} deleted.`, 'success');
      setSelectedIssueIds((current) => current.filter((issueId) => !issueIds.includes(issueId)));
      setActiveIssueMenuId(null);
    } catch {
      showToast('Failed to delete selected issues.', 'error', 'Delete failed');
    }
  };

  const renderListView = () => (
    <div className="flex-1 overflow-y-auto px-4 py-5">
      {myIssues.length > 0 ? (
        <div className="space-y-3">
          {listStatusGroups.map(({ status, items }) => {
            const isCollapsed = collapsedStatusKeys.includes(status.key);
            const groupIds = items.map((issue) => issue.id);
            const selectedCount = items.filter((issue) => selectedIssueIds.includes(issue.id)).length;
            const allGroupSelected = items.length > 0 && selectedCount === items.length;

            return (
              <section
                key={status.key}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark"
              >
                <button
                  type="button"
                  onClick={() => toggleStatusSection(status.key)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                    />
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: status.color }} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {status.label}
                        </h3>
                        {status.isFinal && (
                          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-500">
                            Done
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {items.length} issue{items.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-3"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allGroupSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = selectedCount > 0 && selectedCount < items.length;
                      }}
                      onChange={() =>
                        setSelectedIssueIds((current) => {
                          if (allGroupSelected) {
                            return current.filter((issueId) => !groupIds.includes(issueId));
                          }
                          return [...new Set([...current, ...groupIds])];
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 bg-transparent text-primary focus:ring-primary/30"
                    />
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="border-t border-gray-200 dark:border-border-dark">
                    <div className="grid grid-cols-[44px_32px_1fr_120px_120px_120px_44px] gap-4 bg-gray-50/60 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:bg-black/10">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={allGroupSelected}
                          ref={(input) => {
                            if (input) input.indeterminate = selectedCount > 0 && selectedCount < items.length;
                          }}
                          onChange={() =>
                            setSelectedIssueIds((current) => {
                              if (allGroupSelected) {
                                return current.filter((issueId) => !groupIds.includes(issueId));
                              }
                              return [...new Set([...current, ...groupIds])];
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300 bg-transparent text-primary focus:ring-primary/30"
                        />
                      </div>
                      <div className="flex justify-center">
                        <ArrowUpDown size={10} />
                      </div>
                      <div>Title</div>
                      <div>Workflow</div>
                      <div>Priority</div>
                      <div>Due Date</div>
                      <div />
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-border-dark">
                      {items.map((issue) => (
                        <div
                          key={issue.id}
                          onClick={() => setSelectedIssueId(issue.id)}
                          className={`grid grid-cols-[44px_32px_1fr_120px_120px_120px_44px] items-center gap-4 px-5 py-4 transition-colors group ${
                            selectedIssueIds.includes(issue.id)
                              ? 'bg-primary/5 dark:bg-primary/10'
                              : 'hover:bg-gray-50 dark:hover:bg-white/5'
                          } cursor-pointer`}
                        >
                          <div
                            className="flex justify-center"
                            onClick={(event) => {
                              event.stopPropagation();
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIssueIds.includes(issue.id)}
                              onChange={() => toggleIssueSelection(issue.id)}
                              className="h-4 w-4 rounded border-gray-300 bg-transparent text-primary focus:ring-primary/30"
                            />
                          </div>
                          <div className="flex justify-center">
                            <div className={`h-2 w-2 rounded-full shrink-0 ${issue.priority === 'urgent' ? 'bg-red-500' : 'bg-primary'}`} />
                          </div>
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{issue.title}</span>
                                <TypeBadge type={issue.type || 'task'} />
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase text-gray-400">
                                <span>{issue.id}</span>
                                <span>•</span>
                                <span>{issue.project?.name || 'No Project'}</span>
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
                          <div
                            className="flex items-center"
                            onClick={(event) => {
                              event.stopPropagation();
                            }}
                          >
                            <WorkflowStatusSelect
                              value={issue.status}
                              statuses={workspaceStatuses}
                              onChange={(nextStatus) => {
                                void handleIssueUpdate(issue.id, nextStatus);
                              }}
                            />
                          </div>
                          <div className="flex items-center shrink-0">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${PRIORITY_COLORS[issue.priority]}`}>
                              {issue.priority}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            {formatCalendarDate(issue.dueDate, undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })}
                          </div>
                          <div className="relative flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setActiveIssueMenuId((current) => (current === issue.id ? null : issue.id));
                              }}
                              className="p-1 rounded text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {activeIssueMenuId === issue.id && (
                              <div className="absolute right-0 top-9 z-20 min-w-[180px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-border-dark dark:bg-card-dark">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openAssignDialog([issue.id]);
                                  }}
                                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5 dark:hover:text-white"
                                >
                                  Add To Cycle
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
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
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-border-dark bg-white dark:bg-white/5 shrink-0">
            <FolderKanban size={14} className="text-gray-400" />
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="bg-transparent border-none text-xs font-medium outline-none focus:ring-0 appearance-none pr-4 cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {viewMode === 'list' && selectedIssueIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-3 dark:border-border-dark dark:bg-bg-dark">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">{selectedIssueIds.length} selected</span>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveIssueMenuId((current) => (current === '__bulk__' ? null : '__bulk__'))}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-border-dark dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
            >
              <MoreHorizontal size={15} />
              Actions
            </button>
            {activeIssueMenuId === '__bulk__' && (
              <div className="absolute right-0 top-11 z-20 min-w-[220px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-border-dark dark:bg-card-dark">
                <button
                  type="button"
                  onClick={() => {
                    setActiveIssueMenuId(null);
                    navigate('/issues/create');
                  }}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  Add New Issue
                </button>
                <button
                  type="button"
                  onClick={() => openAssignDialog(selectedIssueIds)}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  Add To Cycle
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteIssues(selectedIssueIds)}
                    className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIssueIds([]);
                    setActiveIssueMenuId(null);
                  }}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
            statuses={workspaceStatuses}
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
      <AssignIssuesToCycleDialog
        open={Boolean(assignmentDraft)}
        onClose={() => setAssignmentDraft(null)}
        teamId={assignmentDraft?.teamId}
        issueIds={assignmentDraft?.issueIds ?? []}
      />
    </div>
  );
};
