import type { ApiListMeta } from '@shared/services/types';
import type { CreateDocumentInput } from '@shared/types/documents';

export type TeamVisibility = 'PUBLIC' | 'PRIVATE';
export type TeamSort = 'name:asc' | 'name:desc' | 'createdAt:asc' | 'createdAt:desc';
export type TeamMemberSort = 'name:asc' | 'name:desc' | 'joinedAt:asc' | 'joinedAt:desc';

export interface TeamLeadSummary {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface TeamDepartmentSummary {
  id: string;
  name: string;
  color: string | null;
}

export interface TeamStatsSummary {
  memberCount: number;
  projectCount: number;
}

export interface TeamStatsDetail extends TeamStatsSummary {
  issueCount: number;
}

export interface TeamSummary {
  id: string;
  name: string;
  description: string | null;
  visibility: TeamVisibility;
  createdAt: string;
  updatedAt: string;
  lead: TeamLeadSummary | null;
  department: TeamDepartmentSummary | null;
  stats: TeamStatsSummary;
}

export interface TeamDetail extends Omit<TeamSummary, 'stats'> {
  stats: TeamStatsDetail;
}

export interface TeamCompact {
  id: string;
  name: string;
  departmentId: string | null;
}

export interface TeamMemberRow {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  joinedAt: string;
  department: {
    id: string;
    name: string;
  } | null;
  team: {
    id: string;
    name: string;
  };
}

export interface TeamMemberOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface TeamListResult<T> {
  items: T[];
  meta: ApiListMeta;
}

export interface ListTeamsInput {
  q?: string;
  cursor?: string;
  limit?: number;
  sort?: TeamSort;
  departmentId?: string;
  leadId?: string;
  visibility?: TeamVisibility;
}

export interface ListTeamMembersInput {
  q?: string;
  cursor?: string;
  limit?: number;
  sort?: TeamMemberSort;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  leadId: string;
  departmentId?: string | null;
  visibility?: TeamVisibility;
  memberIds?: string[];
  docs?: CreateDocumentInput[];
}

export interface UpdateTeamInput {
  name?: string;
  description?: string | null;
  leadId?: string;
  departmentId?: string | null;
  visibility?: TeamVisibility;
}

export interface AddTeamMembersInput {
  userIds: string[];
}
