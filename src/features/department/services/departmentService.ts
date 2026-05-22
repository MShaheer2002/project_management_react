import type { AxiosRequestConfig } from 'axios';
import { privateApi } from '@shared/services/privateApi';
import type { ApiPaginatedResponse, ApiResponse } from '@shared/services/types';
import type {
  AddDepartmentMembersInput,
  CreateDepartmentInput,
  DepartmentCompact,
  DepartmentDetail,
  DepartmentListResult,
  DepartmentMemberOption,
  DepartmentMemberRow,
  DepartmentSummary,
  ListDepartmentMembersInput,
  ListDepartmentsInput,
  UpdateDepartmentInput,
} from '../types';

const mutationConfig = {
  skipGlobalErrorToast: true,
} as AxiosRequestConfig & { skipGlobalErrorToast: boolean };

export const departmentService = {
  listDirectory: async (params: ListDepartmentsInput = {}): Promise<DepartmentListResult<DepartmentSummary>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<DepartmentSummary>>('/departments', {
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

  listOptions: async (params: ListDepartmentsInput = {}): Promise<DepartmentListResult<DepartmentCompact>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<DepartmentCompact>>('/departments', {
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

  getById: async (departmentId: string): Promise<DepartmentDetail> => {
    const { data } = await privateApi.get<ApiResponse<DepartmentDetail>>(`/departments/${departmentId}`);
    return data.data;
  },

  create: async (input: CreateDepartmentInput): Promise<DepartmentDetail> => {
    const { data } = await privateApi.post<ApiResponse<DepartmentDetail>>(
      '/departments',
      input,
      mutationConfig
    );
    return data.data;
  },

  update: async (departmentId: string, input: UpdateDepartmentInput): Promise<DepartmentDetail> => {
    const { data } = await privateApi.patch<ApiResponse<DepartmentDetail>>(
      `/departments/${departmentId}`,
      input,
      mutationConfig
    );
    return data.data;
  },

  delete: async (departmentId: string): Promise<void> => {
    await privateApi.delete(`/departments/${departmentId}`, mutationConfig);
  },

  listMembers: async (
    departmentId: string,
    params: ListDepartmentMembersInput = {}
  ): Promise<DepartmentListResult<DepartmentMemberRow>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<DepartmentMemberRow>>(
      `/departments/${departmentId}/members`,
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
    departmentId: string,
    params: ListDepartmentMembersInput = {}
  ): Promise<DepartmentListResult<DepartmentMemberOption>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<DepartmentMemberOption>>(
      `/departments/${departmentId}/members`,
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
    departmentId: string,
    input: AddDepartmentMembersInput
  ): Promise<{ added: string[] }> => {
    const { data } = await privateApi.post<ApiResponse<{ added: string[] }>>(
      `/departments/${departmentId}/members`,
      input,
      mutationConfig
    );
    return data.data;
  },

  removeMember: async (departmentId: string, userId: string): Promise<void> => {
    await privateApi.delete(`/departments/${departmentId}/members/${userId}`, mutationConfig);
  },
};
