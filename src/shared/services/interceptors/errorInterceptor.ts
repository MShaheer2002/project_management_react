import type { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import type { ApiError } from '../types';

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
            window.location.href = '/login';
          }
          break;

        case 403:
          if (errorCode === 'NOT_WORKSPACE_MEMBER') {
            // User was removed from workspace — clear stored workspace and refetch
            // Per workspace_integration.md §9: Global 403 Handler
            console.warn('[ErrorInterceptor] NOT_WORKSPACE_MEMBER — clearing workspace, redirecting to onboarding');
            useAuthStore.getState().setAuth(
              useAuthStore.getState().currentUser!,
              null // clear workspace
            );
            if (typeof window !== 'undefined') {
              window.location.href = '/org-creation';
            }
          } else if (errorCode !== 'USER_NOT_SYNCED' && !skipGlobalErrorToast) {
            showToast("You don't have permission to perform this action.", 'error', 'Access denied');
          }
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
