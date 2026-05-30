import type { ApiListMeta } from '@shared/services/types';

export type ActivityScope = 'workspace' | 'project' | 'team' | 'issue' | 'cycle';

export type ActivityTargetType =
  | 'workspace'
  | 'project'
  | 'team'
  | 'cycle'
  | 'issue'
  | 'comment'
  | 'label'
  | 'member';

export interface ActivityActor {
  id: string;
  name: string;
  email?: string;
  avatar?: string | null;
}

export interface ActivityTarget {
  type: ActivityTargetType;
  id: string;
  entityId?: string;
  name?: string;
  url?: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  actor?: ActivityActor;
  target: ActivityTarget;
  metadata?: Record<string, unknown>;
}

export interface ActivityListResult {
  items: ActivityItem[];
  meta: ApiListMeta;
}

export interface ListActivityInput {
  scope?: ActivityScope;
  scopeId?: string;
  actorId?: string;
  types?: string;
  entityTypes?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}
