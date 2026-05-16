import React, { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { privateApi } from '@shared/services/privateApi';

/**
 * AuthSync
 *
 * Syncs Clerk auth state → our backend /me → Zustand auth store.
 * This runs once when the user's Clerk session loads, and again
 * if the user changes (e.g., switches account).
 *
 * Flow:
 * 1. Clerk loads → isLoaded=true, isSignedIn=true
 * 2. We call GET /me on our backend (token auto-injected by interceptor)
 * 3. Backend returns user profile + workspace info
 * 4. We set that in useAuthStore so the whole app can read it
 *
 * If the backend call fails (e.g., webhook hasn't synced yet),
 * we fall back to Clerk's user data directly so the app doesn't break.
 */
export const AuthSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    // Wait for Clerk to finish loading before doing anything
    if (!isLoaded) {
      console.log('[AuthSync] Clerk not loaded yet, waiting...');
      return;
    }

    // User is not signed in → clear the auth store
    if (!isSignedIn || !user) {
      console.log('[AuthSync] No signed-in user. Clearing auth store.');
      clear();
      return;
    }

    // User IS signed in → sync with our backend
    console.log('[AuthSync] User signed in:', user.id, '| Syncing with backend...');
    const syncUser = async () => {
      try {
        // Get a fresh Clerk session token
        const token = await getToken();
        console.log('[AuthSync] Got Clerk token. Calling GET /me...');

        // Call our backend to get the full user profile + workspace
        // The auth interceptor would normally handle this, but AuthSync
        // may run before the ClerkTokenBridge has registered the getter,
        // so we pass the token manually as a safety measure
        const { data } = await privateApi.get('/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        console.log('[AuthSync] Backend /me success:', data.data.user?.email, '| Workspace:', data.data.workspace?.name || 'none');

        // Backend returned our user + workspace → set in Zustand
        setAuth(
          {
            id: data.data.user.id,
            name: data.data.user.name,
            email: data.data.user.email,
            avatar: data.data.user.avatar,
          },
          data.data.workspace ?? null // null if user hasn't created a workspace yet
        );
      } catch (err) {
        // Backend call failed — likely webhook hasn't synced the user yet.
        // Fall back to Clerk's user object so the app still works.
        // The user can still create a workspace, and the next /me call will succeed.
        console.warn('[AuthSync] Backend /me failed (webhook delay?). Falling back to Clerk user data.', err);
        setAuth(
          {
            id: user.id,
            name: user.fullName || user.firstName || '',
            email: user.primaryEmailAddress?.emailAddress || '',
            avatar: user.imageUrl,
          },
          null // no workspace data available from fallback
        );
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user?.id]); // Re-run when Clerk user changes

  return <>{children}</>;
};
