import type { ApiListMeta } from '@shared/services/types';

export type DepartmentVisibility = 'PUBLIC' | 'PRIVATE';
export type DepartmentSort = 'name:asc' | 'name:desc' | 'createdAt:asc' | 'createdAt:desc';
export type DepartmentMemberSort = 'name:asc' | 'name:desc' | 'joinedAt:asc' | 'joinedAt:desc';

export interface DepartmentHeadSummary {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface DepartmentStatsSummary {
  memberCount: number;
  teamCount: number;
  projectCount: number;
}

export interface DepartmentStatsDetail extends DepartmentStatsSummary {
  issueCount: number;
}

export interface DepartmentAnalyticsTrend {
  value: number;
  direction: 'up' | 'down' | 'flat';
}

export interface DepartmentAnalyticsMetric {
  value: number;
  trend: DepartmentAnalyticsTrend;
}

export interface DepartmentVelocityPoint {
  date: string;
  label: string;
  completed: number;
  created: number;
  velocity: number;
}

export interface DepartmentWorkloadPoint {
  teamId: string;
  name: string;
  issues: number;
  completed: number;
  open: number;
  completionRate: number;
}

export interface DepartmentAnalytics {
  period: {
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  summary: {
    efficiencyPercent: DepartmentAnalyticsMetric;
    resourceLoadPercent: DepartmentAnalyticsMetric;
    stressIndex: DepartmentAnalyticsMetric;
    overdueIssues: number;
  };
  charts: {
    velocity: DepartmentVelocityPoint[];
    workload: DepartmentWorkloadPoint[];
  };
}

export interface DepartmentSummary {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  visibility: DepartmentVisibility;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  head: DepartmentHeadSummary | null;
  stats: DepartmentStatsSummary;
}

export interface DepartmentDetail extends Omit<DepartmentSummary, 'stats'> {
  stats: DepartmentStatsDetail;
  analytics: DepartmentAnalytics;
}

export interface DepartmentCompact {
  id: string;
  name: string;
}

export interface DepartmentMemberRow {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  joinedAt: string;
  department: {
    id: string;
    name: string;
  };
  team: {
    id: string;
    name: string;
  } | null;
}

export interface DepartmentMemberOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface DepartmentListResult<T> {
  items: T[];
  meta: ApiListMeta;
}

export interface ListDepartmentsInput {
  q?: string;
  cursor?: string;
  limit?: number;
  sort?: DepartmentSort;
  visibility?: DepartmentVisibility;
  headId?: string;
}

export interface ListDepartmentMembersInput {
  q?: string;
  cursor?: string;
  limit?: number;
  sort?: DepartmentMemberSort;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
}

export interface CreateDepartmentInput {
  name: string;
  description?: string;
  headId?: string | null;
  color?: string | null;
  visibility?: DepartmentVisibility;
  isDefault?: boolean;
  memberIds?: string[];
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string | null;
  headId?: string | null;
  color?: string | null;
  visibility?: DepartmentVisibility;
  isDefault?: boolean;
}

export interface AddDepartmentMembersInput {
  userIds: string[];
}
