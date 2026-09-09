import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useTenantStore } from '@/app/stores/useTenantStore';
import { TrussenAppLogo } from '@/assets/svg/TrussenAppLogo';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-bg-dark">
    <div className="flex flex-col items-center gap-3">
      <TrussenAppLogo className="w-12 h-12 animate-pulse" />
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  </div>
);

/**
 * AuthGuard
 *
 * Protects authenticated routes. Wraps <Outlet /> in routes.tsx.
 * - If Clerk is still loading → show a loading spinner (prevents flash)
 * - If user is NOT signed in → redirect to /login
 * - If user IS signed in but has no workspace → force onboarding
 * - If signed in with a workspace but on the BARE domain → AuthSync is mid-redirect
 *   to that workspace's own subdomain (a real browser navigation); show loading
 *   instead of rendering app content on the wrong domain first
 * - If signed in with a workspace on that workspace's own subdomain → render it
 *
 * Usage in routes.tsx:
 *   <Route element={<AuthGuard />}>
 *     <Route path="/dashboard" element={<DashboardPage />} />
 *   </Route>
 */
export const AuthGuard: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const workspace = useAuthStore((s) => s.workspace);
  const authSyncStatus = useAuthStore((s) => s.authSyncStatus);
  const tenantSlug = useTenantStore((s) => s.slug);

  // Clerk or backend workspace sync still initializing — show loading state to prevent app flash
  if (!isLoaded || (isSignedIn && authSyncStatus !== 'ready')) {
    return <LoadingScreen />;
  }

  // Not signed in → redirect to login
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Signed in but no workspace — force onboarding before app routes render
  if (!workspace) {
    return <Navigate to="/org-creation" replace />;
  }

  if (!tenantSlug) {
    return <LoadingScreen />;
  }

  // Signed in, on the right subdomain → render the protected route
  return <Outlet />;
};
