import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, ArrowUpDown, Bug, CheckSquare, ChevronDown, Loader2, MoreHorizontal, Zap } from 'lucide-react';
import { LabelChip } from '@shared/components/ui/LabelChip';
import { WorkflowStatusSelect } from '@shared/components/ui/WorkflowStatusSelect';
import { PRIORITY_COLORS, ISSUE_TYPE_CONFIG } from '@/constants';
import { Issue, IssueType, Priority, Status, WorkspaceStatus } from '@/types';
import { useIssuesDirectory } from '../hooks/useIssueData';
import { IssueBoardFilters } from './IssueBoardColumn';

const GROUP_PAGE_SIZE = 25;

const TypeBadge: React.FC<{ type: IssueType }> = ({ type }) => {
  const config = ISSUE_TYPE_CONFIG[type];
  return (
    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${config.color}`}>
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

/** Fires onIntersect when the sentinel scrolls into view, while enabled. */
function useLoadMoreSentinel(onIntersect: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersect();
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, onIntersect]);

  return ref;
}

interface IssueStatusGroupProps {
  status: WorkspaceStatus;
  filters: IssueBoardFilters;
  isCollapsed: boolean;
  onToggle: () => void;
  workspaceStatuses: WorkspaceStatus[];
  selectedIssueIds: string[];
  setSelectedIssueIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleIssueSelection: (issueId: string) => void;
  onIssueSelect: (issueId: string) => void;
  onIssueUpdate: (issueId: string, newStatus: Status) => Promise<boolean> | boolean;
  activeIssueMenuId: string | null;
  setActiveIssueMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  onAssignToCycle: (issueIds: string[]) => void;
  onIssuesLoaded?: (statusKey: string, issues: Issue[]) => void;
  /**
   * Workspace-wide count for this status, read from the DB-trigger-maintained
   * counter (see issue.service.ts's getStatusCounts) rather than a live query.
   * Only meaningful when no extra filters are active — undefined otherwise, in
   * which case nothing is shown while collapsed (no query is fired just to answer
   * "how many," matching the point of not loading anything until expanded).
   */
  persistedCount?: number;
}

/**
 * One collapsible status section in the List view. Collapsed by default and
 * fetches nothing until expanded — once expanded it loads 25 issues for just
 * this status and loads more as the sentinel at the bottom scrolls into view.
 * This is what keeps a workspace with thousands of issues from loading them
 * all just to render the grouped list.
 */
export const IssueStatusGroup: React.FC<IssueStatusGroupProps> = ({
  status,
  filters,
  isCollapsed,
  onToggle,
  workspaceStatuses,
  selectedIssueIds,
  setSelectedIssueIds,
  toggleIssueSelection,
  onIssueSelect,
  onIssueUpdate,
  activeIssueMenuId,
  setActiveIssueMenuId,
  onAssignToCycle,
  onIssuesLoaded,
  persistedCount,
}) => {
  const query = useIssuesDirectory(
    { ...filters, status: status.key, sort: 'updatedAt:desc', limit: GROUP_PAGE_SIZE },
    { enabled: !isCollapsed }
  );

  const items = useMemo(() => {
    const byId = new Map<string, Issue>();
    query.data?.pages.forEach((page) => page.items.forEach((issue) => byId.set(issue.id, issue)));
    return Array.from(byId.values());
  }, [query.data]);

  useEffect(() => {
    if (!isCollapsed) onIssuesLoaded?.(status.key, items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, isCollapsed, status.key]);

  const totalCount = query.data?.pages[0]?.meta.total;

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  }, [query]);
  const sentinelRef = useLoadMoreSentinel(loadMore, !isCollapsed && Boolean(query.hasNextPage));

  if (isCollapsed) {
    return (
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <ChevronDown size={16} className="shrink-0 text-gray-400 transition-transform -rotate-90" />
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: status.color }} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{status.label}</h3>
                {status.isFinal && (
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-500">Done</span>
                )}
              </div>
              {persistedCount !== undefined && (
                <p className="mt-0.5 text-xs text-gray-400">
                  {persistedCount} issue{persistedCount === 1 ? '' : 's'}
                </p>
              )}
            </div>
          </div>
        </button>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <ChevronDown size={16} className="shrink-0 text-gray-400 transition-transform rotate-0" />
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: status.color }} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{status.label}</h3>
              {status.isFinal && (
                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-500">Done</span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-gray-400">
              {query.isLoading && persistedCount === undefined
                ? 'Loading…'
                : (() => {
                    const count = totalCount ?? persistedCount ?? items.length;
                    return `${count} issue${count === 1 ? '' : 's'}`;
                  })()}
            </p>
          </div>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-3" onClick={(event) => event.stopPropagation()}>
            <input
              type="checkbox"
              checked={items.every((issue) => selectedIssueIds.includes(issue.id))}
              ref={(input) => {
                if (input) {
                  const selectedCount = items.filter((issue) => selectedIssueIds.includes(issue.id)).length;
                  input.indeterminate = selectedCount > 0 && selectedCount < items.length;
                }
              }}
              onChange={() =>
                setSelectedIssueIds((current) => {
                  const groupIds = items.map((issue) => issue.id);
                  const allSelected = groupIds.every((issueId) => current.includes(issueId));
                  if (allSelected) return current.filter((issueId) => !groupIds.includes(issueId));
                  return [...new Set([...current, ...groupIds])];
                })
              }
              className="h-4 w-4 rounded border-gray-300 bg-transparent text-primary focus:ring-primary/30"
            />
          </div>
        )}
      </button>

      <div className="border-t border-gray-200 dark:border-border-dark">
        {query.isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No issues in this status.</div>
        ) : (
          <>
            <div className="grid grid-cols-[44px_40px_100px_1fr_120px_100px_150px_120px_44px] gap-4 bg-gray-50/60 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:bg-black/10">
              <div className="flex justify-center">
                <input
                  type="checkbox"
                  checked={items.every((issue) => selectedIssueIds.includes(issue.id))}
                  ref={(input) => {
                    if (input) {
                      const selectedCount = items.filter((issue) => selectedIssueIds.includes(issue.id)).length;
                      input.indeterminate = selectedCount > 0 && selectedCount < items.length;
                    }
                  }}
                  onChange={() =>
                    setSelectedIssueIds((current) => {
                      const groupIds = items.map((issue) => issue.id);
                      const allSelected = groupIds.every((issueId) => current.includes(issueId));
                      if (allSelected) return current.filter((issueId) => !groupIds.includes(issueId));
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

            {items.map((issue) => {
              const assignee = issue.assignee;
              const isSelected = selectedIssueIds.includes(issue.id);
              return (
                <div
                  key={issue.id}
                  onClick={() => onIssueSelect(issue.id)}
                  className={`grid grid-cols-[44px_40px_100px_1fr_120px_100px_150px_120px_44px] gap-4 border-t border-gray-100 px-5 py-3 transition-colors group dark:border-border-dark/50 ${
                    isSelected ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  } cursor-pointer`}
                >
                  <div className="flex items-center justify-center" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleIssueSelection(issue.id)}
                      className="h-4 w-4 rounded border-gray-300 bg-transparent text-primary focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex justify-center items-center">
                    <PriorityIcon priority={issue.priority} />
                  </div>
                  <div className="text-xs font-mono text-gray-400 flex items-center">{issue.id}</div>
                  <div className="flex flex-col justify-center min-w-0">
                    <span className="text-sm font-medium truncate">{issue.title}</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {issue.labels.map((label) => (
                        <LabelChip key={label} label={label} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center" onClick={(event) => event.stopPropagation()}>
                    <WorkflowStatusSelect
                      value={issue.status}
                      statuses={workspaceStatuses}
                      onChange={(nextStatus) => {
                        void onIssueUpdate(issue.id, nextStatus);
                      }}
                    />
                  </div>
                  <div className="flex items-center">
                    <TypeBadge type={issue.type || 'task'} />
                  </div>
                  <div className="flex items-center">
                    {assignee ? (
                      <div className="flex items-center gap-2 text-xs min-w-0">
                        {assignee.avatar ? (
                          <img src={assignee.avatar} className="w-5 h-5 rounded-full" alt={assignee.name} />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                            {assignee.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="truncate">{assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Unassigned</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${PRIORITY_COLORS[issue.priority]}`}>
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
                      <div className="absolute right-0 top-9 z-20 min-w-[180px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-border-dark dark:bg-card-dark">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onAssignToCycle([issue.id]);
                          }}
                          className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5 dark:hover:text-white"
                        >
                          Add To Cycle
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {query.hasNextPage && (
              <div ref={sentinelRef} className="flex items-center justify-center py-3 text-gray-400">
                {query.isFetchingNextPage && <Loader2 size={14} className="animate-spin" />}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
