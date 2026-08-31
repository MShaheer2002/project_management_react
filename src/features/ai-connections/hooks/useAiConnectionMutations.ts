import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import { aiConnectionService } from '../services/aiConnectionService';
import { aiConnectionQueryKeys } from './useAiConnectionData';
import type { AiConnection, AiConnectionHealthResponse, CreateAiConnectionInput } from '../types';

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
    onSuccess: (_, id) => {
      queryClient.setQueryData<AiConnection[]>(
        aiConnectionQueryKeys.list(workspaceId),
        (current) => current?.filter((connection) => connection.id !== id) ?? [],
      );
      queryClient.invalidateQueries({
        queryKey: aiConnectionQueryKeys.list(workspaceId),
      });
      showToast('AI connection revoked', 'success');
    },
  });
};

export const useAiConnectionHealthCheck = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (id: string) => aiConnectionService.getHealth(id),
    onSuccess: (result) => {
      queryClient.setQueryData<AiConnection[]>(
        aiConnectionQueryKeys.list(workspaceId),
        (current) => current?.map((connection) => (
          connection.id === result.connection.id ? result.connection : connection
        )) ?? [],
      );
      queryClient.setQueryData<AiConnectionHealthResponse>(
        aiConnectionQueryKeys.health(workspaceId, result.connection.id),
        result,
      );
    },
  });
};

export const useUpdateAiConnectionScopes = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: ({ id, scopes }: { id: string; scopes: string[] }) => aiConnectionService.updateScopes(id, scopes),
    onSuccess: (result) => {
      queryClient.setQueryData<AiConnection[]>(
        aiConnectionQueryKeys.list(workspaceId),
        (current) => current?.map((connection) => (
          connection.id === result.id ? result : connection
        )) ?? [result],
      );
      showToast('Scopes updated', 'success');
    },
  });
};

export const useCompleteOAuthSetup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      ...input
    }: { workspaceId: string; clientId: string; name: string; primaryClient?: string; scopes: string[] }) =>
      aiConnectionService.completeOAuthSetup(workspaceId, input),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: aiConnectionQueryKeys.list(variables.workspaceId),
      });
    },
  });
};

export const useRotateAiConnection = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (id: string) => aiConnectionService.rotate(id),
    onSuccess: (result) => {
      queryClient.setQueryData<AiConnection[]>(
        aiConnectionQueryKeys.list(workspaceId),
        (current) => current?.map((connection) => (
          connection.id === result.connection.id ? result.connection : connection
        )) ?? [result.connection],
      );
      queryClient.invalidateQueries({
        queryKey: aiConnectionQueryKeys.sessions(workspaceId, result.connection.id),
      });
    },
  });
};
