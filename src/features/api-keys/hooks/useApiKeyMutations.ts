import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import { apiKeyService } from '../services/apiKeyService';
import { apiKeyQueryKeys } from './useApiKeyData';
import type { CreateApiKeyInput } from '../types';

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateApiKeyInput) => apiKeyService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: apiKeyQueryKeys.list(workspaceId),
      });
    },
  });
};

export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (id: string) => apiKeyService.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: apiKeyQueryKeys.list(workspaceId),
      });
      showToast('API key revoked', 'success');
    },
  });
};
