import type { ApiListMeta } from '@shared/services/types';
import type { CreateDocumentInput } from '@shared/types/documents';

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
export type ProjectVisibility = 'PUBLIC' | 'PRIVATE';
export type ProjectSort =
  | 'updatedAt:desc'
  | 'updatedAt:asc'
  | 'name:asc'
  | 'name:desc'
  | 'createdAt:desc'
  | 'createdAt:asc'
  | 'targetDate:asc'
  | 'targetDate:desc';
export type ProjectMemberSort = 'name:asc' | 'name:desc' | 'joinedAt:asc' | 'joinedAt:desc';

export interface ProjectFeatures {
  roadmap: boolean;
  cycles: boolean;
  issueTracking: boolean;
}

export interface ProjectLeadSummary {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface ProjectTeamSummary {
  id: string;
  name: string;
}

export interface ProjectDepartmentSummary {
  id: string;
  name: string;
  color: string | null;
}

export interface ProjectStatsSummary {
  issueCount: number;
  completedIssueCount: number;
  memberCount: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  progress: number;
  startDate: string | null;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  lead: ProjectLeadSummary | null;
  team: ProjectTeamSummary;
  department: ProjectDepartmentSummary | null;
  stats: ProjectStatsSummary;
  features: ProjectFeatures;
}

export interface ProjectDetail extends ProjectSummary {}

export interface ProjectCompact {
  id: string;
  name: string;
  teamId: string;
  departmentId: string | null;
  status: ProjectStatus;
  visibility: ProjectVisibility;
}

export interface ProjectMemberRow {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  joinedAt: string | null;
  membershipRole: 'LEAD' | 'MEMBER';
  department: {
    id: string;
    name: string;
  } | null;
  team: {
    id: string;
    name: string;
  } | null;
}

export interface ProjectMemberOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ProjectListResult<T> {
  items: T[];
  meta: ApiListMeta;
}

export interface ListProjectsInput {
  q?: string;
  cursor?: string;
  limit?: number;
  sort?: ProjectSort;
  teamId?: string;
  departmentId?: string;
  leadId?: string;
  status?: ProjectStatus;
  visibility?: ProjectVisibility;
}

export interface ListProjectMembersInput {
  q?: string;
  cursor?: string;
  limit?: number;
  sort?: ProjectMemberSort;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
}

export interface CreateProjectInput {
  name: string;
  slug?: string;
  description?: string;
  teamId: string;
  departmentId?: string | null;
  leadId: string;
  memberIds?: string[];
  visibility?: ProjectVisibility;
  startDate?: string | null;
  targetDate?: string | null;
  features?: Partial<ProjectFeatures>;
  docs?: CreateDocumentInput[];
}

export interface UpdateProjectInput {
  name?: string;
  slug?: string;
  description?: string | null;
  teamId?: string;
  departmentId?: string | null;
  leadId?: string;
  visibility?: ProjectVisibility;
  status?: ProjectStatus;
  startDate?: string | null;
  targetDate?: string | null;
  features?: Partial<ProjectFeatures>;
}

export interface AddProjectMembersInput {
  userIds: string[];
}
