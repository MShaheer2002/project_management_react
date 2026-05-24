import type { AxiosRequestConfig } from 'axios';
import { privateApi } from '@shared/services/privateApi';
import type { ApiPaginatedResponse, ApiResponse } from '@shared/services/types';
import type { IssueAttachment, IssueDependency, IssueIntegrationRef, IssueSubtask } from '@/types';
import type {
  AddIssueAttachmentsInput,
  AddIssueDependencyInput,
  AddIssueWatchersInput,
  CreateIssueInput,
  CreateIssueSubtaskInput,
  IssueCompactOption,
  IssueDependencyRow,
  IssueDetail,
  IssueListResult,
  IssueSummary,
  IssueWatcherRow,
  ListIssuesInput,
  ReorderIssueSubtasksInput,
  UpdateIssueInput,
  UpdateIssueIntegrationRefsInput,
  UpdateIssueSubtaskInput,
} from '../types';

const mutationConfig = {
  skipGlobalErrorToast: true,
} as AxiosRequestConfig & { skipGlobalErrorToast: boolean };

type RawIssueUserSummary = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
};

type RawIssueProjectSummary = {
  id: string;
  name: string;
};

type RawIssueTeamSummary = {
  id: string;
  name: string;
};

type RawIssueDepartmentSummary = {
  id: string;
  name: string;
  color?: string | null;
};

type RawIssueParentSummary = {
  id: string;
  title: string;
  status: IssueDetail['status'];
  projectId: string;
};

type RawIssueSubtask = {
  id: string;
  title: string;
  completed: boolean;
  order: number;
};

type RawIssueAttachment = {
  id?: string;
  fileName: string;
  contentType: string;
  size: number;
  kind: IssueAttachment['kind'];
  key: string;
  assetUrl?: string | null;
  reference?: string;
};

type RawIssueDependency = {
  issueId?: string;
  relatedId?: string;
  id?: string;
  title: string;
  status: IssueDetail['status'];
  relation: IssueDependency['relation'];
};

type RawIssueIntegrationRef = {
  id: string;
  provider: IssueIntegrationRef['provider'];
  label?: string | null;
  externalId?: string | null;
  url?: string | null;
};

type RawIssueSummary = {
  id: string;
  entityId?: string;
  title: string;
  description?: string | null;
  type: IssueSummary['type'];
  status: IssueSummary['status'];
  priority: IssueSummary['priority'];
  labels?: string[];
  dueDate?: string | null;
  dueTime?: string | null;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  assigneeId?: string | null;
  projectId: string;
  teamId: string;
  departmentId?: string | null;
  creator?: RawIssueUserSummary;
  assignee?: RawIssueUserSummary | null;
  project?: RawIssueProjectSummary;
  team?: RawIssueTeamSummary;
  department?: RawIssueDepartmentSummary | null;
  subtaskStats?: {
    total: number;
    completed: number;
  };
  attachmentCount?: number;
  estimate?: number | null;
  stepsToReproduce?: string | null;
  expectedBehavior?: string | null;
  actualBehavior?: string | null;
  severity?: IssueDetail['severity'] | null;
  acceptanceCriteria?: string | null;
  relatedIssueKeys?: string[];
  notes?: string | null;
};

type RawIssueDetail = RawIssueSummary & {
  subtasks?: RawIssueSubtask[];
  attachments?: RawIssueAttachment[];
  parent?: RawIssueParentSummary | null;
  parentIssueId?: string | null;
  dependencies?: RawIssueDependency[];
  watchers?: IssueWatcherRow[];
  integrationRefs?: RawIssueIntegrationRef[];
};

const normalizeSubtask = (subtask: RawIssueSubtask): IssueSubtask => ({
  id: subtask.id,
  title: subtask.title,
  completed: subtask.completed,
  order: subtask.order,
});

const normalizeAttachment = (attachment: RawIssueAttachment): IssueAttachment => ({
  id: attachment.id ?? attachment.reference ?? attachment.key,
  fileName: attachment.fileName,
  contentType: attachment.contentType,
  size: attachment.size,
  kind: attachment.kind,
  key: attachment.key,
  assetUrl: attachment.assetUrl ?? null,
  reference: attachment.reference ?? attachment.assetUrl ?? attachment.key,
});

