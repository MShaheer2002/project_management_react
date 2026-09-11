import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useTenantStore } from '@/app/stores/useTenantStore';
import { buildWorkspaceUrl } from '@shared/utils/tenant';
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
 * - If user IS signed in but has no workspace:
 *     - on a company subdomain → this means "not a member of THIS workspace,"
 *       which AuthSync already routes to /no-access for; just wait for that
 *       rather than assuming "go create a workspace" (that page is bare-domain
 *       only, and briefly rendering it on someone else's subdomain is wrong
 *       even if AuthSync's own redirect wins a moment later)
 *     - on the bare domain → force onboarding, no workspace exists anywhere
 * - If signed in with a workspace but on the BARE domain → app routes never render
 *   here — cross to that workspace's own subdomain at the same path (a real
 *   browser navigation, different origin). Covers both a stale bookmark to
 *   trussen.app/dashboard from before subdomain routing existed, AND — this
 *   is the case that actually matters day to day — Clerk's own OAuth
 *   redirect or a stray navigate() landing here right after login, before
 *   AuthSync got a chance to do this itself from /login.
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
  const location = useLocation();

  // Clerk or backend workspace sync still initializing — show loading state to prevent app flash
  if (!isLoaded || (isSignedIn && authSyncStatus !== 'ready')) {
    return <LoadingScreen />;
  }

  // Not signed in → redirect to login, preserving where they were headed
  // (e.g. company.trussen.app/projects/123) so GuestGuard can send them
  // back there once authenticated instead of always landing on /dashboard.
  if (!isSignedIn) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(returnTo)}`} replace />;
  }

  // Signed in but no workspace
  if (!workspace) {
    // On a company subdomain, AuthSync is already navigating to /no-access
    // for this exact case — don't also render /org-creation (bare-domain
    // only) on someone else's subdomain while that's in flight.
    return tenantSlug ? <LoadingScreen /> : <Navigate to="/org-creation" replace />;
  }

  if (!tenantSlug) {
    window.location.href = buildWorkspaceUrl(workspace.slug, `${location.pathname}${location.search}`);
    return <LoadingScreen />;
  }

  // Signed in, on the right subdomain → render the protected route
  return <Outlet />;
};
