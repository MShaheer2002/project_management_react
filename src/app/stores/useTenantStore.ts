import { create } from 'zustand';
import axios from 'axios';
import { getTenantSlugFromHost } from '@shared/utils/tenant';

export type TenantStatus = 'none' | 'checking' | 'found' | 'not-found';

export interface TenantWorkspaceMeta {
  name: string;
  logo?: string;
}

interface TenantState {
  /** Company subdomain from the URL, e.g. "fissiontech" — null on the bare domain. */
  slug: string | null;
  status: TenantStatus;
  workspace: TenantWorkspaceMeta | null;
  /** Resolves `slug` against the backend once. No-op if there's no slug, or already resolved. */
  resolve: () => Promise<void>;
}

const initialSlug = getTenantSlugFromHost();

/**
 * Tenant store — answers "does the company subdomain in the URL bar actually
 * exist?" before login. This is routing information only (which workspace a
 * visitor is claiming to reach), never proof of membership — the backend
 * still enforces WorkspaceMembership on every authenticated request
 * regardless of what this resolved to. See TenantResolver for how the
 * 'not-found' redirect is applied, and AuthSync for how a signed-in user
 * gets matched against (or rejected from) this workspace.
 */
export const useTenantStore = create<TenantState>()((set, get) => ({
  slug: initialSlug,
  status: initialSlug ? 'checking' : 'none',
  workspace: null,

  resolve: async () => {
    const { slug, status } = get();
    if (!slug || status !== 'checking') return;

    const baseUrl = process.env.BASE_URL || 'http://localhost:8000';

    try {
      // Raw axios (not publicApi) — publicApi's shared error interceptor
      // treats a WORKSPACE_NOT_FOUND 404 as "an existing workspace got
      // deleted" and redirects to /org-creation, which is wrong here: this
      // is an unauthenticated check for whether the subdomain is real at
      // all, so it needs its own handling below, not the shared one.
      const { data } = await axios.get(`${baseUrl}/workspaces/resolve/${slug}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 5000,
      });
      set({ status: 'found', workspace: { name: data.data.name, logo: data.data.logo || undefined } });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        set({ status: 'not-found' });
        return;
      }
      // Backend unreachable/erroring — fail open rather than bounce a real
      // company subdomain to the landing page over a transient blip. The
      // actual security check still happens server-side on every request.
      console.warn('[Tenant] Could not verify workspace, proceeding anyway:', err);
      set({ status: 'found', workspace: null });
    }
  },
}));
