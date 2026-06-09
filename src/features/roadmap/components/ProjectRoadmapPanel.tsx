import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpToLine,
  CalendarRange,
  CheckCircle2,
  GitBranch,
  Loader2,
  Pencil,
  Plus,
  Save,
  Target,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useApp } from '@/AppContext';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useProjectOptions } from '@features/projects';
import { useTeamDetail } from '@features/team';
import { canForceRoadmapOverride, canManageRoadmap } from '@shared/permissions';
import { getApiErrorCode, getApiErrorMessage, getApiErrorPayload } from '@shared/services';
import {
  useCancelDependency,
  useCreateDependency,
  useCreateMilestone,
  useDeleteDependency,
  useDeleteMilestone,
  useProjectRoadmapDetail,
  useReorderMilestones,
  useResolveDependency,
  useUpdateMilestone,
  useUpdateProjectSchedule,
} from '../hooks/useRoadmapData';
import type {
  CreateMilestoneInput,
  RoadmapDependency,
  RoadmapMilestone,
  RoadmapMilestoneStatus,
  RoadmapScheduleConflictErrorDetails,
  UpdateMilestoneInput,
} from '../types';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const statusOptions: RoadmapMilestoneStatus[] = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'MISSED'];

const formatDate = (value: string | null) => (value ? dateFormatter.format(new Date(value)) : 'No date');

const toIsoDateTime = (value: string) => new Date(`${value}T00:00:00.000Z`).toISOString();

const statusBadge = (status: string) => {
  switch (status) {
    case 'ON_TRACK':
    case 'COMPLETED':
    case 'RESOLVED':
      return 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400';
    case 'AT_RISK':
    case 'IN_PROGRESS':
      return 'text-amber-600 bg-amber-500/10 dark:text-amber-400';
    case 'OFF_TRACK':
    case 'MISSED':
    case 'CANCELLED':
      return 'text-red-600 bg-red-500/10 dark:text-red-400';
    case 'BLOCKED':
      return 'text-rose-600 bg-rose-500/10 dark:text-rose-400';
    default:
      return 'text-gray-500 bg-gray-500/10 dark:text-gray-400';
  }
};

type MilestoneDraft = {
  name: string;
  description: string;
  dueDate: string;
  status: RoadmapMilestoneStatus;
};

const getMilestoneDraft = (milestone: RoadmapMilestone): MilestoneDraft => ({
  name: milestone.name,
  description: milestone.description ?? '',
  dueDate: milestone.dueDate.slice(0, 10),
  status: milestone.status,
});

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5';
const dateInputClass = `${inputClass} [color-scheme:light] dark:[color-scheme:dark]`;

