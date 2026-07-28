import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Building2,
  Calendar,
  Filter,
  FolderKanban,
  Loader2,
  MoreHorizontal,
  Plus,
  Search as SearchIcon,
} from 'lucide-react';
import { useApp } from '@/AppContext';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { AssignIssuesToCycleDialog } from '@features/cycles';
import { canDeleteIssues } from '@shared/permissions';
import { useDepartmentsDirectory } from '@features/department';
import { useTeamDetail } from '@features/team';
import { useProjectOptions, useProjectWorkflows } from '@features/projects';
import { useWorkspaceMemberOptions } from '@features/workspace';
import { getApiErrorMessage } from '@shared/services';
import { useEffectiveWorkflowStatuses } from '@shared/hooks/useEffectiveWorkflowStatuses';
import { checkTransitionAllowed } from '@shared/utils/workflowTransitions';
import type { Issue, IssueType, Status, WorkspaceStatus } from '@/types';
import { useDeleteAnyIssue, useIssuesDirectory, useIssueStatusCounts, useUpdateAnyIssueStatus } from '../hooks/useIssueData';
import { IssueKanbanBoard } from './IssueKanbanBoard';
import { IssueStatusGroup } from './IssueStatusGroup';
import type { IssueBoardFilters } from './IssueBoardColumn';

type IssuesPageProps = {
  projectId?: string;
  teamId?: string;
  initialViewMode?: 'list' | 'kanban' | 'calendar';
  title?: string;
  showTeamScopeBadge?: boolean;
};

const buildCalendarDays = (issues: Issue[]) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const leadingDays = startOfMonth.getDay();
  const totalCells = Math.ceil((leadingDays + endOfMonth.getDate()) / 7) * 7;
  const gridStart = new Date(startOfMonth);
  gridStart.setDate(startOfMonth.getDate() - leadingDays);

  return Array.from({ length: totalCells }).map((_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const isoDate = date.toISOString().slice(0, 10);

    return {
      key: isoDate,
      date,
      issues: issues.filter((issue) => issue.dueDate?.slice(0, 10) === isoDate),
      isCurrentMonth: date.getMonth() === today.getMonth(),
    };
  });
};

type BoardAssigneeFilter = {
  id: string;
  name: string;
  avatar?: string | null;
};

