import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { dashboardQueryKeys } from '@features/dashboard';
import { sidebarQueryKeys } from '@features/sidebar';
import { notificationService } from '../services/notificationService';
import type { ListNotificationsInput, MarkNotificationReadInput, MarkNotificationsBatchReadInput } from '../types';

export const notificationQueryKeys = {
  all: ['notifications'] as const,
  workspace: (workspaceId: string | undefined) => [...notificationQueryKeys.all, workspaceId] as const,
  list: (workspaceId: string | undefined, params: ListNotificationsInput) =>
    [...notificationQueryKeys.workspace(workspaceId), 'list', params] as const,
  unread: (workspaceId: string | undefined) => [...notificationQueryKeys.workspace(workspaceId), 'unread'] as const,
};

const invalidateNotificationRelated = (
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string | undefined
) => {
  queryClient.invalidateQueries({ queryKey: notificationQueryKeys.workspace(workspaceId) });
  queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
  queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.byWorkspace(workspaceId) });
};

export const useNotifications = (params: ListNotificationsInput = {}, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: notificationQueryKeys.list(workspaceId, params),
    queryFn: ({ pageParam }) =>
      notificationService.list({
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useUnreadNotificationsCount = (options?: { enabled?: boolean; refetchInterval?: number }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: notificationQueryKeys.unread(workspaceId),
    queryFn: notificationService.getUnreadCount,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ notificationId, input }: { notificationId: string; input?: MarkNotificationReadInput }) =>
      notificationService.markRead(notificationId, input),
    onSuccess: () => {
      invalidateNotificationRelated(queryClient, workspaceId);
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => {
      invalidateNotificationRelated(queryClient, workspaceId);
    },
  });
};

export const useMarkNotificationsBatchRead = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: MarkNotificationsBatchReadInput) => notificationService.markBatchRead(input),
    onSuccess: () => {
      invalidateNotificationRelated(queryClient, workspaceId);
    },
  });
};
