import { create } from 'zustand';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AuthWorkspace {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
}

interface AuthState {
  currentUser: AuthUser | null;
  workspace: AuthWorkspace | null;
  isAuthenticated: boolean;

  setAuth: (user: AuthUser, workspace: AuthWorkspace | null) => void;
  setWorkspace: (workspace: AuthWorkspace) => void;
  clear: () => void;

  // Legacy compat — used by AppContext shim until fully migrated
  organization: { id: string; name: string; slug: string; logo?: string } | null;
  setCurrentUser: (user: any) => void;
  setOrganization: (org: any) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  currentUser: null,
  workspace: null,
  isAuthenticated: false,
  organization: null,

  setAuth: (currentUser, workspace) =>
    set({
      currentUser,
      workspace,
      isAuthenticated: true,
      organization: workspace ? { id: workspace.id, name: workspace.name, slug: workspace.slug, logo: workspace.logo } : null,
    }),

  setWorkspace: (workspace) =>
    set({
      workspace,
      organization: { id: workspace.id, name: workspace.name, slug: workspace.slug, logo: workspace.logo },
    }),

  clear: () =>
    set({
      currentUser: null,
      workspace: null,
      isAuthenticated: false,
      organization: null,
    }),

  // Legacy compat — bridges old useApp() calls that set user/org directly
  setCurrentUser: (user) =>
    set((state) => ({
      currentUser: user ? { id: user.id, name: user.name, email: user.email, avatar: user.avatar } : null,
      isAuthenticated: !!user,
    })),

  setOrganization: (org) =>
    set({
      organization: org,
      workspace: org ? { id: org.id, name: org.name, slug: org.slug, logo: org.logo, role: 'owner' } : null,
    }),
}));
