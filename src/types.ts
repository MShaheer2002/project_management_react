
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
export type UserRole = 'admin' | 'co-admin' | 'team-lead' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  teamId?: string;
  lastActive?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assigneeId?: string;
  creatorId: string;
  projectId: string;
  teamId: string;
  labels: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  teamId: string;
  status: 'active' | 'archived' | 'completed';
  progress: number;
  issueCount: number;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  leadId: string;
  memberIds: string[];
  projectIds: string[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface Notification {
  id: string;
  type: 'mention' | 'assignment' | 'update';
  userId: string;
  actorId: string;
  issueId?: string;
  description: string;
  timestamp: string;
  read: boolean;
}

export interface Activity {
  id: string;
  type: 'issue_created' | 'issue_completed' | 'comment_added' | 'member_joined';
  actorId: string;
  targetId: string;
  targetType: 'issue' | 'project' | 'team';
  description: string;
  timestamp: string;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  connected: boolean;
}

export interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  issueCount: number;
  progress: number;
  status: 'current' | 'upcoming' | 'completed';
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt?: string;
}

export type ViewType = 
  | 'marketing'
  | 'dashboard' 
  | 'inbox' 
  | 'my-tasks' 
  | 'issues'
  | 'create-issue'
  | 'templates'
  | 'projects' 
  | 'project-details'
  | 'teams' 
  | 'team-details'
  | 'members'
  | 'roadmap' 
  | 'cycles' 
  | 'analytics' 
  | 'activity' 
  | 'integrations'
  | 'api-keys'
  | 'billing'
  | 'settings'
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'reset-password'
  | 'email-verification'
  | 'org-creation';

export type ModalType = 
  | 'create-task'
  | 'create-project'
  | 'create-cycle'
  | 'create-team'
  | 'invite-member'
  | 'generate-api-key'
  | null;

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
