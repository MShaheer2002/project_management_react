import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { apiKeyService } from '../services/apiKeyService';

export const apiKeyQueryKeys = {
  all: ['api-keys'] as const,
  list: (workspaceId: string | undefined) =>
    [...apiKeyQueryKeys.all, 'list', workspaceId] as const,
};

export const useApiKeys = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: apiKeyQueryKeys.list(workspaceId),
    queryFn: apiKeyService.list,
    enabled: Boolean(workspaceId),
  });
};
