import React, { useMemo } from 'react';
import { Activity, AtSign, Clock3, GitBranch, GitCommit, GitPullRequest, History, Loader2, MessageSquare, Plus, Users } from 'lucide-react';
import { STATUS_LABELS } from '@/constants';
import { GITHUB_ACTIVITY_TYPES } from '@features/integrations';
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

const readIssueRef = (value: unknown) => {
  if (!value || typeof value !== 'object') return null;
  const maybeId = (value as { id?: unknown }).id;
  const maybeTitle = (value as { title?: unknown }).title;
  return {
    id: typeof maybeId === 'string' ? maybeId : null,
    title: typeof maybeTitle === 'string' ? maybeTitle : null,
  };
};

const readStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
};

const areStringArraysEqual = (left: string[], right: string[]) => {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
};

const isNoopActivity = (item: {
  type: string;
  metadata?: Record<string, unknown>;
}) => {
  const metadata = item.metadata ?? {};
  const activityType = typeof metadata.activityKind === 'string' ? metadata.activityKind : item.type;

  if (activityType === 'ISSUE_ASSIGNEE_CHANGED') {
    const fromId = typeof metadata.fromAssigneeId === 'string' ? metadata.fromAssigneeId : null;
    const toId = typeof metadata.toAssigneeId === 'string' ? metadata.toAssigneeId : null;
    const fromName = readNamed(metadata.fromAssignee);
    const toName = readNamed(metadata.toAssignee);

    if (fromId === toId) return true;
    if (!fromId && !toId) return true;
    if (fromName && toName && fromName === toName) return true;
  }

  if (activityType === 'ISSUE_STATUS_CHANGED') {
    return metadata.fromStatus === metadata.toStatus;
  }

  if (activityType === 'ISSUE_PRIORITY_CHANGED') {
    return metadata.fromPriority === metadata.toPriority;
  }

  if (activityType === 'ISSUE_DUE_DATE_CHANGED') {
    return metadata.fromDueDate === metadata.toDueDate;
  }

  if (activityType === 'ISSUE_DUE_TIME_CHANGED') {
    return metadata.fromDueTime === metadata.toDueTime;
  }

  if (activityType === 'ISSUE_ESTIMATE_CHANGED') {
    return metadata.fromEstimate === metadata.toEstimate;
  }

  if (activityType === 'ISSUE_TITLE_CHANGED') {
    return metadata.fromTitle === metadata.toTitle;
  }

  if (activityType === 'ISSUE_PARENT_CHANGED') {
    const fromParent = readIssueRef(metadata.fromParent);
    const toParent = readIssueRef(metadata.toParent);
    return (fromParent?.id ?? null) === (toParent?.id ?? null);
  }

  if (activityType === 'ISSUE_LABELS_CHANGED') {
    const beforeLabels = readStringArray(metadata.previousLabels).slice().sort();
    const afterLabels = readStringArray(metadata.labels).slice().sort();
    if (beforeLabels.length === 0 && afterLabels.length === 0) return true;
    if (beforeLabels.length > 0 && afterLabels.length > 0) {
      return areStringArraysEqual(beforeLabels, afterLabels);
    }
  }

  return false;
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
  issueId?: string;
}) => {
  const actor = item.actor?.name ?? 'Someone';
  const activityType = typeof item.metadata?.activityKind === 'string' ? item.metadata.activityKind : item.type;
  const issuePublicId =
    typeof item.metadata?.issuePublicId === 'string'
      ? item.metadata.issuePublicId
      : typeof item.issueId === 'string'
        ? item.issueId
        : 'this issue';

  if (activityType === 'ISSUE_STATUS_CHANGED') {
    const fromStatus = getStatusLabel(item.metadata?.fromStatus);
    const toStatus = getStatusLabel(item.metadata?.toStatus);
    if (fromStatus && toStatus) {
      return `${actor} moved from ${fromStatus} to ${toStatus}`;
    }
    if (toStatus) {
      return `${actor} moved to ${toStatus}`;
    }
  }

  if (activityType === 'ISSUE_PRIORITY_CHANGED') {
    const fromPriority = item.metadata?.fromPriority;
    const toPriority = item.metadata?.toPriority;
    if (typeof fromPriority === 'string' && typeof toPriority === 'string') {
      return `${actor} changed priority from ${toTitle(fromPriority)} to ${toTitle(toPriority)}`;
    }
  }

  if (activityType === 'ISSUE_ASSIGNEE_CHANGED') {
    const fromAssignee = readNamed(item.metadata?.fromAssignee);
    const toAssignee = readNamed(item.metadata?.toAssignee);
    if (!fromAssignee && !toAssignee) {
      return `${actor} updated the assignee`;
    }
    return `${actor} reassigned issue from ${fromAssignee ?? 'Unassigned'} to ${toAssignee ?? 'Unassigned'}`;
  }

  if (activityType === 'ISSUE_ADDED_TO_CYCLE') {
    const cycleName = typeof item.metadata?.cycleName === 'string' ? item.metadata.cycleName : 'a cycle';
    return `${actor} added ${issuePublicId} to ${cycleName}`;
  }

  if (activityType === 'ISSUE_REMOVED_FROM_CYCLE') {
    const cycleName = typeof item.metadata?.cycleName === 'string' ? item.metadata.cycleName : 'a cycle';
    return `${actor} removed ${issuePublicId} from ${cycleName}`;
  }

  if (activityType === 'ISSUE_TITLE_CHANGED') {
    return `${actor} renamed the issue`;
  }

  if (activityType === 'ISSUE_DESCRIPTION_CHANGED') {
    return `${actor} updated the description`;
  }

  if (activityType === 'ISSUE_TYPE_CHANGED') {
    const fromType = typeof item.metadata?.fromType === 'string' ? toTitle(item.metadata.fromType) : null;
    const toType = typeof item.metadata?.toType === 'string' ? toTitle(item.metadata.toType) : null;
    if (fromType && toType) return `${actor} changed type from ${fromType} to ${toType}`;
    return `${actor} changed the issue type`;
  }

  if (activityType === 'ISSUE_DUE_DATE_CHANGED') {
    const toDueDate = typeof item.metadata?.toDueDate === 'string' ? item.metadata.toDueDate : null;
    return toDueDate ? `${actor} changed the due date to ${toDueDate}` : `${actor} cleared the due date`;
  }

  if (activityType === 'ISSUE_DUE_TIME_CHANGED') {
    const toDueTime = typeof item.metadata?.toDueTime === 'string' ? item.metadata.toDueTime : null;
    return toDueTime ? `${actor} changed the due time to ${toDueTime}` : `${actor} cleared the due time`;
  }

  if (activityType === 'ISSUE_ESTIMATE_CHANGED') {
    const toEstimate = item.metadata?.toEstimate;
    return typeof toEstimate === 'number'
      ? `${actor} set the estimate to ${toEstimate} pt${toEstimate === 1 ? '' : 's'}`
      : `${actor} cleared the estimate`;
  }

  if (activityType === 'ISSUE_PARENT_CHANGED') {
    const toParent = readIssueRef(item.metadata?.toParent);
    if (toParent?.id) {
      return `${actor} linked parent issue ${toParent.id}`;
    }
    return `${actor} removed the parent issue`;
  }

  if (activityType === 'ISSUE_LABELS_CHANGED') {
    const labels = readStringArray(item.metadata?.labels);
    return labels.length > 0
      ? `${actor} updated labels to ${labels.join(', ')}`
      : `${actor} cleared all labels`;
  }

  if (activityType === 'ISSUE_SCOPE_CHANGED') {
    const fromProject = readNamed(item.metadata?.fromProject);
    const toProject = readNamed(item.metadata?.toProject);
    if (fromProject && toProject) {
      return `${actor} moved issue from ${fromProject} to ${toProject}`;
    }
  }

  if (activityType === 'ISSUE_DEPENDENCY_ADDED') {
    const relatedIssue = readIssueRef(item.metadata?.relatedIssue);
    const relation = typeof item.metadata?.relation === 'string' ? item.metadata.relation : 'related';
    const relationLabel = relation === 'blocked-by' ? 'blocked by' : relation === 'blocks' ? 'blocks' : 'related to';
    if (relatedIssue?.id) {
      return `${actor} marked ${issuePublicId} as ${relationLabel} ${relatedIssue.id}`;
    }
    return `${actor} updated dependencies`;
  }

  if (activityType === 'ISSUE_DEPENDENCY_REMOVED') {
    const relatedIssue = readIssueRef(item.metadata?.relatedIssue);
    return relatedIssue?.id
      ? `${actor} removed the dependency link to ${relatedIssue.id}`
      : `${actor} removed a dependency link`;
  }

  if (activityType === 'ISSUE_WATCHERS_CHANGED') {
    const watchers = Array.isArray(item.metadata?.watchers) ? item.metadata.watchers.map(readNamed).filter(Boolean) : [];
    const action = typeof item.metadata?.action === 'string' ? item.metadata.action : 'updated';
    if (watchers.length > 0 && action === 'added') {
      return `${actor} added ${watchers.join(', ')} as watcher${watchers.length === 1 ? '' : 's'}`;
    }
    if (watchers.length > 0 && action === 'removed') {
      return `${actor} removed ${watchers.join(', ')} from watchers`;
    }
    return `${actor} updated watchers`;
  }

  if (activityType === 'ISSUE_INTEGRATION_REFS_CHANGED') {
    return `${actor} updated integration references`;
  }

  if (activityType === 'COMMENT_CREATED') {
    return `${actor} added a comment`;
  }

  if (activityType === 'COMMENT_EDITED') {
    return `${actor} edited a comment`;
  }

  if (activityType === 'COMMENT_DELETED') {
    return `${actor} deleted a comment`;
  }

  if (activityType === 'ISSUE_CREATED') {
    return `${actor} created the issue`;
  }

  return item.message;
};

