import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { projectQueryKeys } from '@features/projects';
import { teamQueryKeys } from '@features/team';
import { workspaceQueryKeys } from '@features/workspace';
import type { CreateDocumentInput } from '@shared/types/documents';
import { documentsService } from '../services/documentsService';
import type {
  CreateFolderInput,
  ListDocumentsInput,
  MoveDocumentInput,
  MoveFolderInput,
  RenameFolderInput,
  UpdateDocumentInput,
} from '../types';

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

  // Folder keys
  folders: ['document-folders'] as const,
  workspaceFolders: (workspaceId: string | undefined, parentId: string | null) =>
    [...documentsQueryKeys.folders, 'workspace', workspaceId, parentId] as const,
  teamFolders: (workspaceId: string | undefined, teamId: string | undefined, parentId: string | null) =>
    [...documentsQueryKeys.folders, 'team', workspaceId, teamId, parentId] as const,
  projectFolders: (workspaceId: string | undefined, projectId: string | undefined, parentId: string | null) =>
    [...documentsQueryKeys.folders, 'project', workspaceId, projectId, parentId] as const,
  workspaceBreadcrumbs: (workspaceId: string | undefined, folderId: string | null) =>
    [...documentsQueryKeys.folders, 'breadcrumbs', 'workspace', workspaceId, folderId] as const,
  teamBreadcrumbs: (workspaceId: string | undefined, teamId: string | undefined, folderId: string | null) =>
    [...documentsQueryKeys.folders, 'breadcrumbs', 'team', workspaceId, teamId, folderId] as const,
  projectBreadcrumbs: (workspaceId: string | undefined, projectId: string | undefined, folderId: string | null) =>
    [...documentsQueryKeys.folders, 'breadcrumbs', 'project', workspaceId, projectId, folderId] as const,
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

// ── Folder hooks ──

type FolderScope = 'workspace' | 'team' | 'project';

export const useFolders = (
  scope: FolderScope,
  entityId: string | undefined,
  parentId: string | null,
  options?: { enabled?: boolean }
) => {
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useQuery({
    queryKey:
      scope === 'workspace'
        ? documentsQueryKeys.workspaceFolders(entityId, parentId)
        : scope === 'team'
          ? documentsQueryKeys.teamFolders(workspaceId, entityId, parentId)
          : documentsQueryKeys.projectFolders(workspaceId, entityId, parentId),
    queryFn: () => {
      const params = parentId ? { parentId } : {};
      if (scope === 'workspace') return documentsService.listWorkspaceFolders(entityId!, params);
      if (scope === 'team') return documentsService.listTeamFolders(entityId!, params);
      return documentsService.listProjectFolders(entityId!, params);
    },
    enabled: Boolean(entityId) && (options?.enabled ?? true),
  });
};

export const useFolderBreadcrumbs = (
  scope: FolderScope,
  entityId: string | undefined,
  folderId: string | null
) => {
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useQuery({
    queryKey:
      scope === 'workspace'
        ? documentsQueryKeys.workspaceBreadcrumbs(entityId, folderId)
        : scope === 'team'
          ? documentsQueryKeys.teamBreadcrumbs(workspaceId, entityId, folderId)
          : documentsQueryKeys.projectBreadcrumbs(workspaceId, entityId, folderId),
    queryFn: () => {
      if (scope === 'workspace')
        return documentsService.getWorkspaceFolderBreadcrumbs(entityId!, folderId!);
      if (scope === 'team') return documentsService.getTeamFolderBreadcrumbs(entityId!, folderId!);
      return documentsService.getProjectFolderBreadcrumbs(entityId!, folderId!);
    },
    enabled: Boolean(entityId) && Boolean(folderId),
  });
};

export const useCreateFolder = (scope: FolderScope, entityId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateFolderInput) => {
      if (scope === 'workspace') return documentsService.createWorkspaceFolder(entityId!, input);
      if (scope === 'team') return documentsService.createTeamFolder(entityId!, input);
      return documentsService.createProjectFolder(entityId!, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.folders });
      if (scope === 'workspace')
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.detail(entityId) });
      else if (scope === 'team') {
        queryClient.invalidateQueries({ queryKey: teamQueryKeys.detail(workspaceId, entityId) });
      } else {
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(workspaceId, entityId) });
      }
    },
  });
};

export const useRenameFolder = (scope: FolderScope, entityId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: ({ folderId, input }: { folderId: string; input: RenameFolderInput }) => {
      if (scope === 'workspace')
        return documentsService.renameWorkspaceFolder(entityId!, folderId, input);
      if (scope === 'team') return documentsService.renameTeamFolder(entityId!, folderId, input);
      return documentsService.renameProjectFolder(entityId!, folderId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.folders });
      if (scope === 'workspace')
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.detail(entityId) });
      else if (scope === 'team') {
        queryClient.invalidateQueries({ queryKey: teamQueryKeys.detail(workspaceId, entityId) });
      } else {
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(workspaceId, entityId) });
      }
    },
  });
};

export const useDeleteFolder = (scope: FolderScope, entityId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: (folderId: string) => {
      if (scope === 'workspace') return documentsService.deleteWorkspaceFolder(entityId!, folderId);
      if (scope === 'team') return documentsService.deleteTeamFolder(entityId!, folderId);
      return documentsService.deleteProjectFolder(entityId!, folderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.folders });
      if (scope === 'workspace')
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.detail(entityId) });
      else if (scope === 'team') {
        queryClient.invalidateQueries({ queryKey: teamQueryKeys.detail(workspaceId, entityId) });
      } else {
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(workspaceId, entityId) });
      }
    },
  });
};

export const useMoveFolder = (scope: FolderScope, entityId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: ({ folderId, input }: { folderId: string; input: MoveFolderInput }) => {
      if (scope === 'workspace')
        return documentsService.moveWorkspaceFolder(entityId!, folderId, input);
      if (scope === 'team') return documentsService.moveTeamFolder(entityId!, folderId, input);
      return documentsService.moveProjectFolder(entityId!, folderId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.folders });
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.all });
    },
  });
};

export const useMoveDocument = (scope: FolderScope, entityId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);

  return useMutation({
    mutationFn: ({ documentId, input }: { documentId: string; input: MoveDocumentInput }) => {
      if (scope === 'workspace')
        return documentsService.moveWorkspaceDocument(entityId!, documentId, input);
      if (scope === 'team') return documentsService.moveTeamDocument(entityId!, documentId, input);
      return documentsService.moveProjectDocument(entityId!, documentId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.folders });
    },
  });
};
