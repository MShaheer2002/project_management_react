import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import {
  workspaceService,
  type ListWorkspaceMembersInput,
} from '../services/workspaceService';
import { workspaceQueryKeys } from './useWorkspaceDetails';

export const useWorkspaceMembers = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: workspaceQueryKeys.members(workspaceId),
    queryFn: () => workspaceService.getMembers(workspaceId!),
    enabled: Boolean(workspaceId),
  });
};

export const useWorkspaceInvitations = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: workspaceQueryKeys.invitations(workspaceId),
    queryFn: () => workspaceService.getInvitations(workspaceId!),
    enabled: Boolean(workspaceId),
  });
};

export const useWorkspaceMemberDirectory = (
  params: ListWorkspaceMembersInput = {},
  options?: { enabled?: boolean }
) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: workspaceQueryKeys.memberDirectory(workspaceId, params),
    queryFn: ({ pageParam }) =>
      workspaceService.listMemberDirectory(workspaceId!, {
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useWorkspaceMemberOptions = (
  params: ListWorkspaceMembersInput = {},
  options?: { enabled?: boolean }
) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: workspaceQueryKeys.memberOptions(workspaceId, params),
    queryFn: ({ pageParam }) =>
      workspaceService.listMemberOptions(workspaceId!, {
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};
