import type { AxiosRequestConfig } from 'axios';
import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';
import type {
  CreateDependencyInput,
  CreateMilestoneInput,
  DependencyActionInput,
  ListRoadmapInput,
  ProjectRoadmapDetailResponse,
  ReorderMilestonesInput,
  RoadmapDependency,
  RoadmapListResponse,
  RoadmapMilestone,
  RoadmapItem,
  UpdateMilestoneInput,
  UpdateProjectScheduleInput,
} from '../types';

const mutationConfig = {
  skipGlobalErrorToast: true,
} as AxiosRequestConfig & { skipGlobalErrorToast: boolean };

export const roadmapService = {
  list: async (params: ListRoadmapInput = {}): Promise<RoadmapListResponse> => {
    const { data } = await privateApi.get<ApiResponse<RoadmapListResponse>>('/roadmap', { params });
    return data.data;
  },

  getProjectDetail: async (projectId: string): Promise<ProjectRoadmapDetailResponse> => {
    const { data } = await privateApi.get<ApiResponse<ProjectRoadmapDetailResponse>>(`/roadmap/projects/${projectId}`);
    return data.data;
  },

  updateSchedule: async (projectId: string, input: UpdateProjectScheduleInput): Promise<RoadmapItem> => {
    const { data } = await privateApi.patch<ApiResponse<RoadmapItem>>(
      `/roadmap/projects/${projectId}/schedule`,
      input,
      mutationConfig
    );
    return data.data;
  },

  createMilestone: async (projectId: string, input: CreateMilestoneInput): Promise<RoadmapMilestone> => {
    const { data } = await privateApi.post<ApiResponse<RoadmapMilestone>>(
      `/roadmap/projects/${projectId}/milestones`,
      input,
      mutationConfig
    );
    return data.data;
  },

  updateMilestone: async (
    projectId: string,
    milestoneId: string,
    input: UpdateMilestoneInput
  ): Promise<RoadmapMilestone> => {
    const { data } = await privateApi.patch<ApiResponse<RoadmapMilestone>>(
      `/roadmap/projects/${projectId}/milestones/${milestoneId}`,
      input,
      mutationConfig
    );
    return data.data;
  },

  reorderMilestones: async (
    projectId: string,
    input: ReorderMilestonesInput
  ): Promise<{ orderedIds: string[] }> => {
    const { data } = await privateApi.patch<ApiResponse<{ orderedIds: string[] }>>(
      `/roadmap/projects/${projectId}/milestones/reorder`,
      input,
      mutationConfig
    );
    return data.data;
  },

  deleteMilestone: async (projectId: string, milestoneId: string): Promise<void> => {
    await privateApi.delete(`/roadmap/projects/${projectId}/milestones/${milestoneId}`, mutationConfig);
  },

  createDependency: async (input: CreateDependencyInput): Promise<RoadmapDependency> => {
    const { data } = await privateApi.post<ApiResponse<RoadmapDependency>>(
      '/roadmap/dependencies',
      input,
      mutationConfig
    );
    return data.data;
  },

  resolveDependency: async (
    dependencyId: string,
    input: DependencyActionInput = {}
  ): Promise<RoadmapDependency> => {
    const { data } = await privateApi.patch<ApiResponse<RoadmapDependency>>(
      `/roadmap/dependencies/${dependencyId}/resolve`,
      input,
      mutationConfig
    );
    return data.data;
  },

  cancelDependency: async (
    dependencyId: string,
    input: DependencyActionInput = {}
  ): Promise<RoadmapDependency> => {
    const { data } = await privateApi.patch<ApiResponse<RoadmapDependency>>(
      `/roadmap/dependencies/${dependencyId}/cancel`,
      input,
      mutationConfig
    );
    return data.data;
  },

  deleteDependency: async (dependencyId: string): Promise<void> => {
    await privateApi.delete(`/roadmap/dependencies/${dependencyId}`, mutationConfig);
  },
};
