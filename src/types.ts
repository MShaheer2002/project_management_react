export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = string;
export type WorkspaceStatusCategory = 'backlog' | 'unstarted' | 'active' | 'review' | 'done' | 'cancelled';
export type WorkflowTransitionRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export interface WorkspaceStatusVisibility {
  board: boolean;
  list: boolean;
  filters: boolean;
  create: boolean;
  cycleBoard: boolean;
  cycleList: boolean;
}

export interface WorkspaceStatusCycleConfig {
  allowedInCycle: boolean;
  countsAsCompleted: boolean;
  countsAsCarryOver: boolean;
  planIntoThisStatus: boolean;
}

export interface WorkspaceStatusTransitionConfig {
  mode: 'free' | 'restricted';
  to: string[];
  allowRollback: boolean;
  allowedRoles: WorkflowTransitionRole[];
  allowedUserIds: string[];
  assigneeOnly: boolean;
  creatorOnly: boolean;
}

export interface WorkspaceStatusRuleConfig {
  requireAssignee: boolean;
  requireDueDate: boolean;
  requireAllSubtasksComplete: boolean;
  requireAcceptanceCriteria: boolean;
  requireParentIssue: boolean;
  requireIntegrationRef: boolean;
}

export type WorkflowApprovalReviewerSource = 'project_members' | 'team_lead' | 'department_head' | 'manual';

export interface WorkspaceStatusApprovalConfig {
  required: boolean;
  requiredCount: number;
  reviewerSource: WorkflowApprovalReviewerSource;
  reviewerUserIds: string[];
}

export interface WorkspaceStatus {
  key: string;
  label: string;
  color: string;
  order: number;
  category: WorkspaceStatusCategory;
  isActive: boolean;
  isFinal: boolean;
  showOnBoard: boolean;
  visibility: WorkspaceStatusVisibility;
  cycle: WorkspaceStatusCycleConfig;
  transitions: WorkspaceStatusTransitionConfig;
  rules: WorkspaceStatusRuleConfig;
  approval: WorkspaceStatusApprovalConfig;
}

export interface WorkflowAutomationConfig {
  subtaskCompletion: {
    enabled: boolean;
    mode: 'suggest' | 'move';
    targetStatusKey: string | null;
  };
  cycleStart: {
    enabled: boolean;
    fromStatusKey: string | null;
    targetStatusKey: string | null;
  };
  overdue: {
    enabled: boolean;
    action: 'notify';
  };
  githubPullRequest: {
    opened: {
      enabled: boolean;
      targetStatusKey: string | null;
    };
    merged: {
      enabled: boolean;
      targetStatusKey: string | null;
    };
  };
}
export type UserRole = 'owner' | 'admin' | 'member' | 'guest';
export type IssueType = 'task' | 'bug' | 'issue';
export type Severity = 'low' | 'medium' | 'high';
export type IssueDependencyRelation = 'blocks' | 'blocked-by' | 'related';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  teamId?: string;
  departmentId?: string;
  lastActive?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface IssueSubtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface IssueDependency {
  issueId: string;
  relation: IssueDependencyRelation;
}

export interface IssueIntegrationRef {
  id: string;
  provider: 'github' | 'jira' | 'slack' | 'notion' | 'figma' | 'discord' | 'custom';
  label?: string;
  externalId?: string;
  url?: string;
}

export interface IssueAttachment {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  kind: 'attachment' | 'video';
  key: string;
  assetUrl?: string | null;
  reference: string;
}

export interface IssueUserSummary {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface IssueEntitySummary {
  id: string;
  name: string;
}

export interface IssueCycleSummary {
  id: string;
  name: string;
  status: 'UPCOMING' | 'CURRENT' | 'COMPLETED';
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

export interface IssueSubtaskStats {
  total: number;
  completed: number;
}

export interface IssueWatcher {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
}

export interface Issue {
  id: string;
  entityId?: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  type: IssueType;
  assigneeId?: string;
  creatorId: string;
  projectId: string;
  teamId: string;
  cycleId?: string | null;
  labels: string[];
  dueDate?: string;
  dueTime?: string;
  createdAt: string;
  updatedAt: string;
  subtasks: IssueSubtask[];
  estimate?: number;
  departmentId?: string;
  
  // Bug specific fields
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity?: Severity;
  
  // Issue (Feature) specific fields
  acceptanceCriteria?: string;
  relatedIssues?: string[];
  notes?: string;

  // Future system parameters
  parentIssueId?: string;
  parent?: IssueParentSummary | null;
  dependencies?: IssueDependency[];
  watcherIds?: string[];
  watchers?: IssueWatcher[];
  integrationRefs?: IssueIntegrationRef[];
  attachments?: IssueAttachment[];
  attachmentCount?: number;
  subtaskStats?: IssueSubtaskStats;
  creator?: IssueUserSummary;
  assignee?: IssueUserSummary | null;
  project?: IssueEntitySummary;
  team?: IssueEntitySummary;
  cycle?: IssueCycleSummary | null;
  department?: IssueDepartmentSummary | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  teamId: string;
  departmentId?: string;
  status: 'active' | 'archived' | 'completed';
  progress: number;
  issueCount: number;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  leadId: string;
  departmentId?: string;
  memberIds: string[];
  projectIds: string[];
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  color?: string;
  icon?: string;
  memberIds: string[];
  teamIds: string[];
  projectIds: string[];
  visibility: 'public' | 'private';
  isDefault: boolean;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface Notification {
  id: string;
  type: 'mention' | 'assignment' | 'update';
  userId: string;
  actorId: string;
  issueId?: string;
  description: string;
  timestamp: string;
  read: boolean;
}

export interface Activity {
  id: string;
  type: 'issue_created' | 'issue_completed' | 'comment_added' | 'member_joined';
  actorId: string;
  targetId: string;
  targetType: 'issue' | 'project' | 'team';
  description: string;
  timestamp: string;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  connected: boolean;
}

export interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  issueCount: number;
  progress: number;
  status: 'current' | 'upcoming' | 'completed';
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export type { Toast, ModalType } from '@shared/types/common';
