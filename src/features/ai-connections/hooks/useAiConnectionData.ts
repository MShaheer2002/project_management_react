import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { aiConnectionService } from '../services/aiConnectionService';

export const aiConnectionQueryKeys = {
  all: ['ai-connections'] as const,
  catalog: (workspaceId: string | undefined) =>
    [...aiConnectionQueryKeys.all, 'catalog', workspaceId] as const,
  health: (workspaceId: string | undefined, id: string | undefined) =>
    [...aiConnectionQueryKeys.all, 'health', workspaceId, id] as const,
  sessions: (workspaceId: string | undefined, id: string | undefined) =>
    [...aiConnectionQueryKeys.all, 'sessions', workspaceId, id] as const,
  list: (workspaceId: string | undefined) =>
    [...aiConnectionQueryKeys.all, 'list', workspaceId] as const,
};

export const useAiConnectionCatalog = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: aiConnectionQueryKeys.catalog(workspaceId),
    queryFn: aiConnectionService.catalog,
    enabled: Boolean(workspaceId),
  });
};

export const useAiConnections = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: aiConnectionQueryKeys.list(workspaceId),
    queryFn: aiConnectionService.list,
    enabled: Boolean(workspaceId),
  });
};

export const useAiConnectionSessions = (id: string | null) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: aiConnectionQueryKeys.sessions(workspaceId, id ?? undefined),
    queryFn: () => aiConnectionService.listSessions(id!),
    enabled: Boolean(workspaceId && id),
  });
};
