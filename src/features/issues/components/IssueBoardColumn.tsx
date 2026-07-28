import React, { useEffect, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, CheckCircle2, Loader2 } from 'lucide-react';
import { BoardCard } from '@/components/board/BoardCard';
import { Issue, IssueType, Status } from '@/types';
import { useIssuesDirectory } from '../hooks/useIssueData';

export interface IssueBoardFilters {
  q?: string;
  projectId?: string;
  teamId?: string;
  departmentId?: string;
  type?: IssueType;
}

interface IssueBoardColumnProps {
  id: Status;
  filters: IssueBoardFilters;
  selectedAssigneeIds?: string[];
  onIssueClick: (id: string) => void;
  onNewIssue: () => void;
  hideNewIssueButton?: boolean;
  statusLabel: string;
  statusColor: string;
  isFinal?: boolean;
  onIssuesLoaded?: (statusKey: string, issues: Issue[]) => void;
}

const COLUMN_PAGE_SIZE = 10; // temporarily lowered for testing infinite scroll — bump back to 30 after
const SCROLL_LOAD_THRESHOLD_PX = 150;

const StatusIcon: React.FC<{ color: string; isFinal: boolean }> = ({ color, isFinal }) => {
  if (isFinal) {
    return <CheckCircle2 size={14} style={{ color }} />;
  }
  return <div className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: color }} />;
};

/**
 * A single Kanban column that owns its own paginated data — each column fetches
 * only issues for its own status (server-side filtered), 30 at a time, and loads
 * more as the column itself is scrolled. This keeps a workspace with thousands of
 * issues from ever loading them all into the board at once.
 */
export const IssueBoardColumn: React.FC<IssueBoardColumnProps> = ({
  id,
  filters,
  selectedAssigneeIds = [],
  onIssueClick,
  onNewIssue,
  hideNewIssueButton = false,
  statusLabel,
  statusColor,
  isFinal = false,
  onIssuesLoaded,
}) => {
  const query = useIssuesDirectory({
    ...filters,
    status: id,
    sort: 'updatedAt:desc',
    limit: COLUMN_PAGE_SIZE,
  });

  const allIssues = useMemo(() => {
    const byId = new Map<string, Issue>();
    query.data?.pages.forEach((page) => page.items.forEach((issue) => byId.set(issue.id, issue)));
    return Array.from(byId.values());
  }, [query.data]);

  useEffect(() => {
    onIssuesLoaded?.(id, allIssues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allIssues, id]);

  const issues = useMemo(() => {
    if (selectedAssigneeIds.length === 0) return allIssues;
    const set = new Set(selectedAssigneeIds);
    return allIssues.filter((issue) => issue.assigneeId && set.has(issue.assigneeId));
  }, [allIssues, selectedAssigneeIds]);

  const totalCount = query.data?.pages[0]?.meta.total ?? issues.length;

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'Column', status: id },
  });

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    const el = event.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_LOAD_THRESHOLD_PX) {
      query.fetchNextPage();
    }
  };

  return (
    <div className="w-80 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-2">
          <StatusIcon color={statusColor} isFinal={isFinal} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">{statusLabel}</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-500 tabular-nums">
            {totalCount}
          </span>
        </div>
        {!hideNewIssueButton && (
          <button
            onClick={onNewIssue}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 transition-colors"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        onScroll={handleScroll}
        className={`flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-hide rounded-xl transition-colors duration-200 ${
          isOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''
        }`}
      >
        {query.isLoading ? (
          <div className="h-24 flex items-center justify-center text-gray-400">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : (
          <SortableContext items={issues.map((issue) => issue.id)} strategy={verticalListSortingStrategy}>
            {issues.map((issue) => (
              <BoardCard key={issue.id} issue={issue} onClick={onIssueClick} />
            ))}
          </SortableContext>
        )}

        {!query.isLoading && issues.length === 0 && (
          <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-border-dark rounded-xl text-gray-400 text-xs gap-2">
            <p>Drop items here</p>
          </div>
        )}

        {query.isFetchingNextPage && (
          <div className="flex items-center justify-center py-3 text-gray-400">
            <Loader2 size={14} className="animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};
