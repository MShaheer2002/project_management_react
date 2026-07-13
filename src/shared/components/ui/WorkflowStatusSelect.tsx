import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { Status, WorkspaceStatus } from '@/types';

type WorkflowStatusSelectProps = {
  value: Status;
  statuses: WorkspaceStatus[];
  disabled?: boolean;
  onChange: (value: Status) => void;
};

export const WorkflowStatusSelect: React.FC<WorkflowStatusSelectProps> = ({
  value,
  statuses,
  disabled = false,
  onChange,
}) => (
  <div className="relative inline-flex min-w-[122px] items-center">
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as Status)}
      className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white px-3 py-1.5 pr-8 text-xs font-semibold text-gray-700 outline-none transition-colors hover:border-primary/30 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-border-dark dark:bg-white/[0.04] dark:text-gray-200"
    >
      {statuses.map((status) => (
        <option key={status.key} value={status.key}>
          {status.label}
        </option>
      ))}
    </select>
    <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
  </div>
);
