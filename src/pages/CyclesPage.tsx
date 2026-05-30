import React, { useDeferredValue, useMemo, useState } from 'react';
import { Calendar, Loader2, Plus, RotateCcw, Search, Target } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import { useCycles, type CycleStatus } from '@features/cycles';
import { useTeamOptions } from '@features/team';

const statusLabel: Record<CycleStatus, string> = {
  CURRENT: 'Current',
  UPCOMING: 'Upcoming',
  COMPLETED: 'Completed',
};

const formatDateRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
};

export const CyclesPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveModal } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const teamId = searchParams.get('team') || undefined;
  const statusParam = searchParams.get('status') as CycleStatus | 'all' | null;
  const status = statusParam && ['CURRENT', 'UPCOMING', 'COMPLETED', 'all'].includes(statusParam) ? statusParam : 'all';

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const teamOptionsQuery = useTeamOptions({ limit: 100 });
  const teams = useMemo(
    () => teamOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [teamOptionsQuery.data]
  );
  const teamName = teams.find((team) => team.id === teamId)?.name;
  const cyclesQuery = useCycles({
    teamId,
    status: status === 'all' ? undefined : status,
    q: deferredSearch.trim() || undefined,
    limit: 30,
    sort: 'startsAt:desc',
  });
  const cycles = useMemo(() => cyclesQuery.data?.pages.flatMap((page) => page.items) ?? [], [cyclesQuery.data]);

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  return (
    <div className="flex h-full flex-col bg-gray-50/30 dark:bg-transparent">
      <header className="border-b border-gray-200 px-6 py-6 dark:border-border-dark">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <RotateCcw size={18} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold tracking-tight">{teamName ? `${teamName} Cycles` : 'Cycles'}</h1>
                  {teamName && (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                      Team Scope
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{cycles.length} cycles</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-[240px]">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search cycles"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
              />
            </div>

            <select
              value={teamId ?? 'all'}
              onChange={(event) => updateParam('team', event.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
            >
              <option value="all">All teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={(event) => updateParam('status', event.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
            >
              <option value="all">All status</option>
              <option value="CURRENT">Current</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <button
              onClick={() => setActiveModal('create-cycle')}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              <Plus size={16} />
              New Cycle
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {cyclesQuery.isLoading ? (
          <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-400">
            <Loader2 size={16} className="mr-2 animate-spin" />
            Loading cycles...
          </div>
        ) : cyclesQuery.isError ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
            <Target size={28} className="text-red-500" />
            <h2 className="text-lg font-bold">Failed to load cycles</h2>
            <button onClick={() => cyclesQuery.refetch()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">
              Retry
            </button>
          </div>
        ) : cycles.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white/80 px-6 text-center dark:border-border-dark dark:bg-white/[0.03]">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target size={28} />
            </div>
            <h2 className="text-lg font-bold">No cycles found</h2>
            <p className="mt-2 max-w-sm text-sm text-gray-400">Try changing filters or create a new cycle.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cycles.map((cycle) => (
              <button
                key={cycle.id}
                onClick={() => navigate(`/cycles/${cycle.id}`)}
                className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 dark:border-border-dark dark:bg-card-dark"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold tracking-tight">{cycle.name}</h2>
                    <p className="mt-1 text-[11px] text-gray-400">{cycle.goal || cycle.description || 'No goal set'}</p>
                  </div>
                  <span className="rounded-full border border-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:border-border-dark">
                    {statusLabel[cycle.status]}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <Calendar size={12} />
                  {formatDateRange(cycle.startsAt, cycle.endsAt)}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 dark:border-border-dark/70">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Issues</p>
                    <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">{cycle.stats.totalIssues}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Done</p>
                    <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">{cycle.stats.completedIssues}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                    <span>Progress</span>
                    <span>{cycle.stats.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${cycle.stats.progress}%` }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
