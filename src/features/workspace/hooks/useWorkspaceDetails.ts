import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { workspaceService } from '../services/workspaceService';

export const workspaceQueryKeys = {
  all: ['workspaces'] as const,
  list: () => [...workspaceQueryKeys.all, 'list'] as const,
  detail: (workspaceId: string | undefined) => [...workspaceQueryKeys.all, 'detail', workspaceId] as const,
  members: (workspaceId: string | undefined) => [...workspaceQueryKeys.all, 'members', workspaceId] as const,
  invitations: (workspaceId: string | undefined) => [...workspaceQueryKeys.all, 'invitations', workspaceId] as const,
};

export const useWorkspaceDetails = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: workspaceQueryKeys.detail(workspaceId),
    queryFn: () => workspaceService.getById(workspaceId!),
    enabled: Boolean(workspaceId),
  });
};

export const useWorkspaces = () => {
  return useQuery({
    queryKey: workspaceQueryKeys.list(),
    queryFn: workspaceService.getAll,
  });
};
