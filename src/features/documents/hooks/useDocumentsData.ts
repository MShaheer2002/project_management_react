import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { projectQueryKeys } from '@features/projects';
import { teamQueryKeys } from '@features/team';
import { workspaceQueryKeys } from '@features/workspace';
import type { CreateDocumentInput } from '@shared/types/documents';
import { documentsService } from '../services/documentsService';
import type { ListDocumentsInput, UpdateDocumentInput } from '../types';

export const documentsQueryKeys = {
  all: ['documents'] as const,
  workspace: (workspaceId: string | undefined) => [...documentsQueryKeys.all, 'workspace', workspaceId] as const,
  workspaceList: (workspaceId: string | undefined, params: object) =>
    [...documentsQueryKeys.workspace(workspaceId), 'list', params] as const,
  team: (workspaceId: string | undefined, teamId: string | undefined) =>
    [...documentsQueryKeys.all, 'team', workspaceId, teamId] as const,
  teamList: (workspaceId: string | undefined, teamId: string | undefined, params: object) =>
    [...documentsQueryKeys.team(workspaceId, teamId), 'list', params] as const,
  project: (workspaceId: string | undefined, projectId: string | undefined) =>
    [...documentsQueryKeys.all, 'project', workspaceId, projectId] as const,
  projectList: (workspaceId: string | undefined, projectId: string | undefined, params: object) =>
    [...documentsQueryKeys.project(workspaceId, projectId), 'list', params] as const,
};

export const useWorkspaceDocuments = (
  workspaceId: string | undefined,
  params: ListDocumentsInput = {},
  options?: { enabled?: boolean }
) =>
  useInfiniteQuery({
    queryKey: documentsQueryKeys.workspaceList(workspaceId, params),
    queryFn: ({ pageParam }) =>
      documentsService.listWorkspace(workspaceId!, {
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });

export const useTeamDocuments = (
  teamId: string | undefined,
  params: ListDocumentsInput = {},
  options?: { enabled?: boolean }
) => {
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useInfiniteQuery({
    queryKey: documentsQueryKeys.teamList(workspaceId, teamId, params),
    queryFn: ({ pageParam }) =>
      documentsService.listTeam(teamId!, {
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId && teamId) && (options?.enabled ?? true),
  });
};

export const useProjectDocuments = (
  projectId: string | undefined,
  params: ListDocumentsInput = {},
  options?: { enabled?: boolean }
) => {
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useInfiniteQuery({
    queryKey: documentsQueryKeys.projectList(workspaceId, projectId, params),
    queryFn: ({ pageParam }) =>
      documentsService.listProject(projectId!, {
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId && projectId) && (options?.enabled ?? true),
  });
};

export const useCreateWorkspaceDocument = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDocumentInput) => documentsService.createWorkspace(workspaceId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.detail(workspaceId) });
    },
  });
};

export const useUpdateWorkspaceDocument = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, input }: { documentId: string; input: UpdateDocumentInput }) =>
      documentsService.updateWorkspace(workspaceId!, documentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.detail(workspaceId) });
    },
  });
};

export const useDeleteWorkspaceDocument = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => documentsService.deleteWorkspace(workspaceId!, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.detail(workspaceId) });
    },
  });
};

export const useCreateTeamDocument = (teamId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateDocumentInput) => documentsService.createTeam(teamId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.team(workspaceId, teamId) });
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.detail(workspaceId, teamId) });
    },
  });
};

export const useUpdateTeamDocument = (teamId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: ({ documentId, input }: { documentId: string; input: UpdateDocumentInput }) =>
      documentsService.updateTeam(teamId!, documentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.team(workspaceId, teamId) });
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.detail(workspaceId, teamId) });
    },
  });
};

export const useDeleteTeamDocument = (teamId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: (documentId: string) => documentsService.deleteTeam(teamId!, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.team(workspaceId, teamId) });
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.detail(workspaceId, teamId) });
    },
  });
};

export const useCreateProjectDocument = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateDocumentInput) => documentsService.createProject(projectId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.project(workspaceId, projectId) });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(workspaceId, projectId) });
    },
  });
};

export const useUpdateProjectDocument = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: ({ documentId, input }: { documentId: string; input: UpdateDocumentInput }) =>
      documentsService.updateProject(projectId!, documentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.project(workspaceId, projectId) });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(workspaceId, projectId) });
    },
  });
};

export const useDeleteProjectDocument = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: (documentId: string) => documentsService.deleteProject(projectId!, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.project(workspaceId, projectId) });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(workspaceId, projectId) });
    },
  });
};
