import type { AxiosInstance } from 'axios';
import { attachAuthInterceptor } from './authInterceptor';
import { attachWorkspaceInterceptor } from './workspaceInterceptor';
import { attachErrorInterceptor } from './errorInterceptor';

export { setClerkTokenGetter } from './authInterceptor';
export { attachErrorInterceptor };

/**
 * Attach all interceptors to a private API instance.
 * Order:
 *   1. Auth token (request) — must run first
 *   2. Workspace header (request)
 *   3. Error handler (response)
 */
export function attachAllInterceptors(instance: AxiosInstance) {
  attachAuthInterceptor(instance);
  attachWorkspaceInterceptor(instance);
  attachErrorInterceptor(instance);
}
