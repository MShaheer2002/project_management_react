import React, { useDeferredValue, useState } from 'react';
import { Building2, Loader2, Plus, Search, Shield, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '@/AppContext';
import { canCreateTeam } from '@shared/permissions';
import { useTeamsDirectory } from '../hooks/useTeamData';
import type { TeamVisibility } from '../types';

const visibilityText: Record<TeamVisibility, string> = {
  PUBLIC: 'Public',
  PRIVATE: 'Private',
};

export const TeamsPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveModal } = useApp();
  const role = useAuthStore((s) => s.workspace?.role);
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState<'all' | TeamVisibility>('all');
  const deferredSearch = useDeferredValue(search);

  const teamsQuery = useTeamsDirectory({
    q: deferredSearch.trim() || undefined,
    visibility: visibility === 'all' ? undefined : visibility,
    sort: 'name:asc',
    limit: 12,
  });

  const teams = teamsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const total = teamsQuery.data?.pages[0]?.meta.total ?? 0;
  const showCreate = canCreateTeam(role);

  return (
    <div className="flex h-full flex-col bg-gray-50/30 dark:bg-transparent">
      <header className="border-b border-gray-200 px-6 py-6 dark:border-border-dark">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Teams</h1>
                <p className="text-xs text-gray-400">
                  {total} {total === 1 ? 'team' : 'teams'} in this workspace
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-[240px]">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search teams"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
              />
            </div>

            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as 'all' | TeamVisibility)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
            >
              <option value="all">All visibility</option>
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>

            {showCreate && (
              <button
                onClick={() => setActiveModal('create-team')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                <Plus size={16} />
                Create Team
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {teamsQuery.isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Loading teams...
          </div>
        ) : teamsQuery.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <p>Failed to load teams.</p>
            <button
              onClick={() => teamsQuery.refetch()}
              className="mt-3 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white"
            >
              Retry
            </button>
          </div>
        ) : teams.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white/80 px-6 text-center dark:border-border-dark dark:bg-white/[0.03]">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users size={28} />
            </div>
            <h2 className="text-lg font-bold">No teams found</h2>
            <p className="mt-2 max-w-sm text-sm text-gray-400">
              Create your first team or adjust the current search and visibility filters.
            </p>
            {showCreate && (
              <button
                onClick={() => setActiveModal('create-team')}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
              >
                <Plus size={16} />
                Create Team
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => navigate(`/teams/${team.id}`)}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 dark:border-border-dark dark:bg-card-dark"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="font-bold tracking-tight">{team.name}</h2>
                          <p className="text-[11px] text-gray-400">
                            {team.stats.memberCount} members
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full border border-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:border-border-dark">
                      {visibilityText[team.visibility]}
                    </span>
                  </div>

                  <p className="mt-4 min-h-[40px] text-sm text-gray-500 dark:text-gray-400">
                    {team.description || 'No description provided yet.'}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 dark:border-border-dark/70">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Lead</p>
                      <p className="mt-1 truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {team.lead?.name || 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Department</p>
                      <p className="mt-1 truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {team.department?.name || 'No department'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Building2 size={12} />
                      {team.department?.color ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: team.department.color }}
                          />
                          {team.department.name}
                        </span>
                      ) : (
                        'No department'
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Shield size={12} />
                      {team.stats.projectCount} active projects
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {teamsQuery.hasNextPage && (
              <div className="flex justify-center">
                <button
                  onClick={() => teamsQuery.fetchNextPage()}
                  disabled={teamsQuery.isFetchingNextPage}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold transition-all hover:border-primary/40 dark:border-border-dark dark:bg-white/5"
                >
                  {teamsQuery.isFetchingNextPage && <Loader2 size={15} className="animate-spin" />}
                  Load more
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
