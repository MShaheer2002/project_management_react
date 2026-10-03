import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { aiService } from '../services/aiService';

export const aiAvailabilityQueryKey = (workspaceId: string | undefined) => ['ai', 'availability', workspaceId] as const;

/**
 * Whether this workspace's plan includes Trussen AI (chat, issue generation,
 * AI suggestions). The help assistant is on every plan. Hidden until known,
 * so a Free workspace never flashes AI it can't use.
 */
export const useAiAvailability = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const query = useQuery({
    queryKey: aiAvailabilityQueryKey(workspaceId),
    queryFn: () => aiService.getAvailability(),
    enabled: Boolean(workspaceId),
    staleTime: 60_000,
  });
  return { trussenAi: query.data?.trussenAi === true };
};
