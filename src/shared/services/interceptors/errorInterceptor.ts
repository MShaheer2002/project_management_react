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
        showToast('Network error. Check your connection.', 'error');
        return Promise.reject(error);
      }

      const { status, data } = error.response;
      const errorCode = data?.error?.code;
      const errorMessage = data?.error?.message || 'Something went wrong';

      switch (status) {
        case 401:
          useAuthStore.getState().clear();
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
          break;

        case 403:
          if (errorCode !== 'USER_NOT_SYNCED') {
            showToast("You don't have permission to do that.", 'error');
          }
          break;

        case 409:
          showToast(errorMessage, 'error');
          break;

        case 422:
          // Skip — form hooks handle field-level validation errors
          break;

        case 429:
          showToast('Too many requests. Please wait a moment.', 'error');
          break;

        default:
          if (status >= 500) {
            showToast('Server error. Please try again later.', 'error');
          }
          break;
      }

      return Promise.reject(error);
    }
  );
}
