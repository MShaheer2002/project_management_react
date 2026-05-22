import type { AxiosRequestConfig } from 'axios';
import { privateApi } from '@shared/services/privateApi';
import type { ApiPaginatedResponse, ApiResponse } from '@shared/services/types';
import type {
  AddTeamMembersInput,
  CreateTeamInput,
  ListTeamMembersInput,
  ListTeamsInput,
  TeamCompact,
  TeamDetail,
  TeamListResult,
  TeamMemberOption,
  TeamMemberRow,
  TeamSummary,
  UpdateTeamInput,
} from '../types';

const mutationConfig = {
  skipGlobalErrorToast: true,
} as AxiosRequestConfig & { skipGlobalErrorToast: boolean };

export const teamService = {
  listDirectory: async (params: ListTeamsInput = {}): Promise<TeamListResult<TeamSummary>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<TeamSummary>>('/teams', {
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

  listOptions: async (params: ListTeamsInput = {}): Promise<TeamListResult<TeamCompact>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<TeamCompact>>('/teams', {
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

  getById: async (teamId: string): Promise<TeamDetail> => {
    const { data } = await privateApi.get<ApiResponse<TeamDetail>>(`/teams/${teamId}`);
    return data.data;
  },

  create: async (input: CreateTeamInput): Promise<TeamDetail> => {
    const { data } = await privateApi.post<ApiResponse<TeamDetail>>('/teams', input, mutationConfig);
    return data.data;
  },

  update: async (teamId: string, input: UpdateTeamInput): Promise<TeamDetail> => {
    const { data } = await privateApi.patch<ApiResponse<TeamDetail>>(`/teams/${teamId}`, input, mutationConfig);
    return data.data;
  },

  delete: async (teamId: string): Promise<void> => {
    await privateApi.delete(`/teams/${teamId}`, mutationConfig);
  },

  listMembers: async (
    teamId: string,
    params: ListTeamMembersInput = {}
  ): Promise<TeamListResult<TeamMemberRow>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<TeamMemberRow>>(`/teams/${teamId}/members`, {
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

  listMemberOptions: async (
    teamId: string,
    params: ListTeamMembersInput = {}
  ): Promise<TeamListResult<TeamMemberOption>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<TeamMemberOption>>(`/teams/${teamId}/members`, {
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

  addMembers: async (teamId: string, input: AddTeamMembersInput): Promise<{ added: string[] }> => {
    const { data } = await privateApi.post<ApiResponse<{ added: string[] }>>(
      `/teams/${teamId}/members`,
      input,
      mutationConfig
    );
    return data.data;
  },

  removeMember: async (teamId: string, userId: string): Promise<void> => {
    await privateApi.delete(`/teams/${teamId}/members/${userId}`, mutationConfig);
  },
};
