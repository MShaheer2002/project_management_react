import { privateApi } from '@shared/services/privateApi';
import { publicApi } from '@shared/services/publicApi';
import type { ApiResponse } from '@shared/services/types';

/**
 * Workspace API response types.
 * Match the backend response shapes from workspace_integration.md §11.
 *
 * POST /workspaces response includes `defaultTeamId` — the auto-created
 * team (same name as workspace). Store this for invite forms and first
 * project/issue creation.
 */
export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  role: string;           // "OWNER" | "ADMIN" | "MEMBER" | "GUEST"
  defaultTeamId?: string; // Auto-created team ID (returned on POST /workspaces)
  teamSize?: string;      // "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE"
  createdAt?: string;
}

export interface CreateWorkspaceInput {
  name: string;     // 1-100 chars, required
  slug: string;     // 3-50 chars, lowercase a-z 0-9 hyphens
  teamSize?: string; // Optional: "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE"
}

export interface SlugCheckResponse {
  available: boolean;
}

/**
 * Reserved slugs — rejected by the backend.
 * Frontend validates these client-side to avoid unnecessary API calls.
 * From workspace_integration.md §2: Slug Rules.
 */
const RESERVED_SLUGS = new Set([
  'api', 'app', 'admin', 'www', 'mail', 'help', 'support', 'billing',
  'status', 'docs', 'blog', 'login', 'signup', 'auth', 'oauth', 'sso',
  'webhook', 'webhooks', 'settings', 'dashboard', 'onboarding',
]);

/**
 * Workspace service — handles all workspace-related API calls.
 * Uses privateApi (authenticated) for most endpoints.
 * Uses publicApi for slug availability check (no auth needed during onboarding).
 *
 * Per R4.2: Services are the only data access layer.
 * Per R4.3: All methods return promises.
 * Per R4.4: One service per feature domain.
 */
export const workspaceService = {
  /**
   * GET /workspaces — list all workspaces the current user belongs to.
   * Used by AuthSync on every app load to determine if user needs onboarding.
   */
  getAll: async (): Promise<WorkspaceResponse[]> => {
    const { data } = await privateApi.get<ApiResponse<WorkspaceResponse[]>>('/workspaces');
    return data.data;
  },

  /**
   * POST /workspaces — create a new workspace.
   * The creating user automatically becomes OWNER.
   * Returns the created workspace with role.
   */
  create: async (input: CreateWorkspaceInput): Promise<WorkspaceResponse> => {
    const { data } = await privateApi.post<ApiResponse<WorkspaceResponse>>('/workspaces', input);
    return data.data;
  },

  /**
   * GET /workspaces/check-slug/:slug — check if a slug is available.
   * Public endpoint — no auth needed (used during onboarding before workspace exists).
   */
  checkSlug: async (slug: string): Promise<boolean> => {
    try {
      const { data } = await publicApi.get<ApiResponse<SlugCheckResponse>>(`/workspaces/check-slug/${slug}`);
      return data.data.available;
    } catch {
      // If the check fails (network/server error), assume available and let backend validate on submit
      return true;
    }
  },

  /**
   * Client-side slug validation.
   * Returns error message or null if valid.
   * From workspace_integration.md §2: Slug Rules.
   */
  validateSlug: (slug: string): string | null => {
    if (slug.length < 3) return 'Must be at least 3 characters';
    if (slug.length > 50) return 'Must be 50 characters or less';
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) return 'Only lowercase letters, numbers, and hyphens';
    if (slug.startsWith('-') || slug.endsWith('-')) return 'Cannot start or end with a hyphen';
    if (RESERVED_SLUGS.has(slug)) return 'This URL is reserved';
    return null;
  },
};
