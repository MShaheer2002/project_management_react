import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import { integrationService } from '../services/integrationService';
import { integrationQueryKeys } from './useIntegrationData';
import type { UpdateIntegrationSettingsInput } from '../types';
import type { ApiAxiosError } from '@shared/services/types';

export const useConnectIntegration = () => {
  return useMutation({
    mutationFn: (provider: string) => integrationService.connect(provider),
  });
};

export const useDisconnectIntegration = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (provider: string) => integrationService.disconnect(provider),
    onSuccess: (_data, provider) => {
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.list(workspaceId),
      });
      showToast(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} disconnected`,
        'success',
      );
    },
    onError: (err: ApiAxiosError) => {
      const message = err.response?.data?.error?.message;
      showToast(message || 'Failed to disconnect integration', 'error');
    },
  });
};

export const useUpdateIntegrationSettings = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: ({
      provider,
      settings,
    }: {
      provider: string;
      settings: UpdateIntegrationSettingsInput;
    }) => integrationService.updateSettings(provider, settings),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.list(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.settings(workspaceId, variables.provider),
      });
      showToast('Settings updated', 'success');
    },
    onError: (err: ApiAxiosError) => {
      const message = err.response?.data?.error?.message;
      showToast(message || 'Failed to update settings', 'error');
    },
  });
};
