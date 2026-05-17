import React, { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, type AuthWorkspace } from '@/app/stores/useAuthStore';
import axios from 'axios';

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
  '/org-creation',  // Already on onboarding — don't redirect in a loop
];

export const AuthSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoaded) {
      console.log('[AuthSync] Clerk not loaded yet, waiting...');
      return;
    }

    // Not signed in → clear store, done
    if (!isSignedIn || !user) {
      console.log('[AuthSync] No signed-in user. Clearing auth store.');
      clear();
      return;
    }

    console.log('[AuthSync] User signed in:', user.id, '| Email:', user.primaryEmailAddress?.emailAddress);

    const syncUser = async () => {
      // ── Step 1: Build user object from Clerk (always available) ──
      const clerkUser = {
        id: user.id,
        name: user.fullName || user.firstName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatar: user.imageUrl,
      };

      // ── Step 2: Check workspaces from backend ──
      const baseUrl = process.env.BASE_URL || 'http://localhost:8000';
      let backendWorkspaces: AuthWorkspace[] | null = null;

      try {
        const token = await getToken();
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
      const isExemptPage = ONBOARDING_EXEMPT_PATHS.some(
        (p) => location.pathname === p || (p !== '/' && location.pathname.startsWith(p + '/'))
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
          setAuth(clerkUser, active);
        } else {
          // ❌ User has ZERO workspaces — MUST create one before using the app
          console.log('[AuthSync] User has no workspaces (confirmed by backend)');
          setAuth(clerkUser, null);
          if (!isExemptPage) {
            console.log('[AuthSync] REDIRECTING to /org-creation (no workspace)');
            navigate('/org-creation', { replace: true });
          }
        }
      } else {
        // Backend unreachable — check persisted workspace
        if (persistedWorkspace) {
          console.log('[AuthSync] Using persisted workspace:', persistedWorkspace.name);
          setAuth(clerkUser, persistedWorkspace);
        } else {
          // No backend, no persisted workspace — onboarding required
          console.log('[AuthSync] No workspace found anywhere (backend down, nothing persisted)');
          setAuth(clerkUser, null);
          if (!isExemptPage) {
            console.log('[AuthSync] REDIRECTING to /org-creation (no workspace, offline)');
            navigate('/org-creation', { replace: true });
          }
        }
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user?.id]);

  return <>{children}</>;
};
