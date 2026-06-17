import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { useAuthStore, type AuthWorkspace } from '@/app/stores/useAuthStore';
import { realtimeSocket } from '@shared/services/realtimeSocket';
import type { WorkspaceResponse } from '../services/workspaceService';

/**
 * Encapsulates the full workspace switch sequence:
 *   1. Update Zustand store (interceptor picks up new ID immediately)
 *   2. Disconnect + reconnect Socket.IO to new workspace room
 *   3. Invalidate ALL workspace-scoped React Query cache
 *   4. Navigate to /dashboard (deep routes reference workspace-specific entities)
 */
export function useWorkspaceSwitch() {
  const setWorkspace = useAuthStore((s) => s.setWorkspace);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const switchWorkspace = useCallback(
    async (workspace: WorkspaceResponse) => {
      const activeWorkspace = useAuthStore.getState().workspace;

      // No-op if switching to the same workspace
      if (activeWorkspace?.id === workspace.id) return;

      // 1. Update Zustand store
      const authWorkspace: AuthWorkspace = {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        logo: workspace.logo,
        role: workspace.role.toLowerCase() as AuthWorkspace['role'],
        defaultTeamId: workspace.defaultTeamId,
        customStatuses: workspace.customStatuses,
      };
      setWorkspace(authWorkspace);

      // 2. Reconnect Socket.IO to new workspace
      const token = await getToken();
      if (token) {
        realtimeSocket.disconnect();
        realtimeSocket.connect({ token, workspaceId: workspace.id });
      }

      // 3. Clear workspace-scoped localStorage drafts
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('issue_draft:')) keysToRemove.push(key);
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // 4. Invalidate all queries — stale data from old workspace must not leak
      queryClient.invalidateQueries();

      // 5. Navigate to dashboard — deep routes like /projects/abc123 reference
      //    entities that don't exist in the new workspace
      navigate('/dashboard', { replace: true });
    },
    [setWorkspace, queryClient, navigate, getToken],
  );

  return switchWorkspace;
}
