import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { integrationService } from '../services/integrationService';

export const integrationQueryKeys = {
  all: ['integrations'] as const,
  list: (workspaceId: string | undefined) =>
    [...integrationQueryKeys.all, 'list', workspaceId] as const,
};

export const useIntegrations = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: integrationQueryKeys.list(workspaceId),
    queryFn: integrationService.list,
    enabled: Boolean(workspaceId),
  });
};
