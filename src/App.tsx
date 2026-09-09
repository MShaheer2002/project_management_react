import { ClerkTokenBridge } from '@/app/providers/ClerkTokenBridge';
import { TenantResolver } from '@/app/providers/TenantResolver';
import { AuthSync } from '@/app/providers/AuthSync';
import { RealtimeNotificationProvider } from '@/app/providers/RealtimeNotificationProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { AppProvider } from './AppContext';
import { AppRoutes } from '@/app/routes';
import { ToastContainer } from '@/components/ToastContainer';
import { ConfirmDialogHost } from '@/components/ConfirmDialogHost';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';

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
    <ThemeProvider>
      <ClerkTokenBridge>
        {/* Resolves the company subdomain (if any) before anything else renders —
            redirects off unknown ones, so AuthSync/routes never see a fake tenant. */}
        <TenantResolver>
          <AuthSync>
            <RealtimeNotificationProvider>
              <AppProvider>
                {/* Root-level safety net for crashes outside MainLayout (auth pages, routing
                    itself) — MainLayout has its own boundary around just the page Outlet so a
                    crash there doesn't take down the sidebar too; this one is the last resort. */}
                <ErrorBoundary
                  title="Trussen hit an unexpected error"
                  description="Reloading usually fixes this. If it keeps happening, let us know what you were doing right before it appeared."
                >
                  <AppRoutes />
                </ErrorBoundary>
                {/* Global toast — renders on all pages (auth, dashboard, everywhere) */}
                <ToastContainer />
                {/* Global confirm dialog — replaces window.confirm() everywhere */}
                <ConfirmDialogHost />
              </AppProvider>
            </RealtimeNotificationProvider>
          </AuthSync>
        </TenantResolver>
      </ClerkTokenBridge>
    </ThemeProvider>
  );
}
