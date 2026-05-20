export interface SidebarUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

export interface SidebarWorkspace {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  teamSize: string | null;
  role: string;
}

export interface SidebarBadges {
  inbox: number;
  myIssues: number;
  pendingInvitations: number;
}

export interface SidebarTeam {
  id: string;
  name: string;
}

export interface SidebarPermissions {
  canCreateIssue: boolean;
  canCreateProject: boolean;
  canCreateTeam: boolean;
  canInviteMembers: boolean;
  canManageSettings: boolean;
  canManageBilling: boolean;
  canManageApiKeys: boolean;
  canManageTemplates: boolean;
  canDeleteWorkspace: boolean;
}

export interface SidebarData {
  user: SidebarUser;
  workspaces: SidebarWorkspace[];
  activeWorkspace: SidebarWorkspace;
  badges: SidebarBadges;
  teams: SidebarTeam[];
  permissions: SidebarPermissions;
}
