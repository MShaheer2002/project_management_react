import { ClerkTokenBridge } from '@/app/providers/ClerkTokenBridge';
import { AuthSync } from '@/app/providers/AuthSync';
import { AppProvider } from './AppContext';
import { AppRoutes } from '@/app/routes';
import { ToastContainer } from '@/components/ToastContainer';

/**
 * App — Root component.
 *
 * Provider order (from main.tsx → App.tsx):
 * 1. ClerkProvider (main.tsx) — Clerk auth context
 * 2. QueryClientProvider (main.tsx) — TanStack Query
 * 3. BrowserRouter (main.tsx) — React Router
 * 4. ClerkTokenBridge — bridges Clerk getToken() → Axios interceptor
 * 5. AuthSync — syncs Clerk user → backend /me → Zustand auth store
 * 6. AppProvider — LEGACY compatibility wrapper for useApp() consumers
 *    (35+ components still use useApp() — will be removed after full migration)
 * 7. AppRoutes — all route definitions with guards
 *
 * ToastContainer is rendered here (root level) so toasts work on EVERY page
 * including auth pages (login, signup, verify) which are outside MainLayout.
 */
export default function App() {
  return (
    <ClerkTokenBridge>
      <AuthSync>
        <AppProvider>
          <AppRoutes />
          {/* Global toast — renders on all pages (auth, dashboard, everywhere) */}
          <ToastContainer />
        </AppProvider>
      </AuthSync>
    </ClerkTokenBridge>
  );
}
