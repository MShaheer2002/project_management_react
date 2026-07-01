import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import { aiConnectionService } from '../services/aiConnectionService';
import { aiConnectionQueryKeys } from './useAiConnectionData';
import type { CreateAiConnectionInput } from '../types';

export const useCreateAiConnection = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateAiConnectionInput) => aiConnectionService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: aiConnectionQueryKeys.list(workspaceId),
      });
    },
  });
};

export const useRevokeAiConnection = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (id: string) => aiConnectionService.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: aiConnectionQueryKeys.list(workspaceId),
      });
      showToast('AI connection revoked', 'success');
    },
  });
};
