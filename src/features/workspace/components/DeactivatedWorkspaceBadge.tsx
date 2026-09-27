import React from 'react';
import type { WorkspaceResponse } from '../services/workspaceService';

/**
 * Shown next to a workspace its owner has deleted (soft delete, restorable
 * until purgeAt). The owner sees it as pending deletion; everyone else as
 * deactivated, which is all they can act on.
 */
export const DeactivatedWorkspaceBadge: React.FC<{ workspace: Pick<WorkspaceResponse, 'deactivatedAt' | 'canRestore'> }> = ({
  workspace,
}) => {
  if (!workspace.deactivatedAt) return null;

  return workspace.canRestore ? (
    <span className="text-[10px] font-medium px-1.5 py-px rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
      Scheduled for deletion
    </span>
  ) : (
    <span className="text-[10px] font-medium px-1.5 py-px rounded-full bg-red-500/10 text-red-500 dark:text-red-400">
      Deactivated by Owner
    </span>
  );
};
