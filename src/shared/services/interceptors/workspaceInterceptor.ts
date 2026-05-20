import type { AxiosInstance } from 'axios';
import { useAuthStore } from '@/app/stores/useAuthStore';

/**
 * Injects X-Workspace-Id header on every private API request.
 * Reads from Zustand at call time so workspace switches are instant.
 */
export function attachWorkspaceInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const method = config.method?.toLowerCase();
    const path = getPathname(config.url);

    if (isWorkspaceContextExempt(method, path)) {
      return config;
    }

    const workspace = useAuthStore.getState().workspace;
    if (workspace?.id) {
      config.headers['X-Workspace-Id'] = workspace.id;
    }
    return config;
  });
}

function getPathname(url: string | undefined): string {
  if (!url) return '';

  try {
    return new URL(url, 'http://linearis.local').pathname;
  } catch {
    return url.split('?')[0] ?? '';
  }
}

function isWorkspaceContextExempt(method: string | undefined, path: string): boolean {
  if (method === 'get' && path === '/workspaces') return true;
  if (method === 'post' && path === '/workspaces') return true;
  if (method === 'get' && path.startsWith('/workspaces/check-slug/')) return true;
  if (method === 'get' && path === '/invitations/resolve') return true;
  if (method === 'post' && path === '/invitations/accept') return true;

  return false;
}
