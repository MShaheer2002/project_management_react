import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-react';
import { useThemeStore } from '@/app/stores/useThemeStore';
import { applyThemeToDom } from '@shared/theme/theme';
import { queryClient } from './lib/query-client';
import App from './App.tsx';
import './index.css';

/**
 * Clerk publishable key — injected via vite.config.ts define from .env
 * This is a PUBLIC key (pk_test_* or pk_live_*), safe to expose in frontend.
 */
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing CLERK_PUBLISHABLE_KEY in environment variables. Check your .env file.');
}

applyThemeToDom(useThemeStore.getState().theme);

/**
 * Provider order (outermost → innermost):
 * 1. ClerkProvider — auth state, must be outermost so all hooks work
 * 2. QueryClientProvider — server state caching (TanStack Query)
 * 3. BrowserRouter — URL-based routing
 * 4. App — our application root
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
);
