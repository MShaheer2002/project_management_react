import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { driveService } from '../services/driveService';

/**
 * Drive query keys. The status depends on the workspace (its Workspace Drive,
 * its public links switch, the member's upload target), so it's keyed by it.
 */
export const driveQueryKeys = {
  all: ['drive'] as const,
  connection: (workspaceId?: string) => [...driveQueryKeys.all, 'connection', ...(workspaceId ? [workspaceId] : [])] as const,
  files: (workspaceId?: string, ids?: string[]) => [...driveQueryKeys.all, 'files', workspaceId, ids] as const,
};

/** Drive status for the current user in the active workspace. */
export const useDriveConnection = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: driveQueryKeys.connection(workspaceId),
    queryFn: driveService.getStatus,
    enabled: Boolean(workspaceId),
    staleTime: 60 * 1000,
    retry: 1,
  });
};

/** Sharing badges for the Drive attachments on screen. */
export const useDriveFiles = (ids: string[], enabled = true) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: driveQueryKeys.files(workspaceId, ids),
    queryFn: () => driveService.listFiles(ids),
    enabled: enabled && Boolean(workspaceId) && ids.length > 0,
    staleTime: 30 * 1000,
  });
};
