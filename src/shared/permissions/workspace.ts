import type { UserRole } from '@/types';

type WorkspaceRoleInput = UserRole | null | undefined;

export const canCreateTeam = (role: WorkspaceRoleInput): boolean =>
  role === 'owner' || role === 'admin' || role === 'member';

export const canCreateProject = (role: WorkspaceRoleInput): boolean =>
  canCreateTeam(role);

export const canCreateDepartment = (role: WorkspaceRoleInput): boolean =>
  role === 'owner' || role === 'admin';

export const canManageDocuments = (role: WorkspaceRoleInput): boolean =>
  role === 'owner' || role === 'admin';

export const canManageTeam = (
  role: WorkspaceRoleInput,
  currentUserId: string | null | undefined,
  leadId: string | null | undefined
): boolean =>
  canCreateDepartment(role) || (Boolean(currentUserId) && currentUserId === leadId);

export const canManageDepartment = (
  role: WorkspaceRoleInput,
  currentUserId: string | null | undefined,
  headId: string | null | undefined
): boolean =>
  canCreateDepartment(role) || (Boolean(currentUserId) && currentUserId === headId);

export const canManageProject = (
  role: WorkspaceRoleInput,
  currentUserId: string | null | undefined,
  leadId: string | null | undefined
): boolean =>
  canCreateDepartment(role) || (Boolean(currentUserId) && currentUserId === leadId);

export const canManageRoadmap = (
  role: WorkspaceRoleInput,
  currentUserId: string | null | undefined,
  projectLeadId: string | null | undefined,
  teamLeadId: string | null | undefined
): boolean =>
  canCreateDepartment(role) ||
  (Boolean(currentUserId) && (currentUserId === projectLeadId || currentUserId === teamLeadId));

export const canForceRoadmapOverride = (role: WorkspaceRoleInput): boolean =>
  canManageDocuments(role);

export const canDeleteIssues = (role: WorkspaceRoleInput): boolean =>
  canManageDocuments(role);

export const canManageTemplates = (role: WorkspaceRoleInput): boolean =>
  canManageDocuments(role);

export const canManageApiKeys = (role: WorkspaceRoleInput): boolean =>
  role === 'owner' || role === 'admin';

export const canManageIntegrations = (role: WorkspaceRoleInput): boolean =>
  role === 'owner' || role === 'admin';
