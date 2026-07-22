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

export interface IssueLabelRow {
  id: string;
  name: string;
  color: string;
  description?: string | null;
  issueCount?: number;
}

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
  labelObjects?: IssueLabelRow[];
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
  issueId: string;
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
  cycleId?: string | null;
  templateId?: string | null;
  templateDraftId?: string | null;
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
  integrationRefs?: IssueIntegrationRef[];
  departmentId?: string | null;
}

export interface CheckIssueAssignmentEligibilityInput {
  projectId: string;
  assigneeId: string;
}

export interface IssueAssignmentEligibility {
  projectId: string;
  projectName: string;
  workspaceMember: boolean;
  projectMember: boolean;
  canAutoAdd: boolean;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string | null;
  type?: Issue['type'];
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

export interface ListLabelsInput {
  q?: string;
  cursor?: string;
  limit?: number;
  sort?: 'name:asc' | 'usage:desc' | 'createdAt:desc' | 'createdAt:asc';
}

export interface CreateLabelInput {
  name: string;
  color: string;
  description?: string | null;
}

export interface UpdateLabelInput {
  name?: string;
  color?: string;
  description?: string | null;
}

export interface AttachIssueLabelsInput {
  labelIds: string[];
}

export interface IssueCommentAuthor {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
}

export interface IssueComment {
  id: string;
  issueId: string;
  parentId: string | null;
  body: string;
  attachments?: IssueCommentAttachment[];
  createdAt: string;
  updatedAt: string;
  author: IssueCommentAuthor;
}

export interface IssueCommentAttachment {
  id: string;
  key: string;
  fileName: string;
  contentType: string;
  size: number;
  kind: 'attachment' | 'video';
  assetUrl?: string | null;
  createdAt?: string;
}

export interface IssueCommentAttachmentInput {
  key: string;
  fileName: string;
  contentType: string;
  size: number;
  kind: 'attachment' | 'video';
  assetUrl?: string | null;
}

export interface CreateIssueCommentInput {
  body: string;
  parentId?: string | null;
  attachments?: IssueCommentAttachmentInput[];
}

export interface UpdateIssueCommentInput {
  body: string;
  attachments?: IssueCommentAttachmentInput[];
}

export interface ListIssueCommentsInput {
  cursor?: string;
  limit?: number;
}

export interface IssueActivityItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  actor?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  issueId: string;
  commentId?: string;
}

export interface ListIssueActivityInput {
  cursor?: string;
  limit?: number;
}

export interface AddIssueCommentAttachmentsInput {
  attachments: IssueCommentAttachmentInput[];
}

export interface IssueApprovalStatus {
  statusKey: string;
  statusLabel: string;
  required: boolean;
  requiredCount: number;
  reviewerSource: 'project_members' | 'team_lead' | 'department_head' | 'manual';
  currentCount: number;
  satisfied: boolean;
  approvals: Array<{
    userId: string;
    name: string;
    email: string;
    avatar: string | null;
    approvedAt: string;
  }>;
}
