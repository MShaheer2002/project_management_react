import { useEffect } from 'react';
import { useTenantStore } from '@/app/stores/useTenantStore';
import { TrussenAppLogo } from '@/assets/svg/TrussenAppLogo';

const LANDING_URL = import.meta.env.DEV
  ? `${window.location.protocol}//localhost:${window.location.port}`
  : 'https://trussen.app';

/**
 * TenantResolver — runs once, before anything else renders, to answer
 * "does the company subdomain in the URL actually exist?"
 *
 * - No subdomain at all (bare trussen.app / localhost) → renders children
 *   immediately, nothing changes from today's behavior.
 * - Subdomain doesn't match any workspace → redirect off to the landing
 *   domain instead of rendering the app at all.
 * - Subdomain matches a real workspace → renders children; routes.tsx and
 *   AuthSync read useTenantStore to show sign-in-only UI and to pick the
 *   right workspace once the user logs in.
 */
export const TenantResolver: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const status = useTenantStore((s) => s.status);
  const resolve = useTenantStore((s) => s.resolve);

  useEffect(() => {
    resolve();
  }, [resolve]);

  if (status === 'not-found') {
    window.location.replace(LANDING_URL);
    return null; // mid-redirect — render nothing rather than flash the app
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-bg-dark">
        <div className="flex flex-col items-center gap-3">
          <TrussenAppLogo className="w-12 h-12 animate-pulse" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
