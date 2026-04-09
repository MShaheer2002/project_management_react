import React, { useState, useCallback, useMemo } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  GripVertical, 
  Trash2, 
  X,
  CheckSquare
} from 'lucide-react';
import { IssueSubtask, Issue } from '../../../types';
import { updateStoredIssue } from '../../../lib/issue-storage';
import { useApp } from '../../../AppContext';

interface SubtaskItemProps {
  subtask: IssueSubtask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
}

const SortableSubtaskItem: React.FC<SubtaskItemProps> = ({ subtask, onToggle, onDelete, onUpdate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: subtask.id });

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(subtask.title);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== subtask.title) {
      onUpdate(subtask.id, editValue);
    } else {
      setEditValue(subtask.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(subtask.title);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all ${
        subtask.completed ? 'opacity-60' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-opacity"
      >
        <GripVertical size={14} />
      </button>

      <button
        onClick={() => onToggle(subtask.id)}
        className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
          subtask.completed 
            ? 'bg-primary border-primary text-white' 
            : 'border-gray-300 dark:border-gray-600 hover:border-primary'
        }`}
      >
        {subtask.completed && <CheckCircle2 size={14} />}
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none"
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className={`text-sm truncate cursor-text block ${
              subtask.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {subtask.title}
          </span>
        )}
      </div>

      <button
        onClick={() => onDelete(subtask.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

interface SubtaskListProps {
  issue: Issue;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({ issue }) => {
  const { showToast } = useApp();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleToggle = (id: string) => {
    const updatedSubtasks = issue.subtasks.map(s => 
      s.id === id ? { ...s, completed: !s.completed } : s
    );
    
    const updatedIssue = { ...issue, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() };
    updateStoredIssue(updatedIssue);

    const isAllCompleted = updatedSubtasks.every(s => s.completed);
    if (isAllCompleted && issue.status !== 'done') {
      showToast('All subtasks completed! Suggest marking issue as Done.', 'info');
    }
  };

  const handleDelete = (id: string) => {
    const updatedSubtasks = issue.subtasks.filter(s => s.id !== id);
    const updatedIssue = { ...issue, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() };
    updateStoredIssue(updatedIssue);
  };

  const handleUpdate = (id: string, title: string) => {
    const updatedSubtasks = issue.subtasks.map(s => 
      s.id === id ? { ...s, title } : s
    );
    const updatedIssue = { ...issue, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() };
    updateStoredIssue(updatedIssue);
  };

  const handleAdd = () => {
    if (!newSubtaskTitle.trim()) {
      setIsAdding(false);
      return;
    }

    const newSubtask: IssueSubtask = {
      id: `st-${Math.random().toString(36).substr(2, 9)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      order: issue.subtasks.length
    };

    const updatedIssue = { 
      ...issue, 
      subtasks: [...issue.subtasks, newSubtask],
      updatedAt: new Date().toISOString()
    };
    updateStoredIssue(updatedIssue);
    setNewSubtaskTitle('');
    setIsAdding(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = issue.subtasks.findIndex(s => s.id === active.id);
      const newIndex = issue.subtasks.findIndex(s => s.id === over.id);
      
      const movedSubtasks = arrayMove(issue.subtasks, oldIndex, newIndex).map((s: IssueSubtask, i: number) => ({
        ...s,
        order: i
      }));

      const updatedIssue = { ...issue, subtasks: movedSubtasks, updatedAt: new Date().toISOString() };
      updateStoredIssue(updatedIssue);
    }
  };

  const sortedSubtasks = useMemo(() => {
    return [...issue.subtasks].sort((a, b) => a.order - b.order);
  }, [issue.subtasks]);

  const completedCount = issue.subtasks.filter(s => s.completed).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <CheckSquare size={16} />
          Subtasks
        </h4>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs font-medium text-gray-400">
            {completedCount}/{issue.subtasks.length} completed
          </span>
          {issue.subtasks.length > 0 && (
            <div className="w-24 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${(completedCount / issue.subtasks.length) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedSubtasks.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {sortedSubtasks.map(subtask => (
              <SortableSubtaskItem
                key={subtask.id}
                subtask={subtask}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </SortableContext>
        </DndContext>

        {isAdding ? (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-white/5 ring-2 ring-primary/20">
            <Circle size={16} className="text-gray-300 ml-7" />
            <input
              autoFocus
              type="text"
              placeholder="What needs to be done?"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onBlur={handleAdd}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              className="flex-1 bg-transparent border-none p-0 text-sm focus:ring-0 outline-none"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 p-3 text-sm text-gray-400 hover:text-primary transition-colors w-full text-left group"
          >
            <Plus size={16} className="group-hover:scale-110 transition-transform" />
            Add a subtask...
          </button>
        )}
      </div>
    </div>
  );
};