export const ProjectRoadmapPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { showToast } = useApp();
  const role = useAuthStore((state) => state.workspace?.role);
  const currentUserId = useAuthStore((state) => state.currentUser?.id);

  const roadmapQuery = useProjectRoadmapDetail(projectId);
  const teamId = roadmapQuery.data?.project.team?.id;
  const teamQuery = useTeamDetail(teamId);
  const [dependencySearch, setDependencySearch] = useState('');
  const deferredDependencySearch = useDeferredValue(dependencySearch);
  const dependencySearchQuery = useProjectOptions(
    {
      q: deferredDependencySearch.trim() || undefined,
      limit: 20,
      status: 'ACTIVE',
      sort: 'name:asc',
    },
    { enabled: canManageRoadmap(role, currentUserId, roadmapQuery.data?.project.lead?.id, teamQuery.data?.lead?.id) }
  );

  const updateSchedule = useUpdateProjectSchedule(projectId);
  const createMilestone = useCreateMilestone(projectId);
  const updateMilestone = useUpdateMilestone(projectId);
  const reorderMilestones = useReorderMilestones(projectId);
  const deleteMilestone = useDeleteMilestone(projectId);
  const createDependency = useCreateDependency(projectId);
  const resolveDependency = useResolveDependency(projectId);
  const cancelDependency = useCancelDependency(projectId);
  const removeDependency = useDeleteDependency(projectId);

  const detail = roadmapQuery.data;
  const milestones = useMemo(
    () => [...(detail?.milestones ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [detail?.milestones]
  );
  const dependencyOptions = dependencySearchQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const filteredDependencyOptions = dependencyOptions.filter((option) => option.id !== projectId);

  const canManage = canManageRoadmap(role, currentUserId, detail?.project.lead?.id, teamQuery.data?.lead?.id);
  const canForceOverride = canForceRoadmapOverride(role);

  const [scheduleStartDate, setScheduleStartDate] = useState('');
  const [scheduleTargetDate, setScheduleTargetDate] = useState('');
  const [scheduleReason, setScheduleReason] = useState('');
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDescription, setNewMilestoneDescription] = useState('');
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('');
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [milestoneDraft, setMilestoneDraft] = useState<MilestoneDraft | null>(null);
  const [selectedBlockingProjectId, setSelectedBlockingProjectId] = useState('');
  const [dependencyNote, setDependencyNote] = useState('');

  useEffect(() => {
    if (!detail) return;
    setScheduleStartDate(detail.project.schedule.startDate ?? '');
    setScheduleTargetDate(detail.project.schedule.targetDate ?? '');
    setScheduleReason('');
  }, [detail]);

  const handleScheduleSave = async (force = false) => {
    try {
      await updateSchedule.mutateAsync({
        startDate: scheduleStartDate || null,
        targetDate: scheduleTargetDate || null,
        reason: scheduleReason.trim() || null,
        force,
      });
      setScheduleReason('');
      showToast('Roadmap schedule updated.', 'success');
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'ROADMAP_SCHEDULE_CONFLICT') {
        const payload = getApiErrorPayload(error);
        const details = payload?.details as unknown as RoadmapScheduleConflictErrorDetails | undefined;
        const impactedNames = details?.affectedDependencies?.map((item) => item.blockedProject.name).join(', ');
        if (details?.allowedForceOverride && canForceOverride) {
          const confirmed = window.confirm(
            `This schedule change affects dependent projects${impactedNames ? `: ${impactedNames}` : ''}. Force update anyway?`
          );
          if (confirmed) {
            await handleScheduleSave(true);
          }
          return;
        }
        showToast(
          impactedNames
            ? `Schedule change conflicts with: ${impactedNames}.`
            : payload?.message || 'Schedule change conflicts with dependent projects.',
          'error',
          'Conflict detected'
        );
        return;
      }

      showToast(getApiErrorMessage(error) || 'Failed to update roadmap schedule.', 'error', 'Update failed');
    }
  };

  const handleCreateMilestone = async () => {
    if (!newMilestoneName.trim() || !newMilestoneDueDate) {
      showToast('Milestone name and due date are required.', 'error', 'Validation error');
      return;
    }

    const input: CreateMilestoneInput = {
      name: newMilestoneName.trim(),
      description: newMilestoneDescription.trim() || null,
      dueDate: toIsoDateTime(newMilestoneDueDate),
      status: 'PLANNED',
    };

    try {
      await createMilestone.mutateAsync(input);
      setNewMilestoneName('');
      setNewMilestoneDescription('');
      setNewMilestoneDueDate('');
      showToast('Milestone created.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to create milestone.', 'error', 'Create failed');
    }
  };

  const handleSaveMilestone = async (milestoneId: string) => {
    if (!milestoneDraft || !milestoneDraft.name.trim() || !milestoneDraft.dueDate) {
      showToast('Milestone name and due date are required.', 'error', 'Validation error');
      return;
    }

    const input: UpdateMilestoneInput = {
      name: milestoneDraft.name.trim(),
      description: milestoneDraft.description.trim() || null,
      dueDate: toIsoDateTime(milestoneDraft.dueDate),
      status: milestoneDraft.status,
    };

    try {
      await updateMilestone.mutateAsync({ milestoneId, input });
      setEditingMilestoneId(null);
      setMilestoneDraft(null);
      showToast('Milestone updated.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update milestone.', 'error', 'Update failed');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!window.confirm('Delete this milestone?')) return;

    try {
      await deleteMilestone.mutateAsync(milestoneId);
      showToast('Milestone deleted.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to delete milestone.', 'error', 'Delete failed');
    }
  };

  const handleMoveMilestone = async (milestoneId: string, direction: -1 | 1) => {
    const currentIndex = milestones.findIndex((milestone) => milestone.id === milestoneId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= milestones.length) return;

    const reordered = [...milestones];
    const [removed] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, removed);

    try {
      await reorderMilestones.mutateAsync({ orderedIds: reordered.map((milestone) => milestone.id) });
      showToast('Milestone order updated.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to reorder milestones.', 'error', 'Reorder failed');
    }
  };

  const handleCreateDependency = async () => {
    if (!selectedBlockingProjectId) {
      showToast('Select a blocking project first.', 'error', 'Validation error');
      return;
    }

    try {
      await createDependency.mutateAsync({
        blockingProjectId: selectedBlockingProjectId,
        blockedProjectId: projectId,
        note: dependencyNote.trim() || null,
      });
      setSelectedBlockingProjectId('');
      setDependencyNote('');
      showToast('Dependency created.', 'success');
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'ROADMAP_DEPENDENCY_DUPLICATE') {
        showToast('This dependency already exists.', 'error', 'Duplicate dependency');
        return;
      }
      if (code === 'ROADMAP_DEPENDENCY_CYCLE') {
        showToast('This dependency would create a cycle.', 'error', 'Invalid dependency');
        return;
      }
      showToast(getApiErrorMessage(error) || 'Failed to create dependency.', 'error', 'Create failed');
    }
  };

  const runDependencyAction = async (
    action: 'resolve' | 'cancel' | 'delete',
    dependency: RoadmapDependency
  ) => {
    try {
      if (action === 'resolve') {
        await resolveDependency.mutateAsync({ dependencyId: dependency.id });
        showToast('Dependency resolved.', 'success');
        return;
      }
      if (action === 'cancel') {
        await cancelDependency.mutateAsync({ dependencyId: dependency.id });
        showToast('Dependency cancelled.', 'success');
        return;
      }
      if (!window.confirm('Delete this dependency link? Use this only for incorrect links.')) return;
      await removeDependency.mutateAsync(dependency.id);
      showToast('Dependency deleted.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Dependency action failed.', 'error', 'Update failed');
    }
  };

  if (roadmapQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Loading roadmap...
      </div>
    );
  }

  if (roadmapQuery.error || !detail) {
    const errorCode = getApiErrorCode(roadmapQuery.error);
    const isDisabled = errorCode === 'ROADMAP_DISABLED_FOR_PROJECT';

    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-300 dark:bg-white/5 dark:text-gray-600">
          <GitBranch size={22} />
        </div>
        <h2 className="text-lg font-bold">{isDisabled ? 'Roadmap disabled' : 'Roadmap unavailable'}</h2>
        <p className="mt-1.5 max-w-sm text-sm text-gray-400">
          {isDisabled
            ? 'Turn on roadmap in project settings to plan dates, milestones, and dependencies.'
            : 'We couldn\'t load this project roadmap.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      {/* Header card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GitBranch size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">Project Roadmap</h2>
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${statusBadge(detail.summary.health.status)}`}>
                {detail.summary.health.status.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Dates, milestones, and dependencies in one place.
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Start</p>
            <p className="mt-1 text-sm font-semibold">{formatDate(detail.project.schedule.startDate)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Target</p>
            <p className="mt-1 text-sm font-semibold">{formatDate(detail.project.schedule.targetDate)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Progress</p>
            <p className="mt-1 text-sm font-semibold">{detail.project.progress}%</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Milestones</p>
            <p className="mt-1 text-sm font-semibold">{milestones.length}</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target size={15} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Health</p>
              <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${statusBadge(detail.summary.health.status)}`}>
                {detail.summary.health.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CalendarRange size={15} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Forecast</p>
              <p className="mt-0.5 text-sm font-semibold">{detail.summary.forecast.status.replace('_', ' ')}</p>
              <p className="text-[10px] text-gray-400">
                {detail.summary.forecast.projectedTargetDate
                  ? `~${formatDate(detail.summary.forecast.projectedTargetDate)}`
                  : 'Needs more data'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <GitBranch size={15} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Blocked</p>
              <p className="mt-0.5 text-sm font-semibold">{detail.summary.blocked ? 'Yes' : 'No'}</p>
              <p className="text-[10px] text-gray-400">
                {detail.dependencies.upstream.length} up / {detail.dependencies.downstream.length} down
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={15} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Next milestone</p>
              <p className="mt-0.5 truncate text-sm font-semibold">{detail.summary.nextMilestone?.name || 'None'}</p>
              <p className="text-[10px] text-gray-400">
                {detail.summary.nextMilestone ? formatDate(detail.summary.nextMilestone.dueDate) : 'Create one below'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Schedule</h3>
            <p className="mt-0.5 text-xs text-gray-400">Set the dates that shape this project on the roadmap.</p>
          </div>
          {detail.project.dependencySummary.blocked && (
            <span className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
              Blocked
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Start date</span>
            <input
              type="date"
              value={scheduleStartDate}
              onChange={(event) => setScheduleStartDate(event.target.value)}
              disabled={!canManage}
              className={`${dateInputClass} disabled:opacity-50`}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Target date</span>
            <input
              type="date"
              value={scheduleTargetDate}
              onChange={(event) => setScheduleTargetDate(event.target.value)}
              disabled={!canManage}
              className={`${dateInputClass} disabled:opacity-50`}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Reason</span>
            <input
              type="text"
              value={scheduleReason}
              onChange={(event) => setScheduleReason(event.target.value)}
              disabled={!canManage}
              placeholder="Optional change reason"
              className={`${inputClass} disabled:opacity-50`}
            />
          </label>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => void handleScheduleSave(false)}
            disabled={!canManage || updateSchedule.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {updateSchedule.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>
      </div>

      {/* Milestones */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Milestones</h3>
            <p className="mt-0.5 text-xs text-gray-400">Key checkpoints for this project.</p>
          </div>
          <span className="text-[11px] text-gray-400">
            {detail.summary.overdueMilestones > 0 && (
              <span className="mr-2 text-amber-500">{detail.summary.overdueMilestones} overdue</span>
            )}
            {milestones.length} total
          </span>
        </div>

        {/* Create form */}
        {canManage && (
          <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3 dark:border-border-dark dark:bg-white/[0.02]">
            <div className="flex-1 min-w-[140px]">
              <span className="mb-1 block text-[10px] font-semibold text-gray-400">Name</span>
              <input
                value={newMilestoneName}
                onChange={(event) => setNewMilestoneName(event.target.value)}
                placeholder="Milestone name"
                className={inputClass}
              />
            </div>
            <div className="w-36">
              <span className="mb-1 block text-[10px] font-semibold text-gray-400">Due date</span>
              <input
                type="date"
                value={newMilestoneDueDate}
                onChange={(event) => setNewMilestoneDueDate(event.target.value)}
                className={dateInputClass}
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <span className="mb-1 block text-[10px] font-semibold text-gray-400">Description</span>
              <input
                value={newMilestoneDescription}
                onChange={(event) => setNewMilestoneDescription(event.target.value)}
                placeholder="Optional"
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={handleCreateMilestone}
              disabled={createMilestone.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {createMilestone.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add
            </button>
          </div>
        )}

        {/* Milestone list */}
        <div className="mt-4 space-y-2">
          {milestones.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-8 text-center dark:border-border-dark">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-300 dark:bg-white/5 dark:text-gray-600">
                <Target size={18} />
              </div>
              <p className="text-xs text-gray-400">No milestones yet</p>
            </div>
          )}

          {milestones.map((milestone, index) => {
            const isEditing = editingMilestoneId === milestone.id && milestoneDraft;

            return (
              <div
                key={milestone.id}
                className={`group rounded-lg border p-3.5 transition-colors ${
                  milestone.outOfRange
                    ? 'border-amber-200 bg-amber-500/5 dark:border-amber-500/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-border-dark dark:bg-card-dark dark:hover:border-gray-600'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        value={milestoneDraft.name}
                        onChange={(event) => setMilestoneDraft({ ...milestoneDraft, name: event.target.value })}
                        className={inputClass}
                        placeholder="Name"
                      />
                      <input
                        type="date"
                        value={milestoneDraft.dueDate}
                        onChange={(event) => setMilestoneDraft({ ...milestoneDraft, dueDate: event.target.value })}
                        className={dateInputClass}
                      />
                      <input
                        value={milestoneDraft.description}
                        onChange={(event) => setMilestoneDraft({ ...milestoneDraft, description: event.target.value })}
                        placeholder="Description"
                        className={inputClass}
                      />
                      <select
                        value={milestoneDraft.status}
                        onChange={(event) =>
                          setMilestoneDraft({
                            ...milestoneDraft,
                            status: event.target.value as RoadmapMilestoneStatus,
                          })
                        }
                        className={inputClass}
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMilestoneId(null);
                          setMilestoneDraft(null);
                        }}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium dark:border-border-dark"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSaveMilestone(milestone.id)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="truncate text-sm font-semibold">{milestone.name}</h4>
                        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${statusBadge(milestone.status)}`}>
                          {milestone.status.replace('_', ' ')}
                        </span>
                        {milestone.outOfRange && (
                          <span className="shrink-0 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            Out of range
                          </span>
                        )}
                      </div>
                      {milestone.description && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{milestone.description}</p>
                      )}
                      <div className="mt-1.5 flex gap-3 text-[11px] text-gray-400">
                        <span>Due {formatDate(milestone.dueDate)}</span>
                        <span>{milestone.owner?.name || 'Unassigned'}</span>
                        {milestone.completedAt && <span>Done {formatDate(milestone.completedAt)}</span>}
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => void handleMoveMilestone(milestone.id, -1)}
                          disabled={index === 0 || reorderMilestones.isPending}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 dark:hover:bg-white/5"
                        >
                          <ArrowUpToLine size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleMoveMilestone(milestone.id, 1)}
                          disabled={index === milestones.length - 1 || reorderMilestones.isPending}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 dark:hover:bg-white/5"
                        >
                          <ArrowDownToLine size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMilestoneId(milestone.id);
                            setMilestoneDraft(getMilestoneDraft(milestone));
                          }}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary dark:hover:bg-white/5"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteMilestone(milestone.id)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dependencies */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Upstream */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Upstream</h3>
              <p className="mt-0.5 text-xs text-gray-400">Projects this depends on.</p>
            </div>
            <span className="text-[11px] text-gray-400">{detail.dependencies.upstream.length}</span>
          </div>

          {canManage && (
            <div className="mt-4 space-y-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3 dark:border-border-dark dark:bg-white/[0.02]">
              <input
                value={dependencySearch}
                onChange={(event) => setDependencySearch(event.target.value)}
                placeholder="Search projects..."
                className={inputClass}
              />
              <select
                value={selectedBlockingProjectId}
                onChange={(event) => setSelectedBlockingProjectId(event.target.value)}
                className={inputClass}
              >
                <option value="">Select blocking project</option>
                {filteredDependencyOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <input
                value={dependencyNote}
                onChange={(event) => setDependencyNote(event.target.value)}
                placeholder="Optional note"
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleCreateDependency}
                disabled={createDependency.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {createDependency.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add
              </button>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {detail.dependencies.upstream.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-6 text-center dark:border-border-dark">
                <p className="text-xs text-gray-400">No upstream dependencies</p>
              </div>
            )}
            {detail.dependencies.upstream.map((dependency) => (
              <DependencyCard
                key={dependency.id}
                dependency={dependency}
                perspective="upstream"
                canManage={canManage}
                onResolve={() => void runDependencyAction('resolve', dependency)}
                onCancel={() => void runDependencyAction('cancel', dependency)}
                onDelete={() => void runDependencyAction('delete', dependency)}
              />
            ))}
          </div>
        </div>

        {/* Downstream */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Downstream</h3>
              <p className="mt-0.5 text-xs text-gray-400">Projects waiting on this.</p>
            </div>
            <span className="text-[11px] text-gray-400">{detail.dependencies.downstream.length}</span>
          </div>

          <div className="mt-4 space-y-2">
            {detail.dependencies.downstream.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-6 text-center dark:border-border-dark">
                <p className="text-xs text-gray-400">No downstream dependencies</p>
              </div>
            )}
            {detail.dependencies.downstream.map((dependency) => (
              <DependencyCard
                key={dependency.id}
                dependency={dependency}
                perspective="downstream"
                canManage={canManage}
                onResolve={() => void runDependencyAction('resolve', dependency)}
                onCancel={() => void runDependencyAction('cancel', dependency)}
                onDelete={() => void runDependencyAction('delete', dependency)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DependencyCard: React.FC<{
  dependency: RoadmapDependency;
  perspective: 'upstream' | 'downstream';
  canManage: boolean;
  onResolve: () => void;
  onCancel: () => void;
  onDelete: () => void;
}> = ({ dependency, perspective, canManage, onResolve, onCancel, onDelete }) => {
  const project = perspective === 'upstream' ? dependency.blockingProject : dependency.blockedProject;

  return (
    <div className="group rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300 dark:border-border-dark dark:hover:border-gray-600">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold">{project?.name || 'Unknown project'}</p>
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${statusBadge(dependency.status)}`}>
              {dependency.status}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-gray-400">
            {project?.team?.name || 'No team'}
            {project?.department ? ` / ${project.department.name}` : ''}
            {' · Target '}
            {formatDate(project?.targetDate || null)}
          </p>
          {dependency.note && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{dependency.note}</p>}
        </div>

        {canManage && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {dependency.status === 'ACTIVE' && (
              <>
                <button
                  type="button"
                  onClick={onResolve}
                  className="rounded p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                  title="Resolve"
                >
                  <CheckCircle2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                  title="Cancel"
                >
                  <XCircle size={14} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
