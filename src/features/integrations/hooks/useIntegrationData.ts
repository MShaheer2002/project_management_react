import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { integrationService } from '../services/integrationService';

export const integrationQueryKeys = {
  all: ['integrations'] as const,
  list: (workspaceId: string | undefined) =>
    [...integrationQueryKeys.all, 'list', workspaceId] as const,
  settings: (workspaceId: string | undefined, provider: string) =>
    [...integrationQueryKeys.all, 'settings', workspaceId, provider] as const,
  slackChannels: (workspaceId: string | undefined) =>
    [...integrationQueryKeys.all, 'slack-channels', workspaceId] as const,
};

export const useIntegrations = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: integrationQueryKeys.list(workspaceId),
    queryFn: integrationService.list,
    enabled: Boolean(workspaceId),
  });
};

export const useIntegrationSettings = <T = Record<string, unknown>>(
  provider: string,
  options?: { enabled?: boolean },
) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: integrationQueryKeys.settings(workspaceId, provider),
    queryFn: () => integrationService.getSettings<T>(provider),
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useSlackChannels = (options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: integrationQueryKeys.slackChannels(workspaceId),
    queryFn: integrationService.listSlackChannels,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};
