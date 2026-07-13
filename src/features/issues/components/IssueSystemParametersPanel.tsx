import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Check,
  ChevronRight,
  Link as LinkIcon,
  Plus,
  Search,
  Settings2,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { STATUS_LABELS } from '@/constants';
import { useWorkspaceMemberOptions } from '@features/workspace';
import type {
  IssueDependency,
  IssueDependencyRelation,
  IssueIntegrationRef,
} from '@/types';
import { useIssueOptions } from '../hooks/useIssueData';

type SystemDialogKey = 'parent' | 'dependencies' | 'watchers' | 'integration' | null;

type IssueSystemParametersPanelProps = {
  projectId?: string;
  parentIssueId: string;
  dependencies: IssueDependency[];
  watcherIds: string[];
  integrationRefs: IssueIntegrationRef[];
  onParentIssueIdChange: (issueId: string) => void;
  onDependenciesChange: (items: IssueDependency[]) => void;
  onWatcherIdsChange: (ids: string[]) => void;
  onIntegrationRefsChange: (items: IssueIntegrationRef[]) => void;
};

type MiniDialogProps = {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
};

const rowClassName =
  'group flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 text-left transition-all hover:border-primary/20 hover:bg-primary/5 dark:border-border-dark dark:bg-white/[0.035]';
const inputClassName =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.04]';

const dependencyRelations: Array<{ value: IssueDependencyRelation; label: string }> = [
  { value: 'blocks', label: 'Blocks' },
  { value: 'blocked-by', label: 'Blocked by' },
  { value: 'related', label: 'Related' },
];

const integrationProviders: Array<{ value: IssueIntegrationRef['provider']; label: string }> = [
  { value: 'github', label: 'GitHub' },
  { value: 'jira', label: 'Jira' },
  { value: 'slack', label: 'Slack' },
  { value: 'notion', label: 'Notion' },
  { value: 'custom', label: 'Custom' },
];

const createReferenceId = () => Math.random().toString(36).slice(2, 11);

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('');

const MiniDialog: React.FC<MiniDialogProps> = ({ title, subtitle, onClose, children }) => {
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[160] isolate flex items-center justify-center p-4">
      <motion.button
        type="button"
        aria-label="Close dialog"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-border-dark dark:bg-card-dark"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-4 py-4 dark:border-border-dark">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary dark:hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
      </motion.div>
    </div>,
    document.body
  );
};

