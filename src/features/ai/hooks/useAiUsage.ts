import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { aiService } from '../services/aiService';
import type { AiUsagePeriod } from '../types';

export const aiUsageQueryKeys = {
  all: ['ai', 'usage'] as const,
  workspace: (workspaceId: string | undefined, period: AiUsagePeriod, limit: number) =>
    [...aiUsageQueryKeys.all, 'workspace', workspaceId, period, limit] as const,
  users: (workspaceId: string | undefined, period: AiUsagePeriod, limit: number) =>
    [...aiUsageQueryKeys.all, 'users', workspaceId, period, limit] as const,
};

export const useAiWorkspaceUsage = (input?: {
  period?: AiUsagePeriod;
  limit?: number;
  enabled?: boolean;
}) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const period = input?.period ?? '30d';
  const limit = input?.limit ?? 8;

  return useQuery({
    queryKey: aiUsageQueryKeys.workspace(workspaceId, period, limit),
    queryFn: () => aiService.getWorkspaceUsage({ period, limit }),
    enabled: Boolean(workspaceId) && (input?.enabled ?? true),
    staleTime: 30_000,
  });
};

export const useAiUserUsage = (input?: {
  period?: AiUsagePeriod;
  limit?: number;
  enabled?: boolean;
}) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const period = input?.period ?? '30d';
  const limit = input?.limit ?? 20;

  return useQuery({
    queryKey: aiUsageQueryKeys.users(workspaceId, period, limit),
    queryFn: () => aiService.getUserUsage({ period, limit }),
    enabled: Boolean(workspaceId) && (input?.enabled ?? true),
    staleTime: 30_000,
  });
};
