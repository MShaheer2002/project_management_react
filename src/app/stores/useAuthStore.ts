import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkspaceStatus } from '@/types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export type UploadPolicy = 'BOTH' | 'SYSTEM_ONLY' | 'DRIVE_ONLY';

export interface AuthWorkspace {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  defaultTeamId?: string; // Auto-created team — needed for invites, first project/issue creation
  customStatuses?: WorkspaceStatus[];
  uploadPolicy?: UploadPolicy; // Controls where members can upload: BOTH (default), SYSTEM_ONLY, DRIVE_ONLY
}

export type AuthSyncStatus = 'idle' | 'loading' | 'ready';

interface AuthState {
  currentUser: AuthUser | null;
  workspace: AuthWorkspace | null;
  isAuthenticated: boolean;
  authSyncStatus: AuthSyncStatus;

  setAuth: (user: AuthUser, workspace: AuthWorkspace | null) => void;
  setWorkspace: (workspace: AuthWorkspace) => void;
  setAuthSyncStatus: (status: AuthSyncStatus) => void;
  clear: () => void;

  // Legacy compat — used by AppContext shim until fully migrated
  organization: { id: string; name: string; slug: string; logo?: string } | null;
  setCurrentUser: (user: any) => void;
  setOrganization: (org: any) => void;
}

/**
 * Auth store — persists workspace to localStorage so it survives page refresh.
 * User data is re-synced from Clerk on every load (via AuthSync),
 * but workspace is persisted so the user doesn't need to re-select it.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      workspace: null,
      isAuthenticated: false,
      authSyncStatus: 'idle',
      organization: null,

      setAuth: (currentUser, workspace) =>
        set({
          currentUser,
          workspace,
          isAuthenticated: true,
          authSyncStatus: 'ready',
          organization: workspace ? { id: workspace.id, name: workspace.name, slug: workspace.slug, logo: workspace.logo } : null,
        }),

      setWorkspace: (workspace) =>
        set({
          workspace,
          authSyncStatus: 'ready',
          organization: { id: workspace.id, name: workspace.name, slug: workspace.slug, logo: workspace.logo },
        }),

      setAuthSyncStatus: (authSyncStatus) => set({ authSyncStatus }),

      clear: () =>
        set({
          currentUser: null,
          workspace: null,
          isAuthenticated: false,
          authSyncStatus: 'idle',
          organization: null,
        }),

      // Legacy compat
      setCurrentUser: (user) =>
        set(() => ({
          currentUser: user ? { id: user.id, name: user.name, email: user.email, avatar: user.avatar } : null,
          isAuthenticated: !!user,
        })),

      setOrganization: (org) =>
        set({
          organization: org,
          workspace: org ? { id: org.id, name: org.name, slug: org.slug, logo: org.logo, role: 'owner' } : null,
        }),
    }),
    {
      name: 'linearis-auth',
      // Only persist workspace — user is re-synced from Clerk each load
      partialize: (state) => ({ workspace: state.workspace }),
    }
  )
);
