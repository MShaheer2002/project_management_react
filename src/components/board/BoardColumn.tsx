import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Issue, Status } from '../../types';
import { STATUS_LABELS } from '../../constants';
import { BoardCard } from './BoardCard';

interface BoardColumnProps {
  id: Status;
  issues: Issue[];
  onIssueClick: (id: string) => void;
  onNewIssue: () => void;
  hideNewIssueButton?: boolean;
}

const StatusIcon: React.FC<{ status: Status }> = ({ status }) => {
  switch (status) {
    case 'done': return <CheckCircle2 size={14} className="text-green-500" />;
    case 'in-progress': return <Clock size={14} className="text-blue-500" />;
    case 'review': return <Clock size={14} className="text-purple-500" />;
    case 'todo': return <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400" />;
    case 'backlog': return <div className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-gray-400" />;
    default: return null;
  }
};

export const BoardColumn: React.FC<BoardColumnProps> = ({ 
  id, 
  issues, 
  onIssueClick, 
  onNewIssue,
  hideNewIssueButton = false
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      status: id,
    },
  });

  return (
    <div className="w-80 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-2">
          <StatusIcon status={id} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">{STATUS_LABELS[id]}</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-500 tabular-nums">
            {issues.length}
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
        className={`flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-hide rounded-xl transition-colors duration-200 ${
          isOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''
        }`}
      >
        <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map(issue => (
            <BoardCard key={issue.id} issue={issue} onClick={onIssueClick} />
          ))}
        </SortableContext>
        
        {issues.length === 0 && (
          <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-border-dark rounded-xl text-gray-400 text-xs gap-2">
            <p>Drop items here</p>
          </div>
        )}
      </div>
    </div>
  );
};
