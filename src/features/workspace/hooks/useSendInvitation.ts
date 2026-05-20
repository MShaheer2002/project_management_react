import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sidebarQueryKeys } from '@features/sidebar';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { workspaceService, type SendInvitationInput } from '../services/workspaceService';
import { workspaceQueryKeys } from './useWorkspaceDetails';

export type SendInvitationFormInput = Omit<SendInvitationInput, 'workspaceId'>;

export const useSendInvitation = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: SendInvitationFormInput) => {
      if (!workspaceId) {
        throw new Error('Missing active workspace');
      }
      return workspaceService.sendInvitation({ ...input, workspaceId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.invitations(workspaceId) });
    },
  });
};
