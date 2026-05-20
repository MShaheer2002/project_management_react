import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { workspaceService } from '../services/workspaceService';
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
