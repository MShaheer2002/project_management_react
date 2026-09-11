import React, { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, type AuthWorkspace } from '@/app/stores/useAuthStore';
import { useTenantStore } from '@/app/stores/useTenantStore';
import { buildWorkspaceUrl } from '@shared/utils/tenant';
import { getSafeRedirectPath } from '@shared/utils/safeRedirect';
import { decideWorkspaceDestination, isOnboardingExempt } from '@/app/auth/workspaceDecision';
import axios from 'axios';
import { authService } from '@features/auth';

/**
 * AuthSync
 *
 * Syncs Clerk auth state → Zustand auth store on every app load, then hands
 * the result to decideWorkspaceDestination (app/auth/workspaceDecision.ts)
 * for the actual "where should this user end up" decision — this file's
 * job is fetching the data that decision needs and executing whatever it
 * returns (set the active workspace, and navigate if the decision calls
 * for it), not deciding the routing logic itself.
 *
 * CRITICAL FLOW — new user onboarding:
 *   Signup → Verify OTP → /org-creation (workspace) → /dashboard
 */

const setDevJwt = (token: string | null) => {
  if (!import.meta.env.DEV) return;
  const devWindow = window as Window & { __TRUSSEN_JWT__?: string | null };
  devWindow.__TRUSSEN_JWT__ = token;
  console.log('[AuthSync] JWT for Postman:', token);
};

/**
 * Every workspace lives on its own subdomain — being on the bare domain
 * with an active workspace resolved is a transitional state, not a place
 * the dashboard should actually render. This is a full browser navigation
 * (different origin), not a client-side route change.
 *
 * This only ever fires from /login (see shouldCrossToSubdomain) — so the
 * one thing worth preserving across the jump isn't the current path
 * itself (that's always literally "/login", not a useful destination),
 * it's whatever `?redirect=` AuthGuard or the 401 handler attached to get
 * the user to /login in the first place.
 */
const goToWorkspaceSubdomain = (slug: string) => {
  const params = new URLSearchParams(window.location.search);
  const destination = getSafeRedirectPath(params.get('redirect')) ?? '/dashboard';
  window.location.href = buildWorkspaceUrl(slug, destination);
};

const setDevWorkspaceId = (workspaceId: string | null) => {
  if (!import.meta.env.DEV) return;
  const devWindow = window as Window & { __TRUSSEN_WORKSPACE_ID__?: string | null };
  devWindow.__TRUSSEN_WORKSPACE_ID__ = workspaceId;
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
        // isSignedIn is still true here (Clerk hasn't signed them out) but
        // no token was available — without markReady(), the guards' loading
        // check (isSignedIn && authSyncStatus !== 'ready') would spin
        // forever, since nothing else re-triggers this effect.
        setDevJwt(null);
        setDevWorkspaceId(null);
        if (!cancelled) {
          clear();
          markReady();
        }
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
            customStatuses: ws.customStatuses || undefined,
            workflowAutomation: ws.workflowAutomation || undefined,
            uploadPolicy: ws.uploadPolicy || 'BOTH',
            inviteDomainPolicy: ws.inviteDomainPolicy || 'ANY',
            allowedEmailDomains: ws.allowedEmailDomains || [],
          }));
          console.log('[AuthSync] GET /workspaces returned', backendWorkspaces?.length, 'workspace(s)');
        }
      } catch {
        console.log('[AuthSync] Backend /workspaces unreachable. Using persisted workspace if available.');
      }

      // ── Step 3: Decide — delegate to the centralized decision function ──
      const persistedWorkspace = useAuthStore.getState().workspace;
      const currentPath = window.location.pathname;
      const tenantSlug = useTenantStore.getState().slug;
      const isExemptPage = isOnboardingExempt(currentPath);

      const decision = decideWorkspaceDestination({
        tenantSlug,
        backendWorkspaces,
        persistedWorkspace,
        currentPath,
      });

      switch (decision.type) {
        case 'ENTER_WORKSPACE': {
          console.log('[AuthSync] Active workspace:', decision.workspace.name, '| Role:', decision.workspace.role);
          setDevWorkspaceId(decision.workspace.id);
          if (!cancelled) setAuth(backendUser, decision.workspace);
          if (decision.crossToSubdomain && !cancelled) goToWorkspaceSubdomain(decision.workspace.slug);
          break;
        }

        case 'NO_ACCESS': {
          // Signed in, but this account has no membership in the workspace
          // this subdomain belongs to — do not silently switch them into a
          // different one of their own workspaces instead.
          console.log('[AuthSync] User has no membership in this subdomain\'s workspace');
          if (!cancelled) setAuth(backendUser, null);
          if (!isExemptPage && !cancelled) navigate('/no-access', { replace: true });
          break;
        }

        case 'SELECT_WORKSPACE': {
          // Temporarily set the first workspace so AuthGuard doesn't bounce
          // to /org-creation while the picker page itself loads.
          console.log('[AuthSync] Multiple workspaces, no preference — showing picker (temp:', decision.temporaryWorkspace.name, ')');
          setDevWorkspaceId(decision.temporaryWorkspace.id);
          if (!cancelled) setAuth(backendUser, decision.temporaryWorkspace);
          if (!isExemptPage && !cancelled) navigate('/select-workspace', { replace: true });
          break;
        }

        case 'ONBOARD': {
          console.log('[AuthSync] No workspace anywhere — onboarding required');
          setDevWorkspaceId(null);
          if (!cancelled) setAuth(backendUser, null);
          if (!isExemptPage && !cancelled) navigate('/org-creation', { replace: true });
          break;
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
