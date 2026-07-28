import React from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { TrussenAppLogo } from '@/assets/svg/TrussenAppLogo';

/**
 * SSOCallbackPage
 *
 * Handles the OAuth redirect callback from Google/GitHub.
 * After the user authorizes on the provider's site, they're redirected
 * back to /sso-callback. Clerk's component handles:
 * 1. Exchanging the OAuth code for a session
 * 2. Creating the session
 * 3. Redirecting to the `redirectUrlComplete` (usually "/")
 *
 * This page MUST be outside both AuthGuard and GuestGuard in routes.tsx
 * because the user is in a transitional state during the callback.
 */
export const SSOCallbackPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-bg-dark">
      <div className="flex flex-col items-center gap-3">
        <TrussenAppLogo className="w-12 h-12 animate-pulse" />
        <p className="text-sm text-gray-400">Completing sign in...</p>
      </div>
      {/* Clerk handles the actual OAuth callback logic here */}
      <AuthenticateWithRedirectCallback />
    </div>
  );
};
