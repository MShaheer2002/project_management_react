import { useMemo } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { DEFAULT_STATUSES } from '@shared/constants/statuses';
import type { WorkspaceStatus } from '@/types';

/**
 * Returns the resolved workspace statuses array.
 * Falls back to DEFAULT_STATUSES when customStatuses is missing or empty.
 */
export const useWorkspaceStatuses = (): WorkspaceStatus[] => {
  const customStatuses = useAuthStore((s) => s.workspace?.customStatuses);

  return useMemo(() => {
    if (customStatuses && customStatuses.length > 0) {
      return [...customStatuses].sort((a, b) => a.order - b.order);
    }
    return DEFAULT_STATUSES;
  }, [customStatuses]);
};
