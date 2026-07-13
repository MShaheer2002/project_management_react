import { privateApi } from '@shared/services/privateApi';
import { publicApi } from '@shared/services/publicApi';
import type { ApiListMeta, ApiPaginatedResponse, ApiResponse } from '@shared/services/types';
import type { AxiosRequestConfig } from 'axios';

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
  uploadPolicy?: 'BOTH' | 'SYSTEM_ONLY' | 'DRIVE_ONLY';
  unreadNotifications?: number; // Per-workspace unread count (from GET /workspaces)
  joinedAt?: string;            // When user joined this workspace
  createdAt?: string;
  customStatuses?: Array<{ key: string; label: string; color: string; order: number; isFinal: boolean; showOnBoard: boolean }>;
}

export interface CreateWorkspaceInput {
  name: string;     // 1-100 chars, required
  slug: string;     // 3-50 chars, lowercase a-z 0-9 hyphens
  teamSize?: string; // Optional: "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE"
}

export interface SlugCheckResponse {
  available: boolean;
}

export type InvitationRole = 'ADMIN' | 'MEMBER' | 'GUEST';

export interface SendInvitationInput {
  workspaceId: string;
  email: string;
  role: InvitationRole;
  designation: string;
  teamId: string;
  departmentId?: string;
}

export interface InvitationResponse {
  id: string;
  email: string;
  role: InvitationRole;
  designation?: string | null;
  teamId: string;
  departmentId?: string | null;
  status?: string;
  existingUser?: boolean; // True if invitee already has a platform account
  createdAt?: string;
}

export interface UpdateWorkspaceInput {
  workspaceId: string;
  name?: string;
  logo?: string | null;
  uploadPolicy?: 'BOTH' | 'SYSTEM_ONLY' | 'DRIVE_ONLY';
}

export interface WorkspaceMemberResponse {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  designation?: string | null;
  invitedById?: string | null;
  joinedAt?: string;
  team?: {
    id: string;
    name: string;
    leadId?: string | null;
    departmentId?: string | null;
    joinedAt?: string;
    department?: WorkspaceMemberDepartment | null;
  } | null;
  teams?: WorkspaceMemberTeam[];
  department?: WorkspaceMemberDepartment | null;
  departments?: WorkspaceMemberDepartment[];
}

export interface WorkspaceMemberOption {
  id: string;
  name: string;
  email: string;
  role: string;
  designation?: string | null;
}

export type WorkspaceMemberSort = 'name:asc' | 'name:desc' | 'joinedAt:asc' | 'joinedAt:desc';
export type WorkspaceMemberFilterRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
export type WorkspaceMemberView = 'compact' | 'full';

export interface ListWorkspaceMembersInput {
  q?: string;
  cursor?: string;
  limit?: number;
  sort?: WorkspaceMemberSort;
  role?: WorkspaceMemberFilterRole;
}

export interface WorkspaceMemberListResult<T> {
  items: T[];
  meta: ApiListMeta;
}

export interface WorkspaceMemberDepartment {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  joinedAt?: string;
}

export interface WorkspaceMemberTeam {
  id: string;
  name: string;
  leadId?: string | null;
  departmentId?: string | null;
  joinedAt?: string;
  department?: WorkspaceMemberDepartment | null;
}

export interface UpdateMemberRoleInput {
  workspaceId: string;
  userId: string;
  role: InvitationRole;
}

export interface RemoveMemberInput {
  workspaceId: string;
  userId: string;
}

export interface WorkspaceInvitationResponse {
  id: string;
  email: string;
  role: string;
  designation?: string | null;
  status: string;
  teamId?: string;
  teamName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  invitedByName?: string | null;
  createdAt?: string;
  expiresAt?: string;
}

export interface InvitationResolveResponse {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  workspaceLogo?: string | null;
  role: string;
  designation?: string | null;
  teamName: string;
  departmentName?: string | null;
  invitedEmail: string;
}

export interface InvitationAcceptResponse {
  workspace: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  role: string;
  alreadyAccepted?: boolean;
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
 * Uses privateApi for slug availability check because the backend requires a
 * signed-in Clerk user during onboarding.
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

  getById: async (workspaceId: string): Promise<WorkspaceResponse> => {
    const { data } = await privateApi.get<ApiResponse<WorkspaceResponse>>(`/workspaces/${workspaceId}`);
    return data.data;
  },

  update: async (input: UpdateWorkspaceInput): Promise<WorkspaceResponse> => {
    const { workspaceId, ...payload } = input;
    const { data } = await privateApi.patch<ApiResponse<WorkspaceResponse>>(`/workspaces/${workspaceId}`, payload);
    return data.data;
  },

  delete: async (workspaceId: string): Promise<void> => {
    await privateApi.delete(`/workspaces/${workspaceId}`);
  },

