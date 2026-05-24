import type { AxiosRequestConfig } from 'axios';
import { privateApi } from '@shared/services/privateApi';
import type { ApiPaginatedResponse, ApiResponse } from '@shared/services/types';
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

const mutationConfig = {
  skipGlobalErrorToast: true,
} as AxiosRequestConfig & { skipGlobalErrorToast: boolean };

export const projectService = {
  listDirectory: async (params: ListProjectsInput = {}): Promise<ProjectListResult<ProjectSummary>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<ProjectSummary>>('/projects', {
      params: {
        ...params,
        view: 'full',
      },
    });

    return {
      items: data.data,
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
    return data.data;
  },

  create: async (input: CreateProjectInput): Promise<ProjectDetail> => {
    const { data } = await privateApi.post<ApiResponse<ProjectDetail>>('/projects', input, mutationConfig);
    return data.data;
  },

  update: async (projectId: string, input: UpdateProjectInput): Promise<ProjectDetail> => {
    const { data } = await privateApi.patch<ApiResponse<ProjectDetail>>(
      `/projects/${projectId}`,
      input,
      mutationConfig
    );
    return data.data;
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
};
