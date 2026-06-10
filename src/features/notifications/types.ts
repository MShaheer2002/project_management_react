import type { ApiListMeta } from '@shared/services/types';

export type NotificationType =
  | 'MENTION'
  | 'ASSIGNMENT'
  | 'UPDATE'
  | 'COMMENT_REPLY'
  | 'PROJECT_MEMBER'
  | 'TEAM_MEMBER'
  | 'WORKSPACE_INVITE'
  | 'WORKSPACE_INVITATION'
  | 'ISSUE_DUE_SOON'
  | 'ISSUE_OVERDUE';

export type NotificationCategory = 'mention' | 'assignment' | 'update' | 'membership' | 'comment';

export type NotificationTargetType = 'issue' | 'comment' | 'project' | 'team' | 'workspace';

export interface NotificationActor {
  id: string;
  name: string;
  email?: string;
  avatar?: string | null;
}

export interface NotificationTarget {
  type: NotificationTargetType;
  id: string;
  publicId?: string;
  url: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType | string;
  category: NotificationCategory;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  actor?: NotificationActor;
  target: NotificationTarget;
  metadata?: Record<string, unknown>;
}

export interface NotificationsListResult {
  items: NotificationItem[];
  meta: ApiListMeta;
}

export interface ListNotificationsInput {
  cursor?: string;
  limit?: number;
  unreadOnly?: boolean;
  category?: NotificationCategory;
  types?: string;
  actorId?: string;
  targetType?: NotificationTargetType;
  from?: string;
  to?: string;
}

export interface UnreadNotificationsCount {
  unread: number;
}

export interface MarkNotificationReadInput {
  read?: boolean;
}

export interface MarkNotificationsBatchReadInput {
  ids: string[];
}
