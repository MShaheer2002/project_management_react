import React, { useDeferredValue, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Map,
  Search,
  Target,
} from 'lucide-react';
import { useDepartmentOptions } from '@features/department';
import { useTeamOptions } from '@features/team';
import { useWorkspaceMemberOptions } from '@features/workspace';
import { useRoadmapList } from '../hooks/useRoadmapData';
import type { RoadmapHealth, RoadmapItem, RoadmapProjectStatus, RoadmapView } from '../types';

const pageSize = 50;

const statusOptions: Array<{ value: RoadmapProjectStatus; label: string }> = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const healthOptions: Array<{ value: RoadmapHealth; label: string }> = [
  { value: 'ON_TRACK', label: 'On track' },
  { value: 'AT_RISK', label: 'At risk' },
  { value: 'OFF_TRACK', label: 'Off track' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'NO_SIGNAL', label: 'Needs dates' },
];

const monthLabelFormatter = new Intl.DateTimeFormat(undefined, { month: 'short' });
const monthRangeFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const parseDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatShortDate = (value: string | null) => (value ? dateFormatter.format(parseDate(value)) : 'No date');

const getTimelineSegments = (from: string, to: string, view: RoadmapView) => {
  const start = parseDate(from);
  const end = parseDate(to);

  if (view === 'QUARTER') {
    const segments: Array<{ key: string; label: string }> = [];
    let cursor = startOfMonth(start);
    while (cursor <= end) {
      segments.push({
        key: cursor.toISOString(),
        label: monthLabelFormatter.format(cursor),
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return segments;
  }

  const segments: Array<{ key: string; label: string }> = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    const segmentEnd = addDays(cursor, 6);
    segments.push({
      key: cursor.toISOString(),
      label: `${monthRangeFormatter.format(cursor)} - ${monthRangeFormatter.format(segmentEnd <= end ? segmentEnd : end)}`,
    });
    cursor = addDays(cursor, 7);
  }

  return segments;
};

const healthBadge = (status: RoadmapHealth) => {
  switch (status) {
    case 'ON_TRACK':
      return 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400';
    case 'AT_RISK':
      return 'text-amber-600 bg-amber-500/10 dark:text-amber-400';
    case 'OFF_TRACK':
      return 'text-red-500 bg-red-500/10 dark:text-red-400';
    case 'BLOCKED':
      return 'text-rose-500 bg-rose-500/10 dark:text-rose-400';
    default:
      return 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
  }
};

const barColor = (item: RoadmapItem) => {
  if (item.dependencySummary.blocked) return 'bg-rose-500/15 text-rose-700 dark:text-rose-300';

  switch (item.health.status) {
    case 'ON_TRACK':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'AT_RISK':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
    case 'OFF_TRACK':
      return 'bg-red-500/15 text-red-700 dark:text-red-300';
    case 'BLOCKED':
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300';
    default:
      return 'bg-primary/10 text-primary';
  }
};

const progressBarColor = (status: RoadmapHealth) => {
  switch (status) {
    case 'ON_TRACK':
      return 'bg-emerald-500';
    case 'AT_RISK':
      return 'bg-amber-500';
    case 'OFF_TRACK':
      return 'bg-red-500';
    case 'BLOCKED':
      return 'bg-rose-500';
    default:
      return 'bg-primary';
  }
};

/* ------------------------------------------------------------------ */
/*  Shimmer skeleton                                                   */
/* ------------------------------------------------------------------ */
const ShimmerBlock: React.FC<{ className: string }> = ({ className }) => (
  <div className={`animate-pulse rounded bg-gray-200 dark:bg-white/[0.06] ${className}`} />
);

const RoadmapSkeleton: React.FC = () => (
  <div className="flex h-full flex-col bg-gray-50/30 dark:bg-transparent">
    <header className="border-b border-gray-200 px-6 py-6 dark:border-border-dark">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShimmerBlock className="h-10 w-10 !rounded-xl" />
          <div className="space-y-2">
            <ShimmerBlock className="h-5 w-36" />
            <ShimmerBlock className="h-3 w-24 !bg-gray-100 dark:!bg-white/[0.03]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShimmerBlock className="h-8 w-40 !rounded-lg" />
          <ShimmerBlock className="h-8 w-28 !rounded-lg" />
          <ShimmerBlock className="h-8 w-20 !rounded-lg" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <ShimmerBlock className="h-9 w-48 !rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <ShimmerBlock key={i} className="h-9 w-28 !rounded-lg" />
        ))}
      </div>
    </header>

    <div className="flex-1 overflow-hidden p-6">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-border-dark dark:bg-card-dark">
        {/* Header row */}
        <div className="flex border-b border-gray-100 dark:border-border-dark/40">
          <div className="w-72 shrink-0 px-4 py-3">
            <ShimmerBlock className="h-3 w-16" />
          </div>
          <div className="flex flex-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`flex flex-1 justify-center py-3 ${i > 0 ? 'border-l border-gray-100 dark:border-border-dark/40' : ''}`}>
                <ShimmerBlock className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex border-b border-gray-100 last:border-b-0 dark:border-border-dark/30">
            <div className="w-72 shrink-0 space-y-2 px-4 py-4">
              <ShimmerBlock className="h-4 w-32" />
              <ShimmerBlock className="h-3 w-20 !bg-gray-100 dark:!bg-white/[0.03]" />
              <ShimmerBlock className="h-1.5 w-full !rounded-full !bg-gray-100 dark:!bg-white/[0.03]" />
              <ShimmerBlock className="h-4 w-16 !rounded-md" />
            </div>
            <div className="flex flex-1 items-center px-3">
              <div
                className="h-7 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.04]"
                style={{ marginLeft: `${5 + i * 12}%`, width: `${18 + i * 6}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Shared select class                                                */
/* ------------------------------------------------------------------ */
const selectClass =
  'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5 dark:text-gray-300';

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export const RoadmapPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const legacyTeamId = searchParams.get('team');
  const teamId = searchParams.get('teamId') || legacyTeamId || undefined;
  const view = (searchParams.get('view') === 'MONTH' ? 'MONTH' : 'QUARTER') as RoadmapView;
  const from = searchParams.get('from') || undefined;
  const departmentId = searchParams.get('departmentId') || undefined;
  const leadId = searchParams.get('leadId') || undefined;
  const status = (searchParams.get('status') as RoadmapProjectStatus | null) || undefined;
  const health = (searchParams.get('health') as RoadmapHealth | null) || undefined;
  const includeUnscheduled = searchParams.get('includeUnscheduled') === 'true';
  const q = searchParams.get('q') || '';
  const deferredQuery = useDeferredValue(q);

  useEffect(() => {
    if (!legacyTeamId || searchParams.get('teamId')) return;
    const next = new URLSearchParams(searchParams);
    next.set('teamId', legacyTeamId);
    next.delete('team');
    setSearchParams(next, { replace: true });
  }, [legacyTeamId, searchParams, setSearchParams]);

  const roadmapQuery = useRoadmapList({
    view,
    from,
    teamId,
    departmentId,
    leadId,
    status,
    health,
    includeUnscheduled,
    q: deferredQuery.trim() || undefined,
    limit: pageSize,
    sort: 'targetDate:asc',
  });

  const teamOptionsQuery = useTeamOptions({ limit: 100, sort: 'name:asc' }, { enabled: true });
  const departmentOptionsQuery = useDepartmentOptions({ limit: 100, sort: 'name:asc' }, { enabled: true });
  const leadOptionsQuery = useWorkspaceMemberOptions({ limit: 100, sort: 'name:asc' }, { enabled: true });

  const teamOptions = teamOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const departmentOptions = departmentOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const leadOptions = leadOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const pages = roadmapQuery.data?.pages ?? [];
  const firstPage = pages[0];
  const items = pages.flatMap((page) => page.items);
  const unscheduledItems = firstPage?.unscheduled.items ?? [];
  const segments = useMemo(
    () => (firstPage ? getTimelineSegments(firstPage.window.from, firstPage.window.to, firstPage.window.view) : []),
    [firstPage]
  );
  const selectedTeam = teamOptions.find((option) => option.id === teamId);

  const updateSearchParams = (updates: Record<string, string | undefined | null | boolean>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        if (value) next.set(key, 'true');
        else next.delete(key);
        return;
      }

      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next);
  };

  /* Loading */
  if (roadmapQuery.isLoading) return <RoadmapSkeleton />;

  /* Error */
  if (roadmapQuery.error || !firstPage) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Map size={28} />
        </div>
        <h2 className="text-lg font-bold">Roadmap unavailable</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-400">
          We couldn&apos;t load the roadmap. Try again or adjust your filters.
        </p>
        <button
          type="button"
          onClick={() => roadmapQuery.refetch()}
          className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50/30 dark:bg-transparent">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="border-b border-gray-200 px-6 py-6 dark:border-border-dark">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Map size={20} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold tracking-tight">
                    {selectedTeam ? `${selectedTeam.name} Roadmap` : 'Roadmap'}
                  </h1>
                  {selectedTeam && (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                      Team Scope
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {firstPage.meta.total} project{firstPage.meta.total === 1 ? '' : 's'} in this view
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* View toggle */}
            <div className="flex items-center rounded-lg bg-gray-100 p-0.5 dark:bg-white/5">
              {(['QUARTER', 'MONTH'] as RoadmapView[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateSearchParams({ view: option, from: firstPage.window.from })}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    firstPage.window.view === option
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                >
                  {option === 'QUARTER' ? 'Quarterly' : 'Monthly'}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center rounded-lg border border-gray-200 bg-white dark:border-border-dark dark:bg-white/5">
              <button
                type="button"
                onClick={() =>
                  updateSearchParams({ from: firstPage.window.previous.from, view: firstPage.window.view })
                }
                className="rounded-l-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[90px] border-x border-gray-200 px-3 py-1.5 text-center text-xs font-semibold dark:border-border-dark">
                {firstPage.window.label}
              </span>
              <button
                type="button"
                onClick={() => updateSearchParams({ from: firstPage.window.next.from, view: firstPage.window.view })}
                className="rounded-r-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              <CalendarRange size={14} />
              Projects
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(event) => updateSearchParams({ q: event.target.value || null })}
              placeholder="Search projects"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5 dark:text-gray-300"
            />
          </div>

          <select value={teamId ?? ''} onChange={(event) => updateSearchParams({ teamId: event.target.value || null })} className={selectClass}>
            <option value="">All teams</option>
            {teamOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>

          <select value={departmentId ?? ''} onChange={(event) => updateSearchParams({ departmentId: event.target.value || null })} className={selectClass}>
            <option value="">All departments</option>
            {departmentOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>

          <select value={leadId ?? ''} onChange={(event) => updateSearchParams({ leadId: event.target.value || null })} className={selectClass}>
            <option value="">All leads</option>
            {leadOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>

          <select value={status ?? ''} onChange={(event) => updateSearchParams({ status: event.target.value || null })} className={selectClass}>
            <option value="">All status</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select value={health ?? ''} onChange={(event) => updateSearchParams({ health: event.target.value || null })} className={selectClass}>
            <option value="">All health</option>
            {healthOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-500 transition-all hover:border-primary/40 dark:border-border-dark dark:bg-white/5 dark:text-gray-400">
            <input
              type="checkbox"
              checked={includeUnscheduled}
              onChange={(event) => updateSearchParams({ includeUnscheduled: event.target.checked })}
              className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            Unscheduled
          </label>
        </div>
      </header>

      {/* ── Timeline ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        <div className="min-w-[1080px]">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
            {/* Column header */}
            <div className="flex border-b border-gray-200 dark:border-border-dark">
              <div className="w-72 shrink-0 border-r border-gray-100 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:border-border-dark/50">
                Project
              </div>
              <div className="flex flex-1">
                {segments.map((segment, i) => (
                  <div
                    key={segment.key}
                    className={`flex-1 py-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 ${
                      i > 0 ? 'border-l border-gray-100 dark:border-border-dark/50' : ''
                    }`}
                  >
                    {segment.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Empty state */}
            {items.length === 0 && (
              <div className="flex min-h-[30vh] flex-col items-center justify-center px-6 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Target size={28} />
                </div>
                <h2 className="text-lg font-bold">No roadmap projects</h2>
                <p className="mt-2 max-w-sm text-sm text-gray-400">
                  Try changing filters, or add project dates to start building your roadmap.
                </p>
              </div>
            )}

            {/* Rows */}
            {items.map((item) => {
              const layout = item.schedule.layout;
              const barWidth = layout?.overlapsWindow ? Math.max(layout.widthPercent, 14) : 0;
              const showDuration = barWidth >= 22;

              return (
                <div
                  key={item.id}
                  className="group flex border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50 dark:border-border-dark/30 dark:hover:bg-white/[0.02]"
                >
                  {/* Project info */}
                  <div className="w-72 shrink-0 border-r border-gray-100 px-4 py-4 dark:border-border-dark/50">
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${item.id}?tab=roadmap`)}
                      className="block truncate text-sm font-bold tracking-tight transition-colors hover:text-primary"
                    >
                      {item.name}
                    </button>
                    <p className="mt-0.5 truncate text-[11px] text-gray-400">
                      {item.team?.name || 'No team'}
                      {item.department ? ` · ${item.department.name}` : ''}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                        <div
                          className={`h-full rounded-full transition-all ${progressBarColor(item.health.status)}`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold tabular-nums text-gray-400">{item.progress}%</span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${healthBadge(item.health.status)}`}>
                        {item.health.status.replace('_', ' ')}
                      </span>
                      {item.dependencySummary.blocked && (
                        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                          Blocked
                        </span>
                      )}
                      {item.milestoneSummary.overdue > 0 && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {item.milestoneSummary.overdue} overdue
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timeline bar */}
                  <div className="relative flex flex-1 items-center px-1">
                    {/* Column gridlines */}
                    <div className="pointer-events-none absolute inset-0 flex">
                      {segments.map((segment, i) => (
                        <div
                          key={`g-${item.id}-${segment.key}`}
                          className={`flex-1 ${i > 0 ? 'border-l border-gray-50 dark:border-border-dark/20' : ''}`}
                        />
                      ))}
                    </div>

                    {layout?.overlapsWindow ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/projects/${item.id}?tab=roadmap`)}
                        title={`${item.name} — ${item.schedule.durationDays ?? layout.durationDays} days`}
                        className={`relative z-10 flex h-7 items-center rounded-lg px-2.5 text-left transition-all hover:-translate-y-px hover:shadow-md ${barColor(item)}`}
                        style={{
                          marginLeft: `${layout.offsetPercent}%`,
                          width: `${barWidth}%`,
                        }}
                      >
                        <span className="truncate text-[11px] font-semibold">{item.name}</span>
                        {showDuration && (
                          <span className="ml-auto shrink-0 pl-2 text-[10px] font-medium opacity-60">
                            {item.schedule.durationDays ?? layout.durationDays}d
                          </span>
                        )}
                      </button>
                    ) : (
                      <div className="relative z-10 ml-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-200 px-3 py-1.5 text-[11px] text-gray-400 dark:border-border-dark">
                        <AlertTriangle size={11} />
                        Outside this timeline
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Unscheduled ─────────────────────────────────────── */}
          {includeUnscheduled && unscheduledItems.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                Unscheduled
                <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-100 px-1.5 text-[10px] font-bold text-gray-500 dark:bg-white/5">
                  {unscheduledItems.length}
                </span>
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                Add start and target dates so these projects appear on the timeline.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {unscheduledItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/projects/${item.id}?tab=roadmap`)}
                    className="group rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 dark:border-border-dark dark:bg-card-dark"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold tracking-tight">{item.name}</p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {item.team?.name || 'No team'}
                          {item.department ? ` · ${item.department.name}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-gray-400">{item.progress}%</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 dark:border-border-dark/70">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Start</p>
                        <p className="mt-1 text-xs font-semibold text-gray-600 dark:text-gray-300">{formatShortDate(item.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Target</p>
                        <p className="mt-1 text-xs font-semibold text-gray-600 dark:text-gray-300">{formatShortDate(item.targetDate)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Load more */}
          {roadmapQuery.hasNextPage && (
            <div className="flex justify-center py-6">
              <button
                type="button"
                onClick={() => roadmapQuery.fetchNextPage()}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50 dark:border-border-dark"
                disabled={roadmapQuery.isFetchingNextPage}
              >
                {roadmapQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
