import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { projectQueryKeys } from '@features/projects';
import { roadmapService } from '../services/roadmapService';
import type {
  CreateDependencyInput,
  CreateMilestoneInput,
  DependencyActionInput,
  ListRoadmapInput,
  ReorderMilestonesInput,
  UpdateMilestoneInput,
  UpdateProjectScheduleInput,
} from '../types';

export const roadmapQueryKeys = {
  all: ['roadmap'] as const,
  workspace: (workspaceId: string | undefined) => [...roadmapQueryKeys.all, workspaceId] as const,
  list: (workspaceId: string | undefined, params: object) =>
    [...roadmapQueryKeys.workspace(workspaceId), 'list', params] as const,
  project: (workspaceId: string | undefined, projectId: string | undefined) =>
    [...roadmapQueryKeys.workspace(workspaceId), 'project', projectId] as const,
};

const invalidateRoadmapQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string | undefined,
  projectId?: string
) => {
  queryClient.invalidateQueries({ queryKey: roadmapQueryKeys.workspace(workspaceId) });
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.workspace(workspaceId) });
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: roadmapQueryKeys.project(workspaceId, projectId) });
    queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(workspaceId, projectId) });
  }
};

export const useRoadmapList = (params: ListRoadmapInput = {}, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useInfiniteQuery({
    queryKey: roadmapQueryKeys.list(workspaceId, params),
    queryFn: ({ pageParam }) =>
      roadmapService.list({
        ...params,
        cursor: (pageParam as string | undefined) ?? undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useProjectRoadmapDetail = (projectId: string | undefined, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useQuery({
    queryKey: roadmapQueryKeys.project(workspaceId, projectId),
    queryFn: () => roadmapService.getProjectDetail(projectId!),
    enabled: Boolean(workspaceId && projectId) && (options?.enabled ?? true),
  });
};

export const useUpdateProjectSchedule = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: (input: UpdateProjectScheduleInput) => roadmapService.updateSchedule(projectId!, input),
    onSuccess: () => invalidateRoadmapQueries(queryClient, workspaceId, projectId),
  });
};

export const useCreateMilestone = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateMilestoneInput) => roadmapService.createMilestone(projectId!, input),
    onSuccess: () => invalidateRoadmapQueries(queryClient, workspaceId, projectId),
  });
};

export const useUpdateMilestone = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: ({ milestoneId, input }: { milestoneId: string; input: UpdateMilestoneInput }) =>
      roadmapService.updateMilestone(projectId!, milestoneId, input),
    onSuccess: () => invalidateRoadmapQueries(queryClient, workspaceId, projectId),
  });
};

export const useReorderMilestones = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: (input: ReorderMilestonesInput) => roadmapService.reorderMilestones(projectId!, input),
    onSuccess: () => invalidateRoadmapQueries(queryClient, workspaceId, projectId),
  });
};

export const useDeleteMilestone = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: (milestoneId: string) => roadmapService.deleteMilestone(projectId!, milestoneId),
    onSuccess: () => invalidateRoadmapQueries(queryClient, workspaceId, projectId),
  });
};

export const useCreateDependency = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateDependencyInput) => roadmapService.createDependency(input),
    onSuccess: () => invalidateRoadmapQueries(queryClient, workspaceId, projectId),
  });
};

export const useResolveDependency = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: ({ dependencyId, input }: { dependencyId: string; input?: DependencyActionInput }) =>
      roadmapService.resolveDependency(dependencyId, input),
    onSuccess: () => invalidateRoadmapQueries(queryClient, workspaceId, projectId),
  });
};

export const useCancelDependency = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: ({ dependencyId, input }: { dependencyId: string; input?: DependencyActionInput }) =>
      roadmapService.cancelDependency(dependencyId, input),
    onSuccess: () => invalidateRoadmapQueries(queryClient, workspaceId, projectId),
  });
};

export const useDeleteDependency = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: (dependencyId: string) => roadmapService.deleteDependency(dependencyId),
    onSuccess: () => invalidateRoadmapQueries(queryClient, workspaceId, projectId),
  });
};
