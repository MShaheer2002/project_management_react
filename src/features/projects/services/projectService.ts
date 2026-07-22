import type { AxiosRequestConfig } from 'axios';
import { privateApi } from '@shared/services/privateApi';
import type { ApiPaginatedResponse, ApiResponse } from '@shared/services/types';
import type { WorkspaceStatusRemovalResolution } from '@features/workspace/services/workspaceService';
import type { WorkflowAutomationConfig, WorkspaceStatus } from '@/types';
import type {
  AddProjectMembersInput,
  CreateProjectInput,
  ListProjectMembersInput,
  ListProjectsInput,
  ProjectCompact,
  ProjectDetail,
  ProjectListResult,
  ProjectMemberOption,
  ProjectMemberRow,
  ProjectSummary,
  UpdateProjectInput,
} from '../types';

export interface ProjectWorkflow {
  source: 'workspace' | 'project';
  statuses: WorkspaceStatus[];
  automation: WorkflowAutomationConfig;
}

export interface ProjectWorkflowStatusUsage {
  statusKey: string;
  label: string;
  issueCount: number;
  truncated?: boolean;
  issues: Array<{ id: string; publicId: string; title: string }>;
}

export interface UpdateProjectWorkflowStatusesInput {
  statuses: WorkspaceStatus[];
  removalResolutions?: WorkspaceStatusRemovalResolution[];
}

export interface ClearProjectWorkflowOverrideInput {
  removalResolutions?: WorkspaceStatusRemovalResolution[];
}

const mutationConfig = {
  skipGlobalErrorToast: true,
} as AxiosRequestConfig & { skipGlobalErrorToast: boolean };

const toInputDate = (value: string | null): string | null => {
  if (!value) return null;
  return value.slice(0, 10);
};

const normalizeProject = <T extends ProjectSummary | ProjectDetail>(project: T): T => ({
  ...project,
  startDate: toInputDate(project.startDate),
  targetDate: toInputDate(project.targetDate),
});

export const projectService = {
  listDirectory: async (params: ListProjectsInput = {}): Promise<ProjectListResult<ProjectSummary>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<ProjectSummary>>('/projects', {
      params: {
        ...params,
        view: 'full',
      },
    });

    return {
      items: data.data.map(normalizeProject),
      meta: data.meta,
    };
  },

  listOptions: async (params: ListProjectsInput = {}): Promise<ProjectListResult<ProjectCompact>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<ProjectCompact>>('/projects', {
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

  getById: async (projectId: string): Promise<ProjectDetail> => {
    const { data } = await privateApi.get<ApiResponse<ProjectDetail>>(`/projects/${projectId}`);
    return normalizeProject(data.data);
  },

  create: async (input: CreateProjectInput): Promise<ProjectDetail> => {
    const { data } = await privateApi.post<ApiResponse<ProjectDetail>>('/projects', input, mutationConfig);
    return normalizeProject(data.data);
  },

  update: async (projectId: string, input: UpdateProjectInput): Promise<ProjectDetail> => {
    const { data } = await privateApi.patch<ApiResponse<ProjectDetail>>(
      `/projects/${projectId}`,
      input,
      mutationConfig
    );
    return normalizeProject(data.data);
  },

  delete: async (projectId: string): Promise<void> => {
    await privateApi.delete(`/projects/${projectId}`, mutationConfig);
  },

  listMembers: async (
    projectId: string,
    params: ListProjectMembersInput = {}
  ): Promise<ProjectListResult<ProjectMemberRow>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<ProjectMemberRow>>(
      `/projects/${projectId}/members`,
      {
        params: {
          ...params,
          view: 'full',
        },
      }
    );

    return {
      items: data.data,
      meta: data.meta,
    };
  },

  listMemberOptions: async (
    projectId: string,
    params: ListProjectMembersInput = {}
  ): Promise<ProjectListResult<ProjectMemberOption>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<ProjectMemberOption>>(
      `/projects/${projectId}/members`,
      {
        params: {
          ...params,
          view: 'compact',
        },
      }
    );

    return {
      items: data.data,
      meta: data.meta,
    };
  },

  addMembers: async (
    projectId: string,
    input: AddProjectMembersInput
  ): Promise<{ added: string[] }> => {
    const { data } = await privateApi.post<ApiResponse<{ added: string[] }>>(
      `/projects/${projectId}/members`,
      input,
      mutationConfig
    );
    return data.data;
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await privateApi.delete(`/projects/${projectId}/members/${userId}`, mutationConfig);
  },

  getWorkflow: async (projectId: string): Promise<ProjectWorkflow> => {
    const { data } = await privateApi.get<ApiResponse<ProjectWorkflow>>(`/projects/${projectId}/workflow`);
    return data.data;
  },

  getWorkflowStatusUsage: async (projectId: string, statusKey: string, limit?: number): Promise<ProjectWorkflowStatusUsage> => {
    const { data } = await privateApi.get<ApiResponse<ProjectWorkflowStatusUsage>>(
      `/projects/${projectId}/workflow/statuses/${statusKey}/usage`,
      { params: limit ? { limit } : undefined }
    );
    return data.data;
  },

  mergeWorkflowStatus: async (projectId: string, statusKey: string, targetStatusKey: string): Promise<ProjectWorkflow> => {
    const { data } = await privateApi.post<ApiResponse<ProjectWorkflow>>(
      `/projects/${projectId}/workflow/statuses/${statusKey}/merge`,
      { targetStatusKey },
      mutationConfig
    );
    return data.data;
  },

  updateWorkflowStatuses: async (
    projectId: string,
    input: UpdateProjectWorkflowStatusesInput
  ): Promise<ProjectWorkflow> => {
    const { data } = await privateApi.put<ApiResponse<ProjectWorkflow>>(
      `/projects/${projectId}/workflow/statuses`,
      input,
      mutationConfig
    );
    return data.data;
  },

  clearWorkflowOverride: async (
    projectId: string,
    input: ClearProjectWorkflowOverrideInput = {}
  ): Promise<ProjectWorkflow> => {
    const { data } = await privateApi.delete<ApiResponse<ProjectWorkflow>>(`/projects/${projectId}/workflow`, {
      ...mutationConfig,
      data: input,
    });
    return data.data;
  },

  updateWorkflowAutomation: async (
    projectId: string,
    input: WorkflowAutomationConfig
  ): Promise<ProjectWorkflow> => {
    const { data } = await privateApi.put<ApiResponse<ProjectWorkflow>>(
      `/projects/${projectId}/workflow/automation`,
      input,
      mutationConfig
    );
    return data.data;
  },
};
