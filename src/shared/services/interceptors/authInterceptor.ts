import type { AxiosInstance } from 'axios';

/**
 * Holds the Clerk getToken function.
 * Set by ClerkTokenBridge component at app startup.
 * This bridges the React world (Clerk hooks) → module-level Axios interceptors.
 */
let _getToken: (() => Promise<string | null>) | null = null;

export function setClerkTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

/** Get a fresh auth token. Used by SSE/fetch calls that bypass Axios. */
export async function getAuthToken(): Promise<string | null> {
  if (!_getToken) return null;
  try {
    return await _getToken();
  } catch {
    return null;
  }
}

export function attachAuthInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use(async (config) => {
    if (_getToken) {
      try {
        const token = await _getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Token retrieval failed — let the request go without auth.
        // The error interceptor will handle the 401 response.
      }
    }
    return config;
  });
}
