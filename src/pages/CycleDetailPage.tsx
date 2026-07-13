import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  Activity,
  ArrowUpDown,
  Bug,
  ChevronDown,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  Filter,
  LayoutGrid,
  ListTodo,
  Loader2,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  Target,
  Timer,
  Trash2,
  Zap,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { ActivityTimeline, activityQueryKeys } from '@features/activity';
import {
  AssignIssuesToCycleDialog,
  useCarryOverCycle,
  useCompleteCycle,
  useCycleDetail,
  useCycleIssues,
  useDeleteCycle,
  usePlanCycleIssues,
  useRemoveCycleIssue,
  useReopenCycle,
  useUpdateCycle,
} from '@features/cycles';
import { useIssueOptions, useUpdateAnyIssueStatus } from '@features/issues';
import { WorkflowStatusSelect } from '@shared/components/ui/WorkflowStatusSelect';
import { useWorkspaceStatuses } from '@shared/hooks/useWorkspaceStatuses';
import { getApiErrorMessage } from '@shared/services';
import { ISSUE_TYPE_CONFIG, PRIORITY_COLORS, STATUS_LABELS } from '@/constants';
import type { Issue, IssueType, Priority, Status } from '@/types';

type CycleAssigneeFilter = {
  id: string;
  name: string;
  avatar?: string | null;
};

const formatDateRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
};

const progressPercent = (total: number, completed: number) => {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
};

const CircularMetric: React.FC<{
  value: number;
  label: string;
  tone?: 'primary' | 'neutral';
  suffix?: string;
}> = ({ value, label, tone = 'primary', suffix = '%' }) => {
  const safeValue = Math.max(0, Math.min(100, value));
  const stroke = tone === 'primary' ? 'var(--color-primary, #5f72ea)' : 'rgb(107 114 128)';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-white/10" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - safeValue / 100)}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {safeValue}
            {suffix}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{label}</span>
    </div>
  );
};

const toInputDate = (value: string) => value.slice(0, 10);
const toIsoDateTime = (value: string, fallback: string) => {
  const [, time = '00:00:00.000Z'] = fallback.split('T');
  return new Date(`${value}T${time}`).toISOString();
};

