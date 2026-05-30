import type { IssueType, Priority, Severity, Status } from '@/types';

export type TemplateCategory =
  | 'Bug'
  | 'Feature'
  | 'Task'
  | 'QA'
  | 'Research'
  | 'Security'
  | 'Release'
  | 'Onboarding';

export type TemplateCategoryMode = TemplateCategory | 'Custom';

export type TemplateAssigneeType = 'UNASSIGNED' | 'CREATOR' | 'SPECIFIC_USER';
export type TemplateScopeType = 'WORKSPACE' | 'TEAM' | 'PROJECT';
export type TemplateSort = 'updatedAt:desc' | 'updatedAt:asc' | 'usageCount:desc' | 'usageCount:asc' | 'name:asc';

export interface TemplateCreator {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface TemplateDefaultsResponse {
  categoryOptions: string[];
  priorityOptions: string[];
  statusOptions: string[];
  labelOptions: string[];
}

export interface TemplateScope {
  scopeType: TemplateScopeType;
  scopeId: string | null;
}

export type TemplateLifecycle = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface TemplateActivationConflictDetails {
  issueType: IssueType;
  activeTemplate: {
    id: string;
    name: string;
  };
  candidateTemplate: {
    id: string;
    name: string;
  };
  requiresConfirmation: true;
  message?: string;
}

export interface TemplateDefaultConflictDetails {
  issueType: IssueType;
  currentDefault: {
    id: string;
    name: string;
  };
  candidateTemplate: {
    id: string;
    name: string;
  };
  scopeType: 'WORKSPACE';
  requiresConfirmation: true;
  message?: string;
}

export interface IssueTemplate {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  category: TemplateCategoryMode;
  customCategory?: string | null;
  categoryOptions: string[];
  issueType: IssueType;
  scopeType: TemplateScopeType;
  scopeId: string | null;
  isDefault: boolean;
  titleTemplate: string;
  contentTemplate: string;
  defaultPriority: Priority;
  priorityOptions: string[];
  defaultStatus: Status;
  customStatus?: string | null;
  statusOptions: string[];
  defaultAssigneeType: TemplateAssigneeType;
  defaultAssigneeId?: string | null;
  defaultEstimate?: number | null;
  defaultDueDateOffset?: number | null;
  defaultLabelIds: string[];
  labelOptions: string[];
  checklistItems: string[];
  defaultSeverity?: Severity | null;
  stepsToReproduceTemplate?: string | null;
  expectedBehaviorTemplate?: string | null;
  actualBehaviorTemplate?: string | null;
  acceptanceCriteriaTemplate?: string | null;
  relatedIssueKeysTemplate?: string | null;
  notesTemplate?: string | null;
  lifecycle?: TemplateLifecycle;
  isActive?: boolean;
  appliedByCurrentUser?: boolean;
  appliedAt?: string | null;
  appliedDraft?: TemplateApplyDraft | null;
  activeVersion?: number;
  usageCount: number;
  timesApplied: number;
  lastAppliedAt?: string | null;
  createdBy: TemplateCreator;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface TemplateListInput {
  q?: string;
  category?: TemplateCategoryMode | 'all';
  issueType?: IssueType | 'all';
  scopeType?: TemplateScopeType | 'all';
  scopeId?: string;
  creatorId?: string | 'all';
  sort?: TemplateSort;
  lifecycle?: TemplateLifecycle | 'all';
  isActive?: boolean | 'all';
  cursor?: string;
  limit?: number;
}

export interface TemplateDraftInput {
  name: string;
  description: string;
  category: TemplateCategoryMode;
  customCategory?: string | null;
  categoryOptions: string[];
  issueType: IssueType;
  scopeType: TemplateScopeType;
  scopeId?: string | null;
  isDefault?: boolean;
  titleTemplate: string;
  contentTemplate: string;
  defaultPriority: Priority;
  priorityOptions: string[];
  defaultStatus: Status;
  customStatus?: string | null;
  statusOptions: string[];
  defaultAssigneeType: TemplateAssigneeType;
  defaultAssigneeId?: string | null;
  defaultEstimate?: number | null;
  defaultDueDateOffset?: number | null;
  defaultLabelIds: string[];
  labelOptions: string[];
  checklistItems: string[];
  defaultSeverity?: Severity | null;
  stepsToReproduceTemplate?: string | null;
  expectedBehaviorTemplate?: string | null;
  actualBehaviorTemplate?: string | null;
  acceptanceCriteriaTemplate?: string | null;
  relatedIssueKeysTemplate?: string | null;
  notesTemplate?: string | null;
  lifecycle?: TemplateLifecycle;
  isActive?: boolean;
  activeVersion?: number;
}

export interface TemplateApplyDraft {
  templateId: string;
  title: string;
  description: string;
  issueType: IssueType;
  scopeType: TemplateScopeType;
  scopeId: string | null;
  isDefault: boolean;
  priority: Priority;
  status: Status;
  customStatus?: string | null;
  assigneeType: TemplateAssigneeType;
  assigneeId?: string | null;
  estimate?: number | null;
  dueDateOffset?: number | null;
  labels: string[];
  subtasks: string[];
  severity?: Severity | null;
  stepsToReproduce?: string | null;
  expectedBehavior?: string | null;
  actualBehavior?: string | null;
  acceptanceCriteria?: string | null;
  relatedIssueKeys?: string | null;
  notes?: string | null;
  appliedByCurrentUser?: boolean;
  appliedAt?: string | null;
}

export interface TemplateActivationResult {
  id: string;
  isActive: boolean;
  lifecycle: TemplateLifecycle;
  activeVersion: number;
  updatedAt: string;
}
