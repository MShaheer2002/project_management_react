export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
export type UserRole = 'owner' | 'admin' | 'member' | 'guest';
export type IssueType = 'task' | 'bug' | 'issue';
export type Severity = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  teamId?: string;
  departmentId?: string;
  lastActive?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface IssueSubtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  type: IssueType;
  assigneeId?: string;
  creatorId: string;
  projectId: string;
  teamId: string;
  labels: string[];
  dueDate?: string;
  dueTime?: string;
  createdAt: string;
  updatedAt: string;
  subtasks: IssueSubtask[];
  estimate?: number;
  departmentId?: string;
  
  // Bug specific fields
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity?: Severity;
  
  // Issue (Feature) specific fields
  acceptanceCriteria?: string;
  relatedIssues?: string[];
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  teamId: string;
  departmentId?: string;
  status: 'active' | 'archived' | 'completed';
  progress: number;
  issueCount: number;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  leadId: string;
  departmentId?: string;
  memberIds: string[];
  projectIds: string[];
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  color?: string;
  icon?: string;
  memberIds: string[];
  teamIds: string[];
  projectIds: string[];
  visibility: 'public' | 'private';
  isDefault: boolean;
  createdAt: string;
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

export type { Toast, ModalType } from '@shared/types/common';
