import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { TrussenAppLogo } from '@/assets/svg/TrussenAppLogo';

/**
 * GuestGuard
 *
 * Protects public-only routes (login, signup, etc.) from already-authenticated users.
 *
 * If signed in:
 *   - Has workspace → redirect to /dashboard
 *   - No workspace  → redirect to /org-creation (must complete onboarding first)
 *
 * If not signed in:
 *   - Render the public route normally
 */
export const GuestGuard: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const workspace = useAuthStore((s) => s.workspace);
  const authSyncStatus = useAuthStore((s) => s.authSyncStatus);

  // Clerk or backend workspace sync still loading — show loading state to prevent redirect flash
  if (!isLoaded || (isSignedIn && authSyncStatus !== 'ready')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-bg-dark">
        <div className="flex flex-col items-center gap-3">
          <TrussenAppLogo className="w-12 h-12 animate-pulse" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Already signed in → send to dashboard or onboarding
  if (isSignedIn) {
    if (workspace) {
      return <Navigate to="/dashboard" replace />;
    }
    // Signed in but no workspace — must create one first
    return <Navigate to="/org-creation" replace />;
  }

  // Not signed in → render the public route
  return <Outlet />;
};
