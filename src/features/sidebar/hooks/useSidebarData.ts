import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { sidebarService } from '../services/sidebarService';

export const sidebarQueryKeys = {
  all: ['sidebar'] as const,
  byWorkspace: (workspaceId: string | undefined) => [...sidebarQueryKeys.all, workspaceId] as const,
};

export const useSidebarData = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: sidebarQueryKeys.byWorkspace(workspaceId),
    queryFn: sidebarService.getSidebar,
    enabled: Boolean(workspaceId),
    staleTime: 60_000,
  });
};
