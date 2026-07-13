import type { Issue, IssueType, Priority, Status } from '@/types';

export type CycleStatus = 'UPCOMING' | 'CURRENT' | 'COMPLETED';

export type CycleStats = {
  totalIssues: number;
  completedIssues: number;
  inProgressIssues: number;
  todoIssues: number;
  backlogIssues: number;
  reviewIssues: number;
  unfinishedIssues: number;
  progress: number;
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  timeElapsedPercent: number;
};

export type CycleSummary = {
  id: string;
  workspaceId: string;
  teamId: string;
  name: string;
  number: number;
  description: string | null;
  goal: string | null;
  startsAt: string;
  endsAt: string;
  status: CycleStatus;
  completedAt: string | null;
  completedById: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  team: { id: string; name: string };
  stats: CycleStats;
};

export type CycleIssueBreakdown = {
  byStatus: Array<{ status: Status; label: string; count: number }>;
  byPriority: Array<{ priority: Priority; count: number }>;
  byType: Array<{ type: IssueType; count: number }>;
  byProject: Array<{ projectId: string; projectName: string; count: number; completedCount: number }>;
};

export type CycleDetail = CycleSummary & {
  createdBy?: { id: string; name: string; email?: string; avatar?: string | null };
  completedBy?: { id: string; name: string; email?: string; avatar?: string | null } | null;
  issueBreakdown: CycleIssueBreakdown;
  rules: {
    carryOverRequired: boolean;
    unfinishedIssueCount: number;
    canComplete: boolean;
    canEditDates: boolean;
    canCarryOver: boolean;
    canReopen?: boolean;
    canDelete?: boolean;
  };
  issues?: Issue[];
};

export type CycleListResult<T> = {
  items: T[];
  meta: {
    cursor: string | null;
    hasMore: boolean;
    total?: number;
  };
};

export type ListCyclesInput = {
  teamId?: string;
  status?: CycleStatus;
  q?: string;
  from?: string;
  to?: string;
  sort?: 'startsAt:asc' | 'startsAt:desc' | 'updatedAt:desc' | 'number:desc';
  cursor?: string;
  limit?: number;
};

export type CreateCycleInput = {
  teamId: string;
  name?: string;
  description?: string | null;
  goal?: string | null;
  startsAt: string;
  endsAt: string;
  status?: 'UPCOMING' | 'CURRENT';
};

export type UpdateCycleInput = Partial<Pick<CreateCycleInput, 'name' | 'description' | 'goal' | 'startsAt' | 'endsAt' | 'status'>>;

export type CompleteCycleInput = {
  unfinishedAction: 'KEEP' | 'MOVE_TO_NEXT' | 'MOVE_TO_BACKLOG';
  targetCycleId?: string;
};

export type CarryOverCycleInput = {
  mode: 'nextCycle' | 'backlog';
  targetCycleId?: string;
};

export type ListCycleIssuesInput = {
  q?: string;
  status?: Status;
  type?: IssueType;
  priority?: Priority;
  projectId?: string;
  assigneeId?: string;
  departmentId?: string;
  sort?: 'updatedAt:desc' | 'priority:desc' | 'dueDate:asc' | 'status:asc';
  cursor?: string;
  limit?: number;
};

export type PlanIssuesInput = {
  issueIds: string[];
};
