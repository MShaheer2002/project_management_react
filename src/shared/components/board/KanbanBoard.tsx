import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Issue, Status, WorkspaceStatus } from '@/types';
import { BoardColumn } from './BoardColumn';
import { BoardCard } from './BoardCard';
import { useApp } from '@/AppContext';
import { useWorkspaceStatuses } from '@shared/hooks/useWorkspaceStatuses';

interface KanbanBoardProps {
  issues: Issue[];
  onIssueUpdate: (issueId: string, newStatus: Status) => void;
  onNewIssue: (status: Status) => void;
  hideNewIssueButton?: boolean;
  statuses?: WorkspaceStatus[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  issues,
  onIssueUpdate,
  onNewIssue,
  hideNewIssueButton = false,
  statuses: statusesProp,
}) => {
  const defaultStatuses = useWorkspaceStatuses();
  const resolvedStatuses = statusesProp ?? defaultStatuses;
  const COLUMNS = resolvedStatuses.map((s) => s.key);
  const { setSelectedIssueId } = useApp();
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [localIssues, setLocalIssues] = useState<Issue[]>(issues);

  // Sync local issues when props change
  useEffect(() => {
    setLocalIssues(issues);
  }, [issues]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const issue = localIssues.find((i) => i.id === active.id);
    if (issue) setActiveIssue(issue);
  }, [localIssues]);

  const [mouseDeltaX, setMouseDeltaX] = useState(0);
  const lastMouseX = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (activeIssue) {
        if (lastMouseX.current !== null) {
          const delta = e.clientX - lastMouseX.current;
          // Smoothly interpolate the delta to avoid jitter
          setMouseDeltaX(prev => prev * 0.8 + delta * 0.2);
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

  const tiltAngle = useMemo(() => {
    // Clamp the tilt between -5 and 5 degrees based on movement speed/direction
    const angle = Math.max(-5, Math.min(5, mouseDeltaX * 0.5));
    return angle;
  }, [mouseDeltaX]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAnIssue = active.data.current?.type === 'Issue';
    const isOverAColumn = over.data.current?.type === 'Column';
    const isOverAnIssue = over.data.current?.type === 'Issue';

    if (!isActiveAnIssue) return;

    // Dropping over a column
    if (isOverAColumn) {
      setLocalIssues((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === activeId);
        const newStatus = over.data.current?.status as Status;
        
        if (prev[activeIndex].status !== newStatus) {
          const updated = [...prev];
          updated[activeIndex] = { ...updated[activeIndex], status: newStatus };
          return updated;
        }
        return prev;
      });
    }

    // Dropping over another issue
    if (isOverAnIssue) {
      const activeIndex = localIssues.findIndex((i) => i.id === activeId);
      const overIndex = localIssues.findIndex((i) => i.id === overId);
      const overIssue = localIssues[overIndex];

      if (localIssues[activeIndex].status !== overIssue.status) {
        setLocalIssues((prev) => {
          const updated = [...prev];
          updated[activeIndex] = { ...updated[activeIndex], status: overIssue.status };
          return arrayMove(updated, activeIndex, overIndex);
        });
      }
    }
  }, [localIssues]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);
    lastMouseX.current = null;
    setMouseDeltaX(0);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeIndex = localIssues.findIndex((i) => i.id === activeId);
    const overIndex = localIssues.findIndex((i) => i.id === overId);

    const activeIssue = localIssues[activeIndex];
    let newStatus = activeIssue.status;

    if (over.data.current?.type === 'Column') {
      newStatus = over.data.current.status;
    } else if (over.data.current?.type === 'Issue') {
      newStatus = over.data.current.issue.status;
    }

    // Notify parent of the update
    onIssueUpdate(activeId as string, newStatus);

    if (activeIndex !== overIndex) {
      setLocalIssues((prev) => arrayMove(prev, activeIndex, overIndex));
    }
  }, [localIssues, onIssueUpdate]);

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="flex-1 overflow-x-auto p-6 bg-gray-50/30 dark:bg-black/10">
        <div className="flex gap-6 h-full min-w-max">
          {COLUMNS.map((status) => {
            const statusConfig = resolvedStatuses.find((s) => s.key === status);
            return (
              <BoardColumn
                key={status}
                id={status}
                issues={localIssues.filter((i) => i.status === status)}
                onIssueClick={setSelectedIssueId}
                onNewIssue={() => onNewIssue(status)}
                hideNewIssueButton={hideNewIssueButton}
                statusLabel={statusConfig?.label}
                statusColor={statusConfig?.color}
                isFinal={statusConfig?.isFinal}
              />
            );
          })}
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
