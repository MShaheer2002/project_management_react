import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { dashboardService } from '../services/dashboardService';

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  byWorkspace: (workspaceId: string | undefined) => [...dashboardQueryKeys.all, workspaceId] as const,
};

export const useDashboardData = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: dashboardQueryKeys.byWorkspace(workspaceId),
    queryFn: dashboardService.getDashboard,
    enabled: Boolean(workspaceId),
  });
};
