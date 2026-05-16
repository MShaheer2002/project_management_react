import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setClerkTokenGetter } from '@shared/services/interceptors';

/**
 * ClerkTokenBridge
 *
 * Bridges Clerk's React-only `getToken()` function into our module-level
 * Axios interceptor system. Without this, the auth interceptor can't get
 * Clerk session tokens because Axios instances are created at import time
 * (before React renders).
 *
 * How it works:
 * 1. This component renders inside <ClerkProvider>
 * 2. It grabs `getToken` from Clerk's `useAuth()` hook
 * 3. It passes that function to the Axios auth interceptor via `setClerkTokenGetter`
 * 4. From that point on, every privateApi request auto-injects the Bearer token
 *
 * Must be placed as a child of <ClerkProvider> in the component tree.
 */
export const ClerkTokenBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken } = useAuth();

  useEffect(() => {
    // Register Clerk's getToken so Axios interceptor can use it
    console.log('[ClerkTokenBridge] Registering Clerk getToken with Axios interceptor');
    setClerkTokenGetter(getToken);
  }, [getToken]);

  return <>{children}</>;
};
