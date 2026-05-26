import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { activityService } from '../services/activityService';
import type { ListActivityInput } from '../types';

export const activityQueryKeys = {
  all: ['activity'] as const,
  workspace: (workspaceId: string | undefined) => [...activityQueryKeys.all, workspaceId] as const,
  feed: (workspaceId: string | undefined, params: ListActivityInput) =>
    [...activityQueryKeys.workspace(workspaceId), 'feed', params] as const,
};

export const useActivityFeed = (params: ListActivityInput = {}, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: activityQueryKeys.feed(workspaceId, params),
    queryFn: ({ pageParam }) =>
      activityService.list({
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};
