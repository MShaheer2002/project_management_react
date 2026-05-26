import { privateApi } from '@shared/services/privateApi';
import type { ApiPaginatedResponse } from '@shared/services/types';
import type { ActivityItem, ActivityListResult, ListActivityInput } from '../types';

type RawActivityResponseItem = {
  id: string;
  type: string;
  message?: string;
  description?: string;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email?: string;
    avatar?: string | null;
  };
  target?: {
    type: ActivityItem['target']['type'];
    id: string;
    entityId?: string;
    name?: string;
    url?: string;
  };
  metadata?: Record<string, unknown>;
};

type RawActivityMeta = {
  total?: number;
  cursor?: string | null;
  nextCursor?: string | null;
  hasMore: boolean;
};

type RawActivityPaginatedResponse = {
  success: true;
  data: RawActivityResponseItem[];
  meta: RawActivityMeta;
};

const normalizeActivityItem = (item: RawActivityResponseItem): ActivityItem => ({
  id: item.id,
  type: item.type,
  message: item.message ?? item.description ?? '',
  createdAt: item.createdAt,
  actor: item.actor
    ? {
        id: item.actor.id,
        name: item.actor.name,
        email: item.actor.email,
        avatar: item.actor.avatar ?? null,
      }
    : undefined,
  target: {
    type: item.target?.type ?? 'workspace',
    id: item.target?.id ?? '',
    entityId: item.target?.entityId,
    name: item.target?.name,
    url: item.target?.url,
  },
  metadata: item.metadata,
});

export const activityService = {
  list: async (params: ListActivityInput = {}): Promise<ActivityListResult> => {
    const { data } = await privateApi.get<RawActivityPaginatedResponse | ApiPaginatedResponse<RawActivityResponseItem>>(
      '/activity',
      { params }
    );

    const meta = data.meta as RawActivityMeta;

    return {
      items: data.data.map(normalizeActivityItem),
      meta: {
        total: meta.total ?? data.data.length,
        cursor: meta.nextCursor ?? meta.cursor ?? null,
        hasMore: Boolean(meta.hasMore),
      },
    };
  },
};
