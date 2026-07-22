import { useWorkspaceStatuses } from './useWorkspaceStatuses';
import { useProjectWorkflow } from '@features/projects';
import type { WorkspaceStatus } from '@/types';

/**
 * Resolves the workflow status list that actually applies in a given context:
 * a project's own override if it has one, else the workspace default.
 *
 * Pass a projectId whenever rendering something scoped to a single project
 * (an issue list/board filtered to that project, a create-issue form with a
 * project already selected). Omit it for workspace-wide views (My Issues,
 * cross-project search) where no single project's workflow applies.
 */
export const useEffectiveWorkflowStatuses = (projectId?: string): WorkspaceStatus[] => {
  const workspaceStatuses = useWorkspaceStatuses();
  const projectWorkflowQuery = useProjectWorkflow(projectId);

  if (projectId && projectWorkflowQuery.data) {
    return projectWorkflowQuery.data.statuses;
  }

  return workspaceStatuses;
};
