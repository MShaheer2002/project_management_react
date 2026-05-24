import React, { useDeferredValue, useState } from 'react';
import { Layers, Loader2, Plus, Search, Shield, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '@/AppContext';
import { canCreateProject } from '@shared/permissions';
import { useProjectsDirectory } from '../hooks/useProjectData';
import type { ProjectStatus, ProjectVisibility } from '../types';

const visibilityText: Record<ProjectVisibility, string> = {
  PUBLIC: 'Public',
  PRIVATE: 'Private',
};

const statusText: Record<ProjectStatus, string> = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  COMPLETED: 'Completed',
};

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setActiveModal } = useApp();
  const role = useAuthStore((s) => s.workspace?.role);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | ProjectStatus>('all');
  const [visibility, setVisibility] = useState<'all' | ProjectVisibility>('all');
  const deferredSearch = useDeferredValue(search);
  const teamId = searchParams.get('team') || undefined;

  const projectsQuery = useProjectsDirectory({
    q: deferredSearch.trim() || undefined,
    teamId,
    status: status === 'all' ? undefined : status,
    visibility: visibility === 'all' ? undefined : visibility,
    sort: 'updatedAt:desc',
    limit: 12,
  });

  const projects = projectsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const total = projectsQuery.data?.pages[0]?.meta.total ?? 0;
  const showCreate = canCreateProject(role);

  return (
    <div className="flex h-full flex-col bg-gray-50/30 dark:bg-transparent">
      <header className="border-b border-gray-200 px-6 py-6 dark:border-border-dark">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Layers size={20} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold tracking-tight">
                    {teamId ? 'Team Projects' : 'Projects'}
                  </h1>
                  {teamId && (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                      Team Scope
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {total} {total === 1 ? 'project' : 'projects'} in this workspace
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
                placeholder="Search projects"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
              />
            </div>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as 'all' | ProjectStatus)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
            >
              <option value="all">All status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as 'all' | ProjectVisibility)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
            >
              <option value="all">All visibility</option>
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>

            {showCreate && (
              <button
                onClick={() => setActiveModal('create-project')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                <Plus size={16} />
                New Project
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {projectsQuery.isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Loading projects...
          </div>
        ) : projectsQuery.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <p>Failed to load projects.</p>
            <button
              onClick={() => projectsQuery.refetch()}
              className="mt-3 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white"
            >
              Retry
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white/80 px-6 text-center dark:border-border-dark dark:bg-white/[0.03]">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Layers size={28} />
            </div>
            <h2 className="text-lg font-bold">No projects found</h2>
            <p className="mt-2 max-w-sm text-sm text-gray-400">
              Create a project or refine the current search, status, and visibility filters.
            </p>
            {showCreate && (
              <button
                onClick={() => setActiveModal('create-project')}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
              >
                <Plus size={16} />
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 dark:border-border-dark dark:bg-card-dark"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Layers size={20} />
                      </div>
                      <div>
                        <h2 className="font-bold tracking-tight">{project.name}</h2>
                        <p className="text-[11px] text-gray-400">
                          {project.team.name} {project.department ? `· ${project.department.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:border-border-dark">
                      {visibilityText[project.visibility]}
                    </span>
                  </div>

                  <p className="mt-4 min-h-[40px] text-sm text-gray-500 dark:text-gray-400">
                    {project.description || 'No description provided yet.'}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 dark:border-border-dark/70">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Lead</p>
                      <p className="mt-1 truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {project.lead?.name || 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Status</p>
                      <p className="mt-1 truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {statusText[project.status]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Users size={12} />
                      {project.stats.memberCount} members
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Shield size={12} />
                      {project.stats.issueCount} issues
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {projectsQuery.hasNextPage && (
              <div className="flex justify-center">
                <button
                  onClick={() => projectsQuery.fetchNextPage()}
                  disabled={projectsQuery.isFetchingNextPage}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold transition-all hover:border-primary/40 dark:border-border-dark dark:bg-white/5"
                >
                  {projectsQuery.isFetchingNextPage && <Loader2 size={15} className="animate-spin" />}
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
