import type { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import { getTenantSlugFromHost, buildLandingUrl } from '@shared/utils/tenant';
import type { ApiError } from '../types';

/**
 * /org-creation only exists on the bare domain ("create a new company" is
 * never a tenant-subdomain action). If this fires while sitting on
 * acme.trussen.app, a plain relative redirect would land on
 * acme.trussen.app/org-creation instead — a real navigation to the bare
 * domain is needed here, same reasoning as everywhere else workspace
 * context crosses an origin boundary.
 */
function goToOrgCreation() {
  if (typeof window === 'undefined') return;
  window.location.href = getTenantSlugFromHost() ? buildLandingUrl('/org-creation') : '/org-creation';
}

/**
 * Global error response interceptor.
 *
 * Handles common HTTP errors so feature hooks don't repeat boilerplate.
 * Feature-specific handling (e.g., 422 form errors) is done in the hook — not here.
 *
 * | Status | Action                                          |
 * |--------|-------------------------------------------------|
 * | 401    | Clear auth store, redirect to /login            |
 * | 403    | Toast "permission denied" (unless USER_NOT_SYNCED) |
 * | 409    | Toast the backend message                       |
 * | 422    | Skip — let form hooks handle field errors        |
 * | 429    | Toast "rate limited"                            |
 * | 500+   | Toast "server error"                            |
 * | Network| Toast "network error"                           |
 */
export function attachErrorInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
      const showToast = useToastStore.getState().showToast;

      // A request cancelled via AbortController (e.g. Escape while an AI
      // generation is in flight) is a deliberate user action, not a failure —
      // it must never surface as a "network error" toast.
      if (error.code === 'ERR_CANCELED') {
        return Promise.reject(error);
      }

      // Network error — no response received
      if (!error.response) {
        showToast('Please check your internet connection and try again.', 'error', 'Network error');
        return Promise.reject(error);
      }

      const { status, data } = error.response;
      const errorCode = data?.error?.code;
      const errorMessage = data?.error?.message || 'Something went wrong';
      const skipGlobalErrorToast = (
        error.config as (typeof error.config & { skipGlobalErrorToast?: boolean }) | undefined
      )?.skipGlobalErrorToast;

      switch (status) {
        case 401:
          useAuthStore.getState().clear();
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            // Preserve where they were (e.g. mid-session expiry on
            // company.trussen.app/projects/123) so GuestGuard can send them
            // back after re-authenticating, same mechanism AuthGuard uses.
            const returnTo = `${window.location.pathname}${window.location.search}`;
            window.location.href = `/login?redirect=${encodeURIComponent(returnTo)}`;
          }
          break;

        case 403:
          if (errorCode === 'NOT_WORKSPACE_MEMBER') {
            // User was removed from workspace — clear stored workspace and redirect
            console.warn('[ErrorInterceptor] NOT_WORKSPACE_MEMBER — clearing workspace, redirecting to onboarding');
            useAuthStore.getState().setAuth(
              useAuthStore.getState().currentUser!,
              null
            );
            goToOrgCreation();
          } else if (errorCode === 'FREE_PLAN_ACCESS_LIMIT_EXCEEDED') {
            // Still a member, just over the Free plan's seat cap — don't clear
            // the workspace or redirect to onboarding, just explain why every
            // action is being blocked until the owner upgrades or seats free up.
            showToast(errorMessage, 'error', 'Workspace over member limit');
          } else if (errorCode !== 'USER_NOT_SYNCED' && !skipGlobalErrorToast) {
            showToast("You don't have permission to perform this action.", 'error', 'Access denied');
          }
          break;

        case 404:
          if (errorCode === 'WORKSPACE_NOT_FOUND') {
            // Workspace was deleted — clear stored workspace and redirect
            console.warn('[ErrorInterceptor] WORKSPACE_NOT_FOUND — workspace deleted, redirecting to onboarding');
            useAuthStore.getState().setAuth(
              useAuthStore.getState().currentUser!,
              null
            );
            goToOrgCreation();
          }
          // Don't toast generic 404s — let pages handle "not found" UI
          break;

        case 409:
          if (!skipGlobalErrorToast) {
            showToast(errorMessage, 'error');
          }
          break;

        case 422:
          // Skip — form hooks handle field-level validation errors
          break;

        case 429:
          showToast('Please wait a moment before trying again.', 'warning', 'Too many requests');
          break;

        default:
          if (status >= 500 && !skipGlobalErrorToast) {
            showToast('Something went wrong on our end. Please try again later.', 'error', 'Server error');
          }
          break;
      }

      return Promise.reject(error);
    }
  );
}
