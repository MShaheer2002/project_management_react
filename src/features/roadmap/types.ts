export type RoadmapView = 'MONTH' | 'QUARTER';
export type RoadmapSort =
  | 'targetDate:asc'
  | 'targetDate:desc'
  | 'startDate:asc'
  | 'startDate:desc'
  | 'progress:asc'
  | 'progress:desc'
  | 'health:asc'
  | 'health:desc'
  | 'updatedAt:desc'
  | 'name:asc';
export type RoadmapProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type RoadmapProjectVisibility = 'PUBLIC' | 'PRIVATE';
export type RoadmapHealth = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'BLOCKED' | 'NO_SIGNAL';
export type RoadmapMilestoneStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';
export type RoadmapDependencyStatus = 'ACTIVE' | 'RESOLVED' | 'CANCELLED';

export interface RoadmapWindow {
  view: RoadmapView;
  from: string;
  to: string;
  label: string;
  previous: { from: string; to: string; label: string };
  next: { from: string; to: string; label: string };
}

export interface RoadmapFilters {
  teamId?: string | null;
  departmentId?: string | null;
  leadId?: string | null;
  projectId?: string | null;
  status?: RoadmapProjectStatus | null;
  health?: RoadmapHealth | null;
  includeUnscheduled?: boolean;
  q?: string | null;
}

export interface RoadmapPerson {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface RoadmapEntityRef {
  id: string;
  name: string;
}

export interface RoadmapDepartmentRef extends RoadmapEntityRef {
  color: string | null;
}

export interface RoadmapItem {
  id: string;
  name: string;
  slug: string;
  status: RoadmapProjectStatus;
  visibility: RoadmapProjectVisibility;
  description: string | null;
  startDate: string | null;
  targetDate: string | null;
  updatedAt: string;
  createdAt: string;
  progress: number;
  team: RoadmapEntityRef | null;
  department: RoadmapDepartmentRef | null;
  lead: RoadmapPerson | null;
  features: { roadmap: boolean };
  schedule: {
    startDate: string | null;
    targetDate: string | null;
    durationDays: number | null;
    layout: {
      startsBeforeWindow: boolean;
      endsAfterWindow: boolean;
      overlapsWindow: boolean;
      offsetPercent: number;
      widthPercent: number;
      durationDays: number;
    } | null;
  };
  stats: {
    totalIssues: number;
    completedIssues: number;
    openIssues: number;
  };
  health: {
    status: RoadmapHealth;
    reasonCodes: string[];
    severity: number;
  };
  milestoneSummary: {
    total: number;
    completed: number;
    overdue: number;
    next: RoadmapMilestone | null;
  };
  dependencySummary: {
    blocked: boolean;
    blockedByCount: number;
    blockingCount: number;
  };
  forecast: {
    expectedProgress: number | null;
    variance: number | null;
    status: Exclude<RoadmapHealth, 'BLOCKED'>;
    projectedTargetDate: string | null;
  };
}

export interface RoadmapListResponse {
  window: RoadmapWindow;
  filters: {
    teamId: string | null;
    departmentId: string | null;
    leadId: string | null;
    projectId: string | null;
    status: RoadmapProjectStatus | null;
    health: RoadmapHealth | null;
    includeUnscheduled: boolean;
    q: string | null;
  };
  items: RoadmapItem[];
  unscheduled: {
    count: number;
    items: RoadmapItem[];
  };
  meta: {
    total: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export interface RoadmapMilestone {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  dueDate: string;
  owner: RoadmapPerson | null;
  status: RoadmapMilestoneStatus;
  completedAt: string | null;
  completedBy: RoadmapPerson | null;
  sortOrder: number;
  outOfRange: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapProjectRef {
  id: string;
  name: string;
  slug: string;
  status: RoadmapProjectStatus;
  visibility: RoadmapProjectVisibility;
  startDate: string | null;
  targetDate: string | null;
  team: RoadmapEntityRef | null;
  department: RoadmapDepartmentRef | null;
  lead: RoadmapPerson | null;
}

export interface RoadmapDependency {
  id: string;
  workspaceId: string;
  blockingProjectId: string;
  blockedProjectId: string;
  status: RoadmapDependencyStatus;
  note: string | null;
  resolvedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  blockingProject: RoadmapProjectRef | null;
  blockedProject: RoadmapProjectRef | null;
}

export interface ProjectRoadmapDetailResponse {
  project: RoadmapItem;
  milestones: RoadmapMilestone[];
  dependencies: {
    upstream: RoadmapDependency[];
    downstream: RoadmapDependency[];
  };
  summary: {
    blocked: boolean;
    overdueMilestones: number;
    nextMilestone: RoadmapMilestone | null;
    health: RoadmapItem['health'];
    forecast: RoadmapItem['forecast'];
  };
}

export interface ListRoadmapInput {
  view?: RoadmapView;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
  sort?: RoadmapSort;
  teamId?: string;
  departmentId?: string;
  leadId?: string;
  projectId?: string;
  status?: RoadmapProjectStatus;
  health?: RoadmapHealth;
  includeUnscheduled?: boolean;
  q?: string;
}

export interface UpdateProjectScheduleInput {
  startDate?: string | null;
  targetDate?: string | null;
  reason?: string | null;
  force?: boolean;
}

export interface RoadmapScheduleConflictErrorDetails {
  projectId: string;
  affectedDependencies: Array<{
    dependencyId: string;
    blockedProject: { id: string; name: string };
  }>;
  requiresConfirmation: boolean;
  allowedForceOverride: boolean;
}

export interface CreateMilestoneInput {
  name: string;
  description?: string | null;
  dueDate: string;
  ownerId?: string | null;
  status?: RoadmapMilestoneStatus;
}

export interface UpdateMilestoneInput {
  name?: string;
  description?: string | null;
  dueDate?: string;
  ownerId?: string | null;
  status?: RoadmapMilestoneStatus;
}

export interface ReorderMilestonesInput {
  orderedIds: string[];
}

export interface CreateDependencyInput {
  blockingProjectId: string;
  blockedProjectId: string;
  note?: string | null;
}

export interface DependencyActionInput {
  note?: string | null;
}
