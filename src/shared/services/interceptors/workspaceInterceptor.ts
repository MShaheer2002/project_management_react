import type { AxiosInstance } from 'axios';
import { useAuthStore } from '@/app/stores/useAuthStore';

/**
 * Injects X-Workspace-Id header on every private API request.
 * Reads from Zustand at call time so workspace switches are instant.
 */
export function attachWorkspaceInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const workspace = useAuthStore.getState().workspace;
    if (workspace?.id) {
      config.headers['X-Workspace-Id'] = workspace.id;
    }
    return config;
  });
}
