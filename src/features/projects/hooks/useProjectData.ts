import { useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { departmentQueryKeys } from '@features/department';
import { teamQueryKeys } from '@features/team';
import { workspaceQueryKeys } from '@features/workspace';
import { projectService } from '../services/projectService';
import type {
  ClearProjectWorkflowOverrideInput,
  ProjectWorkflow,
  UpdateProjectWorkflowStatusesInput,
} from '../services/projectService';
import type { WorkflowAutomationConfig } from '@/types';
import type {
  AddProjectMembersInput,
  CreateProjectInput,
  ListProjectMembersInput,
  ListProjectsInput,
  UpdateProjectInput,
} from '../types';

export const projectQueryKeys = {
  all: ['projects'] as const,
  workspace: (workspaceId: string | undefined) => [...projectQueryKeys.all, workspaceId] as const,
  directory: (workspaceId: string | undefined, params: object) =>
    [...projectQueryKeys.workspace(workspaceId), 'directory', params] as const,
  options: (workspaceId: string | undefined, params: object) =>
    [...projectQueryKeys.workspace(workspaceId), 'options', params] as const,
  detail: (workspaceId: string | undefined, projectId: string | undefined) =>
    [...projectQueryKeys.workspace(workspaceId), 'detail', projectId] as const,
  members: (workspaceId: string | undefined, projectId: string | undefined, params: object) =>
    [...projectQueryKeys.detail(workspaceId, projectId), 'members', params] as const,
  workflow: (workspaceId: string | undefined, projectId: string | undefined) =>
    [...projectQueryKeys.detail(workspaceId, projectId), 'workflow'] as const,
};

export const useProjectsDirectory = (params: ListProjectsInput = {}, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: projectQueryKeys.directory(workspaceId, params),
    queryFn: ({ pageParam }) =>
      projectService.listDirectory({
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useProjectOptions = (params: ListProjectsInput = {}, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: projectQueryKeys.options(workspaceId, params),
    queryFn: ({ pageParam }) =>
      projectService.listOptions({
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useProjectDetail = (projectId: string | undefined) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: projectQueryKeys.detail(workspaceId, projectId),
    queryFn: () => projectService.getById(projectId!),
    enabled: Boolean(workspaceId && projectId),
  });
};

export const useProjectMembers = (
  projectId: string | undefined,
  params: ListProjectMembersInput = {},
  options?: { enabled?: boolean }
) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: projectQueryKeys.members(workspaceId, projectId, params),
    queryFn: ({ pageParam }) =>
      projectService.listMembers(projectId!, {
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId && projectId) && (options?.enabled ?? true),
  });
};

const invalidateProjectRelatedQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string | undefined,
  projectId?: string
) => {
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.workspace(workspaceId) });
  queryClient.invalidateQueries({ queryKey: teamQueryKeys.workspace(workspaceId) });
  queryClient.invalidateQueries({ queryKey: departmentQueryKeys.workspace(workspaceId) });
  queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });

  if (projectId) {
    queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(workspaceId, projectId) });
  }
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectService.create(input),
    onSuccess: (project) => {
      invalidateProjectRelatedQueries(queryClient, workspaceId, project.id);
    },
  });
};

export const useUpdateProject = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: UpdateProjectInput) => projectService.update(projectId!, input),
    onSuccess: () => {
      invalidateProjectRelatedQueries(queryClient, workspaceId, projectId);
    },
  });
};

export const useDeleteProject = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: () => projectService.delete(projectId!),
    onSuccess: () => {
      invalidateProjectRelatedQueries(queryClient, workspaceId, projectId);
    },
  });
};

export const useAddProjectMembers = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: AddProjectMembersInput) => projectService.addMembers(projectId!, input),
    onSuccess: () => {
      invalidateProjectRelatedQueries(queryClient, workspaceId, projectId);
    },
  });
};

export const useRemoveProjectMember = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (userId: string) => projectService.removeMember(projectId!, userId),
    onSuccess: () => {
      invalidateProjectRelatedQueries(queryClient, workspaceId, projectId);
    },
  });
};

export const useProjectWorkflow = (projectId: string | undefined) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: projectQueryKeys.workflow(workspaceId, projectId),
    queryFn: () => projectService.getWorkflow(projectId!),
    enabled: Boolean(workspaceId && projectId),
  });
};

/**
 * Resolves the effective workflow for every distinct project id passed in, in
 * parallel. Used by cross-project views (All Issues) where issues can belong to
 * several different projects, each potentially on its own workflow — the caller
 * is expected to pass only the project ids actually in view (e.g. derived from
 * the currently-loaded issues), which are already access-scoped since the issue
 * list itself only returns issues from projects the user can see.
 */
export const useProjectWorkflows = (projectIds: string[]) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const uniqueProjectIds = useMemo(() => [...new Set(projectIds)], [projectIds]);

  const results = useQueries({
    queries: uniqueProjectIds.map((projectId) => ({
      queryKey: projectQueryKeys.workflow(workspaceId, projectId),
      queryFn: () => projectService.getWorkflow(projectId),
      enabled: Boolean(workspaceId),
    })),
  });

  return useMemo(() => {
    const map = new Map<string, ProjectWorkflow>();
    uniqueProjectIds.forEach((projectId, index) => {
      const data = results[index]?.data;
      if (data) map.set(projectId, data);
    });
    return map;
  }, [uniqueProjectIds, results]);
};

const invalidateProjectWorkflowQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string | undefined,
  projectId: string | undefined
) => {
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.workflow(workspaceId, projectId) });
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(workspaceId, projectId) });
};

export const useUpdateProjectWorkflowStatuses = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: UpdateProjectWorkflowStatusesInput) => projectService.updateWorkflowStatuses(projectId!, input),
    onSuccess: () => {
      invalidateProjectWorkflowQueries(queryClient, workspaceId, projectId);
    },
  });
};

export const useMergeProjectWorkflowStatus = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ sourceKey, targetStatusKey }: { sourceKey: string; targetStatusKey: string }) =>
      projectService.mergeWorkflowStatus(projectId!, sourceKey, targetStatusKey),
    onSuccess: () => {
      invalidateProjectWorkflowQueries(queryClient, workspaceId, projectId);
    },
  });
};

export const useClearProjectWorkflowOverride = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: ClearProjectWorkflowOverrideInput = {}) => projectService.clearWorkflowOverride(projectId!, input),
    onSuccess: () => {
      invalidateProjectWorkflowQueries(queryClient, workspaceId, projectId);
    },
  });
};

export const useUpdateProjectWorkflowAutomation = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: WorkflowAutomationConfig) => projectService.updateWorkflowAutomation(projectId!, input),
    onSuccess: () => {
      invalidateProjectWorkflowQueries(queryClient, workspaceId, projectId);
    },
  });
};
