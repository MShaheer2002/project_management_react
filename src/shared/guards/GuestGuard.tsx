import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useTenantStore } from '@/app/stores/useTenantStore';
import { getSafeRedirectPath } from '@shared/utils/safeRedirect';
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
 * GuestGuard
 *
 * Protects public-only routes (login, signup, etc.) from already-authenticated users.
 *
 * If signed in:
 *   - On a company subdomain → AuthSync is the sole authority on membership here;
 *     wait for it to resolve, then honor `?redirect=` (e.g. AuthGuard sending back
 *     to /projects/123) ONLY once membership is confirmed — never based on the
 *     param alone, or on /no-access
 *   - On the bare domain, has a `?redirect=` (e.g. an invite link that bounced
 *     through /login) → honor it
 *   - On the bare domain, on /signup specifically → "sign up" means "I want
 *     something new," not "let me into my existing account" — send to
 *     /org-creation to create an ADDITIONAL company, never into one they
 *     already belong to
 *   - On the bare domain, on /login, has a workspace → AuthSync is mid-redirect
 *     to that workspace's own subdomain (a real browser navigation); show
 *     loading, don't flash anything here first
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
  const { pathname } = useLocation();

  // Clerk or backend workspace sync still loading — show loading state to prevent redirect flash
  if (!isLoaded || (isSignedIn && authSyncStatus !== 'ready')) {
    return <LoadingScreen />;
  }

  if (isSignedIn) {
    const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));

    if (tenantSlug) {
      // On a company subdomain, AuthSync is the sole authority on
      // membership — it already resolved this to either a matched
      // workspace or a navigate to /no-access. Deliberately checked BEFORE
      // the redirectTo branch below: an arbitrary `?redirect=` param must
      // never be honored on a subdomain the user isn't confirmed to belong
      // to, even briefly — this doesn't expose any data by itself (that's
      // still gated server-side), but a routing guard shouldn't hand out a
      // "confirmed" destination it hasn't actually confirmed.
      if (!workspace) return <LoadingScreen />;
      return <Navigate to={redirectTo ?? '/dashboard'} replace />;
    }

    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    if (pathname === '/signup' && workspace) {
      // Already have an account and at least one company — "sign up" here
      // means starting a new one, same as the switcher's "create new
      // workspace" option, not re-entering a company already joined.
      return <Navigate to="/org-creation?new=true" replace />;
    }

    if (workspace) {
      // Bare domain, and AuthSync only ever redirects to a workspace
      // subdomain from /login specifically (see REDIRECT_TO_SUBDOMAIN_PATHS
      // in AuthSync.tsx) — so only wait here on /login itself. Landing
      // signed-in with a workspace on /forgot-password etc. has no redirect
      // coming; send to the landing page instead of hanging forever.
      return pathname === '/login' ? <LoadingScreen /> : <Navigate to="/marketing" replace />;
    }

    // Signed in but no workspace anywhere — must create one first
    return <Navigate to="/org-creation" replace />;
  }

  // Not signed in → render the public route
  return <Outlet />;
};