const isGitHubActivity = (type: string) =>
  (GITHUB_ACTIVITY_TYPES as readonly string[]).includes(type);

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
    case 'GITHUB_BRANCH_LINKED':
      return <GitBranch size={10} className="text-green-500" />;
    case 'GITHUB_COMMIT_LINKED':
      return <GitCommit size={10} className="text-gray-500" />;
    case 'GITHUB_PR_OPENED':
      return <GitPullRequest size={10} className="text-yellow-500" />;
    case 'GITHUB_PR_MERGED':
      return <GitPullRequest size={10} className="text-green-500" />;
    case 'GITHUB_PR_CLOSED':
      return <GitPullRequest size={10} className="text-gray-500" />;
    case 'GITHUB_PR_REVIEW':
      return <GitPullRequest size={10} className="text-purple-500" />;
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
    () => (activityQuery.data?.pages.flatMap((page) => page.items) ?? []).filter((item) => !isNoopActivity(item)),
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
                <div className={`absolute left-3.5 top-2 z-10 h-2 w-2 -translate-x-1/2 rounded-full border-4 border-white dark:border-bg-dark ${isGitHubActivity(item.type) ? 'bg-gray-600' : 'bg-primary'}`} />

                <div className="flex flex-1 gap-2.5 pl-7">
                  {item.actor?.avatar ? (
                    <img src={item.actor.avatar} className="h-6 w-6 shrink-0 rounded-full" alt={actorName} />
                  ) : (
                    <AvatarFallback name={actorName} />
                  )}
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      {isGitHubActivity(item.type) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          {getActivityIcon(item.type)}
                          GitHub
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] leading-5 text-text-secondary-light dark:text-text-secondary-dark">
                      {getActivityMessage(item)}
                      <span className="text-gray-500"> {' '}&middot; {relativeTime(item.createdAt)}</span>
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