const normalizeDependency = (dependency: RawIssueDependency): IssueDependencyRow => ({
  issueId: dependency.issueId ?? dependency.relatedId ?? dependency.id ?? '',
  title: dependency.title,
  status: dependency.status,
  relation: dependency.relation,
});

const normalizeIssueSummary = (issue: RawIssueSummary): IssueSummary => ({
  id: issue.id,
  entityId: issue.entityId,
  title: issue.title,
  description: issue.description ?? '',
  type: issue.type,
  status: issue.status,
  priority: issue.priority,
  labels: issue.labels ?? [],
  dueDate: issue.dueDate ?? undefined,
  dueTime: issue.dueTime ?? undefined,
  createdAt: issue.createdAt,
  updatedAt: issue.updatedAt,
  subtasks: [],
  creatorId: issue.creatorId,
  assigneeId: issue.assigneeId ?? undefined,
  projectId: issue.projectId,
  teamId: issue.teamId,
  departmentId: issue.departmentId ?? issue.department?.id ?? undefined,
  creator: issue.creator
    ? {
        id: issue.creator.id,
        name: issue.creator.name,
        email: issue.creator.email,
        avatar: issue.creator.avatar ?? null,
      }
    : undefined,
  assignee: issue.assignee
    ? {
        id: issue.assignee.id,
        name: issue.assignee.name,
        email: issue.assignee.email,
        avatar: issue.assignee.avatar ?? null,
      }
    : null,
  project: issue.project
    ? {
        id: issue.project.id,
        name: issue.project.name,
      }
    : undefined,
  team: issue.team
    ? {
        id: issue.team.id,
        name: issue.team.name,
      }
    : undefined,
  department: issue.department
    ? {
        id: issue.department.id,
        name: issue.department.name,
        color: issue.department.color ?? null,
      }
    : null,
  subtaskStats: issue.subtaskStats,
  attachmentCount: issue.attachmentCount,
  estimate: issue.estimate ?? undefined,
  stepsToReproduce: issue.stepsToReproduce ?? undefined,
  expectedBehavior: issue.expectedBehavior ?? undefined,
  actualBehavior: issue.actualBehavior ?? undefined,
  severity: issue.severity ?? undefined,
  acceptanceCriteria: issue.acceptanceCriteria ?? undefined,
  relatedIssues: issue.relatedIssueKeys,
  notes: issue.notes ?? undefined,
});

const normalizeIssueDetail = (issue: RawIssueDetail): IssueDetail => ({
  ...normalizeIssueSummary(issue),
  subtasks: (issue.subtasks ?? []).map(normalizeSubtask),
  attachments: (issue.attachments ?? []).map(normalizeAttachment),
  parentIssueId: issue.parent?.id ?? issue.parentIssueId ?? undefined,
  parent: issue.parent
    ? {
        id: issue.parent.id,
        title: issue.parent.title,
        status: issue.parent.status,
        projectId: issue.parent.projectId,
      }
    : null,
  dependencies: (issue.dependencies ?? []).map(normalizeDependency),
  watchers: issue.watchers ?? [],
  integrationRefs: (issue.integrationRefs ?? []).map((ref) => ({
    id: ref.id,
    provider: ref.provider,
    label: ref.label ?? undefined,
    externalId: ref.externalId ?? undefined,
    url: ref.url ?? undefined,
  })),
});

