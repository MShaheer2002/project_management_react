import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckSquare, Bug, Zap, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Issue, Priority, Status, IssueType } from '../../types';
import { MOCK_USERS, PRIORITY_COLORS, ISSUE_TYPE_CONFIG } from '../../constants';

interface BoardCardProps {
  issue: Issue;
  onClick: (id: string) => void;
}

const PriorityIcon: React.FC<{ priority: Priority }> = ({ priority }) => {
  switch (priority) {
    case 'urgent': return <AlertCircle size={14} className="text-red-500" />;
    case 'high': return <AlertCircle size={14} className="text-orange-500" />;
    case 'medium': return <AlertCircle size={14} className="text-blue-500" />;
    case 'low': return <AlertCircle size={14} className="text-gray-400" />;
    default: return null;
  }
};

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

export const BoardCard: React.FC<BoardCardProps> = ({ issue, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    data: {
      type: 'Issue',
      issue,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const assignee = MOCK_USERS.find(u => u.id === issue.assigneeId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(issue.id)}
      className={`bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-4 shadow-sm hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing group select-none ${
        isDragging ? 'z-50 shadow-xl scale-[1.02]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-400">{issue.id}</span>
          <TypeBadge type={issue.type || 'task'} />
        </div>
        <PriorityIcon priority={issue.priority} />
      </div>
      <h4 className="text-sm font-medium mb-3 line-clamp-2 group-hover:text-primary transition-colors">
        {issue.title}
      </h4>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {issue.labels.slice(0, 2).map(l => (
            <span key={l} className="text-[9px] px-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
              {l}
            </span>
          ))}
          {issue.labels.length > 2 && (
            <span className="text-[9px] px-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-400">
              +{issue.labels.length - 2}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {issue.subtasks && issue.subtasks.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400 mr-1">
              <CheckSquare size={10} />
              <span>{issue.subtasks.filter(s => s.completed).length}/{issue.subtasks.length}</span>
            </div>
          )}
          {assignee ? (
            <img src={assignee.avatar} className="w-5 h-5 rounded-full ring-1 ring-gray-200 dark:ring-white/10" alt={assignee.name} title={assignee.name} />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
              <Clock size={10} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
