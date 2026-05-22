import type { Issue } from '@/types';

export type MemberPerformanceSubject = {
  id: string;
  name: string;
  email?: string | null;
  avatar?: string | null;
  roleLabel?: string | null;
  assigneeIds?: string[];
};

export type MemberPerformanceRow = MemberPerformanceSubject & {
  totalAssigned: number;
  completedCount: number;
  activeCount: number;
  queuedCount: number;
  overdueCount: number;
  completionRate: number;
};

export const mergeIssuesById = (...collections: Issue[][]): Issue[] => {
  const issuesById = new Map<string, Issue>();

  collections.forEach((issues) => {
    issues.forEach((issue) => {
      issuesById.set(issue.id, issue);
    });
  });

  return Array.from(issuesById.values());
};

export const buildMemberPerformanceRows = (
  subjects: MemberPerformanceSubject[],
  issues: Issue[]
): MemberPerformanceRow[] => {
  const now = Date.now();

  return subjects
    .map((subject) => {
      const assigneeIds = new Set(subject.assigneeIds?.length ? subject.assigneeIds : [subject.id]);
      const assignedIssues = issues.filter(
        (issue) => issue.assigneeId && assigneeIds.has(issue.assigneeId)
      );
      const completedCount = assignedIssues.filter((issue) => issue.status === 'done').length;
      const activeCount = assignedIssues.filter(
        (issue) => issue.status === 'in-progress' || issue.status === 'review'
      ).length;
      const queuedCount = assignedIssues.filter(
        (issue) => issue.status === 'todo' || issue.status === 'backlog'
      ).length;
      const overdueCount = assignedIssues.filter((issue) => {
        if (!issue.dueDate || issue.status === 'done') return false;
        const dueAt = Date.parse(issue.dueDate);
        return Number.isFinite(dueAt) && dueAt < now;
      }).length;
      const totalAssigned = assignedIssues.length;
      const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

      return {
        ...subject,
        totalAssigned,
        completedCount,
        activeCount,
        queuedCount,
        overdueCount,
        completionRate,
      };
    })
    .sort((left, right) => {
      if (right.totalAssigned !== left.totalAssigned) {
        return right.totalAssigned - left.totalAssigned;
      }
      if (right.completionRate !== left.completionRate) {
        return right.completionRate - left.completionRate;
      }
      return left.name.localeCompare(right.name);
    });
};
