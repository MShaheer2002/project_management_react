import React, { useMemo } from 'react';
import { History, Loader2, MessageSquare, Pencil, Trash2, AtSign } from 'lucide-react';
import { useIssueActivity } from '../hooks/useIssueData';
import type { IssueActivityItem } from '../types';

type IssueActivityTimelineProps = {
  issueId: string;
  compact?: boolean;
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getIcon = (type: IssueActivityItem['type']) => {
  switch (type) {
    case 'COMMENT_CREATED':
      return <MessageSquare size={13} className="text-primary" />;
    case 'COMMENT_EDITED':
      return <Pencil size={13} className="text-amber-500" />;
    case 'COMMENT_DELETED':
      return <Trash2 size={13} className="text-red-500" />;
    case 'COMMENT_MENTIONED':
      return <AtSign size={13} className="text-emerald-500" />;
    default:
      return <History size={13} className="text-gray-400" />;
  }
};

export const IssueActivityTimeline: React.FC<IssueActivityTimelineProps> = ({ issueId, compact }) => {
  const activityQuery = useIssueActivity(issueId, { limit: 50 }, { enabled: Boolean(issueId) });
  const items = useMemo(
    () => activityQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [activityQuery.data]
  );

  if (activityQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 size={14} className="animate-spin" /> Loading activity...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 p-4 text-sm text-gray-500 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-400">
        No activity yet.
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${compact ? '' : 'pt-1'}`}>
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-gray-100 bg-white/80 px-3 py-2.5 shadow-sm dark:border-border-dark dark:bg-white/[0.01]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {getIcon(item.type)}
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {item.actor?.name || 'System'}
              </span>
            </div>
            <span className="text-[11px] text-gray-400">{formatTimestamp(item.createdAt)}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{item.message}</p>
        </div>
      ))}

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
