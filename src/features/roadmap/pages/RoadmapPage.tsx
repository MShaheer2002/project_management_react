import React, { useDeferredValue, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Loader2,
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

const healthClassName = (status: RoadmapHealth) => {
  switch (status) {
    case 'ON_TRACK':
      return 'border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/20 dark:text-emerald-300';
    case 'AT_RISK':
      return 'border-amber-200 bg-amber-500/10 text-amber-600 dark:border-amber-500/20 dark:text-amber-300';
    case 'OFF_TRACK':
      return 'border-red-200 bg-red-500/10 text-red-600 dark:border-red-500/20 dark:text-red-300';
    case 'BLOCKED':
      return 'border-rose-200 bg-rose-500/10 text-rose-600 dark:border-rose-500/20 dark:text-rose-300';
    default:
      return 'border-gray-200 bg-gray-500/10 text-gray-500 dark:border-border-dark dark:text-gray-300';
  }
};

const barClassName = (item: RoadmapItem) => {
  if (item.dependencySummary.blocked) {
    return 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-200';
  }

  switch (item.health.status) {
    case 'ON_TRACK':
      return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-200';
    case 'AT_RISK':
      return 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-200';
    case 'OFF_TRACK':
      return 'bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-200';
    case 'BLOCKED':
      return 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-200';
    default:
      return 'bg-primary/15 border-primary/30 text-primary';
  }
};

const progressBarClassName = (status: RoadmapHealth) => {
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

  if (roadmapQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Loading roadmap...
      </div>
    );
  }

  if (roadmapQuery.error || !firstPage) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <Map size={28} />
        </div>
        <h2 className="text-xl font-bold">Roadmap unavailable</h2>
        <p className="mt-2 max-w-md text-sm text-gray-400">
          We couldn&apos;t load the roadmap for this view.
        </p>
        <button
          type="button"
          onClick={() => roadmapQuery.refetch()}
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50/30 dark:bg-transparent">
      <header className="border-b border-gray-200 px-6 py-6 dark:border-border-dark">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Map size={20} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl font-bold tracking-tight">
                {selectedTeam ? `${selectedTeam.name} — Roadmap` : 'Roadmap'}
                  </h1>
                  {selectedTeam && (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                      Team view
                    </span>
                  )}
                  {includeUnscheduled && (
                    <span className="rounded-full border border-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:border-border-dark">
                      Showing unscheduled
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {firstPage.meta.total} project{firstPage.meta.total === 1 ? '' : 's'} in this view
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-md bg-gray-100 p-1 dark:bg-white/5">
                {(['QUARTER', 'MONTH'] as RoadmapView[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateSearchParams({ view: option, from: firstPage.window.from })}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                      firstPage.window.view === option
                        ? 'bg-white shadow-sm dark:bg-gray-800'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    }`}
                  >
                    {option === 'QUARTER' ? 'Quarterly' : 'Monthly'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-1 py-1 shadow-sm dark:border-border-dark dark:bg-white/[0.03]">
                <button
                  type="button"
                  onClick={() =>
                    updateSearchParams({ from: firstPage.window.previous.from, view: firstPage.window.view })
                  }
                  className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="min-w-[88px] text-center text-sm font-medium">{firstPage.window.label}</span>
                <button
                  type="button"
                  onClick={() => updateSearchParams({ from: firstPage.window.next.from, view: firstPage.window.view })}
                  className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <CalendarRange size={14} />
              Projects
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-6">
          <label className="relative lg:col-span-2">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(event) => updateSearchParams({ q: event.target.value || null })}
              placeholder="Search roadmap"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.03]"
            />
          </label>

          <select
            value={teamId ?? ''}
            onChange={(event) => updateSearchParams({ teamId: event.target.value || null })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.03]"
          >
            <option value="">All teams</option>
            {teamOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

          <select
            value={departmentId ?? ''}
            onChange={(event) => updateSearchParams({ departmentId: event.target.value || null })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.03]"
          >
            <option value="">All departments</option>
            {departmentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

          <select
            value={leadId ?? ''}
            onChange={(event) => updateSearchParams({ leadId: event.target.value || null })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.03]"
          >
            <option value="">All leads</option>
            {leadOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={status ?? ''}
              onChange={(event) => updateSearchParams({ status: event.target.value || null })}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.03]"
            >
              <option value="">All status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={health ?? ''}
              onChange={(event) => updateSearchParams({ health: event.target.value || null })}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.03]"
            >
              <option value="">All health</option>
              {healthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <input
            type="checkbox"
            checked={includeUnscheduled}
            onChange={(event) => updateSearchParams({ includeUnscheduled: event.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          Include unscheduled projects
        </label>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Map size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Timeline</p>
                <p className="mt-1 text-sm font-bold">{firstPage.window.label}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
                <Target size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">On timeline</p>
                <p className="mt-1 text-sm font-bold">{items.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-300">
                <GitBranch size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Needs dates</p>
                <p className="mt-1 text-sm font-bold">{firstPage.unscheduled.count}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="min-w-[1080px]">
          <div className="sticky top-0 z-10 flex rounded-t-3xl border border-gray-200 bg-gray-50/95 backdrop-blur dark:border-border-dark dark:bg-black/40">
            <div className="w-80 border-r border-gray-200 p-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:border-border-dark">
              Projects
            </div>
            <div className="flex flex-1">
              {segments.map((segment) => (
                <div
                  key={segment.key}
                  className="flex-1 border-r border-gray-200 p-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 last:border-r-0 dark:border-border-dark"
                >
                  {segment.label}
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-b-3xl border-x border-b border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="divide-y divide-gray-100 dark:divide-border-dark">
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Map size={24} />
                </div>
                <h3 className="text-lg font-semibold">No roadmap projects in this scope</h3>
                <p className="mt-2 max-w-lg text-sm text-gray-400">
                  Try changing the filters, or add project dates to start building your roadmap.
                </p>
              </div>
            )}

            {items.map((item) => {
              const layout = item.schedule.layout;

              return (
                <div key={item.id} className="flex transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                  <div className="w-80 border-r border-gray-200 p-4 dark:border-border-dark">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/projects/${item.id}?tab=roadmap`)}
                          className="truncate text-left text-sm font-semibold transition-colors hover:text-primary"
                        >
                          {item.name}
                        </button>
                        <p className="mt-1 truncate text-xs text-gray-400">
                          {item.team?.name || 'No team'}
                          {item.department ? ` · ${item.department.name}` : ''}
                        </p>
                        <div className="mt-3 space-y-2">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className={`h-full rounded-full transition-all ${progressBarClassName(item.health.status)}`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-gray-400">
                            <span>{item.stats.completedIssues}/{item.stats.totalIssues} issues done</span>
                            <span>{item.progress}%</span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${healthClassName(item.health.status)}`}>
                            {item.health.status.replace('_', ' ')}
                          </span>
                          {item.dependencySummary.blocked && (
                            <span className="rounded-full border border-rose-200 bg-rose-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600 dark:border-rose-500/20 dark:text-rose-300">
                              Blocked
                            </span>
                          )}
                          {item.milestoneSummary.overdue > 0 && (
                            <span className="rounded-full border border-amber-200 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:border-amber-500/20 dark:text-amber-300">
                              {item.milestoneSummary.overdue} overdue
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-500">{item.progress}%</span>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {item.targetDate ? formatShortDate(item.targetDate) : 'No target'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex flex-1 items-center p-4">
                    <div className="absolute inset-0 flex">
                      {segments.map((segment) => (
                        <div
                          key={`${item.id}-${segment.key}`}
                          className="flex-1 border-r border-gray-100 last:border-r-0 dark:border-border-dark/30"
                        />
                      ))}
                    </div>

                    {layout?.overlapsWindow ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/projects/${item.id}?tab=roadmap`)}
                        className={`relative z-10 flex h-11 items-center rounded-xl border px-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${barClassName(item)}`}
                        style={{
                          marginLeft: `${layout.offsetPercent}%`,
                          width: `${Math.max(layout.widthPercent, 6)}%`,
                        }}
                      >
                        <div className="flex w-full items-center justify-between gap-3">
                          <span className="truncate text-xs font-semibold">{item.name}</span>
                          <span className="shrink-0 text-[10px] font-bold">
                            {item.schedule.durationDays ?? layout.durationDays}d
                          </span>
                        </div>
                      </button>
                    ) : (
                      <div className="relative z-10 inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400 dark:border-border-dark">
                        <AlertTriangle size={12} />
                        Outside this timeline
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>

          {includeUnscheduled && unscheduledItems.length > 0 && (
            <section className="mt-6 rounded-3xl border border-gray-200 bg-gray-50/50 px-6 py-6 dark:border-border-dark dark:bg-white/[0.02]">
              <div className="mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Unscheduled</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  These projects don&apos;t have enough date information to appear on the timeline yet.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {unscheduledItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/projects/${item.id}?tab=roadmap`)}
                    className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md dark:border-border-dark dark:bg-card-dark"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {item.team?.name || 'No team'}
                          {item.department ? ` · ${item.department.name}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-gray-500">{item.progress}%</span>
                    </div>
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Start: {formatShortDate(item.startDate)}
                      <br />
                      Target: {formatShortDate(item.targetDate)}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {roadmapQuery.hasNextPage && (
            <div className="flex justify-center px-6 py-6">
              <button
                type="button"
                onClick={() => roadmapQuery.fetchNextPage()}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50 dark:border-border-dark"
                disabled={roadmapQuery.isFetchingNextPage}
              >
                {roadmapQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
