import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useTenantStore } from '@/app/stores/useTenantStore';
import { TrussenAppLogo } from '@/assets/svg/TrussenAppLogo';

function getSafeRedirect(value: string | null): string | null {
  if (!value) return null;
  return value.startsWith('/') && !value.startsWith('//') ? value : null;
}

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-bg-dark">
    <div className="flex flex-col items-center gap-3">
      <TrussenAppLogo className="w-12 h-12 animate-pulse" />
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  </div>
);

/**
 * GuestGuard
 *
 * Protects public-only routes (login, signup, etc.) from already-authenticated users.
 *
 * If signed in:
 *   - Has a `?redirect=` (e.g. an invite link that bounced through /login) → honor it first
 *   - On a company subdomain → AuthSync already decided /dashboard or /no-access; this
 *     guard just waits for that rather than making its own competing decision
 *   - On the bare domain, has a workspace → AuthSync is mid-redirect to that workspace's
 *     own subdomain (a real browser navigation); show loading, don't flash /dashboard here first
 *   - On the bare domain, no workspace anywhere → /org-creation (must onboard first)
 *
 * If not signed in:
 *   - Render the public route normally
 */
export const GuestGuard: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const workspace = useAuthStore((s) => s.workspace);
  const authSyncStatus = useAuthStore((s) => s.authSyncStatus);
  const tenantSlug = useTenantStore((s) => s.slug);
  const [searchParams] = useSearchParams();

  // Clerk or backend workspace sync still loading — show loading state to prevent redirect flash
  if (!isLoaded || (isSignedIn && authSyncStatus !== 'ready')) {
    return <LoadingScreen />;
  }

  if (isSignedIn) {
    const redirectTo = getSafeRedirect(searchParams.get('redirect'));
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    if (tenantSlug) {
      // On a company subdomain, AuthSync already resolved this: /dashboard
      // if this account is a member, or a navigate to /no-access if not.
      // Nothing for this guard to decide independently.
      return workspace ? <Navigate to="/dashboard" replace /> : <LoadingScreen />;
    }

    if (workspace) {
      // Bare domain — AuthSync is redirecting to the workspace's own
      // subdomain right now (window.location, not a route change).
      // Rendering /dashboard here first would just flash the wrong domain.
      return <LoadingScreen />;
    }

    // Signed in but no workspace anywhere — must create one first
    return <Navigate to="/org-creation" replace />;
  }

  // Not signed in → render the public route
  return <Outlet />;
};
