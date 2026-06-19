import { useQuery } from '@tanstack/react-query';
import { driveService } from '../services/driveService';

/**
 * Drive query keys — user-scoped (not workspace-scoped).
 * Drive connection is per-user, so no workspaceId in the key.
 */
export const driveQueryKeys = {
  all: ['drive'] as const,
  connection: () => [...driveQueryKeys.all, 'connection'] as const,
};

/**
 * Fetch the current user's Google Drive connection status.
 * Returns { connected, email, provider, connectedAt }.
 */
export const useDriveConnection = () =>
  useQuery({
    queryKey: driveQueryKeys.connection(),
    queryFn: driveService.getStatus,
    staleTime: 60 * 1000, // 1 minute — connection status doesn't change often
    retry: 1,
  });
