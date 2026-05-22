import React, { useDeferredValue, useState } from 'react';
import { Building2, Loader2, Plus, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '@/AppContext';
import { canCreateDepartment } from '@shared/permissions';
import { useDepartmentsDirectory } from '../hooks/useDepartmentData';
import type { DepartmentVisibility } from '../types';

export const DepartmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveModal } = useApp();
  const role = useAuthStore((s) => s.workspace?.role);
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState<'all' | DepartmentVisibility>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const deferredSearch = useDeferredValue(search);

  const departmentsQuery = useDepartmentsDirectory({
    q: deferredSearch.trim() || undefined,
    visibility: visibility === 'all' ? undefined : visibility,
    sort: 'name:asc',
    limit: 12,
  });

  const departments = departmentsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const total = departmentsQuery.data?.pages[0]?.meta.total ?? 0;
  const showCreate = canCreateDepartment(role);

  return (
    <div className="flex h-full flex-col bg-gray-50/30 dark:bg-transparent">
      <header className="border-b border-gray-200 px-6 py-6 dark:border-border-dark">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Departments</h1>
                <p className="text-xs text-gray-400">
                  {total} {total === 1 ? 'department' : 'departments'} in this workspace
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
                placeholder="Search departments"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
              />
            </div>

            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as 'all' | DepartmentVisibility)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
            >
              <option value="all">All visibility</option>
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>

            <div className="flex rounded-lg border border-gray-200 bg-white p-1 dark:border-border-dark dark:bg-white/5">
              {(['grid', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === mode ? 'bg-primary/10 text-primary' : 'text-gray-400'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {showCreate && (
              <button
                onClick={() => setActiveModal('create-department')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                <Plus size={16} />
                Create Department
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {departmentsQuery.isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Loading departments...
          </div>
        ) : departmentsQuery.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <p>Failed to load departments.</p>
            <button
              onClick={() => departmentsQuery.refetch()}
              className="mt-3 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white"
            >
              Retry
            </button>
          </div>
        ) : departments.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white/80 px-6 text-center dark:border-border-dark dark:bg-white/[0.03]">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 size={28} />
            </div>
            <h2 className="text-lg font-bold">No departments found</h2>
            <p className="mt-2 max-w-sm text-sm text-gray-400">
              Create your first department or refine the current search filters.
            </p>
            {showCreate && (
              <button
                onClick={() => setActiveModal('create-department')}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
              >
                <Plus size={16} />
                Create Department
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {departments.map((department) => (
                  <button
                    key={department.id}
                    onClick={() => navigate(`/departments/${department.id}`)}
                    className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 dark:border-border-dark dark:bg-card-dark"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-inner"
                          style={{ backgroundColor: department.color || '#5f72ea' }}
                        >
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-bold tracking-tight">{department.name}</h2>
                            {department.isDefault && (
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400">
                            {department.visibility.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 min-h-[40px] text-sm text-gray-500 dark:text-gray-400">
                      {department.description || 'No description provided yet.'}
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 dark:border-border-dark/70">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Members</p>
                        <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {department.stats.memberCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Teams</p>
                        <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {department.stats.teamCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Projects</p>
                        <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {department.stats.projectCount}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                      <Users size={12} />
                      Head: {department.head?.name || 'Unassigned'}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50/60 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:border-border-dark dark:bg-white/[0.03]">
                    <tr>
                      <th className="px-5 py-4">Department</th>
                      <th className="px-5 py-4">Head</th>
                      <th className="px-5 py-4">Visibility</th>
                      <th className="px-5 py-4">Stats</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
                    {departments.map((department) => (
                      <tr
                        key={department.id}
                        onClick={() => navigate(`/departments/${department.id}`)}
                        className="cursor-pointer hover:bg-gray-50/70 dark:hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                              style={{ backgroundColor: department.color || '#5f72ea' }}
                            >
                              <Building2 size={16} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-gray-100">{department.name}</p>
                              <p className="text-xs text-gray-400">{department.description || 'No description'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {department.head?.name || 'Unassigned'}
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                          {department.visibility}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {department.stats.memberCount} members · {department.stats.teamCount} teams
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {departmentsQuery.hasNextPage && (
              <div className="flex justify-center">
                <button
                  onClick={() => departmentsQuery.fetchNextPage()}
                  disabled={departmentsQuery.isFetchingNextPage}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold transition-all hover:border-primary/40 dark:border-border-dark dark:bg-white/5"
                >
                  {departmentsQuery.isFetchingNextPage && <Loader2 size={15} className="animate-spin" />}
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
