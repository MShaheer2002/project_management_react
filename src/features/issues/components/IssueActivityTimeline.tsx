import React, { useMemo } from 'react';
import { Activity, AtSign, Clock3, History, Loader2, MessageSquare, Plus, Users } from 'lucide-react';
import { STATUS_LABELS } from '@/constants';
import { useIssueActivity } from '../hooks/useIssueData';
import type { Status } from '@/types';

type IssueActivityTimelineProps = {
  issueId: string;
  compact?: boolean;
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

const getStatusLabel = (value?: unknown) => {
  if (typeof value !== 'string') return null;
  const key = value.toLowerCase() as Status;
  return STATUS_LABELS[key] ?? value;
};

const readNamed = (value: unknown) => {
  if (!value || typeof value !== 'object') return null;
  const maybeName = (value as { name?: unknown }).name;
  return typeof maybeName === 'string' && maybeName.trim() ? maybeName : null;
};

const toTitle = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getActivityMessage = (item: {
  type: string;
  message: string;
  actor?: { name: string };
  metadata?: Record<string, unknown>;
}) => {
  const actor = item.actor?.name ?? 'Someone';

  if (item.type === 'ISSUE_STATUS_CHANGED') {
    const fromStatus = getStatusLabel(item.metadata?.fromStatus);
    const toStatus = getStatusLabel(item.metadata?.toStatus);
    if (fromStatus && toStatus) {
      return `${actor} moved from ${fromStatus} to ${toStatus}`;
    }
    if (toStatus) {
      return `${actor} moved to ${toStatus}`;
    }
  }

  if (item.type === 'ISSUE_PRIORITY_CHANGED') {
    const fromPriority = item.metadata?.fromPriority;
    const toPriority = item.metadata?.toPriority;
    if (typeof fromPriority === 'string' && typeof toPriority === 'string') {
      return `${actor} changed priority from ${toTitle(fromPriority)} to ${toTitle(toPriority)}`;
    }
  }

  if (item.type === 'ISSUE_ASSIGNEE_CHANGED') {
    const fromAssignee = readNamed(item.metadata?.fromAssignee) ?? 'Unassigned';
    const toAssignee = readNamed(item.metadata?.toAssignee) ?? 'Unassigned';
    return `${actor} reassigned issue from ${fromAssignee} to ${toAssignee}`;
  }

  if (item.type === 'ISSUE_SCOPE_CHANGED') {
    const fromProject = readNamed(item.metadata?.fromProject);
    const toProject = readNamed(item.metadata?.toProject);
    if (fromProject && toProject) {
      return `${actor} moved issue from ${fromProject} to ${toProject}`;
    }
  }

  if (item.type === 'COMMENT_CREATED') {
    return `${actor} added a comment`;
  }

  if (item.type === 'COMMENT_EDITED') {
    return `${actor} edited a comment`;
  }

  if (item.type === 'COMMENT_DELETED') {
    return `${actor} deleted a comment`;
  }

  if (item.type === 'ISSUE_CREATED') {
    return `${actor} created the issue`;
  }

  return item.message;
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'ISSUE_CREATED':
      return <Plus size={10} className="text-green-500" />;
    case 'ISSUE_STATUS_CHANGED':
      return <Clock3 size={10} className="text-blue-500" />;
    case 'COMMENT_CREATED':
    case 'COMMENT_EDITED':
    case 'COMMENT_DELETED':
      return <MessageSquare size={10} className="text-orange-500" />;
    case 'COMMENT_MENTIONED':
      return <AtSign size={10} className="text-emerald-500" />;
    case 'TEAM_MEMBER_JOINED':
    case 'TEAM_MEMBER_REMOVED':
    case 'PROJECT_MEMBER_ADDED':
    case 'PROJECT_MEMBER_REMOVED':
    case 'WORKSPACE_MEMBER_JOINED':
    case 'WORKSPACE_MEMBER_REMOVED':
      return <Users size={10} className="text-purple-500" />;
    default:
      return <Activity size={10} className="text-gray-400" />;
  }
};

const AvatarFallback: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
    {name.charAt(0).toUpperCase()}
  </div>
);

export const IssueActivityTimeline: React.FC<IssueActivityTimelineProps> = ({ issueId, compact }) => {
  const activityQuery = useIssueActivity(issueId, { limit: 50 }, { enabled: Boolean(issueId) });
  const items = useMemo(
    () => activityQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [activityQuery.data]
  );

  if (activityQuery.isLoading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Loading activity...
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 p-4 text-sm text-gray-500 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-400">
        <History size={16} className="mb-2" />
        No activity yet.
      </div>
    );
  }

  return (
    <div className={`${compact ? 'space-y-3' : 'space-y-4'}`}>
      <div className="relative">
        <div className="absolute bottom-0 left-3.5 top-0 w-px bg-gray-200 dark:bg-border-dark" />

        <div className="space-y-3">
          {items.map((item) => {
            const actorName = item.actor?.name || 'System';

            return (
              <div key={item.id} className="group relative flex gap-3">
                <div className="absolute left-3.5 top-2 z-10 h-2 w-2 -translate-x-1/2 rounded-full border-4 border-white bg-primary dark:border-bg-dark" />

                <div className="flex flex-1 gap-2.5 pl-7">
                  {item.actor?.avatar ? (
                    <img src={item.actor.avatar} className="h-6 w-6 shrink-0 rounded-full" alt={actorName} />
                  ) : (
                    <AvatarFallback name={actorName} />
                  )}
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <div />
                    </div>
                    <p className="text-[13px] leading-5 text-text-secondary-light dark:text-text-secondary-dark">
                      {getActivityMessage(item)}
                      <span className="text-gray-500"> {' '}• {relativeTime(item.createdAt)}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activityQuery.hasNextPage && (
        <button
          type="button"
          onClick={() => activityQuery.fetchNextPage()}
          disabled={activityQuery.isFetchingNextPage}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-300"
        >
          {activityQuery.isFetchingNextPage ? 'Loading...' : 'Load more activity'}
        </button>
      )}
    </div>
  );
};
