import type { AxiosInstance } from 'axios';
import { attachAuthInterceptor } from './authInterceptor';
import { attachWorkspaceInterceptor } from './workspaceInterceptor';
import { attachErrorInterceptor } from './errorInterceptor';
import { attachPathGuard } from './pathGuard';

export { setClerkTokenGetter, getAuthToken } from './authInterceptor';
export { attachErrorInterceptor, attachPathGuard };

/**
 * Attach all interceptors to a private API instance.
 * Order:
 *   1. Auth token (request) — must run first
 *   2. Workspace header (request)
 *   3. Error handler (response)
 */
export function attachAllInterceptors(instance: AxiosInstance) {
  attachPathGuard(instance);
  attachAuthInterceptor(instance);
  attachWorkspaceInterceptor(instance);
  attachErrorInterceptor(instance);
}
