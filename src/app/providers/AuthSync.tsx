import React, { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, type AuthWorkspace } from '@/app/stores/useAuthStore';
import axios from 'axios';
import { authService } from '@features/auth';

/**
 * AuthSync
 *
 * Syncs Clerk auth state → Zustand auth store on every app load.
 *
 * CRITICAL FLOW — new user onboarding:
 *   Signup → Verify OTP → /org-creation (workspace) → /dashboard
 *
 * The workspace check (GET /workspaces) runs on every load:
 * - If user has workspaces → set active workspace, allow dashboard
 * - If user has NO workspaces → FORCE redirect to /org-creation
 *   (user CANNOT reach dashboard without a workspace)
 *
 * This redirect happens REGARDLESS of where the user tries to navigate.
 * The only pages exempt from this redirect are listed in ONBOARDING_EXEMPT_PATHS.
 */

/**
 * Paths where we do NOT redirect to /org-creation even if no workspace exists.
 * These are: public pages, auth flow pages, and the onboarding page itself.
 */
const ONBOARDING_EXEMPT_PATHS = [
  '/',              // Marketing landing page
  '/marketing',     // Marketing alias
  '/login',
  '/signup',
  '/email-verification',
  '/forgot-password',
  '/reset-password',
  '/sso-callback',
  '/invite',
  '/org-creation',  // Already on onboarding — don't redirect in a loop
];

const setDevJwt = (token: string | null) => {
  if (!import.meta.env.DEV) return;
  const devWindow = window as Window & { __LINEARIS_JWT__?: string | null };
  devWindow.__LINEARIS_JWT__ = token;
  console.log('[AuthSync] JWT for Postman:', token);
};

const setDevWorkspaceId = (workspaceId: string | null) => {
  if (!import.meta.env.DEV) return;
  const devWindow = window as Window & { __LINEARIS_WORKSPACE_ID__?: string | null };
  devWindow.__LINEARIS_WORKSPACE_ID__ = workspaceId;
  console.log('[AuthSync] Workspace ID for Postman:', workspaceId);
};

export const AuthSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setAuthSyncStatus = useAuthStore((s) => s.setAuthSyncStatus);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) {
      console.log('[AuthSync] Clerk not loaded yet, waiting...');
      return;
    }

    // Not signed in → clear store, done
    if (!isSignedIn || !user) {
      console.log('[AuthSync] No signed-in user. Clearing auth store.');
      setDevJwt(null);
      setDevWorkspaceId(null);
      clear();
      return;
    }

    let cancelled = false;
    const markReady = () => {
      if (!cancelled) setAuthSyncStatus('ready');
    };

    const existingAuth = useAuthStore.getState();
    const isInitialSync =
      existingAuth.authSyncStatus !== 'ready' ||
      existingAuth.currentUser?.id !== user.id ||
      !existingAuth.workspace;

    if (isInitialSync) {
      setAuthSyncStatus('loading');
    }
    console.log('[AuthSync] User signed in:', user.id, '| Email:', user.primaryEmailAddress?.emailAddress);

    const syncUser = async () => {
      const token = await getToken();
      if (!token) {
        setDevJwt(null);
        setDevWorkspaceId(null);
        if (!cancelled) clear();
        return;
      }
      setDevJwt(token);

      // ── Step 1: Sync user profile from backend /me ──
      const fallbackUser = {
        id: user.id,
        name: user.fullName || user.firstName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatar: user.imageUrl,
      };

      let backendUser = fallbackUser;

      try {
        const me = await authService.getMe(token);
        backendUser = {
          id: me.id,
          name: me.name,
          email: me.email,
          avatar: me.avatar || undefined,
        };
      } catch (err: any) {
        const status = err.response?.status;
        const code = err.response?.data?.error?.code;
        if (status === 403 && code === 'USER_NOT_SYNCED') {
          console.log('[AuthSync] Backend user not synced yet.');
          if (!cancelled) setAuth(fallbackUser, null);
          return;
        }
        if (status === 401) {
          if (!cancelled) {
            clear();
            navigate('/login', { replace: true });
          }
          return;
        }
        console.log('[AuthSync] GET /me failed. Falling back to Clerk profile for this load.');
      }

      // ── Step 2: Check workspaces from backend ──
      const baseUrl = process.env.BASE_URL || 'http://localhost:8000';
      let backendWorkspaces: AuthWorkspace[] | null = null;

      try {
        // Raw axios to avoid error interceptor toasts during silent sync
        const { data } = await axios.get(`${baseUrl}/workspaces`, {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          timeout: 5000,
        });

        if (data.success && Array.isArray(data.data)) {
          backendWorkspaces = data.data.map((ws: any) => ({
            id: ws.id,
            name: ws.name,
            slug: ws.slug,
            logo: ws.logo || undefined,
            role: ws.role?.toLowerCase() || 'member',
            defaultTeamId: ws.defaultTeamId || undefined,
          }));
          console.log('[AuthSync] GET /workspaces returned', backendWorkspaces?.length, 'workspace(s)');
        }
      } catch {
        console.log('[AuthSync] Backend /workspaces unreachable. Using persisted workspace if available.');
      }

      // ── Step 3: Decide — workspace exists or onboarding needed ──
      const persistedWorkspace = useAuthStore.getState().workspace;
      const currentPath = window.location.pathname;
      const isExemptPage = ONBOARDING_EXEMPT_PATHS.some(
        (p) => currentPath === p || (p !== '/' && currentPath.startsWith(p + '/'))
      );

      if (backendWorkspaces !== null) {
        // Backend answered
        if (backendWorkspaces.length > 0) {
          // ✅ User HAS workspaces — pick the right one
          const match = persistedWorkspace
            ? backendWorkspaces.find((ws) => ws.id === persistedWorkspace.id)
            : null;
          const active = match || backendWorkspaces[0];
          console.log('[AuthSync] Active workspace:', active.name, '| Role:', active.role);
          setDevWorkspaceId(active.id);
          if (!cancelled) setAuth(backendUser, active);
        } else {
          // ❌ User has ZERO workspaces — MUST create one before using the app
          console.log('[AuthSync] User has no workspaces (confirmed by backend)');
          setDevWorkspaceId(null);
          if (!cancelled) setAuth(backendUser, null);
          if (!isExemptPage) {
            console.log('[AuthSync] REDIRECTING to /org-creation (no workspace)');
            if (!cancelled) navigate('/org-creation', { replace: true });
          }
        }
      } else {
        // Backend unreachable — check persisted workspace
        if (persistedWorkspace) {
          console.log('[AuthSync] Using persisted workspace:', persistedWorkspace.name);
          setDevWorkspaceId(persistedWorkspace.id);
          if (!cancelled) setAuth(backendUser, persistedWorkspace);
        } else {
          // No backend, no persisted workspace — onboarding required
          console.log('[AuthSync] No workspace found anywhere (backend down, nothing persisted)');
          setDevWorkspaceId(null);
          if (!cancelled) setAuth(backendUser, null);
          if (!isExemptPage) {
            console.log('[AuthSync] REDIRECTING to /org-creation (no workspace, offline)');
            if (!cancelled) navigate('/org-creation', { replace: true });
          }
        }
      }
    };

    syncUser()
      .catch((err) => {
        console.error('[AuthSync] Unexpected sync failure:', err);
        markReady();
      });

    return () => {
      cancelled = true;
    };
  }, [clear, getToken, isLoaded, isSignedIn, navigate, setAuth, setAuthSyncStatus, user?.id]);

  return <>{children}</>;
};
