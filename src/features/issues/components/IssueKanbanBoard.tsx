import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { BoardCard } from '@/components/board/BoardCard';
import { useApp } from '@/AppContext';
import { Issue, Status, WorkspaceStatus } from '@/types';
import { IssueBoardColumn, IssueBoardFilters } from './IssueBoardColumn';

interface IssueKanbanBoardProps {
  filters: IssueBoardFilters;
  selectedAssigneeIds?: string[];
  statuses: WorkspaceStatus[];
  onIssueUpdate: (issueId: string, newStatus: Status) => Promise<boolean> | boolean;
  onNewIssue: (status: Status) => void;
  hideNewIssueButton?: boolean;
  onIssuesLoaded?: (statusKey: string, issues: Issue[]) => void;
}

/**
 * Board view for workspace-wide issue lists. Unlike the legacy KanbanBoard (which
 * takes a pre-fetched flat array), each column here fetches its own status
 * independently and paginates on scroll — a workspace with thousands of issues
 * never has to load them all into memory just to render the board.
 *
 * Drag-and-drop only changes an issue's status (there's no persisted manual
 * ordering to preserve); on drop we call onIssueUpdate and rely on the existing
 * mutation's query invalidation to refresh whichever columns are affected.
 */
export const IssueKanbanBoard: React.FC<IssueKanbanBoardProps> = ({
  filters,
  selectedAssigneeIds = [],
  statuses,
  onIssueUpdate,
  onNewIssue,
  hideNewIssueButton = false,
  onIssuesLoaded,
}) => {
  const { setSelectedIssueId } = useApp();
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const boardStatuses = useMemo(() => statuses.filter((status) => status.showOnBoard !== false), [statuses]);

  const [mouseDeltaX, setMouseDeltaX] = useState(0);
  const lastMouseX = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const issue = event.active.data.current?.issue as Issue | undefined;
    setActiveIssue(issue ?? null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const draggedIssue = active.data.current?.issue as Issue | undefined;
      setActiveIssue(null);
      lastMouseX.current = null;
      setMouseDeltaX(0);
      if (!over || !draggedIssue) return;

      const newStatus =
        over.data.current?.type === 'Column'
          ? (over.data.current.status as Status)
          : over.data.current?.type === 'Issue'
            ? ((over.data.current.issue as Issue).status)
            : draggedIssue.status;

      if (newStatus === draggedIssue.status) return;

      await onIssueUpdate(draggedIssue.entityId ?? draggedIssue.id, newStatus);
    },
    [onIssueUpdate]
  );

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (activeIssue) {
        if (lastMouseX.current !== null) {
          const delta = e.clientX - lastMouseX.current;
          setMouseDeltaX((prev) => prev * 0.8 + delta * 0.2);
        }
        lastMouseX.current = e.clientX;
      } else {
        lastMouseX.current = null;
        setMouseDeltaX(0);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [activeIssue]);

  const tiltAngle = useMemo(() => Math.max(-5, Math.min(5, mouseDeltaX * 0.5)), [mouseDeltaX]);

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.5' } },
    }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="kanban-scroll flex-1 overflow-x-auto p-6 bg-gray-50/30 dark:bg-black/10">
        <div className="flex gap-6 h-full min-w-max">
          {boardStatuses.map((status) => (
            <IssueBoardColumn
              key={status.key}
              id={status.key}
              filters={filters}
              selectedAssigneeIds={selectedAssigneeIds}
              onIssueClick={setSelectedIssueId}
              onNewIssue={() => onNewIssue(status.key)}
              hideNewIssueButton={hideNewIssueButton}
              statusLabel={status.label}
              statusColor={status.color}
              isFinal={status.isFinal}
              onIssuesLoaded={onIssuesLoaded}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeIssue ? (
          <div
            className="z-50 shadow-2xl transition-transform duration-300 ease-out"
            style={{
              transform: `scale(1.05) rotate(${tiltAngle}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <BoardCard issue={activeIssue} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
