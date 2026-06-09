import React from 'react';
import { FileText, Plus } from 'lucide-react';

interface DocumentEmptyStateProps {
  title: string;
  description: string;
  canManage: boolean;
  onAdd?: () => void;
}

export const DocumentEmptyState: React.FC<DocumentEmptyStateProps> = ({
  title,
  description,
  canManage,
  onAdd,
}) => (
  <div className="flex flex-col items-center py-12 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-primary dark:bg-white/5">
      <FileText size={20} />
    </div>
    <h3 className="mt-4 text-sm font-semibold">{title}</h3>
    <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-gray-400">{description}</p>
    {canManage && onAdd && (
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-primary/20"
      >
        <Plus size={14} />
        Add document
      </button>
    )}
  </div>
);
