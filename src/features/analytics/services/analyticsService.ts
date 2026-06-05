import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';
import type {
  WorkspaceAnalyticsData,
  ProjectAnalyticsData,
  TeamAnalyticsData,
  MemberAnalyticsData,
  CycleAnalyticsData,
  AnalyticsQueryParams,
  ExportScope,
  ExportFormat,
} from '../types';

export const analyticsService = {
  getWorkspaceAnalytics: async (params: AnalyticsQueryParams): Promise<WorkspaceAnalyticsData> => {
    const { data } = await privateApi.get<ApiResponse<WorkspaceAnalyticsData>>('/analytics/workspace', { params });
    return data.data;
  },

  getProjectAnalytics: async (projectId: string, params: AnalyticsQueryParams): Promise<ProjectAnalyticsData> => {
    const { data } = await privateApi.get<ApiResponse<ProjectAnalyticsData>>(`/analytics/projects/${projectId}`, { params });
    return data.data;
  },

  getTeamAnalytics: async (teamId: string, params: AnalyticsQueryParams): Promise<TeamAnalyticsData> => {
    const { data } = await privateApi.get<ApiResponse<TeamAnalyticsData>>(`/analytics/teams/${teamId}`, { params });
    return data.data;
  },

  getMemberAnalytics: async (memberId: string, params: AnalyticsQueryParams): Promise<MemberAnalyticsData> => {
    const { data } = await privateApi.get<ApiResponse<MemberAnalyticsData>>(`/analytics/members/${memberId}`, { params });
    return data.data;
  },

  getCycleAnalytics: async (cycleId: string, params: AnalyticsQueryParams): Promise<CycleAnalyticsData> => {
    const { data } = await privateApi.get<ApiResponse<CycleAnalyticsData>>(`/analytics/cycles/${cycleId}`, { params });
    return data.data;
  },

  exportAnalytics: async (scope: ExportScope, format: ExportFormat, params: AnalyticsQueryParams & { scopeId?: string }): Promise<Blob> => {
    const response = await privateApi.get('/analytics/export', {
      params: { scope, format, ...params },
      responseType: 'blob',
    });
    return response.data;
  },
};
