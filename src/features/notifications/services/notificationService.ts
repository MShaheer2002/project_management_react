import type { AxiosRequestConfig } from 'axios';
import { privateApi } from '@shared/services/privateApi';
import type { ApiPaginatedResponse, ApiResponse } from '@shared/services/types';
import type {
  ListNotificationsInput,
  MarkNotificationReadInput,
  MarkNotificationsBatchReadInput,
  NotificationItem,
  NotificationsListResult,
  UnreadNotificationsCount,
} from '../types';

const mutationConfig = {
  skipGlobalErrorToast: true,
} as AxiosRequestConfig & { skipGlobalErrorToast: boolean };

type RawNotificationItem = {
  id: string;
  type: string;
  category: NotificationItem['category'];
  title?: string;
  message?: string;
  createdAt: string;
  readAt: string | null;
  actor?: {
    id: string;
    name: string;
    email?: string;
    avatar?: string | null;
  };
  target: {
    type: NotificationItem['target']['type'];
    id: string;
    publicId?: string;
    url: string;
  };
  metadata?: Record<string, unknown>;
};

type RawMeta = {
  total?: number;
  cursor?: string | null;
  nextCursor?: string | null;
  hasMore: boolean;
};

type RawPaginatedResponse = {
  success: true;
  data: RawNotificationItem[];
  meta: RawMeta;
};

const normalizeNotification = (item: RawNotificationItem): NotificationItem => ({
  id: item.id,
  type: item.type,
  category: item.category,
  title: item.title ?? item.type,
  message: item.message ?? '',
  createdAt: item.createdAt,
  readAt: item.readAt,
  actor: item.actor
    ? {
        id: item.actor.id,
        name: item.actor.name,
        email: item.actor.email,
        avatar: item.actor.avatar ?? null,
      }
    : undefined,
  target: {
    type: item.target.type,
    id: item.target.id,
    publicId: item.target.publicId,
    url: item.target.url,
  },
  metadata: item.metadata,
});

export const notificationService = {
  list: async (params: ListNotificationsInput = {}): Promise<NotificationsListResult> => {
    const { data } = await privateApi.get<RawPaginatedResponse | ApiPaginatedResponse<RawNotificationItem>>(
      '/notifications',
      { params }
    );

    const meta = data.meta as RawMeta;

    return {
      items: data.data.map(normalizeNotification),
      meta: {
        total: meta.total ?? data.data.length,
        cursor: meta.nextCursor ?? meta.cursor ?? null,
        hasMore: Boolean(meta.hasMore),
      },
    };
  },

  getUnreadCount: async (): Promise<UnreadNotificationsCount> => {
    const { data } = await privateApi.get<ApiResponse<UnreadNotificationsCount>>('/notifications/unread-count');
    return data.data;
  },

  markRead: async (
    notificationId: string,
    input: MarkNotificationReadInput = { read: true }
  ): Promise<{ id: string; readAt: string | null }> => {
    const { data } = await privateApi.patch<ApiResponse<{ id: string; readAt: string | null }>>(
      `/notifications/${notificationId}/read`,
      input,
      mutationConfig
    );
    return data.data;
  },

  markAllRead: async (): Promise<{ updated: number; readAt: string }> => {
    const { data } = await privateApi.patch<ApiResponse<{ updated: number; readAt: string }>>(
      '/notifications/read-all',
      {},
      mutationConfig
    );
    return data.data;
  },

  markBatchRead: async (input: MarkNotificationsBatchReadInput): Promise<{ updated: number }> => {
    const { data } = await privateApi.patch<ApiResponse<{ updated: number }>>(
      '/notifications/read',
      input,
      mutationConfig
    );
    return data.data;
  },
};