export const IssueSystemParametersPanel: React.FC<IssueSystemParametersPanelProps> = ({
  projectId,
  parentIssueId,
  dependencies,
  watcherIds,
  integrationRefs,
  onParentIssueIdChange,
  onDependenciesChange,
  onWatcherIdsChange,
  onIntegrationRefsChange,
}) => {
  const [activeDialog, setActiveDialog] = useState<SystemDialogKey>(null);
  const [parentSearch, setParentSearch] = useState('');
  const [dependencySearch, setDependencySearch] = useState('');
  const [watcherSearch, setWatcherSearch] = useState('');
  const deferredParentSearch = useDeferredValue(parentSearch);
  const deferredDependencySearch = useDeferredValue(dependencySearch);
  const deferredWatcherSearch = useDeferredValue(watcherSearch);

  const parentOptionsQuery = useIssueOptions(
    {
      q: deferredParentSearch.trim() || undefined,
      projectId,
      sort: 'updatedAt:desc',
      limit: 8,
    },
    { enabled: activeDialog === 'parent' }
  );
  const dependencyOptionsQuery = useIssueOptions(
    {
      q: deferredDependencySearch.trim() || undefined,
      projectId,
      sort: 'updatedAt:desc',
      limit: 8,
    },
    { enabled: activeDialog === 'dependencies' }
  );
  const watcherOptionsQuery = useWorkspaceMemberOptions(
    {
      q: deferredWatcherSearch.trim() || undefined,
      sort: 'name:asc',
      limit: 10,
    },
    { enabled: activeDialog === 'watchers' }
  );

  useEffect(() => {
    if (!activeDialog) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveDialog(null);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeDialog]);

  const parentOptions = parentOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const dependencyOptions = dependencyOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const watcherOptions = watcherOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const issueOptionMap = useMemo(() => {
    const map = new Map<string, (typeof parentOptions)[number]>();
    [...parentOptions, ...dependencyOptions].forEach((issue) => {
      map.set(issue.id, issue);
    });
    return map;
  }, [dependencyOptions, parentOptions]);

  const selectedParentIssue = issueOptionMap.get(parentIssueId) ?? null;
  const selectedDependencyItems = dependencies
    .map((dependency) => ({
      ...dependency,
      issue: issueOptionMap.get(dependency.issueId) ?? null,
    }))
    .filter((item): item is typeof item & { issue: NonNullable<typeof item.issue> } => item.issue !== null);

  const filteredParentIssues = parentOptions.filter((issue) => issue.id !== parentIssueId);

  const filteredDependencyIssues = dependencyOptions.filter((issue) => {
    if (selectedParentIssue?.id === issue.id) return false;
    if (dependencies.some((dependency) => dependency.issueId === issue.id)) return false;
    return true;
  });

  const filteredWatchers = watcherOptions;

  const parentSummary = parentIssueId || 'None';
  const dependencySummary = dependencies.length === 0 ? 'None' : `${dependencies.length} linked`;
  const watcherSummary = watcherIds.length === 0 ? 'None' : `${watcherIds.length} selected`;
  const integrationSummary = integrationRefs.length === 0 ? 'None' : `${integrationRefs.length} refs`;

  const handleAddDependency = (issueId: string) => {
    onDependenciesChange([...dependencies, { issueId, relation: 'blocks' }]);
  };

  const handleUpdateDependencyRelation = (issueId: string, relation: IssueDependencyRelation) => {
    onDependenciesChange(
      dependencies.map((dependency) =>
        dependency.issueId === issueId ? { ...dependency, relation } : dependency
      )
    );
  };

  const handleRemoveDependency = (issueId: string) => {
    onDependenciesChange(dependencies.filter((dependency) => dependency.issueId !== issueId));
  };

  const handleToggleWatcher = (userId: string) => {
    onWatcherIdsChange(
      watcherIds.includes(userId)
        ? watcherIds.filter((value) => value !== userId)
        : [...watcherIds, userId]
    );
  };

  const handleAddIntegrationRef = () => {
    onIntegrationRefsChange([
      ...integrationRefs,
      {
        id: createReferenceId(),
        provider: 'github',
        label: '',
        externalId: '',
        url: '',
      },
    ]);
  };

  const handleUpdateIntegrationRef = (
    id: string,
    patch: Partial<IssueIntegrationRef>
  ) => {
    onIntegrationRefsChange(
      integrationRefs.map((ref) => (ref.id === id ? { ...ref, ...patch } : ref))
    );
  };

  const handleRemoveIntegrationRef = (id: string) => {
    onIntegrationRefsChange(integrationRefs.filter((ref) => ref.id !== id));
  };

  return (
    <div className="px-1">
      <div className="mb-3 flex items-center gap-3 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
        <Settings2 size={14} className="text-primary/50" />
        <span>System Parameters</span>
      </div>

      <div className="space-y-2">
        <button type="button" onClick={() => setActiveDialog('parent')} className={rowClassName}>
          <div className="flex items-center gap-3">
            <span className="text-primary/40">
              <ChevronRight size={13} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Parent Linkage</p>
              <p className="mt-0.5 text-xs text-gray-400">{parentSummary}</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-gray-300 transition-colors group-hover:text-primary" />
        </button>

        <button type="button" onClick={() => setActiveDialog('dependencies')} className={rowClassName}>
          <div className="flex items-center gap-3">
            <span className="text-primary/40">
              <AlertCircle size={13} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Sub-Dependencies</p>
              <p className="mt-0.5 text-xs text-gray-400">{dependencySummary}</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-gray-300 transition-colors group-hover:text-primary" />
        </button>

        <button type="button" onClick={() => setActiveDialog('watchers')} className={rowClassName}>
          <div className="flex items-center gap-3">
            <span className="text-primary/40">
              <Users size={13} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Watchers (Group)</p>
              <p className="mt-0.5 text-xs text-gray-400">{watcherSummary}</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-gray-300 transition-colors group-hover:text-primary" />
        </button>

        <button type="button" onClick={() => setActiveDialog('integration')} className={rowClassName}>
          <div className="flex items-center gap-3">
            <span className="text-primary/40">
              <LinkIcon size={13} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Integration Ref</p>
              <p className="mt-0.5 text-xs text-gray-400">{integrationSummary}</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-gray-300 transition-colors group-hover:text-primary" />
        </button>
      </div>

      <AnimatePresence>
        {activeDialog === 'parent' && (
          <MiniDialog
            title="Parent linkage"
            subtitle="Link this issue under one parent issue."
            onClose={() => setActiveDialog(null)}
          >
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={parentSearch}
                  onChange={(event) => setParentSearch(event.target.value)}
                  placeholder="Search issue"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.04]"
                />
              </div>

                  {parentIssueId && (
                    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{parentIssueId}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-300">
                          {selectedParentIssue?.title || 'Selected parent issue'}
                        </p>
                      </div>
                      <button
                        type="button"
                    onClick={() => onParentIssueIdChange('')}
                    className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white/70 hover:text-primary dark:hover:bg-white/10"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                {parentOptionsQuery.isLoading && (
                  <div className="rounded-lg border border-gray-100 px-3 py-3 text-xs text-gray-400 dark:border-border-dark">
                    Loading issues...
                  </div>
                )}
                {filteredParentIssues.slice(0, 8).map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => {
                      onParentIssueIdChange(issue.id);
                      setActiveDialog(null);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all ${
                      issue.id === parentIssueId
                        ? 'bg-primary/8 text-primary'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide">{issue.id}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-300">{issue.title}</p>
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      {STATUS_LABELS[issue.status]}
                    </span>
                    </button>
                  ))}
                {!parentOptionsQuery.isLoading && filteredParentIssues.length === 0 && (
                  <div className="rounded-lg border border-gray-100 px-3 py-3 text-xs text-gray-400 dark:border-border-dark">
                    No issues found.
                  </div>
                )}
              </div>
            </div>
          </MiniDialog>
        )}

        {activeDialog === 'dependencies' && (
          <MiniDialog
            title="Dependencies"
            subtitle="Track linked issues and how they relate."
            onClose={() => setActiveDialog(null)}
          >
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={dependencySearch}
                  onChange={(event) => setDependencySearch(event.target.value)}
                  placeholder="Search issue"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.04]"
                />
              </div>

              {selectedDependencyItems.length > 0 && (
                <div className="space-y-2">
                  {selectedDependencyItems.map(({ issue, relation }) => (
                    <div
                      key={issue.id}
                      className="flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{issue.id}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-300">{issue.title}</p>
                      </div>
                      <select
                        value={relation}
                        onChange={(event) =>
                          handleUpdateDependencyRelation(
                            issue.id,
                            event.target.value as IssueDependencyRelation
                          )
                        }
                        className="rounded-md border border-transparent bg-white/80 px-2 py-1.5 text-[11px] font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10"
                      >
                        {dependencyRelations.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(issue.id)}
                        className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white/70 hover:text-primary dark:hover:bg-white/10"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5">
                {dependencyOptionsQuery.isLoading && (
                  <div className="rounded-lg border border-gray-100 px-3 py-3 text-xs text-gray-400 dark:border-border-dark">
                    Loading issues...
                  </div>
                )}
                {filteredDependencyIssues.slice(0, 8).map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => handleAddDependency(issue.id)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{issue.id}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-300">{issue.title}</p>
                    </div>
                    <Plus size={13} className="text-gray-300 transition-colors group-hover:text-primary" />
                    </button>
                  ))}
                {!dependencyOptionsQuery.isLoading && filteredDependencyIssues.length === 0 && (
                  <div className="rounded-lg border border-gray-100 px-3 py-3 text-xs text-gray-400 dark:border-border-dark">
                    No more issues available.
                  </div>
                )}
              </div>
            </div>
          </MiniDialog>
        )}

        {activeDialog === 'watchers' && (
          <MiniDialog
            title="Watchers"
            subtitle="Select members who should follow this issue."
            onClose={() => setActiveDialog(null)}
          >
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={watcherSearch}
                  onChange={(event) => setWatcherSearch(event.target.value)}
                  placeholder="Search member"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.04]"
                />
              </div>

              <div className="space-y-1.5">
                {watcherOptionsQuery.isLoading && (
                  <div className="rounded-lg border border-gray-100 px-3 py-3 text-xs text-gray-400 dark:border-border-dark">
                    Loading members...
                  </div>
                )}
                {filteredWatchers.slice(0, 10).map((watcher) => {
                  const isSelected = watcherIds.includes(watcher.id);
                  return (
                    <button
                      key={watcher.id}
                      type="button"
                      onClick={() => handleToggleWatcher(watcher.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                        isSelected ? 'bg-primary/8' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">
                        {getInitials(watcher.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{watcher.name}</p>
                        <p className="truncate text-xs text-gray-400">{watcher.email}</p>
                      </div>
                      {isSelected ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                          <Check size={11} />
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{watcher.role}</span>
                      )}
                    </button>
                  );
                })}
                {!watcherOptionsQuery.isLoading && filteredWatchers.length === 0 && (
                  <div className="rounded-lg border border-gray-100 px-3 py-3 text-xs text-gray-400 dark:border-border-dark">
                    No members found.
                  </div>
                )}
              </div>
            </div>
          </MiniDialog>
        )}

        {activeDialog === 'integration' && (
          <MiniDialog
            title="Integration references"
            subtitle="Attach external IDs or links for this issue."
            onClose={() => setActiveDialog(null)}
          >
            <div className="space-y-3">
              {integrationRefs.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400 dark:border-border-dark">
                  No references added yet.
                </div>
              )}

              {integrationRefs.map((ref) => (
                <div
                  key={ref.id}
                  className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 dark:border-border-dark dark:bg-white/[0.03]"
                >
                  <div className="grid gap-2 sm:grid-cols-[132px_1fr]">
                    <select
                      value={ref.provider}
                      onChange={(event) =>
                        handleUpdateIntegrationRef(ref.id, {
                          provider: event.target.value as IssueIntegrationRef['provider'],
                        })
                      }
                      className={inputClassName}
                    >
                      {integrationProviders.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={ref.label ?? ''}
                      onChange={(event) =>
                        handleUpdateIntegrationRef(ref.id, { label: event.target.value })
                      }
                      placeholder="Label"
                      className={inputClassName}
                    />
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input
                      value={ref.externalId ?? ''}
                      onChange={(event) =>
                        handleUpdateIntegrationRef(ref.id, { externalId: event.target.value })
                      }
                      placeholder="External ID"
                      className={inputClassName}
                    />
                    <input
                      value={ref.url ?? ''}
                      onChange={(event) =>
                        handleUpdateIntegrationRef(ref.id, { url: event.target.value })
                      }
                      placeholder="URL"
                      className={inputClassName}
                    />
                  </div>

                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveIntegrationRef(ref.id)}
                      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-white hover:text-primary dark:hover:bg-white/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddIntegrationRef}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/25 bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary/10"
              >
                <Plus size={13} />
                Add reference
              </button>
            </div>
          </MiniDialog>
        )}
      </AnimatePresence>
    </div>
  );
};
