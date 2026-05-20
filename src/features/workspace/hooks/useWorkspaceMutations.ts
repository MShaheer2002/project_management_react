import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sidebarQueryKeys } from '@features/sidebar';
import { useAuthStore } from '@/app/stores/useAuthStore';
import {
  workspaceService,
  type InvitationRole,
  type UpdateWorkspaceInput,
} from '../services/workspaceService';
import { workspaceQueryKeys } from './useWorkspaceDetails';

export const useUpdateWorkspace = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const setWorkspace = useAuthStore((s) => s.setWorkspace);

  return useMutation({
    mutationFn: (input: Omit<UpdateWorkspaceInput, 'workspaceId'>) => {
      if (!workspaceId) throw new Error('Missing active workspace');
      return workspaceService.update({ ...input, workspaceId });
    },
    onSuccess: (workspace) => {
      setWorkspace({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        logo: workspace.logo ?? undefined,
        role: workspace.role.toLowerCase() as 'owner' | 'admin' | 'member' | 'guest',
        defaultTeamId: workspace.defaultTeamId,
      });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.detail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};

export const useDeleteWorkspace = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: () => {
      if (!workspaceId) throw new Error('Missing active workspace');
      return workspaceService.delete(workspaceId);
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: InvitationRole }) => {
      if (!workspaceId) throw new Error('Missing active workspace');
      return workspaceService.updateMemberRole({ workspaceId, userId, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (userId: string) => {
      if (!workspaceId) throw new Error('Missing active workspace');
      return workspaceService.removeMember({ workspaceId, userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};

export const useRevokeInvitation = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (invitationId: string) => {
      if (!workspaceId) throw new Error('Missing active workspace');
      return workspaceService.revokeInvitation(workspaceId, invitationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.invitations(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};