export const IssuesPage: React.FC<IssuesPageProps> = ({
  projectId,
  teamId,
  initialViewMode = 'list',
  title,
  showTeamScopeBadge = true,
}) => {
  const { setSelectedIssueId, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamIdFromQuery = searchParams.get('team') || undefined;
  const activeTeamId = teamId ?? teamIdFromQuery;
  const role = useAuthStore((state) => state.workspace?.role);
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const canDelete = canDeleteIssues(role);
  const isCrossProject = !projectId;

  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<IssueType | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [activeIssueMenuId, setActiveIssueMenuId] = useState<string | null>(null);
  const [assignmentDraft, setAssignmentDraft] = useState<{ issueIds: string[]; teamId?: string } | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const effectiveProjectId = projectId ?? (projectFilter === 'all' ? undefined : projectFilter);
  const ownWorkflowStatuses = useEffectiveWorkflowStatuses(projectId);
  const [collapsedStatusKeys, setCollapsedStatusKeys] = useState<string[]>([]);
  const hasInitializedCollapse = useRef(false);
  // Board columns and list groups each fetch their own status independently (see
  // IssueBoardColumn/IssueStatusGroup) — this aggregates whatever they've loaded so
  // far purely for cross-project workflow resolution and the assignee filter, without
  // ever loading a workspace's full issue set into memory at once.
  const [loadedIssuesByStatus, setLoadedIssuesByStatus] = useState<Record<string, Issue[]>>({});
  const handleIssuesLoaded = useCallback((statusKey: string, loaded: Issue[]) => {
    setLoadedIssuesByStatus((current) => ({ ...current, [statusKey]: loaded }));
  }, []);

  const teamQuery = useTeamDetail(activeTeamId);
  const departmentsQuery = useDepartmentsDirectory(
    {
      sort: 'name:asc',
      limit: 100,
    },
    { enabled: true }
  );
  const projectOptionsQuery = useProjectOptions({ sort: 'name:asc', limit: 100 }, { enabled: isCrossProject });
  const assigneeOptionsQuery = useWorkspaceMemberOptions(
    {
      sort: 'name:asc',
      limit: 24,
    },
    { enabled: true }
  );
  const issuesQuery = useIssuesDirectory({
    q: deferredSearchQuery.trim() || undefined,
    projectId: effectiveProjectId,
    teamId: activeTeamId,
    departmentId: departmentFilter === 'all' ? undefined : departmentFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    sort: 'updatedAt:desc',
    limit: 30,
  });
  const updateAnyIssueStatus = useUpdateAnyIssueStatus();
  const deleteAnyIssue = useDeleteAnyIssue();

  // Memoized on the query's own `.data` (stable unless React Query actually refetched) —
  // a plain flatMap here would produce a brand-new array every render, which cascaded
  // into every memo/effect downstream (project workflow resolution, assignee options)
  // recomputing and re-fetching far more than the underlying data ever changed.
  const departments = useMemo(() => departmentsQuery.data?.pages.flatMap((page) => page.items) ?? [], [departmentsQuery.data]);
  const projectOptions = useMemo(() => projectOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [], [projectOptionsQuery.data]);
  const workspaceAssigneeOptions = useMemo(() => assigneeOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [], [assigneeOptionsQuery.data]);
  const issues = useMemo(() => {
    const issuesById = new Map<string, Issue>();
    issuesQuery.data?.pages.forEach((page) => {
      page.items.forEach((issue) => {
        issuesById.set(issue.id, issue);
      });
    });
    return Array.from(issuesById.values());
  }, [issuesQuery.data]);

  // Everything currently loaded anywhere on the page — the flat calendar query plus
  // whatever each board column / list group has independently fetched so far.
  const allLoadedIssues = useMemo(() => {
    const byId = new Map<string, Issue>();
    issues.forEach((issue) => byId.set(issue.id, issue));
    Object.values(loadedIssuesByStatus).forEach((list) => list.forEach((issue) => byId.set(issue.id, issue)));
    return Array.from(byId.values());
  }, [issues, loadedIssuesByStatus]);

  // Cross-project view: issues can belong to different projects, each potentially on
  // its own workflow. Resolve every accessible project's effective workflow up front
  // from the already-fetched project list (same data backing the project filter
  // dropdown) — not from which projects happen to be represented among issues loaded
  // so far. Columns/groups resolve independently and at different times, so deriving
  // this from loaded issues caused a waterfall: each column's arrival re-triggered
  // project-workflow resolution as the set of "known" projects grew incrementally.
  // Resolving from the project list instead means every workflow fetch starts
  // immediately, in parallel, exactly once.
  const distinctIssueProjectIds = useMemo(
    () => (isCrossProject ? projectOptions.map((project) => project.id) : []),
    [isCrossProject, projectOptions]
  );
  const projectWorkflowsById = useProjectWorkflows(distinctIssueProjectIds);
  const workspaceStatuses = useMemo<WorkspaceStatus[]>(() => {
    if (!isCrossProject) return ownWorkflowStatuses;

    const merged = new Map<string, WorkspaceStatus>();
    ownWorkflowStatuses.forEach((status) => merged.set(status.key, status));
    projectWorkflowsById.forEach((workflow) => {
      workflow.statuses.forEach((status) => {
        if (!merged.has(status.key)) merged.set(status.key, status);
      });
    });
    return [...merged.values()].sort((a, b) => a.order - b.order);
  }, [isCrossProject, ownWorkflowStatuses, projectWorkflowsById]);
  const boardAssignees = useMemo<BoardAssigneeFilter[]>(() => {
    const map = new Map<string, BoardAssigneeFilter>();

    workspaceAssigneeOptions.forEach((member) => {
      map.set(member.id, {
        id: member.id,
        name: member.name,
        avatar: undefined,
      });
    });

    allLoadedIssues.forEach((issue) => {
      if (!issue.assigneeId || !issue.assignee?.name) return;
      map.set(issue.assigneeId, {
        id: issue.assigneeId,
        name: issue.assignee.name,
        avatar: issue.assignee.avatar ?? null,
      });
    });

    return Array.from(map.values())
      .filter((member) => allLoadedIssues.some((issue) => issue.assigneeId === member.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allLoadedIssues, workspaceAssigneeOptions]);
  const teamLabel = teamQuery.data?.name;
  const pageTitle = title ?? (teamLabel ? `${teamLabel} — Issues` : 'All Issues');
  const calendarDays = useMemo(() => buildCalendarDays(issues), [issues]);
  const boardFilters = useMemo<IssueBoardFilters>(
    () => ({
      q: deferredSearchQuery.trim() || undefined,
      projectId: effectiveProjectId,
      teamId: activeTeamId,
      departmentId: departmentFilter === 'all' ? undefined : departmentFilter,
      type: typeFilter === 'all' ? undefined : typeFilter,
    }),
    [deferredSearchQuery, effectiveProjectId, activeTeamId, departmentFilter, typeFilter]
  );
  const listStatusGroups = useMemo(
    () => workspaceStatuses.filter((status) => status.visibility.list !== false),
    [workspaceStatuses]
  );

  // The persisted per-status counter is workspace-wide and unfiltered, so it's only
  // valid to show as-is when nothing narrows the view below that scope.
  const hasActiveListFilters = Boolean(
    boardFilters.q || boardFilters.projectId || boardFilters.teamId || boardFilters.departmentId || boardFilters.type
  );
  const statusCountsQuery = useIssueStatusCounts({ enabled: !hasActiveListFilters });
  const statusCounts = statusCountsQuery.data;

  // List groups are collapsed by default so nothing loads until the user opens one —
  // only run this once per mount, so it doesn't fight the user's own toggles later.
  useEffect(() => {
    if (hasInitializedCollapse.current || workspaceStatuses.length === 0) return;
    hasInitializedCollapse.current = true;
    setCollapsedStatusKeys(workspaceStatuses.map((status) => status.key));
  }, [workspaceStatuses]);

  const toggleAssigneeFilter = (assigneeId: string) => {
    setSelectedAssigneeIds((current) =>
      current.includes(assigneeId) ? current.filter((id) => id !== assigneeId) : [...current, assigneeId]
    );
  };

  const handleIssueUpdate = async (issueId: string, newStatus: Status) => {
    // Kanban drags pass entityId (internal UUID) when present; list/dropdown changes
    // pass the human-readable id. Match either, or this lookup silently fails for
    // every drag — no previousStatus, so the optimistic cache patch never applies
    // and it falls back to invalidating everything.
    const issue = allLoadedIssues.find((item) => item.id === issueId || item.entityId === issueId);
    if (issue && role) {
      const issueOwnStatuses = isCrossProject
        ? projectWorkflowsById.get(issue.projectId)?.statuses ?? ownWorkflowStatuses
        : ownWorkflowStatuses;
      const check = checkTransitionAllowed(issueOwnStatuses, {
        currentStatusKey: issue.status,
        nextStatusKey: newStatus,
        actorRole: role,
        actorUserId: currentUserId,
        assigneeId: issue.assigneeId,
        creatorId: issue.creatorId,
      });
      if (check.allowed === false) {
        showToast(check.reason, 'error');
        return false;
      }
    }

    try {
      await updateAnyIssueStatus.mutateAsync({
        issueId,
        status: newStatus,
        previousStatus: issue?.status,
      });
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

  const openAssignDialog = (issueIds: string[]) => {
    const selectedIssues = allLoadedIssues.filter((issue) => issueIds.includes(issue.id));
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
      showToast(
        `${issueIds.length} issue${issueIds.length === 1 ? '' : 's'} deleted.`,
        'success'
      );
      setSelectedIssueIds((current) => current.filter((issueId) => !issueIds.includes(issueId)));
      setActiveIssueMenuId(null);
    } catch (error) {
      showToast('Failed to delete selected issues.', 'error', 'Delete failed');
    }
  };

  const renderListView = () => (
    <div className="flex-1 overflow-y-auto px-4 py-5">
      {listStatusGroups.length > 0 ? (
        <div className="space-y-3">
          {listStatusGroups.map((status) => (
            <IssueStatusGroup
              key={status.key}
              status={status}
              filters={boardFilters}
              isCollapsed={collapsedStatusKeys.includes(status.key)}
              onToggle={() => toggleStatusSection(status.key)}
              workspaceStatuses={workspaceStatuses}
              selectedIssueIds={selectedIssueIds}
              setSelectedIssueIds={setSelectedIssueIds}
              toggleIssueSelection={toggleIssueSelection}
              onIssueSelect={setSelectedIssueId}
              onIssueUpdate={handleIssueUpdate}
              activeIssueMenuId={activeIssueMenuId}
              setActiveIssueMenuId={setActiveIssueMenuId}
              onAssignToCycle={openAssignDialog}
              onIssuesLoaded={handleIssuesLoaded}
              persistedCount={hasActiveListFilters ? undefined : statusCounts?.[status.key]}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <SearchIcon size={48} className="mb-4 opacity-10" />
          <p className="text-sm">No workflow statuses are configured for the list view.</p>
        </div>
      )}
    </div>
  );

  const renderKanbanView = () => (
    <IssueKanbanBoard
      filters={boardFilters}
      selectedAssigneeIds={selectedAssigneeIds}
      statuses={workspaceStatuses}
      onIssueUpdate={handleIssueUpdate}
      onNewIssue={(status) => navigate(`/issues/create?status=${status}`)}
      onIssuesLoaded={handleIssuesLoaded}
    />
  );

  const renderCalendarView = () => (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-border-dark border border-gray-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-gray-50 dark:bg-black/20 p-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {day}
          </div>
        ))}
        {calendarDays.map((day) => (
          <div key={day.key} className="bg-white dark:bg-card-dark min-h-[120px] p-2 flex flex-col gap-1">
            <span
              className={`text-xs font-medium mb-1 ${
                day.isCurrentMonth ? 'text-gray-400' : 'text-gray-300 dark:text-gray-700'
              }`}
            >
              {day.date.getDate()}
            </span>
            {day.issues.map((issue) => (
              <div
                key={issue.id}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedIssueId(issue.id);
                }}
                className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-medium text-primary truncate cursor-pointer hover:bg-primary/20 transition-colors"
              >
                {issue.id}: {issue.title}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  if (issuesQuery.isLoading && issues.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Loading issues...
      </div>
    );
  }

  if (issuesQuery.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle size={26} className="text-red-500" />
        <div className="space-y-1">
          <h1 className="text-lg font-bold">Failed to load issues</h1>
          <p className="text-sm text-gray-400">The issue directory request did not complete.</p>
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
      <header className="flex flex-col gap-3 px-6 pt-4 pb-2 border-b border-gray-200 dark:border-border-dark bg-white dark:bg-bg-dark sticky top-0 z-20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-none">{pageTitle}</h1>
            {showTeamScopeBadge && teamLabel && (
              <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                Team scope
              </span>
            )}
          </div>
          <button
            onClick={() => navigate('/issues/create')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Issue</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
          <div className="relative flex-1 max-w-[240px] min-w-[140px]">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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
            <Building2 size={14} className="text-gray-400" />
            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="bg-transparent border-none text-xs font-medium outline-none focus:ring-0 appearance-none pr-4 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
          {isCrossProject && (
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
          )}
        </div>

        {viewMode === 'kanban' && (
          <div className="-mx-6 border-t border-gray-100 pt-2 dark:border-border-dark/70">
          <div className="flex w-full flex-wrap items-center gap-1.5 px-6">
            <button
              type="button"
              onClick={() => setSelectedAssigneeIds([])}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all ${
                selectedAssigneeIds.length === 0
                  ? 'border-primary/30 bg-primary/10 text-primary shadow-sm'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-primary/30 hover:text-primary dark:border-border-dark dark:bg-white/5 dark:text-gray-300'
              }`}
            >
              Everyone
            </button>
            {boardAssignees.map((assignee) => {
              const isActive = selectedAssigneeIds.includes(assignee.id);
              return (
                <button
                  key={assignee.id}
                  type="button"
                  onClick={() => toggleAssigneeFilter(assignee.id)}
                  title={assignee.name}
                  className={`group flex items-center gap-1.5 rounded-lg border px-1.5 py-1 text-[11px] font-medium transition-all ${
                    isActive
                      ? 'border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/10'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-primary/30 hover:bg-gray-50 hover:text-gray-700 dark:border-border-dark dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'
                  }`}
                >
                  {assignee.avatar ? (
                    <img
                      src={assignee.avatar}
                      alt={assignee.name}
                      className={`h-5 w-5 rounded-full object-cover ring-1 ${isActive ? 'ring-primary/30' : 'ring-black/5 dark:ring-white/10'}`}
                    />
                  ) : (
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                        isActive
                          ? 'bg-primary/15 text-primary'
                          : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-200'
                      }`}
                    >
                      {assignee.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[88px] truncate">{assignee.name}</span>
                </button>
              );
            })}
          </div>
          </div>
        )}
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

      <div className="flex-1 overflow-hidden flex flex-col">
        {viewMode === 'list' && renderListView()}
        {viewMode === 'kanban' && renderKanbanView()}
        {viewMode === 'calendar' && renderCalendarView()}

        {viewMode === 'calendar' && issuesQuery.hasNextPage && (
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
