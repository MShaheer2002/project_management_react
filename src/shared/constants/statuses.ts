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
  {
    key: 'backlog',
    label: 'Backlog',
    color: '#9CA3AF',
    order: 0,
    category: 'backlog',
    isActive: true,
    isFinal: false,
    showOnBoard: true,
    visibility: { board: true, list: true, filters: true, create: true, cycleBoard: false, cycleList: true },
    cycle: { allowedInCycle: true, countsAsCompleted: false, countsAsCarryOver: true, planIntoThisStatus: false },
    transitions: { mode: 'free', to: [], allowRollback: false, allowedRoles: ['OWNER', 'ADMIN', 'MEMBER'], allowedUserIds: [], assigneeOnly: false, creatorOnly: false },
    rules: {
      requireAssignee: false,
      requireDueDate: false,
      requireAllSubtasksComplete: false,
      requireAcceptanceCriteria: false,
      requireParentIssue: false,
      requireIntegrationRef: false,
    },
    approval: { required: false, requiredCount: 1, reviewerSource: 'project_members', reviewerUserIds: [] },
  },
  {
    key: 'todo',
    label: 'Todo',
    color: '#9CA3AF',
    order: 1,
    category: 'unstarted',
    isActive: true,
    isFinal: false,
    showOnBoard: true,
    visibility: { board: true, list: true, filters: true, create: true, cycleBoard: true, cycleList: true },
    cycle: { allowedInCycle: true, countsAsCompleted: false, countsAsCarryOver: true, planIntoThisStatus: true },
    transitions: { mode: 'free', to: [], allowRollback: false, allowedRoles: ['OWNER', 'ADMIN', 'MEMBER'], allowedUserIds: [], assigneeOnly: false, creatorOnly: false },
    rules: {
      requireAssignee: false,
      requireDueDate: false,
      requireAllSubtasksComplete: false,
      requireAcceptanceCriteria: false,
      requireParentIssue: false,
      requireIntegrationRef: false,
    },
    approval: { required: false, requiredCount: 1, reviewerSource: 'project_members', reviewerUserIds: [] },
  },
  {
    key: 'in-progress',
    label: 'In Progress',
    color: '#3B82F6',
    order: 2,
    category: 'active',
    isActive: true,
    isFinal: false,
    showOnBoard: true,
    visibility: { board: true, list: true, filters: true, create: true, cycleBoard: true, cycleList: true },
    cycle: { allowedInCycle: true, countsAsCompleted: false, countsAsCarryOver: true, planIntoThisStatus: false },
    transitions: { mode: 'free', to: [], allowRollback: false, allowedRoles: ['OWNER', 'ADMIN', 'MEMBER'], allowedUserIds: [], assigneeOnly: false, creatorOnly: false },
    rules: {
      requireAssignee: false,
      requireDueDate: false,
      requireAllSubtasksComplete: false,
      requireAcceptanceCriteria: false,
      requireParentIssue: false,
      requireIntegrationRef: false,
    },
    approval: { required: false, requiredCount: 1, reviewerSource: 'project_members', reviewerUserIds: [] },
  },
  {
    key: 'review',
    label: 'Review',
    color: '#A855F7',
    order: 3,
    category: 'review',
    isActive: true,
    isFinal: false,
    showOnBoard: true,
    visibility: { board: true, list: true, filters: true, create: true, cycleBoard: true, cycleList: true },
    cycle: { allowedInCycle: true, countsAsCompleted: false, countsAsCarryOver: true, planIntoThisStatus: false },
    transitions: { mode: 'free', to: [], allowRollback: false, allowedRoles: ['OWNER', 'ADMIN', 'MEMBER'], allowedUserIds: [], assigneeOnly: false, creatorOnly: false },
    rules: {
      requireAssignee: false,
      requireDueDate: false,
      requireAllSubtasksComplete: false,
      requireAcceptanceCriteria: false,
      requireParentIssue: false,
      requireIntegrationRef: false,
    },
    approval: { required: false, requiredCount: 1, reviewerSource: 'project_members', reviewerUserIds: [] },
  },
  {
    key: 'done',
    label: 'Done',
    color: '#22C55E',
    order: 4,
    category: 'done',
    isActive: true,
    isFinal: true,
    showOnBoard: true,
    visibility: { board: true, list: true, filters: true, create: false, cycleBoard: true, cycleList: true },
    cycle: { allowedInCycle: true, countsAsCompleted: true, countsAsCarryOver: false, planIntoThisStatus: false },
    transitions: { mode: 'free', to: [], allowRollback: false, allowedRoles: ['OWNER', 'ADMIN', 'MEMBER'], allowedUserIds: [], assigneeOnly: false, creatorOnly: false },
    rules: {
      requireAssignee: false,
      requireDueDate: false,
      requireAllSubtasksComplete: false,
      requireAcceptanceCriteria: false,
      requireParentIssue: false,
      requireIntegrationRef: false,
    },
    approval: { required: false, requiredCount: 1, reviewerSource: 'project_members', reviewerUserIds: [] },
  },
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
