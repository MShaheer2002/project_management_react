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
      const current = useAuthStore.getState().workspace;
      if (!current) return;

      // Merge only fields the API returns — preserve role, customStatuses, defaultTeamId
      // which are not included in the PATCH response.
      // Use 'in' check instead of ?? to correctly handle explicit null (e.g., logo cleared)
      setWorkspace({
        ...current,
        name: workspace.name,
        slug: workspace.slug,
        logo: workspace.logo ?? undefined,
        customStatuses: workspace.customStatuses ?? current.customStatuses,
        workflowAutomation: workspace.workflowAutomation ?? current.workflowAutomation,
        uploadPolicy: workspace.uploadPolicy ?? current.uploadPolicy,
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
