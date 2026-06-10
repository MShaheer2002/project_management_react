import React, { useMemo, useState } from 'react';
import {
  Activity,
  AtSign,
  Clock3,
  Filter,
  GitBranch,
  GitCommit,
  GitPullRequest,
  History,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { GITHUB_ACTIVITY_TYPES } from '@features/integrations';
import { useActivityFeed } from '../hooks/useActivityData';
import type { ActivityItem, ActivityScope, ListActivityInput } from '../types';

type ActivityTimelineProps = {
  scope?: ActivityScope;
  scopeId?: string;
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  errorMessage?: string;
  compact?: boolean;
  limit?: number;
};

const relativeTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absSec < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
  const diffDay = Math.round(diffHr / 24);
  return rtf.format(diffDay, 'day');
};

const labelFromType = (type: string) =>
  type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const isGitHubActivity = (type: string) =>
  (GITHUB_ACTIVITY_TYPES as readonly string[]).includes(type);

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'ISSUE_CREATED':
      return <Plus size={13} className="text-green-500" />;
    case 'ISSUE_STATUS_CHANGED':
      return <Clock3 size={13} className="text-blue-500" />;
    case 'COMMENT_CREATED':
    case 'COMMENT_EDITED':
    case 'COMMENT_DELETED':
      return <MessageSquare size={13} className="text-orange-500" />;
    case 'COMMENT_MENTIONED':
      return <AtSign size={13} className="text-emerald-500" />;
    case 'TEAM_MEMBER_JOINED':
    case 'TEAM_MEMBER_REMOVED':
    case 'PROJECT_MEMBER_ADDED':
    case 'PROJECT_MEMBER_REMOVED':
    case 'WORKSPACE_MEMBER_JOINED':
    case 'WORKSPACE_MEMBER_REMOVED':
      return <Users size={13} className="text-purple-500" />;
    case 'GITHUB_BRANCH_LINKED':
      return <GitBranch size={13} className="text-green-500" />;
    case 'GITHUB_COMMIT_LINKED':
      return <GitCommit size={13} className="text-gray-500" />;
    case 'GITHUB_PR_OPENED':
      return <GitPullRequest size={13} className="text-yellow-500" />;
    case 'GITHUB_PR_MERGED':
      return <GitPullRequest size={13} className="text-green-500" />;
    case 'GITHUB_PR_CLOSED':
      return <GitPullRequest size={13} className="text-gray-500" />;
    case 'GITHUB_PR_REVIEW':
      return <GitPullRequest size={13} className="text-purple-500" />;
    default:
      return <Activity size={13} className="text-gray-400" />;
  }
};

const AvatarFallback: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
    {name.charAt(0).toUpperCase()}
  </div>
);

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  scope = 'workspace',
  scopeId,
  title = 'Activity',
  emptyTitle,
  emptyDescription,
  errorMessage,
  compact,
  limit = 50,
}) => {
  const [search, setSearch] = useState('');
  const params: ListActivityInput = {
    scope,
    scopeId,
    limit,
  };
  const query = useActivityFeed(params, {
    enabled: scope === 'workspace' || Boolean(scopeId),
  });

  const items = useMemo(() => {
    const byId = new Map<string, ActivityItem>();
    (query.data?.pages ?? []).forEach((page) => {
      page.items.forEach((item) => {
        byId.set(item.id, item);
      });
    });

    const values = Array.from(byId.values());
    if (!search.trim()) return values;

    const term = search.trim().toLowerCase();
    return values.filter((item) => {
      const actorName = item.actor?.name?.toLowerCase() ?? '';
      return (
        item.message.toLowerCase().includes(term) ||
        actorName.includes(term) ||
        item.type.toLowerCase().includes(term)
      );
    });
  }, [query.data, search]);

  if (query.isLoading) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center px-6 py-10 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Loading activity...
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center px-6 py-10 text-center">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {errorMessage ?? 'Failed to load activity.'}
        </p>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="mt-3 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">{title}</h1>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-400 dark:bg-gray-800">{items.length} events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-64 rounded-md border-none bg-gray-100 py-1.5 pl-9 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:bg-white/5"
            />
          </div>
          {!compact && (
            <button className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 dark:border-border-dark dark:hover:bg-white/5">
              <Filter size={14} />
              <span>Filter</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {items.length > 0 ? (
            <div className="relative">
              <div className="absolute bottom-0 left-4 top-0 w-px bg-gray-200 dark:bg-border-dark" />

              <div className="space-y-6">
                {items.map((item) => {
                  const actorName = item.actor?.name || 'System';
                  return (
                    <div key={item.id} className="group relative flex gap-5">
                      <div className={`absolute left-4 top-2 z-10 h-2 w-2 -translate-x-1/2 rounded-full border-4 border-white dark:border-bg-dark ${isGitHubActivity(item.type) ? 'bg-gray-600' : 'bg-primary'}`} />

                      <div className="flex flex-1 gap-3 pl-8">
                        {item.actor?.avatar ? (
                          <img src={item.actor.avatar} className="h-8 w-8 shrink-0 rounded-full" alt={actorName} />
                        ) : (
                          <AvatarFallback name={actorName} />
                        )}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{actorName}</span>
                              <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium dark:bg-gray-800">
                                {getActivityIcon(item.type)}
                                <span>{labelFromType(item.type)}</span>
                              </div>
                            </div>
                            <span className="text-[11px] font-medium text-gray-400">{relativeTime(item.createdAt)}</span>
                          </div>
                          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{item.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5">
                <History size={32} />
              </div>
              <h1 className="text-xl font-bold">{emptyTitle ?? 'No activity found'}</h1>
              <p className="mt-2 max-w-xs text-sm text-gray-400">
                {search.trim()
                  ? 'Try adjusting your filters or search terms.'
                  : emptyDescription ?? 'Try adjusting your filters or search terms.'}
              </p>
            </div>
          )}

          {query.hasNextPage && (
            <button
              type="button"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-300 dark:border-border-dark"
            >
              {query.isFetchingNextPage ? 'Loading...' : 'Load more activity'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
