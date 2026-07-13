import type { AxiosRequestConfig } from 'axios';
import { privateApi } from '@shared/services/privateApi';
import type { ApiPaginatedResponse, ApiResponse } from '@shared/services/types';
import type { Issue } from '@/types';
import type {
  CarryOverCycleInput,
  CompleteCycleInput,
  CreateCycleInput,
  CycleDetail,
  CycleListResult,
  CycleSummary,
  ListCycleIssuesInput,
  ListCyclesInput,
  PlanIssuesInput,
  UpdateCycleInput,
} from '../types';

const mutationConfig = {
  skipGlobalErrorToast: true,
} as AxiosRequestConfig & { skipGlobalErrorToast: boolean };

const normalizeListMeta = (meta: ApiPaginatedResponse['meta'] | undefined) => ({
  cursor: meta?.cursor ?? (meta as { nextCursor?: string | null } | undefined)?.nextCursor ?? null,
  hasMore: Boolean(meta?.hasMore),
  total: meta?.total,
});

export const cycleService = {
  list: async (params: ListCyclesInput = {}): Promise<CycleListResult<CycleSummary>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<CycleSummary>>('/cycles', { params });
    return { items: data.data, meta: normalizeListMeta(data.meta) };
  },

  current: async (teamId?: string): Promise<CycleDetail | null> => {
    const { data } = await privateApi.get<ApiResponse<CycleDetail | null>>('/cycles/current', {
      params: teamId ? { teamId } : undefined,
    });
    return data.data;
  },

  getById: async (cycleId: string): Promise<CycleDetail> => {
    const { data } = await privateApi.get<ApiResponse<CycleDetail>>(`/cycles/${cycleId}`);
    return data.data;
  },

  create: async (input: CreateCycleInput): Promise<CycleDetail> => {
    const { data } = await privateApi.post<ApiResponse<CycleDetail>>('/cycles', input, mutationConfig);
    return data.data;
  },

  update: async (cycleId: string, input: UpdateCycleInput): Promise<CycleDetail> => {
    const { data } = await privateApi.patch<ApiResponse<CycleDetail>>(`/cycles/${cycleId}`, input, mutationConfig);
    return data.data;
  },

  delete: async (cycleId: string): Promise<{ id: string; deleted: boolean; unassignedIssueCount?: number }> => {
    const { data } = await privateApi.delete<ApiResponse<{ id: string; deleted: boolean; unassignedIssueCount?: number }>>(
      `/cycles/${cycleId}`,
      mutationConfig
    );
    return data.data;
  },

  complete: async (cycleId: string, input: CompleteCycleInput) => {
    const { data } = await privateApi.post<ApiResponse<{ cycle: CycleDetail; movedIssueCount: number; keptIssueCount: number; unfinishedIssueCount: number }>>(
      `/cycles/${cycleId}/complete`,
      input,
      mutationConfig
    );
    return data.data;
  },

  reopen: async (cycleId: string): Promise<CycleDetail> => {
    const { data } = await privateApi.post<ApiResponse<CycleDetail>>(`/cycles/${cycleId}/reopen`, {}, mutationConfig);
    return data.data;
  },

  carryOver: async (cycleId: string, input: CarryOverCycleInput) => {
    const { data } = await privateApi.post<ApiResponse<{ movedIssueCount: number; targetCycleId: string | null; mode: 'nextCycle' | 'backlog' }>>(
      `/cycles/${cycleId}/carry-over`,
      input,
      mutationConfig
    );
    return data.data;
  },

  listIssues: async (cycleId: string, params: ListCycleIssuesInput = {}): Promise<CycleListResult<Issue>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<Issue>>(`/cycles/${cycleId}/issues`, { params });
    return { items: data.data, meta: normalizeListMeta(data.meta) };
  },

  planIssues: async (cycleId: string, input: PlanIssuesInput) => {
    const { data } = await privateApi.post<ApiResponse<{ added: Issue[]; skipped: Array<{ issueId: string; reason: string }> }>>(
      `/cycles/${cycleId}/issues`,
      input,
      mutationConfig
    );
    return data.data;
  },

  removeIssue: async (cycleId: string, issueId: string) => {
    const { data } = await privateApi.delete<ApiResponse<{ issueId: string; cycleId: string; removed: boolean }>>(
      `/cycles/${cycleId}/issues/${issueId}`,
      mutationConfig
    );
    return data.data;
  },

  assignIssue: async (issueId: string, cycleId: string) => {
    const { data } = await privateApi.post<ApiResponse<Issue>>(`/issues/${issueId}/cycle`, { cycleId }, mutationConfig);
    return data.data;
  },

  unassignIssue: async (issueId: string) => {
    const { data } = await privateApi.delete<ApiResponse<Issue>>(`/issues/${issueId}/cycle`, mutationConfig);
    return data.data;
  },
};
