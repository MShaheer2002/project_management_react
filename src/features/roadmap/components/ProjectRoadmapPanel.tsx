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

const badgeClassName = (status: string) => {
  switch (status) {
    case 'ON_TRACK':
    case 'COMPLETED':
    case 'RESOLVED':
      return 'border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/20 dark:text-emerald-300';
    case 'AT_RISK':
    case 'IN_PROGRESS':
      return 'border-amber-200 bg-amber-500/10 text-amber-600 dark:border-amber-500/20 dark:text-amber-300';
    case 'OFF_TRACK':
    case 'MISSED':
    case 'CANCELLED':
      return 'border-red-200 bg-red-500/10 text-red-600 dark:border-red-500/20 dark:text-red-300';
    case 'BLOCKED':
      return 'border-rose-200 bg-rose-500/10 text-rose-600 dark:border-rose-500/20 dark:text-rose-300';
    default:
      return 'border-gray-200 bg-gray-500/10 text-gray-500 dark:border-border-dark dark:text-gray-300';
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
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <GitBranch size={28} />
        </div>
        <h2 className="text-xl font-bold">{isDisabled ? 'Roadmap disabled for this project' : 'Roadmap unavailable'}</h2>
        <p className="mt-2 max-w-md text-sm text-gray-400">
          {isDisabled
            ? 'Turn on roadmap in project settings to start planning dates, milestones, and dependencies.'
            : 'We couldn&apos;t load this project roadmap.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50/30 p-6 dark:bg-transparent">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GitBranch size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight">Project Roadmap</h2>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${badgeClassName(detail.summary.health.status)}`}>
                  {detail.summary.health.status.replace('_', ' ')}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Keep the plan clear with dates, milestones, and project dependencies in one place.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-border-dark dark:bg-white/[0.03]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Start</p>
              <p className="mt-2 text-sm font-bold">{formatDate(detail.project.schedule.startDate)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-border-dark dark:bg-white/[0.03]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Target</p>
              <p className="mt-2 text-sm font-bold">{formatDate(detail.project.schedule.targetDate)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-border-dark dark:bg-white/[0.03]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Progress</p>
              <p className="mt-2 text-sm font-bold">{detail.project.progress}%</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-border-dark dark:bg-white/[0.03]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Milestones</p>
              <p className="mt-2 text-sm font-bold">{milestones.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Health</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${badgeClassName(detail.summary.health.status)}`}>
                  {detail.summary.health.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
              <CalendarRange size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Forecast</p>
              <p className="mt-2 text-lg font-bold">{detail.summary.forecast.status.replace('_', ' ')}</p>
              <p className="mt-1 text-xs text-gray-400">
                {detail.summary.forecast.projectedTargetDate
                  ? `Expected around ${formatDate(detail.summary.forecast.projectedTargetDate)}`
                  : 'Add more progress to see a forecast'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-300">
              <GitBranch size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Blocked</p>
              <p className="mt-2 text-lg font-bold">{detail.summary.blocked ? 'Yes' : 'No'}</p>
              <p className="mt-1 text-xs text-gray-400">
                {detail.dependencies.upstream.length} upstream · {detail.dependencies.downstream.length} downstream
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Next milestone</p>
              <p className="mt-2 text-sm font-bold">{detail.summary.nextMilestone?.name || 'None scheduled'}</p>
              <p className="mt-1 text-xs text-gray-400">
                {detail.summary.nextMilestone ? formatDate(detail.summary.nextMilestone.dueDate) : 'Create one to track delivery'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Schedule</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Set the start and target dates that shape this project on the roadmap.
            </p>
          </div>
          {detail.project.dependencySummary.blocked && (
            <span className="rounded-full border border-rose-200 bg-rose-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600 dark:border-rose-500/20 dark:text-rose-300">
              Blocked
            </span>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Start date</span>
            <input
              type="date"
              value={scheduleStartDate}
              onChange={(event) => setScheduleStartDate(event.target.value)}
              disabled={!canManage}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 [color-scheme:light] dark:border-border-dark dark:bg-white/5 dark:[color-scheme:dark]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Target date</span>
            <input
              type="date"
              value={scheduleTargetDate}
              onChange={(event) => setScheduleTargetDate(event.target.value)}
              disabled={!canManage}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 [color-scheme:light] dark:border-border-dark dark:bg-white/5 dark:[color-scheme:dark]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Reason</span>
            <input
              type="text"
              value={scheduleReason}
              onChange={(event) => setScheduleReason(event.target.value)}
              disabled={!canManage}
              placeholder="Optional reason for the change"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 dark:border-border-dark dark:bg-white/5"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void handleScheduleSave(false)}
            disabled={!canManage || updateSchedule.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {updateSchedule.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save schedule
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Milestones</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Break the plan into key checkpoints so the team can see what comes next.
            </p>
          </div>
          <div className="text-xs text-gray-400">
            {detail.summary.overdueMilestones} overdue · {milestones.length} total
          </div>
        </div>

        {canManage && (
            <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-4 dark:border-border-dark dark:bg-white/[0.02] md:grid-cols-4">
            <input
              value={newMilestoneName}
              onChange={(event) => setNewMilestoneName(event.target.value)}
              placeholder="Milestone name"
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
            />
            <input
              type="date"
              value={newMilestoneDueDate}
              onChange={(event) => setNewMilestoneDueDate(event.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 [color-scheme:light] dark:border-border-dark dark:bg-white/5 dark:[color-scheme:dark]"
            />
            <input
              value={newMilestoneDescription}
              onChange={(event) => setNewMilestoneDescription(event.target.value)}
              placeholder="Description"
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
            />
            <button
              type="button"
              onClick={handleCreateMilestone}
              disabled={createMilestone.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {createMilestone.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Add milestone
            </button>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {milestones.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center text-sm text-gray-400 dark:border-border-dark dark:bg-white/[0.02]">
              No milestones yet. Add the first checkpoint to start shaping this timeline.
            </div>
          )}

          {milestones.map((milestone, index) => {
            const isEditing = editingMilestoneId === milestone.id && milestoneDraft;

            return (
              <div
                key={milestone.id}
                className={`rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md dark:border-border-dark ${
                  milestone.outOfRange ? 'border-amber-300 bg-amber-500/5' : 'border-gray-200 bg-white dark:bg-card-dark'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={milestoneDraft.name}
                          onChange={(event) => setMilestoneDraft({ ...milestoneDraft, name: event.target.value })}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                        />
                        <input
                          type="date"
                          value={milestoneDraft.dueDate}
                          onChange={(event) => setMilestoneDraft({ ...milestoneDraft, dueDate: event.target.value })}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 [color-scheme:light] dark:border-border-dark dark:bg-white/5 dark:[color-scheme:dark]"
                        />
                        <input
                          value={milestoneDraft.description}
                          onChange={(event) => setMilestoneDraft({ ...milestoneDraft, description: event.target.value })}
                          placeholder="Description"
                          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                        />
                        <select
                          value={milestoneDraft.status}
                          onChange={(event) =>
                            setMilestoneDraft({
                              ...milestoneDraft,
                              status: event.target.value as RoadmapMilestoneStatus,
                            })
                          }
                          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>
                              {option.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold">{milestone.name}</h3>
                          <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${badgeClassName(milestone.status)}`}>
                            {milestone.status.replace('_', ' ')}
                          </span>
                          {milestone.outOfRange && (
                            <span className="rounded-full border border-amber-200 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:border-amber-500/20 dark:text-amber-300">
                              Out of range
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {milestone.description || 'No details added yet.'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                          <span>Due {formatDate(milestone.dueDate)}</span>
                          <span>Owner: {milestone.owner?.name || 'Unassigned'}</span>
                          {milestone.completedAt && <span>Completed {formatDate(milestone.completedAt)}</span>}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleMoveMilestone(milestone.id, -1)}
                          disabled={index === 0 || reorderMilestones.isPending}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-40 dark:border-border-dark"
                        >
                          <ArrowUpToLine size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleMoveMilestone(milestone.id, 1)}
                          disabled={index === milestones.length - 1 || reorderMilestones.isPending}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-40 dark:border-border-dark"
                        >
                          <ArrowDownToLine size={14} />
                        </button>
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleSaveMilestone(milestone.id)}
                              className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMilestoneId(null);
                                setMilestoneDraft(null);
                              }}
                              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold dark:border-border-dark"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMilestoneId(milestone.id);
                                setMilestoneDraft(getMilestoneDraft(milestone));
                              }}
                              className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-primary/40 hover:text-primary dark:border-border-dark"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteMilestone(milestone.id)}
                              className="rounded-lg border border-red-200 p-2 text-red-500 transition-colors hover:bg-red-500 hover:text-white dark:border-red-500/20"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Upstream dependencies</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Projects this work depends on before it can move forward.
              </p>
            </div>
            <span className="text-xs text-gray-400">{detail.dependencies.upstream.length} items</span>
          </div>

          {canManage && (
            <div className="mt-6 space-y-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-4 dark:border-border-dark dark:bg-white/[0.02]">
              <input
                value={dependencySearch}
                onChange={(event) => setDependencySearch(event.target.value)}
                placeholder="Search active projects"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
              />
              <select
                value={selectedBlockingProjectId}
                onChange={(event) => setSelectedBlockingProjectId(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
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
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
              />
              <button
                type="button"
                onClick={handleCreateDependency}
                disabled={createDependency.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {createDependency.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add dependency
              </button>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {detail.dependencies.upstream.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center text-sm text-gray-400 dark:border-border-dark dark:bg-white/[0.02]">
                No upstream dependencies yet.
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

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Downstream dependencies</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Projects that are waiting on this work.
              </p>
            </div>
            <span className="text-xs text-gray-400">{detail.dependencies.downstream.length} items</span>
          </div>

          <div className="mt-6 space-y-3">
            {detail.dependencies.downstream.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center text-sm text-gray-400 dark:border-border-dark dark:bg-white/[0.02]">
                No downstream dependencies yet.
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
      </section>
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
    <div className="rounded-2xl border border-gray-200 p-4 dark:border-border-dark">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold">{project?.name || 'Unknown project'}</p>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${badgeClassName(dependency.status)}`}>
              {dependency.status}
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {project?.team?.name || 'No team'}
            {project?.department ? ` · ${project.department.name}` : ''}
            {' · '}
            Target {formatDate(project?.targetDate || null)}
          </p>
          {dependency.note && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{dependency.note}</p>}
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            {dependency.status === 'ACTIVE' && (
              <>
                <button
                  type="button"
                  onClick={onResolve}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white dark:border-emerald-500/20"
                >
                  <CheckCircle2 size={13} />
                  Resolve
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500 hover:text-white dark:border-amber-500/20"
                >
                  <XCircle size={13} />
                  Cancel
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500 hover:text-white dark:border-red-500/20"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
