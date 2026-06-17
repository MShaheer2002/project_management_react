import type { WorkspaceStatus } from '@/types';

/** Fallback labels used when workspace statuses haven't loaded yet. */
export const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done',
};

/** Default workspace statuses — used as fallback when customStatuses is missing/empty. */
export const DEFAULT_STATUSES: WorkspaceStatus[] = [
  { key: 'backlog', label: 'Backlog', color: '#9CA3AF', order: 0, isFinal: false },
  { key: 'todo', label: 'Todo', color: '#9CA3AF', order: 1, isFinal: false },
  { key: 'in-progress', label: 'In Progress', color: '#3B82F6', order: 2, isFinal: false },
  { key: 'review', label: 'Review', color: '#A855F7', order: 3, isFinal: false },
  { key: 'done', label: 'Done', color: '#22C55E', order: 4, isFinal: true },
];

/** Look up a status label from workspace statuses, falling back to STATUS_LABELS. */
export const getStatusLabel = (statuses: WorkspaceStatus[], key: string): string => {
  const found = statuses.find((s) => s.key === key);
  if (found) return found.label;
  return STATUS_LABELS[key] ?? key;
};

/** Look up a status color from workspace statuses. */
export const getStatusColor = (statuses: WorkspaceStatus[], key: string): string => {
  const found = statuses.find((s) => s.key === key);
  if (found) return found.color;
  // Fallback colors for default statuses
  const defaults: Record<string, string> = {
    backlog: '#9CA3AF',
    todo: '#9CA3AF',
    'in-progress': '#3B82F6',
    review: '#A855F7',
    done: '#22C55E',
  };
  return defaults[key] ?? '#9CA3AF';
};

/** Check if a status key is a final status (e.g. done). */
export const isStatusFinal = (statuses: WorkspaceStatus[], key: string): boolean => {
  const found = statuses.find((s) => s.key === key);
  if (found) return found.isFinal;
  return key === 'done';
};
