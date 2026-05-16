import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * AuthGuard
 *
 * Protects authenticated routes. Wraps <Outlet /> in routes.tsx.
 * - If Clerk is still loading → show a loading spinner (prevents flash)
 * - If user is NOT signed in → redirect to /login
 * - If user IS signed in → render the child route
 *
 * Usage in routes.tsx:
 *   <Route element={<AuthGuard />}>
 *     <Route path="/dashboard" element={<DashboardPage />} />
 *   </Route>
 */
export const AuthGuard: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();

  // Clerk still initializing — show loading state to prevent redirect flash
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

  // Not signed in → redirect to login
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Signed in → render the protected route
  return <Outlet />;
};
