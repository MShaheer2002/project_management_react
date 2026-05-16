import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * GuestGuard
 *
 * Protects public-only routes (login, signup, etc.) from already-authenticated users.
 * - If Clerk is still loading → show loading spinner
 * - If user IS signed in → redirect to / (dashboard)
 * - If user is NOT signed in → render the public route
 *
 * Usage in routes.tsx:
 *   <Route element={<GuestGuard />}>
 *     <Route path="/login" element={<LoginPage />} />
 *   </Route>
 */
export const GuestGuard: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();

  // Clerk still initializing — show loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-bg-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold animate-pulse">
            L
          </div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Already signed in → redirect to dashboard
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  // Not signed in → render the public route (login, signup, etc.)
  return <Outlet />;
};
