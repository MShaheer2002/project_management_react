import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { helpService } from '../services/helpService';

// Articles only change on deploy; the list depends on the workspace (role and plan).
const STALE_TIME = 5 * 60_000;

export const helpQueryKeys = {
  list: (workspaceId: string | undefined) => ['help', 'articles', workspaceId] as const,
  article: (workspaceId: string | undefined, id: string) => ['help', 'article', workspaceId, id] as const,
  search: (workspaceId: string | undefined, q: string) => ['help', 'search', workspaceId, q] as const,
};

export const useHelpArticles = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: helpQueryKeys.list(workspaceId),
    queryFn: helpService.list,
    enabled: Boolean(workspaceId),
    staleTime: STALE_TIME,
  });
};

export const useHelpArticle = (id: string | undefined) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: helpQueryKeys.article(workspaceId, id ?? ''),
    queryFn: () => helpService.get(id!),
    enabled: Boolean(workspaceId && id),
    staleTime: STALE_TIME,
    retry: false,
  });
};

/** Server search, for queries of 2+ characters. Callers debounce the input. */
export const useHelpSearch = (q: string) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const query = q.trim();
  return useQuery({
    queryKey: helpQueryKeys.search(workspaceId, query.toLowerCase()),
    queryFn: () => helpService.search(query),
    enabled: Boolean(workspaceId) && query.length >= 2,
    staleTime: STALE_TIME,
    retry: false,
  });
};

/** Whether the signed-in person is Trussen staff (sees insights). Hidden until known. */
export const useHelpInsightsAccess = () =>
  useQuery({ queryKey: ['help', 'insights-access'], queryFn: helpService.insightsAccess, staleTime: STALE_TIME, retry: false });

export const useHelpInsights = (days: number, enabled: boolean) =>
  useQuery({
    queryKey: ['help', 'insights', days],
    queryFn: () => helpService.insights(days),
    enabled,
    staleTime: 60_000,
    retry: false,
  });
