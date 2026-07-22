import { useMemo } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { DEFAULT_STATUSES } from '@shared/constants/statuses';
import type { WorkflowApprovalReviewerSource, WorkspaceStatus, WorkspaceStatusCategory, WorkflowTransitionRole } from '@/types';

const STATUS_CATEGORIES: WorkspaceStatusCategory[] = ['backlog', 'unstarted', 'active', 'review', 'done', 'cancelled'];
const TRANSITION_ROLES: WorkflowTransitionRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'];
const APPROVAL_REVIEWER_SOURCES: WorkflowApprovalReviewerSource[] = ['project_members', 'team_lead', 'department_head', 'manual'];

const inferCategory = (status: Partial<WorkspaceStatus>): WorkspaceStatusCategory => {
  if (typeof status.category === 'string' && STATUS_CATEGORIES.includes(status.category)) {
    return status.category;
  }

  switch (status.key) {
    case 'backlog':
    case 'triage':
    case 'groomed':
      return 'backlog';
    case 'todo':
    case 'planned':
    case 'ready':
      return 'unstarted';
    case 'in-progress':
    case 'active':
      return 'active';
    case 'review':
    case 'qa':
    case 'verification':
      return 'review';
    case 'done':
    case 'closed':
    case 'released':
      return 'done';
    case 'cancelled':
    case 'archived':
      return 'cancelled';
    default:
      return status.isFinal ? 'done' : 'active';
  }
};

/**
 * Returns the resolved workspace statuses array.
 * Falls back to DEFAULT_STATUSES when customStatuses is missing or empty.
 */
export const useWorkspaceStatuses = (): WorkspaceStatus[] => {
  const customStatuses = useAuthStore((s) => s.workspace?.customStatuses);

  return useMemo(() => {
    if (customStatuses && customStatuses.length > 0) {
      const normalized = [...customStatuses]
        .map((status) => ({
          ...status,
          category: inferCategory(status),
          isActive: status.isActive !== false,
          showOnBoard: status.isActive === false ? false : (status.visibility?.board ?? status.showOnBoard !== false),
          visibility: {
            board: status.isActive === false ? false : (status.visibility?.board ?? status.showOnBoard !== false),
            list: status.visibility?.list ?? true,
            filters: status.visibility?.filters ?? true,
            create: status.isActive === false ? false : (status.visibility?.create ?? !status.isFinal),
            cycleBoard: status.isActive === false ? false : (status.visibility?.cycleBoard ?? ((status.visibility?.board ?? status.showOnBoard !== false) && inferCategory(status) !== 'backlog' && inferCategory(status) !== 'cancelled')),
            cycleList: status.isActive === false ? false : (status.visibility?.cycleList ?? inferCategory(status) !== 'cancelled'),
          },
          cycle: {
            allowedInCycle: status.cycle?.allowedInCycle ?? inferCategory(status) !== 'cancelled',
            countsAsCompleted: status.cycle?.countsAsCompleted ?? status.isFinal ?? false,
            countsAsCarryOver: status.cycle?.countsAsCarryOver ?? !status.isFinal,
            planIntoThisStatus: status.cycle?.planIntoThisStatus ?? status.key === 'todo',
          },
          transitions: {
            mode: status.transitions?.mode === 'restricted' ? ('restricted' as const) : ('free' as const),
            to: Array.isArray(status.transitions?.to)
              ? status.transitions.to.filter((value): value is string => typeof value === 'string' && value.length > 0)
              : [],
            allowRollback: status.transitions?.allowRollback ?? false,
            allowedRoles: Array.isArray(status.transitions?.allowedRoles)
              ? status.transitions.allowedRoles.filter((value): value is WorkflowTransitionRole => TRANSITION_ROLES.includes(value))
              : (['OWNER', 'ADMIN', 'MEMBER'] as WorkflowTransitionRole[]),
            allowedUserIds: Array.isArray(status.transitions?.allowedUserIds)
              ? status.transitions.allowedUserIds.filter((value): value is string => typeof value === 'string' && value.length > 0)
              : [],
            assigneeOnly: status.transitions?.assigneeOnly ?? false,
            creatorOnly: status.transitions?.creatorOnly ?? false,
          },
          rules: {
            requireAssignee: status.rules?.requireAssignee ?? false,
            requireDueDate: status.rules?.requireDueDate ?? false,
            requireAllSubtasksComplete: status.rules?.requireAllSubtasksComplete ?? false,
            requireAcceptanceCriteria: status.rules?.requireAcceptanceCriteria ?? false,
            requireParentIssue: status.rules?.requireParentIssue ?? false,
            requireIntegrationRef: status.rules?.requireIntegrationRef ?? false,
          },
          approval: {
            required: status.approval?.required ?? false,
            requiredCount: typeof status.approval?.requiredCount === 'number' && status.approval.requiredCount >= 1
              ? status.approval.requiredCount
              : 1,
            reviewerSource: APPROVAL_REVIEWER_SOURCES.includes(status.approval?.reviewerSource)
              ? status.approval.reviewerSource
              : 'project_members',
            reviewerUserIds: Array.isArray(status.approval?.reviewerUserIds)
              ? status.approval.reviewerUserIds.filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)
              : [],
          },
        }))
        .sort((a, b) => a.order - b.order);

      return normalized;
    }
    return DEFAULT_STATUSES;
  }, [customStatuses]);
};
