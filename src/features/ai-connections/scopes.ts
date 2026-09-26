export interface ScopeOption {
  scope: string;
  description: string;
}

export interface ScopeCategory {
  label: string;
  read?: ScopeOption;
  write?: ScopeOption;
}

export const ADMIN_SCOPE = 'admin';

/**
 * What the self-service "Connect AI" flow starts with.
 *
 * Read-only on purpose: the admin wildcard used to be pre-ticked, so a member
 * clicking the generic Connect button bound their workspace at full access
 * (audit FE-N-03). The backend now rejects a non-admin asking for `admin`, so
 * this must also never be empty — an empty scope list reads as unrestricted.
 */
export const DEFAULT_OAUTH_SCOPES = ['issues:read', 'projects:read'];

export const SCOPE_CATEGORIES: ScopeCategory[] = [
  {
    label: 'Issues',
    read: { scope: 'issues:read', description: 'View issues, comments, and search' },
    write: { scope: 'issues:write', description: 'Create, edit, assign, comment on issues' },
  },
  {
    label: 'Projects',
    read: { scope: 'projects:read', description: 'View projects and summaries' },
    write: { scope: 'projects:write', description: 'Create and edit projects' },
  },
  {
    label: 'Teams',
    read: { scope: 'teams:read', description: 'View teams and workload' },
    write: { scope: 'teams:write', description: 'Create and edit teams' },
  },
  {
    label: 'Departments',
    read: { scope: 'departments:read', description: 'View departments' },
    write: { scope: 'departments:write', description: 'Create and edit departments' },
  },
  {
    label: 'Cycles',
    read: { scope: 'cycles:read', description: 'View cycles/sprints' },
    write: { scope: 'cycles:write', description: 'Create and edit cycles' },
  },
  {
    label: 'Members',
    read: { scope: 'members:read', description: 'View workspace members' },
  },
  {
    label: 'Analytics',
    read: { scope: 'analytics:read', description: 'View workspace, project, team, member, and cycle analytics' },
  },
];