  getStatuses: async (workspaceId: string): Promise<WorkspaceResponse['customStatuses']> => {
    const { data } = await privateApi.get<ApiResponse<WorkspaceResponse['customStatuses']>>(`/workspaces/${workspaceId}/statuses`);
    return data.data;
  },

  updateStatuses: async (workspaceId: string, statuses: NonNullable<WorkspaceResponse['customStatuses']>): Promise<NonNullable<WorkspaceResponse['customStatuses']>> => {
    const { data } = await privateApi.put<ApiResponse<NonNullable<WorkspaceResponse['customStatuses']>>>(`/workspaces/${workspaceId}/statuses`, statuses);
    return data.data;
  },

  /**
   * GET /workspaces/check-slug/:slug — check if a slug is available.
   * Authenticated endpoint — no workspace context needed, but Clerk auth is required.
   */
  checkSlug: async (slug: string): Promise<boolean> => {
    try {
      const { data } = await privateApi.get<ApiResponse<SlugCheckResponse>>(`/workspaces/check-slug/${slug}`);
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

  /**
   * POST /workspaces/:workspaceId/invitations — send an invitation email.
   * Requires ADMIN or OWNER in the active workspace.
   */
  sendInvitation: async (input: SendInvitationInput): Promise<InvitationResponse> => {
    const { workspaceId, ...payload } = input;
    const { data } = await privateApi.post<ApiResponse<InvitationResponse>>(
      `/workspaces/${workspaceId}/invitations`,
      payload,
      { skipGlobalErrorToast: true } as AxiosRequestConfig & { skipGlobalErrorToast: boolean }
    );
    return data.data;
  },

  getMembers: async (workspaceId: string): Promise<WorkspaceMemberResponse[]> => {
    const result = await workspaceService.listMemberDirectory(workspaceId, {
      limit: 100,
      sort: 'name:asc',
    });
    return result.items;
  },

  listMemberDirectory: async (
    workspaceId: string,
    params: ListWorkspaceMembersInput = {}
  ): Promise<WorkspaceMemberListResult<WorkspaceMemberResponse>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<WorkspaceMemberResponse>>(
      `/workspaces/${workspaceId}/members`,
      {
        params: {
          ...params,
          view: 'full',
        },
      }
    );
    return {
      items: data.data,
      meta: data.meta,
    };
  },

  listMemberOptions: async (
    workspaceId: string,
    params: ListWorkspaceMembersInput = {}
  ): Promise<WorkspaceMemberListResult<WorkspaceMemberOption>> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<WorkspaceMemberOption>>(
      `/workspaces/${workspaceId}/members`,
      {
        params: {
          ...params,
          view: 'compact',
        },
      }
    );
    return {
      items: data.data,
      meta: data.meta,
    };
  },

  updateMemberRole: async (input: UpdateMemberRoleInput): Promise<WorkspaceMemberResponse> => {
    const { workspaceId, userId, role } = input;
    const { data } = await privateApi.patch<ApiResponse<WorkspaceMemberResponse>>(
      `/workspaces/${workspaceId}/members/${userId}`,
      { role },
      { skipGlobalErrorToast: true } as AxiosRequestConfig & { skipGlobalErrorToast: boolean }
    );
    return data.data;
  },

  removeMember: async (input: RemoveMemberInput): Promise<void> => {
    const { workspaceId, userId } = input;
    await privateApi.delete(`/workspaces/${workspaceId}/members/${userId}`, {
      skipGlobalErrorToast: true,
    } as AxiosRequestConfig & { skipGlobalErrorToast: boolean });
  },

  getInvitations: async (workspaceId: string): Promise<WorkspaceInvitationResponse[]> => {
    const { data } = await privateApi.get<ApiResponse<WorkspaceInvitationResponse[]>>(
      `/workspaces/${workspaceId}/invitations`
    );
    return data.data;
  },

  revokeInvitation: async (workspaceId: string, invitationId: string): Promise<void> => {
    await privateApi.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`);
  },

  resolveInvitation: async (token: string): Promise<InvitationResolveResponse> => {
    const { data } = await publicApi.get<ApiResponse<InvitationResolveResponse>>('/invitations/resolve', {
      params: { t: token },
      skipGlobalErrorToast: true,
    } as AxiosRequestConfig & { skipGlobalErrorToast: boolean });
    return data.data;
  },

  acceptInvitation: async (token: string): Promise<InvitationAcceptResponse> => {
    const { data } = await privateApi.post<ApiResponse<InvitationAcceptResponse>>(
      '/invitations/accept',
      { token },
      { skipGlobalErrorToast: true } as AxiosRequestConfig & { skipGlobalErrorToast: boolean }
    );
    return data.data;
  },
};