export const issueService = {
  listDirectory: async (params: ListIssuesInput = {}): Promise<IssueListResult<IssueSummary>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<RawIssueSummary>>('/issues', {
      params: {
        ...params,
        view: 'full',
      },
    });

    return {
      items: data.data.map(normalizeIssueSummary),
      meta: data.meta,
    };
  },

  listOptions: async (params: ListIssuesInput = {}): Promise<IssueListResult<IssueCompactOption>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<IssueCompactOption>>('/issues', {
      params: {
        ...params,
        view: 'compact',
      },
    });

    return {
      items: data.data,
      meta: data.meta,
    };
  },

  getById: async (issueId: string): Promise<IssueDetail> => {
    const { data } = await privateApi.get<ApiResponse<RawIssueDetail>>(`/issues/${issueId}`);
    return normalizeIssueDetail(data.data);
  },

  create: async (input: CreateIssueInput): Promise<IssueDetail> => {
    const { data } = await privateApi.post<ApiResponse<RawIssueDetail>>('/issues', input, mutationConfig);
    return normalizeIssueDetail(data.data);
  },

  update: async (issueId: string, input: UpdateIssueInput): Promise<IssueDetail> => {
    const { data } = await privateApi.patch<ApiResponse<RawIssueDetail>>(
      `/issues/${issueId}`,
      input,
      mutationConfig
    );
    return normalizeIssueDetail(data.data);
  },

  delete: async (issueId: string): Promise<void> => {
    await privateApi.delete(`/issues/${issueId}`, mutationConfig);
  },

  updateStatus: async (issueId: string, status: IssueDetail['status']): Promise<IssueDetail> => {
    const { data } = await privateApi.patch<ApiResponse<RawIssueDetail>>(
      `/issues/${issueId}/status`,
      { status },
      mutationConfig
    );
    return normalizeIssueDetail(data.data);
  },

  createSubtask: async (issueId: string, input: CreateIssueSubtaskInput): Promise<IssueSubtask> => {
    const { data } = await privateApi.post<ApiResponse<RawIssueSubtask>>(
      `/issues/${issueId}/subtasks`,
      input,
      mutationConfig
    );
    return normalizeSubtask(data.data);
  },

  updateSubtask: async (
    issueId: string,
    subtaskId: string,
    input: UpdateIssueSubtaskInput
  ): Promise<IssueSubtask> => {
    const { data } = await privateApi.patch<ApiResponse<RawIssueSubtask>>(
      `/issues/${issueId}/subtasks/${subtaskId}`,
      input,
      mutationConfig
    );
    return normalizeSubtask(data.data);
  },

  deleteSubtask: async (issueId: string, subtaskId: string): Promise<void> => {
    await privateApi.delete(`/issues/${issueId}/subtasks/${subtaskId}`, mutationConfig);
  },

  reorderSubtasks: async (issueId: string, input: ReorderIssueSubtasksInput): Promise<void> => {
    await privateApi.patch(`/issues/${issueId}/subtasks/reorder`, input, mutationConfig);
  },

  addAttachments: async (issueId: string, input: AddIssueAttachmentsInput): Promise<IssueAttachment[]> => {
    const { data } = await privateApi.post<ApiResponse<RawIssueAttachment[]>>(
      `/issues/${issueId}/attachments`,
      input,
      mutationConfig
    );
    return data.data.map(normalizeAttachment);
  },

  removeAttachment: async (issueId: string, attachmentId: string): Promise<void> => {
    await privateApi.delete(`/issues/${issueId}/attachments/${attachmentId}`, mutationConfig);
  },

  listWatchers: async (issueId: string): Promise<IssueWatcherRow[]> => {
    const { data } = await privateApi.get<ApiResponse<IssueWatcherRow[]>>(`/issues/${issueId}/watchers`);
    return data.data;
  },

  addWatchers: async (issueId: string, input: AddIssueWatchersInput): Promise<void> => {
    await privateApi.post(`/issues/${issueId}/watchers`, input, mutationConfig);
  },

  removeWatcher: async (issueId: string, userId: string): Promise<void> => {
    await privateApi.delete(`/issues/${issueId}/watchers/${userId}`, mutationConfig);
  },

  addDependency: async (issueId: string, input: AddIssueDependencyInput): Promise<void> => {
    await privateApi.post(`/issues/${issueId}/dependencies`, input, mutationConfig);
  },

  removeDependency: async (issueId: string, relatedId: string): Promise<void> => {
    await privateApi.delete(`/issues/${issueId}/dependencies/${relatedId}`, mutationConfig);
  },

  updateIntegrationRefs: async (
    issueId: string,
    input: UpdateIssueIntegrationRefsInput
  ): Promise<IssueIntegrationRef[]> => {
    const { data } = await privateApi.patch<ApiResponse<IssueIntegrationRef[]>>(
      `/issues/${issueId}/integration-ref`,
      input,
      mutationConfig
    );
    return data.data;
  },
};
