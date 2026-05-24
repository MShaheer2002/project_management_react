import type { ApiListMeta } from '@shared/services/types';
import type {
  Issue,
  IssueAttachment,
  IssueDependencyRelation,
  IssueIntegrationRef,
  IssueSubtask,
  Priority,
  Severity,
  Status,
} from '@/types';

export type IssueSort =
  | 'updatedAt:desc'
  | 'updatedAt:asc'
  | 'createdAt:desc'
  | 'createdAt:asc'
  | 'priority:desc'
  | 'priority:asc'
  | 'dueDate:asc'
  | 'dueDate:desc';

export interface IssueUserSummary {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface IssueProjectSummary {
  id: string;
  name: string;
}

export interface IssueTeamSummary {
  id: string;
  name: string;
}

export interface IssueDepartmentSummary {
  id: string;
  name: string;
  color?: string | null;
}

export interface IssueParentSummary {
  id: string;
  title: string;
  status: Status;
  projectId: string;
}

export interface IssueWatcherRow {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
}

export interface IssueDependencyRow {
  issueId: string;
  title: string;
  status: Status;
  relation: IssueDependencyRelation;
}

export interface IssueSubtaskStats {
  total: number;
  completed: number;
}

export interface IssueSummary extends Issue {
  entityId?: string;
  creator?: IssueUserSummary;
  assignee?: IssueUserSummary | null;
  project?: IssueProjectSummary;
  team?: IssueTeamSummary;
  department?: IssueDepartmentSummary | null;
  subtaskStats?: IssueSubtaskStats;
  attachmentCount?: number;
}

export interface IssueDetail extends IssueSummary {
  attachments: IssueAttachment[];
  subtasks: IssueSubtask[];
  parent?: IssueParentSummary | null;
  dependencies?: IssueDependencyRow[];
  watchers?: IssueWatcherRow[];
  integrationRefs?: IssueIntegrationRef[];
}

export interface IssueCompactOption {
  id: string;
  title: string;
  status: Status;
  projectId: string;
}

export interface IssueListResult<T> {
  items: T[];
  meta: ApiListMeta;
}

export interface ListIssuesInput {
  q?: string;
  cursor?: string;
  limit?: number;
  sort?: IssueSort;
  status?: Status;
  priority?: Priority;
  type?: Issue['type'];
  assigneeId?: string;
  projectId?: string;
  teamId?: string;
  departmentId?: string;
  creatorId?: string;
}

export interface CreateIssueSubtaskInput {
  title: string;
  order?: number;
}

export interface UpdateIssueSubtaskInput {
  title?: string;
  completed?: boolean;
  order?: number;
}

export interface ReorderIssueSubtasksInput {
  items: Array<{
    id: string;
    order: number;
  }>;
}

export interface IssueAttachmentInput {
  fileName: string;
  contentType: string;
  size: number;
  kind: IssueAttachment['kind'];
  key: string;
  assetUrl?: string | null;
  reference?: string;
}

export interface AddIssueAttachmentsInput {
  attachments: IssueAttachmentInput[];
}

export interface AddIssueWatchersInput {
  userIds: string[];
}

export interface AddIssueDependencyInput {
  relatedId: string;
  relation: IssueDependencyRelation;
}

export interface UpdateIssueIntegrationRefsInput {
  integrationRefs: IssueIntegrationRef[];
}

export interface CreateIssueInput {
  title: string;
  description?: string;
  type: Issue['type'];
  projectId: string;
  priority: Priority;
  status?: Status;
  assigneeId?: string | null;
  labels?: string[];
  dueDate?: string | null;
  dueTime?: string | null;
  estimate?: number | null;
  subtasks?: CreateIssueSubtaskInput[];
  attachments?: IssueAttachmentInput[];
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity?: Severity;
  acceptanceCriteria?: string;
  relatedIssueKeys?: string[];
  notes?: string;
  departmentId?: string | null;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string | null;
  priority?: Priority;
  status?: Status;
  assigneeId?: string | null;
  labels?: string[];
  dueDate?: string | null;
  dueTime?: string | null;
  estimate?: number | null;
  stepsToReproduce?: string | null;
  expectedBehavior?: string | null;
  actualBehavior?: string | null;
  severity?: Severity | null;
  acceptanceCriteria?: string | null;
  relatedIssueKeys?: string[];
  notes?: string | null;
  parentIssueId?: string | null;
}
