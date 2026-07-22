import type { UserRole, WorkspaceStatus } from '@/types';

export type TransitionCheckResult = { allowed: true } | { allowed: false; reason: string };

export type TransitionCheckContext = {
  currentStatusKey: string;
  nextStatusKey: string;
  actorRole: UserRole;
  actorUserId: string | undefined;
  assigneeId: string | null | undefined;
  creatorId: string | null | undefined;
};

const roleToBackend: Record<UserRole, WorkspaceStatus['transitions']['allowedRoles'][number]> = {
  owner: 'OWNER',
  admin: 'ADMIN',
  member: 'MEMBER',
  guest: 'GUEST',
};

/**
 * Client-side mirror of the backend's assertTransitionPermission (issue.service.ts).
 * Used to block an obviously-disallowed move BEFORE hitting the API — e.g. dragging
 * a card on a cross-project board where the target status doesn't belong to (or
 * isn't reachable from) that specific issue's own project workflow. This is a UX
 * shortcut, not a security boundary: the backend still enforces the real rule on
 * every write regardless of what the client decided here.
 */
export function checkTransitionAllowed(
  statuses: WorkspaceStatus[],
  context: TransitionCheckContext,
): TransitionCheckResult {
  if (context.currentStatusKey === context.nextStatusKey) {
    return { allowed: true };
  }

  const currentStatus = statuses.find((status) => status.key === context.currentStatusKey);
  const nextStatus = statuses.find((status) => status.key === context.nextStatusKey);

  if (!currentStatus || !nextStatus) {
    return { allowed: false, reason: 'This status is not part of this issue\'s workflow.' };
  }

  if (currentStatus.transitions.mode === 'restricted') {
    const isExplicitlyAllowed = currentStatus.transitions.to.includes(context.nextStatusKey);
    const isRollback = currentStatus.transitions.allowRollback && nextStatus.order < currentStatus.order;
    if (!isExplicitlyAllowed && !isRollback) {
      return { allowed: false, reason: `Issues in ${currentStatus.label} cannot move directly to ${nextStatus.label}.` };
    }
  }

  const actorRole = roleToBackend[context.actorRole];
  const roleAllowed = nextStatus.transitions.allowedRoles.includes(actorRole);
  const userAllowed = Boolean(context.actorUserId) && nextStatus.transitions.allowedUserIds.includes(context.actorUserId!);
  if (!roleAllowed && !userAllowed) {
    return { allowed: false, reason: `You cannot move issues into ${nextStatus.label}.` };
  }

  if (nextStatus.transitions.assigneeOnly && context.assigneeId !== context.actorUserId) {
    return { allowed: false, reason: `${nextStatus.label} can only be entered by the assignee.` };
  }

  if (nextStatus.transitions.creatorOnly && context.creatorId !== context.actorUserId) {
    return { allowed: false, reason: `${nextStatus.label} can only be entered by the issue creator.` };
  }

  return { allowed: true };
}
