import { useCallback } from 'react';
import { useAuthStore, type AuthWorkspace } from '@/app/stores/useAuthStore';
import { buildWorkspaceUrl } from '@shared/utils/tenant';
import type { WorkspaceResponse } from '../services/workspaceService';

/**
 * Switching workspaces means switching subdomains — <slug>.trussen.app is a
 * different browser origin, so this ends in a real navigation
 * (window.location), not a client-side route change. That full reload is
 * what used to require manually reconnecting Socket.IO and invalidating
 * every React Query cache entry by hand: a fresh origin gets a fresh
 * instance of all of that for free, so there's nothing left to invalidate.
 */
export function useWorkspaceSwitch() {
  const setWorkspace = useAuthStore((s) => s.setWorkspace);

  const switchWorkspace = useCallback(
    async (workspace: WorkspaceResponse) => {
      const activeWorkspace = useAuthStore.getState().workspace;

      // No-op if switching to the same workspace
      if (activeWorkspace?.id === workspace.id) return;

      const authWorkspace: AuthWorkspace = {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        logo: workspace.logo,
        role: workspace.role.toLowerCase() as AuthWorkspace['role'],
        defaultTeamId: workspace.defaultTeamId,
        customStatuses: workspace.customStatuses,
        workflowAutomation: workspace.workflowAutomation,
        uploadPolicy: workspace.uploadPolicy,
        inviteDomainPolicy: workspace.inviteDomainPolicy,
        allowedEmailDomains: workspace.allowedEmailDomains,
      };
      setWorkspace(authWorkspace);

      // Clear workspace-scoped localStorage drafts on THIS origin before
      // leaving it — the destination subdomain has its own separate storage,
      // so these would otherwise just sit here stale forever.
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('issue_draft:')) keysToRemove.push(key);
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      window.location.href = buildWorkspaceUrl(workspace.slug, '/dashboard');
    },
    [setWorkspace],
  );

  return switchWorkspace;
}