const TypeBadge: React.FC<{ type: IssueType }> = ({ type }) => {
  const config = ISSUE_TYPE_CONFIG[type];
  return (
    <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${config.color}`}>
      {type === 'task' && <CheckSquare size={10} />}
      {type === 'bug' && <Bug size={10} />}
      {type === 'issue' && <Zap size={10} />}
      {config.label}
    </span>
  );
};

const PriorityIcon: React.FC<{ priority: Priority }> = ({ priority }) => {
  switch (priority) {
    case 'urgent':
      return <AlertCircle size={14} className="text-red-500" />;
    case 'high':
      return <AlertCircle size={14} className="text-orange-500" />;
    case 'medium':
      return <AlertCircle size={14} className="text-blue-500" />;
    case 'low':
      return <AlertCircle size={14} className="text-gray-400" />;
    default:
      return null;
  }
};

const StatusIcon: React.FC<{ status: Status }> = ({ status }) => {
  switch (status) {
    case 'done':
      return <CheckCircle2 size={14} className="text-green-500" />;
    case 'in-progress':
      return <Clock size={14} className="text-blue-500" />;
    case 'review':
      return <Clock size={14} className="text-purple-500" />;
    case 'todo':
      return <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-400" />;
    case 'backlog':
      return <div className="h-3.5 w-3.5 rounded-full border-2 border-dashed border-gray-400" />;
    default:
      return null;
  }
};

type ConfirmAction = {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
} | null;

const ConfirmDialog: React.FC<{
  action: ConfirmAction;
  loading?: boolean;
  onClose: () => void;
}> = ({ action, loading, onClose }) => {
  if (!action) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close confirmation" onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-border-dark dark:bg-card-dark">
        <h2 className="text-lg font-bold">{action.title}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{action.message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-60 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={action.onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-60 ${
              action.tone === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CycleDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { cycleId } = useParams<{ cycleId: string }>();
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);
  const workspaceStatuses = useWorkspaceStatuses();
  const { showToast, setActiveModal } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'activity' | 'control'>('overview');
  const [issueView, setIssueView] = useState<'list' | 'board' | 'calendar'>('board');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [activeIssueMenuId, setActiveIssueMenuId] = useState<string | null>(null);
  const [collapsedStatusKeys, setCollapsedStatusKeys] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [selectedPlanIssueIds, setSelectedPlanIssueIds] = useState<string[]>([]);
  const [planSearch, setPlanSearch] = useState('');
  const [controlStartDate, setControlStartDate] = useState('');
  const [controlEndDate, setControlEndDate] = useState('');
  const deferredPlanSearch = React.useDeferredValue(planSearch);
  const cycleQuery = useCycleDetail(cycleId);
  const cycleIssuesQuery = useCycleIssues(cycleId, { limit: 100 });
  const updateCycle = useUpdateCycle(cycleId);
  const completeCycle = useCompleteCycle(cycleId);
  const carryOverCycle = useCarryOverCycle(cycleId);
  const reopenCycle = useReopenCycle(cycleId);
  const deleteCycle = useDeleteCycle(cycleId);
  const planCycleIssues = usePlanCycleIssues(cycleId);
  const removeCycleIssue = useRemoveCycleIssue(cycleId);
  const updateIssueStatus = useUpdateAnyIssueStatus();
  const cycle = cycleQuery.data;
  const issueOptionsQuery = useIssueOptions(
    {
      teamId: cycle?.teamId,
      q: deferredPlanSearch.trim() || undefined,
      limit: 10,
      sort: 'updatedAt:desc',
    },
    { enabled: isPlanDialogOpen && Boolean(cycle?.teamId) }
  );

  const cycleIssues = useMemo(() => {
    const apiIssues = cycleIssuesQuery.data?.pages.flatMap((page) => page.items) ?? cycle?.issues ?? [];
    return apiIssues.length > 0 ? apiIssues : [];
  }, [cycle?.issues, cycleIssuesQuery.data]);
  const cycleAssignees = useMemo<CycleAssigneeFilter[]>(() => {
    const map = new Map<string, CycleAssigneeFilter>();

    cycleIssues.forEach((issue) => {
      if (!issue.assigneeId || !issue.assignee?.name) return;
      map.set(issue.assigneeId, {
        id: issue.assigneeId,
        name: issue.assignee.name,
        avatar: issue.assignee.avatar ?? null,
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [cycleIssues]);
  const filteredCycleIssues = useMemo(() => {
    if (selectedAssigneeIds.length === 0) return cycleIssues;
    const selectedIds = new Set(selectedAssigneeIds);
    return cycleIssues.filter((issue) => issue.assigneeId && selectedIds.has(issue.assigneeId));
  }, [cycleIssues, selectedAssigneeIds]);
  const visibleCycleIssues = issueView === 'board' ? filteredCycleIssues : cycleIssues;
  const visibleCycleIssueIds = useMemo(() => visibleCycleIssues.map((issue) => issue.id), [visibleCycleIssues]);
  const listStatusGroups = useMemo(
    () =>
      workspaceStatuses
        .map((status) => ({
          status,
          items: visibleCycleIssues.filter((issue) => issue.status === status.key),
        }))
        .filter((group) => group.items.length > 0),
    [visibleCycleIssues, workspaceStatuses]
  );
  const allVisibleCycleIssuesSelected =
    visibleCycleIssueIds.length > 0 && visibleCycleIssueIds.every((issueId) => selectedIssueIds.includes(issueId));
  const someVisibleCycleIssuesSelected = visibleCycleIssueIds.some((issueId) => selectedIssueIds.includes(issueId));
  const isActionLoading =
    updateCycle.isPending ||
    completeCycle.isPending ||
    carryOverCycle.isPending ||
    reopenCycle.isPending ||
    deleteCycle.isPending ||
    planCycleIssues.isPending;
  const planIssueOptions = useMemo(
    () => issueOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [issueOptionsQuery.data]
  );

  useEffect(() => {
    if (!cycle) return;
    setControlStartDate(toInputDate(cycle.startsAt));
    setControlEndDate(toInputDate(cycle.endsAt));
  }, [cycle]);

  useEffect(() => {
    setSelectedIssueIds((current) => current.filter((issueId) => cycleIssues.some((issue) => issue.id === issueId)));
  }, [cycleIssues]);

  if (cycleQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        <Loader2 size={16} className="mr-2 animate-spin" />
        Loading cycle...
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-border-dark dark:bg-card-dark">
          <h2 className="text-lg font-bold">Cycle not found</h2>
          <button
            onClick={() => navigate('/cycles')}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Cycles
          </button>
        </div>
      </div>
    );
  }

  const progress = cycle.stats.progress ?? progressPercent(cycle.stats.totalIssues, cycle.stats.completedIssues);
  const remainingIssues = cycle.stats.unfinishedIssues ?? cycle.stats.totalIssues - cycle.stats.completedIssues;
  const daysLeft = cycle.stats.daysRemaining;
  const elapsedPercent = cycle.stats.timeElapsedPercent;
  const cycleRules = cycle.rules ?? {
    carryOverRequired: remainingIssues > 0,
    unfinishedIssueCount: remainingIssues,
    canComplete: cycle.status !== 'COMPLETED',
    canEditDates: cycle.status !== 'COMPLETED',
    canCarryOver: remainingIssues > 0,
  };
  const statusBreakdown = (cycle.issueBreakdown?.byStatus?.length
    ? cycle.issueBreakdown.byStatus.map((item) => ({
        label: item.label,
        value: item.count,
        color:
          item.status === 'done'
            ? 'bg-emerald-500'
            : item.status === 'in-progress'
              ? 'bg-blue-500'
              : item.status === 'review'
                ? 'bg-purple-500'
                : 'bg-gray-500',
      }))
    : [
        { label: 'Done', value: cycle.stats.completedIssues, color: 'bg-emerald-500' },
        { label: 'In Progress', value: cycle.stats.inProgressIssues, color: 'bg-blue-500' },
        { label: 'Todo', value: cycle.stats.todoIssues, color: 'bg-gray-500' },
      ]);

  const handleOpenIssue = (issueId: string) => {
    navigate(`/issues/${issueId}`);
  };

  const handleIssueStatusUpdate = async (issueId: string, status: Status) => {
    try {
      await updateIssueStatus.mutateAsync({ issueId, status });
      queryClient.invalidateQueries({ queryKey: activityQueryKeys.workspace(workspaceId) });
      showToast(`Issue moved to ${STATUS_LABELS[status]}.`, 'success');
      return true;
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update issue status.', 'error', 'Update failed');
      return false;
    }
  };

  const toggleAssigneeFilter = (assigneeId: string) => {
    setSelectedAssigneeIds((current) =>
      current.includes(assigneeId) ? current.filter((id) => id !== assigneeId) : [...current, assigneeId]
    );
  };

  const handlePlanIssues = () => {
    setIsPlanDialogOpen(true);
  };

  const toggleCycleIssueSelection = (issueId: string) => {
    setSelectedIssueIds((current) =>
      current.includes(issueId) ? current.filter((id) => id !== issueId) : [...current, issueId]
    );
  };

  const toggleSelectAllVisibleCycleIssues = () => {
    setSelectedIssueIds((current) => {
      if (allVisibleCycleIssuesSelected) {
        return current.filter((issueId) => !visibleCycleIssueIds.includes(issueId));
      }

      return [...new Set([...current, ...visibleCycleIssueIds])];
    });
  };

  const toggleStatusSection = (statusKey: string) => {
    setCollapsedStatusKeys((current) =>
      current.includes(statusKey) ? current.filter((key) => key !== statusKey) : [...current, statusKey]
    );
  };

  const handlePlanIssuesScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (
      distanceFromBottom < 40 &&
      issueOptionsQuery.hasNextPage &&
      !issueOptionsQuery.isFetchingNextPage
    ) {
      issueOptionsQuery.fetchNextPage();
    }
  };

  const submitPlanIssues = async () => {
    if (selectedPlanIssueIds.length === 0) {
      showToast('Select at least one issue to plan.', 'error', 'Validation');
      return;
    }
    try {
      const result = await planCycleIssues.mutateAsync({ issueIds: selectedPlanIssueIds });
      showToast(`${result.added.length} issue${result.added.length === 1 ? '' : 's'} planned into ${cycle.name}.`, 'success');
      setSelectedPlanIssueIds([]);
      setIsPlanDialogOpen(false);
      setPlanSearch('');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to plan issues.', 'error', 'Planning failed');
    }
  };

  const handleRemoveSelectedCycleIssues = async (issueIds: string[]) => {
    if (issueIds.length === 0) {
      showToast('Select at least one issue first.', 'error', 'Validation');
      return;
    }

    try {
      await Promise.all(issueIds.map((issueId) => removeCycleIssue.mutateAsync(issueId)));
      showToast(`${issueIds.length} issue${issueIds.length === 1 ? '' : 's'} removed from ${cycle.name}.`, 'success');
      setSelectedIssueIds((current) => current.filter((issueId) => !issueIds.includes(issueId)));
      setActiveIssueMenuId(null);
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to remove issues from cycle.', 'error', 'Update failed');
    }
  };

  const runAction = async (callback: () => Promise<unknown>, successMessage: string) => {
    try {
      await callback();
      showToast(successMessage, 'success');
      setConfirmAction(null);
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Action failed.', 'error', 'Cycle update failed');
    }
  };

  const handleCarryOver = () => {
    setConfirmAction({
      title: 'Carry over unfinished issues?',
      message: `This will move ${remainingIssues} unfinished issue${remainingIssues === 1 ? '' : 's'} out of ${cycle.name} and back to backlog. This action updates cycle scope and issue history.`,
      confirmLabel: 'Carry Over',
      onConfirm: () =>
        runAction(
          () => carryOverCycle.mutateAsync({ mode: 'backlog' }),
          'Unfinished issues carried over to backlog.'
        ),
    });
  };

  const handleStartCycle = () => {
    setConfirmAction({
      title: `Start ${cycle.name}?`,
      message: 'This will mark the cycle as current for the selected team. Only one current cycle is allowed per team.',
      confirmLabel: 'Start Cycle',
      onConfirm: () => runAction(() => updateCycle.mutateAsync({ status: 'CURRENT' }), `${cycle.name} started.`),
    });
  };

  const handleCompleteCycle = () => {
    setConfirmAction({
      title: `Complete ${cycle.name}?`,
      message: cycleRules.carryOverRequired
        ? `This cycle has ${remainingIssues} unfinished issue${remainingIssues === 1 ? '' : 's'}. They will stay in this cycle unless you carry them over first. Are you sure you want to complete it?`
        : 'This will mark the cycle as completed. Completed cycles become read-only for normal edits.',
      confirmLabel: 'Complete Cycle',
      onConfirm: () =>
        runAction(
          () => completeCycle.mutateAsync({ unfinishedAction: 'KEEP' }),
          `${cycle.name} completed.`
        ),
    });
  };

  const handleReopenCycle = () => {
    setConfirmAction({
      title: `Reopen ${cycle.name}?`,
      message: 'This will reopen the completed cycle for planning updates. Use this only when the cycle was closed by mistake.',
      confirmLabel: 'Reopen Cycle',
      onConfirm: () => runAction(() => reopenCycle.mutateAsync(), `${cycle.name} reopened.`),
    });
  };

  const handleDeleteCycle = () => {
    setConfirmAction({
      title: `Delete ${cycle.name}?`,
      message: 'This will remove the cycle and unassign its issues from this cycle. This cannot be undone.',
      confirmLabel: 'Delete Cycle',
      tone: 'danger',
      onConfirm: () =>
        runAction(async () => {
          await deleteCycle.mutateAsync();
          navigate('/cycles');
        }, `${cycle.name} deleted.`),
    });
  };

  const handleSaveSchedule = async () => {
    if (!controlStartDate || !controlEndDate) {
      showToast('Start and end dates are required.', 'error', 'Validation');
      return;
    }

    if (new Date(controlStartDate).getTime() >= new Date(controlEndDate).getTime()) {
      showToast('End date must be after start date.', 'error', 'Validation');
      return;
    }

    try {
      await updateCycle.mutateAsync({
        startsAt: toIsoDateTime(controlStartDate, cycle.startsAt),
        endsAt: toIsoDateTime(controlEndDate, cycle.endsAt),
      });
      showToast('Cycle schedule updated.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update cycle dates.', 'error', 'Cycle update failed');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-gray-200 px-6 py-4 dark:border-border-dark">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <button
                type="button"
                onClick={() => navigate('/cycles')}
                className="transition-colors hover:text-gray-600 dark:hover:text-gray-200"
              >
                Cycles
              </button>
              <ChevronRight size={13} />
              <span className="font-medium text-gray-600 dark:text-gray-200">{cycle.name}</span>
            </div>
            <h1 className="text-lg font-semibold">{cycle.name}</h1>
            <p className="text-sm text-gray-400">{cycle.goal}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              {cycle.status.toLowerCase()}
            </span>
          </div>
        </div>
      </header>
      <div className="flex items-center gap-8 border-b border-gray-200 px-6 dark:border-border-dark">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutGrid },
          { id: 'issues', label: 'Issues', icon: Filter },
          { id: 'activity', label: 'Activity', icon: Activity },
          { id: 'control', label: 'Control Center', icon: MoreHorizontal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`relative flex items-center gap-2 py-3 text-sm font-semibold transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={15} />
              {tab.label}
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className={activeTab === 'issues' || activeTab === 'activity' ? '-m-6 space-y-0' : 'mx-auto max-w-6xl space-y-5'}>
          {activeTab === 'overview' && (
            <>
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
                <div className="flex flex-col gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {cycle.status === 'CURRENT' ? 'Current cycle' : cycle.status.toLowerCase()}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar size={14} />
                        {formatDateRange(cycle.startsAt, cycle.endsAt)}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Goal</p>
                        <h2 className="mt-2 max-w-2xl text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                          {cycle.goal}
                        </h2>
                      </div>
                      <div className="flex gap-8 md:text-right">
                        <div>
                          <p className="text-3xl font-bold tabular-nums">{progress}%</p>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Complete</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold tabular-nums">{daysLeft}</p>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Days left</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-gray-400">
                          <span>Scope completion</span>
                          <span>{cycle.stats.completedIssues} of {cycle.stats.totalIssues} issues done</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-gray-400">
                          <span>Time elapsed</span>
                          <span>{elapsedPercent}% of cycle window</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div className="h-full rounded-full bg-gray-500/60" style={{ width: `${elapsedPercent}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-border-dark dark:bg-card-dark">
                  <div className="border-b border-gray-100 px-5 py-4 dark:border-border-dark/70">
                    <h2 className="text-sm font-bold">Scope breakdown</h2>
                    <p className="mt-1 text-xs text-gray-400">Current planned work by execution state.</p>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-border-dark/70">
                    {statusBreakdown.map((item) => (
                      <div key={item.label} className="grid grid-cols-[120px_1fr_48px] items-center gap-4 px-5 py-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span className={`h-2 w-2 rounded-full ${item.color}`} />
                          {item.label}
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className={`h-full rounded-full ${item.color}`}
                            style={{ width: `${cycle.stats.totalIssues ? Math.round((item.value / cycle.stats.totalIssues) * 100) : 0}%` }}
                          />
                        </div>
                        <div className="text-right text-sm font-semibold tabular-nums">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white dark:border-border-dark dark:bg-card-dark">
                  <div className="border-b border-gray-100 px-5 py-4 dark:border-border-dark/70">
                    <h2 className="text-sm font-bold">Cycle rules</h2>
                    <p className="mt-1 text-xs text-gray-400">Rules used when this cycle closes.</p>
                  </div>
                  <div className="divide-y divide-gray-100 text-sm dark:divide-border-dark/70">
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-gray-400">Carry-over needed</span>
                      <span className="font-semibold">{remainingIssues > 0 ? `${remainingIssues} issues` : 'No'}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-gray-400">Scope</span>
                      <span className="font-semibold">Team cycle</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-gray-400">Status path</span>
                      <span className="font-semibold">Upcoming → Current → Completed</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-gray-400">Auto move</span>
                      <span className="font-semibold">Manual review</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-gray-400">Controls</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('control')}
                        className="font-semibold text-primary transition-colors hover:text-primary/80"
                      >
                        Open Control Center
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'issues' && (
            <section className="flex min-h-[calc(100vh-220px)] flex-col">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4 dark:border-border-dark dark:bg-bg-dark">
                <div className="flex flex-wrap items-center gap-4">
                  <h2 className="shrink-0 text-lg font-semibold">{cycle.name} Issues</h2>
                  <div className="inline-flex shrink-0 items-center rounded-md bg-gray-100 p-1 dark:bg-white/5">
                    <button
                      type="button"
                      onClick={() => setIssueView('list')}
                      className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                        issueView === 'list'
                          ? 'bg-white text-primary shadow-sm dark:bg-gray-800'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                      }`}
                    >
                      List
                    </button>
                    <button
                      type="button"
                      onClick={() => setIssueView('board')}
                      className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                        issueView === 'board'
                          ? 'bg-white text-primary shadow-sm dark:bg-gray-800'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                      }`}
                    >
                      Board
                    </button>
                    <button
                      type="button"
                      onClick={() => setIssueView('calendar')}
                      className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                        issueView === 'calendar'
                          ? 'bg-white text-primary shadow-sm dark:bg-gray-800'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                      }`}
                    >
                      Calendar
                    </button>
                  </div>
                </div>
                <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                  <div className="relative min-w-[180px] max-w-[260px] flex-1">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      placeholder="Search issues..."
                      className="w-full rounded-md border-none bg-gray-100 py-1.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:bg-white/5"
                    />
                  </div>
                  <button className="inline-flex shrink-0 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-border-dark dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10">
                    <Filter size={14} className="text-gray-400" />
                    All Types
                  </button>
                  <button className="hidden shrink-0 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-border-dark dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 lg:inline-flex">
                    <Building2 size={14} className="text-gray-400" />
                    All Departments
                  </button>
                  <button
                    type="button"
                    onClick={handlePlanIssues}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                  >
                    <Plus size={14} />
                    Plan Issues
                  </button>
                </div>

                {issueView === 'board' && (
                  <div className="flex w-full flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3 dark:border-border-dark/70">
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
                    {cycleAssignees.map((assignee) => {
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
                )}
              </div>

              {issueView === 'list' && (
                <>
                  {selectedIssueIds.length > 0 && (
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
                                setActiveModal('create-issue');
                              }}
                              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5 dark:hover:text-white"
                            >
                              Add New Issue
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveIssueMenuId(null);
                                setIsPlanDialogOpen(true);
                              }}
                              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5 dark:hover:text-white"
                            >
                              Add Existing Issue
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleRemoveSelectedCycleIssues(selectedIssueIds)}
                              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10"
                            >
                              Remove From Cycle
                            </button>
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
                  <div className="flex-1 overflow-y-auto px-4 py-5">
                    {cycleIssuesQuery.isLoading ? (
                      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Loading cycle issues...
                      </div>
                    ) : visibleCycleIssues.length > 0 ? (
                      <div className="space-y-2.5">
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
                                className="flex w-full items-center justify-between gap-4 px-3.5 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <ChevronDown
                                    size={16}
                                    className={`shrink-0 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                                  />
                                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: status.color }} />
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{status.label}</h3>
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
                                  <div className="grid grid-cols-[44px_40px_100px_1fr_120px_100px_150px_120px_44px] gap-4 bg-gray-50/60 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:bg-black/10">
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
                                    <div>ID</div>
                                    <div>Title</div>
                                    <div>Workflow</div>
                                    <div>Type</div>
                                    <div>Assignee</div>
                                    <div>Priority</div>
                                    <div />
                                  </div>

                                  <div className="divide-y divide-gray-100 dark:divide-border-dark">
                                    {items.map((issue) => (
                                      <div
                                        key={issue.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleOpenIssue(issue.id)}
                                        onKeyDown={(event) => {
                                          if (event.key === 'Enter') handleOpenIssue(issue.id);
                                        }}
                                        className={`group grid cursor-pointer grid-cols-[44px_40px_100px_1fr_120px_100px_150px_120px_44px] gap-4 px-5 py-3 text-left transition-colors ${
                                          selectedIssueIds.includes(issue.id) ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                      >
                                        <div
                                          className="flex items-center justify-center"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={selectedIssueIds.includes(issue.id)}
                                            onChange={() => toggleCycleIssueSelection(issue.id)}
                                            className="h-4 w-4 rounded border-gray-300 bg-transparent text-primary focus:ring-primary/30"
                                          />
                                        </div>
                                        <div className="flex items-center justify-center">
                                          <PriorityIcon priority={issue.priority} />
                                        </div>
                                        <div className="flex items-center font-mono text-xs text-gray-400">{issue.id}</div>
                                        <div className="flex min-w-0 flex-col justify-center">
                                          <span className="truncate text-sm font-medium">{issue.title}</span>
                                          <div className="mt-1 flex flex-wrap gap-1">
                                            {issue.labels?.map((label) => (
                                              <span key={label} className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500 dark:bg-gray-800">
                                                {label}
                                              </span>
                                            ))}
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
                                              void handleIssueStatusUpdate(issue.id, nextStatus);
                                            }}
                                          />
                                        </div>
                                        <div className="flex items-center">
                                          <TypeBadge type={issue.type} />
                                        </div>
                                        <div className="flex items-center">
                                          {issue.assignee ? (
                                            <div className="flex min-w-0 items-center gap-2 text-xs">
                                              {issue.assignee.avatar ? (
                                                <img src={issue.assignee.avatar} className="h-5 w-5 rounded-full" alt={issue.assignee.name} />
                                              ) : (
                                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                                  {issue.assignee.name.charAt(0).toUpperCase()}
                                                </div>
                                              )}
                                              <span className="truncate">{issue.assignee.name}</span>
                                            </div>
                                          ) : (
                                            <span className="text-xs italic text-gray-400">Unassigned</span>
                                          )}
                                        </div>
                                        <div className="flex items-center">
                                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${PRIORITY_COLORS[issue.priority]}`}>
                                            {issue.priority}
                                          </span>
                                        </div>
                                        <div className="relative flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                          <button
                                            type="button"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              setActiveIssueMenuId((current) => (current === issue.id ? null : issue.id));
                                            }}
                                            className="rounded p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                                          >
                                            <MoreHorizontal size={14} />
                                          </button>
                                          {activeIssueMenuId === issue.id && (
                                            <div className="absolute right-0 top-9 z-20 min-w-[190px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-border-dark dark:bg-card-dark">
                                              <button
                                                type="button"
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  void handleRemoveSelectedCycleIssues([issue.id]);
                                                }}
                                                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10"
                                              >
                                                Remove From Cycle
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
                      <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                        <SearchX size={48} className="mb-4 opacity-10" />
                        <p className="text-sm">No issues found matching your filters.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {issueView === 'board' && (
                <div className="flex-1 overflow-hidden">
                  <KanbanBoard
                    issues={visibleCycleIssues}
                    onIssueUpdate={handleIssueStatusUpdate}
                    onNewIssue={(status) => {
                      showToast(`Planning a ${STATUS_LABELS[status]} issue for ${cycle.name}.`, 'info');
                      setActiveModal('create-issue');
                    }}
                  />
                </div>
              )}

              {issueView === 'calendar' && (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 shadow-sm dark:border-border-dark dark:bg-border-dark">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="bg-gray-50 p-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:bg-black/20">
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: 35 }).map((_, index) => {
                      const dayNumber = index + 1;
                      const dayIssues = visibleCycleIssues.filter((issue) => Number(issue.dueDate?.slice(8, 10)) === dayNumber);
                      return (
                        <div key={dayNumber} className="flex min-h-[112px] flex-col gap-1 bg-white p-2 dark:bg-card-dark">
                          <span className="mb-1 text-xs font-medium text-gray-400">{dayNumber}</span>
                          {dayIssues.map((issue) => (
                            <button
                              key={issue.id}
                              type="button"
                              onClick={() => handleOpenIssue(issue.id)}
                              className="truncate rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-left text-[9px] font-medium text-primary transition-colors hover:bg-primary/20"
                            >
                              {issue.id}: {issue.title}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'activity' && (
            <ActivityTimeline
              scope="cycle"
              scopeId={cycle.id}
              title="Activity"
              emptyTitle="No cycle activity yet"
              emptyDescription="Only events tagged to this cycle will appear here."
              errorMessage="Failed to load cycle activity."
            />
          )}

          {activeTab === 'control' && (
            <section className="mx-auto max-w-5xl space-y-5">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Cycle status</p>
                    <h2 className="mt-2 text-xl font-bold">{cycle.name}</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Start, complete, reopen, and carry over work for this cycle from one place.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cycle.status === 'UPCOMING' && (
                      <button
                        type="button"
                        onClick={handleStartCycle}
                        disabled={isActionLoading}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
                      >
                        <Timer size={15} />
                        Start Cycle
                      </button>
                    )}
                    {cycle.status !== 'COMPLETED' ? (
                      <button
                        type="button"
                        onClick={handleCompleteCycle}
                        disabled={!cycleRules.canComplete || isActionLoading}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
                      >
                        <CheckCircle2 size={15} />
                        Complete Cycle
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleReopenCycle}
                        disabled={isActionLoading}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
                      >
                        <RotateCcw size={15} />
                        Reopen Cycle
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCarryOver}
                      disabled={!cycleRules.canCarryOver || remainingIssues === 0 || isActionLoading}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-all hover:border-primary/40 hover:bg-gray-50 hover:text-primary dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-200 dark:hover:bg-white/5 disabled:opacity-60"
                    >
                      <Timer size={15} />
                      Carry Over
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Cycle analytics</h3>
                      <p className="mt-1 text-xs text-gray-400">A compact read on scope completion and time burn.</p>
                    </div>
                    <span className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:border-border-dark dark:text-gray-300">
                      {cycle.status.toLowerCase()}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <CircularMetric value={progress} label="Scope" tone="primary" />
                    <CircularMetric value={elapsedPercent} label="Time" tone="neutral" />
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 dark:border-border-dark dark:bg-white/[0.03]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Done</p>
                      <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                        {cycle.stats.completedIssues}
                        <span className="ml-1 text-sm text-gray-400">/ {cycle.stats.totalIssues}</span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 dark:border-border-dark dark:bg-white/[0.03]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Days left</p>
                      <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{daysLeft}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Dates</h3>
                        <p className="mt-1 text-xs text-gray-400">Adjust the cycle window without leaving this page.</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Start date</span>
                        <input
                          type="date"
                          value={controlStartDate}
                          onChange={(event) => setControlStartDate(event.target.value)}
                          disabled={!cycleRules.canEditDates || isActionLoading}
                          className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/10 disabled:opacity-60 [color-scheme:light] dark:border-border-dark dark:[color-scheme:dark]"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">End date</span>
                        <input
                          type="date"
                          value={controlEndDate}
                          onChange={(event) => setControlEndDate(event.target.value)}
                          disabled={!cycleRules.canEditDates || isActionLoading}
                          className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/10 disabled:opacity-60 [color-scheme:light] dark:border-border-dark dark:[color-scheme:dark]"
                        />
                      </label>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveSchedule}
                        disabled={!cycleRules.canEditDates || isActionLoading}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/5 transition-all disabled:opacity-60"
                      >
                        Save dates
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Rules</h3>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Current state</span>
                        <span className="font-semibold">{cycle.status}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Unfinished issues</span>
                        <span className="font-semibold">{remainingIssues}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Carry-over available</span>
                        <span className="font-semibold">{cycleRules.canCarryOver ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Date edits allowed</span>
                        <span className="font-semibold">{cycleRules.canEditDates ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5 shadow-sm dark:border-red-500/20 dark:bg-red-500/[0.04]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-red-500">Danger zone</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Deleting this cycle will remove the cycle record and unassign all linked issues from it.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteCycle}
                    disabled={isActionLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-500 transition-all hover:bg-red-500 hover:text-white disabled:opacity-60"
                  >
                    <Trash2 size={15} />
                    Delete Cycle
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
      {isPlanDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close plan issues dialog"
            onClick={() => {
              setIsPlanDialogOpen(false);
              setPlanSearch('');
            }}
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
          />
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-border-dark dark:bg-card-dark">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Plan issues into {cycle.name}</h2>
                <p className="mt-1 text-sm text-gray-400">Select existing team issues to add to this cycle.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('create-issue')}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 hover:border-primary/40 hover:text-primary dark:border-border-dark"
              >
                <Plus size={14} />
                New Issue
              </button>
            </div>

            <div className="relative mt-4">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={planSearch}
                onChange={(event) => setPlanSearch(event.target.value)}
                placeholder="Search issues..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.03]"
              />
            </div>

            <div onScroll={handlePlanIssuesScroll} className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {issueOptionsQuery.isLoading ? (
                <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                  <Loader2 size={15} className="mr-2 animate-spin" />
                  Loading issues...
                </div>
              ) : planIssueOptions.length > 0 ? (
                planIssueOptions.map((issue) => {
                  const selected = selectedPlanIssueIds.includes(issue.id);
                  return (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() =>
                        setSelectedPlanIssueIds((current) =>
                          current.includes(issue.id)
                            ? current.filter((id) => id !== issue.id)
                            : [...current, issue.id]
                        )
                      }
                      className={`w-full rounded-xl border px-3 py-2 text-left transition-all ${
                        selected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 bg-white hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{issue.title}</p>
                          <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-gray-400">{issue.id} · {STATUS_LABELS[issue.status]}</p>
                        </div>
                        <span className={`h-4 w-4 rounded-full border ${selected ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'}`} />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-border-dark">
                  No available issues found for this team.
                </div>
              )}
              {issueOptionsQuery.isFetchingNextPage && (
                <div className="flex items-center justify-center py-3 text-xs text-gray-400">
                  <Loader2 size={13} className="mr-2 animate-spin" />
                  Loading 10 more issues...
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-border-dark">
              <button
                type="button"
                onClick={() => {
                  setIsPlanDialogOpen(false);
                  setPlanSearch('');
                }}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitPlanIssues}
                disabled={planCycleIssues.isPending || selectedPlanIssueIds.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {planCycleIssues.isPending && <Loader2 size={14} className="animate-spin" />}
                Plan Selected
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog action={confirmAction} loading={isActionLoading} onClose={() => setConfirmAction(null)} />
    </div>
  );
};
