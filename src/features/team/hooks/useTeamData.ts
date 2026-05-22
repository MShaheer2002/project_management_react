import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { sidebarQueryKeys } from '@features/sidebar';
import { workspaceQueryKeys } from '@features/workspace';
import { teamService } from '../services/teamService';
import type {
  AddTeamMembersInput,
  CreateTeamInput,
  ListTeamMembersInput,
  ListTeamsInput,
  UpdateTeamInput,
} from '../types';

export const teamQueryKeys = {
  all: ['teams'] as const,
  workspace: (workspaceId: string | undefined) => [...teamQueryKeys.all, workspaceId] as const,
  directory: (workspaceId: string | undefined, params: object) =>
    [...teamQueryKeys.workspace(workspaceId), 'directory', params] as const,
  options: (workspaceId: string | undefined, params: object) =>
    [...teamQueryKeys.workspace(workspaceId), 'options', params] as const,
  detail: (workspaceId: string | undefined, teamId: string | undefined) =>
    [...teamQueryKeys.workspace(workspaceId), 'detail', teamId] as const,
  members: (workspaceId: string | undefined, teamId: string | undefined, params: object) =>
    [...teamQueryKeys.detail(workspaceId, teamId), 'members', params] as const,
};

export const useTeamsDirectory = (params: ListTeamsInput = {}, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: teamQueryKeys.directory(workspaceId, params),
    queryFn: ({ pageParam }) =>
      teamService.listDirectory({
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useTeamOptions = (params: ListTeamsInput = {}, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: teamQueryKeys.options(workspaceId, params),
    queryFn: ({ pageParam }) =>
      teamService.listOptions({
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useTeamDetail = (teamId: string | undefined) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: teamQueryKeys.detail(workspaceId, teamId),
    queryFn: () => teamService.getById(teamId!),
    enabled: Boolean(workspaceId && teamId),
  });
};

export const useTeamMembers = (
  teamId: string | undefined,
  params: ListTeamMembersInput = {},
  options?: { enabled?: boolean }
) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: teamQueryKeys.members(workspaceId, teamId, params),
    queryFn: ({ pageParam }) =>
      teamService.listMembers(teamId!, {
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId && teamId) && (options?.enabled ?? true),
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateTeamInput) => teamService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['departments', workspaceId] });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};

export const useUpdateTeam = (teamId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: UpdateTeamInput) => teamService.update(teamId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['departments', workspaceId] });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};

export const useUpdateAnyTeam = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ teamId, input }: { teamId: string; input: UpdateTeamInput }) =>
      teamService.update(teamId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.detail(workspaceId, variables.teamId) });
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['departments', workspaceId] });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};

export const useDeleteTeam = (teamId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: () => teamService.delete(teamId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['departments', workspaceId] });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};

export const useAddTeamMembers = (teamId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: AddTeamMembersInput) => teamService.addMembers(teamId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.detail(workspaceId, teamId) });
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.members(workspaceId, teamId, {}) });
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['departments', workspaceId] });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};

export const useRemoveTeamMember = (teamId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (userId: string) => teamService.removeMember(teamId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.detail(workspaceId, teamId) });
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.members(workspaceId, teamId, {}) });
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['departments', workspaceId] });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};
