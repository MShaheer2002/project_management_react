import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { aiConnectionService } from '../services/aiConnectionService';

export const aiConnectionQueryKeys = {
  all: ['ai-connections'] as const,
  list: (workspaceId: string | undefined) =>
    [...aiConnectionQueryKeys.all, 'list', workspaceId] as const,
};

export const useAiConnections = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: aiConnectionQueryKeys.list(workspaceId),
    queryFn: aiConnectionService.list,
    enabled: Boolean(workspaceId),
  });
};
