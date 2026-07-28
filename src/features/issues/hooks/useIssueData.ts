import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { dashboardQueryKeys } from '@features/dashboard';
import { departmentQueryKeys } from '@features/department';
import { projectQueryKeys } from '@features/projects';
import { teamQueryKeys } from '@features/team';
import { issueService } from '../services/issueService';
import type {
  AddIssueAttachmentsInput,
  AddIssueCommentAttachmentsInput,
  AddIssueDependencyInput,
  AddIssueWatchersInput,
  AttachIssueLabelsInput,
  CheckIssueAssignmentEligibilityInput,
  CreateLabelInput,
  CreateIssueCommentInput,
  CreateIssueInput,
  CreateIssueSubtaskInput,
  IssueAssignmentEligibility,
  IssueDetail,
  IssueSummary,
  ListIssueActivityInput,
  ListIssueCommentsInput,
  ListLabelsInput,
  ListIssuesInput,
  ReorderIssueSubtasksInput,
  UpdateLabelInput,
  UpdateIssueCommentInput,
  UpdateIssueInput,
  UpdateIssueIntegrationRefsInput,
  UpdateIssueSubtaskInput,
} from '../types';

export const issueQueryKeys = {
  all: ['issues'] as const,
  workspace: (workspaceId: string | undefined) => [...issueQueryKeys.all, workspaceId] as const,
  directory: (workspaceId: string | undefined, params: object) =>
    [...issueQueryKeys.workspace(workspaceId), 'directory', params] as const,
  statusCounts: (workspaceId: string | undefined) =>
    [...issueQueryKeys.workspace(workspaceId), 'status-counts'] as const,
  options: (workspaceId: string | undefined, params: object) =>
    [...issueQueryKeys.workspace(workspaceId), 'options', params] as const,
  detail: (workspaceId: string | undefined, issueId: string | undefined) =>
    [...issueQueryKeys.workspace(workspaceId), 'detail', issueId] as const,
  watchers: (workspaceId: string | undefined, issueId: string | undefined) =>
    [...issueQueryKeys.detail(workspaceId, issueId), 'watchers'] as const,
  comments: (workspaceId: string | undefined, issueId: string | undefined) =>
    [...issueQueryKeys.detail(workspaceId, issueId), 'comments'] as const,
  activity: (workspaceId: string | undefined, issueId: string | undefined) =>
    [...issueQueryKeys.detail(workspaceId, issueId), 'activity'] as const,
  approvals: (workspaceId: string | undefined, issueId: string | undefined) =>
    [...issueQueryKeys.detail(workspaceId, issueId), 'approvals'] as const,
  labels: (workspaceId: string | undefined, params: object) =>
    [...issueQueryKeys.workspace(workspaceId), 'labels', params] as const,
};

const invalidateIssueRelatedQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string | undefined,
  issueId?: string,
  related?: {
    projectId?: string;
    teamId?: string;
    departmentId?: string;
  }
) => {
  queryClient.invalidateQueries({ queryKey: issueQueryKeys.workspace(workspaceId) });
  queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.byWorkspace(workspaceId) });
  // Project list shows a live per-project issueCount, so it has to be refetched.
  // Workspace detail/members and the team/department lists carry no issue-derived
  // data — invalidating them here was pure waste, refetched on every issue mutation
  // for no reason (workspace detail, full member list, full team list, full
  // department list), and it was the biggest contributor to the request fan-out that
  // was tripping the global rate limiter.
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.workspace(workspaceId) });

  if (issueId) {
    queryClient.invalidateQueries({ queryKey: issueQueryKeys.detail(workspaceId, issueId) });
    queryClient.invalidateQueries({ queryKey: issueQueryKeys.watchers(workspaceId, issueId) });
    queryClient.invalidateQueries({ queryKey: issueQueryKeys.comments(workspaceId, issueId) });
    queryClient.invalidateQueries({ queryKey: issueQueryKeys.activity(workspaceId, issueId) });
  }

  if (related?.projectId) {
    queryClient.invalidateQueries({
      queryKey: projectQueryKeys.detail(workspaceId, related.projectId),
    });
  }

  if (related?.teamId) {
    queryClient.invalidateQueries({
      queryKey: teamQueryKeys.detail(workspaceId, related.teamId),
    });
  }

  if (related?.departmentId) {
    queryClient.invalidateQueries({
      queryKey: departmentQueryKeys.detail(workspaceId, related.departmentId),
    });
  }
};

type IssueDirectoryPage = { items: IssueSummary[]; meta: { total: number; cursor: string | null; hasMore: boolean } };
type IssueDirectoryData = { pages: IssueDirectoryPage[]; pageParams: unknown[] };

/**
 * Directly patches every cached issues query the moved issue could appear in,
 * instead of invalidating and refetching them. A status change should cost
 * exactly one network request (the PATCH itself) — every board column, list
 * group, and flat query currently mounted gets updated from the mutation's
 * response, in memory, with zero extra GETs. Columns/groups for unrelated
 * statuses are left completely untouched (not even marked stale).
 */
function patchIssueStatusCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string | undefined,
  updatedIssue: IssueDetail,
  previousStatus: string,
) {
  const newStatus = updatedIssue.status;
  if (previousStatus === newStatus) return;

  const directoryQueries = queryClient.getQueryCache().findAll({ queryKey: issueQueryKeys.workspace(workspaceId) });

  directoryQueries.forEach((query) => {
    if (query.queryKey[2] !== 'directory') return;
    const params = query.queryKey[3] as { status?: string } | undefined;
    const filterStatus = params?.status;

    queryClient.setQueryData<IssueDirectoryData>(query.queryKey, (data) => {
      if (!data?.pages) return data;

      // Status-agnostic query (flat "all issues" feed, calendar source, etc.) —
      // the issue stays in the same list either way, just patch its fields.
      if (!filterStatus) {
        let touched = false;
        const pages = data.pages.map((page) => {
          const items = page.items.map((item) => {
            if (item.id !== updatedIssue.id) return item;
            touched = true;
            return { ...item, ...updatedIssue };
          });
          return touched ? { ...page, items } : page;
        });
        return touched ? { ...data, pages } : data;
      }

      // Unrelated column/group for some other status — leave completely alone.
      if (filterStatus !== previousStatus && filterStatus !== newStatus) return data;

      if (filterStatus === previousStatus) {
        let removed = false;
        const pages = data.pages.map((page, index) => {
          if (!page.items.some((item) => item.id === updatedIssue.id)) return page;
          removed = true;
          const items = page.items.filter((item) => item.id !== updatedIssue.id);
          return index === 0
            ? { ...page, items, meta: { ...page.meta, total: Math.max(page.meta.total - 1, 0) } }
            : { ...page, items };
        });
        return removed ? { ...data, pages } : data;
      }

      // filterStatus === newStatus
      const alreadyPresent = data.pages.some((page) => page.items.some((item) => item.id === updatedIssue.id));
      if (alreadyPresent) return data;

      const pages = data.pages.map((page, index) =>
        index === 0
          ? {
              ...page,
              items: [updatedIssue as unknown as IssueSummary, ...page.items],
              meta: { ...page.meta, total: page.meta.total + 1 },
            }
          : page,
      );
      return { ...data, pages };
    });
  });

  queryClient.setQueryData<Record<string, number>>(issueQueryKeys.statusCounts(workspaceId), (data) => {
    if (!data) return data;
    return {
      ...data,
      [previousStatus]: Math.max((data[previousStatus] ?? 0) - 1, 0),
      [newStatus]: (data[newStatus] ?? 0) + 1,
    };
  });

  // Dashboard stats (e.g. "completed this week") do depend on status, but the
  // dashboard is a different route — mark it stale for whenever it's next viewed
  // instead of forcing a refetch right now just because it's technically mounted.
  queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.byWorkspace(workspaceId), refetchType: 'none' });

  queryClient.setQueryData(issueQueryKeys.detail(workspaceId, updatedIssue.id), updatedIssue);
}

export const useIssuesDirectory = (params: ListIssuesInput = {}, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: issueQueryKeys.directory(workspaceId, params),
    queryFn: ({ pageParam }) =>
      issueService.listDirectory({
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useIssueStatusCounts = (options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: issueQueryKeys.statusCounts(workspaceId),
    queryFn: () => issueService.getStatusCounts(),
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useIssueOptions = (params: ListIssuesInput = {}, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: issueQueryKeys.options(workspaceId, params),
    queryFn: ({ pageParam }) =>
      issueService.listOptions({
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useIssueDetail = (issueId: string | undefined) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: issueQueryKeys.detail(workspaceId, issueId),
    queryFn: () => issueService.getById(issueId!),
    enabled: Boolean(workspaceId && issueId),
  });
};

export const useIssueWatchers = (issueId: string | undefined, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: issueQueryKeys.watchers(workspaceId, issueId),
    queryFn: () => issueService.listWatchers(issueId!),
    enabled: Boolean(workspaceId && issueId) && (options?.enabled ?? true),
  });
};

export const useIssueComments = (
  issueId: string | undefined,
  params: ListIssueCommentsInput = {},
  options?: { enabled?: boolean }
) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: [...issueQueryKeys.comments(workspaceId, issueId), params.limit ?? 50] as const,
    queryFn: ({ pageParam }) =>
      issueService.listComments(issueId!, {
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId && issueId) && (options?.enabled ?? true),
  });
};

export const useIssueActivity = (
  issueId: string | undefined,
  params: ListIssueActivityInput = {},
  options?: { enabled?: boolean }
) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: [...issueQueryKeys.activity(workspaceId, issueId), params.limit ?? 50] as const,
    queryFn: ({ pageParam }) =>
      issueService.listActivity(issueId!, {
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId && issueId) && (options?.enabled ?? true),
  });
};

export const useIssueLabels = (params: ListLabelsInput = {}, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: issueQueryKeys.labels(workspaceId, params),
    queryFn: ({ pageParam }) =>
      issueService.listLabels({
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useCreateIssue = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateIssueInput) => issueService.create(input),
    onSuccess: (issue) => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issue.id, {
        projectId: issue.projectId,
        teamId: issue.teamId,
        departmentId: issue.departmentId,
      });
    },
  });
};

export const useCheckIssueAssignmentEligibility = () => {
  return useMutation({
    mutationFn: (input: CheckIssueAssignmentEligibilityInput): Promise<IssueAssignmentEligibility> =>
      issueService.checkAssignmentEligibility(input),
  });
};

export const useUpdateIssue = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: UpdateIssueInput) => issueService.update(issueId!, input),
    onSuccess: (issue) => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId, {
        projectId: issue.projectId,
        teamId: issue.teamId,
        departmentId: issue.departmentId,
      });
    },
  });
};

export const useUpdateAnyIssue = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ issueId, input }: { issueId: string; input: UpdateIssueInput }) =>
      issueService.update(issueId, input),
    onSuccess: (issue) => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issue.id, {
        projectId: issue.projectId,
        teamId: issue.teamId,
        departmentId: issue.departmentId,
      });
    },
  });
};

export const useDeleteIssue = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: () => issueService.delete(issueId!),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useDeleteAnyIssue = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (issueId: string) => issueService.delete(issueId),
    onSuccess: (_result, issueId) => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useUpdateIssueStatus = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ status }: { status: NonNullable<UpdateIssueInput['status']>; previousStatus?: string }) =>
      issueService.updateStatus(issueId!, status),
    onSuccess: (issue, variables) => {
      if (variables.previousStatus && variables.previousStatus !== issue.status) {
        patchIssueStatusCaches(queryClient, workspaceId, issue, variables.previousStatus);
      } else {
        invalidateIssueRelatedQueries(queryClient, workspaceId, issueId, {
          projectId: issue.projectId,
          teamId: issue.teamId,
          departmentId: issue.departmentId,
        });
      }
    },
  });
};

export const useIssueApprovalStatus = (issueId: string | undefined) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: issueQueryKeys.approvals(workspaceId, issueId),
    queryFn: () => issueService.getApprovalStatus(issueId!),
    enabled: Boolean(workspaceId && issueId),
  });
};

export const useApproveIssueStatus = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: () => issueService.approveStatus(issueId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueQueryKeys.approvals(workspaceId, issueId) });
    },
  });
};

export const useRevokeIssueApproval = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: () => issueService.revokeApproval(issueId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueQueryKeys.approvals(workspaceId, issueId) });
    },
  });
};

export const useUpdateAnyIssueStatus = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({
      issueId,
      status,
    }: {
      issueId: string;
      status: NonNullable<UpdateIssueInput['status']>;
      previousStatus?: string;
    }) => issueService.updateStatus(issueId, status),
    onSuccess: (issue, variables) => {
      if (variables.previousStatus && variables.previousStatus !== issue.status) {
        patchIssueStatusCaches(queryClient, workspaceId, issue, variables.previousStatus);
      } else {
        invalidateIssueRelatedQueries(queryClient, workspaceId, issue.id, {
          projectId: issue.projectId,
          teamId: issue.teamId,
          departmentId: issue.departmentId,
        });
      }
    },
  });
};

export const useCreateIssueSubtask = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateIssueSubtaskInput) => issueService.createSubtask(issueId!, input),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useUpdateIssueSubtask = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ subtaskId, input }: { subtaskId: string; input: UpdateIssueSubtaskInput }) =>
      issueService.updateSubtask(issueId!, subtaskId, input),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useDeleteIssueSubtask = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (subtaskId: string) => issueService.deleteSubtask(issueId!, subtaskId),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useReorderIssueSubtasks = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: ReorderIssueSubtasksInput) => issueService.reorderSubtasks(issueId!, input),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useAddIssueAttachments = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: AddIssueAttachmentsInput) => issueService.addAttachments(issueId!, input),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useRemoveIssueAttachment = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (attachmentId: string) => issueService.removeAttachment(issueId!, attachmentId),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useAddIssueWatchers = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: AddIssueWatchersInput) => issueService.addWatchers(issueId!, input),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useAddIssueWatchersAny = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ issueId, input }: { issueId: string; input: AddIssueWatchersInput }) =>
      issueService.addWatchers(issueId, input),
    onSuccess: (_data, variables) => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, variables.issueId);
    },
  });
};

export const useRemoveIssueWatcher = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (userId: string) => issueService.removeWatcher(issueId!, userId),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useAddIssueDependency = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: AddIssueDependencyInput) => issueService.addDependency(issueId!, input),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useAddIssueDependencyAny = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ issueId, input }: { issueId: string; input: AddIssueDependencyInput }) =>
      issueService.addDependency(issueId, input),
    onSuccess: (_data, variables) => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, variables.issueId);
    },
  });
};

export const useRemoveIssueDependency = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (relatedId: string) => issueService.removeDependency(issueId!, relatedId),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useUpdateIssueIntegrationRefs = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: UpdateIssueIntegrationRefsInput) =>
      issueService.updateIntegrationRefs(issueId!, input),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useUpdateIssueIntegrationRefsAny = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ issueId, input }: { issueId: string; input: UpdateIssueIntegrationRefsInput }) =>
      issueService.updateIntegrationRefs(issueId, input),
    onSuccess: (_data, variables) => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, variables.issueId);
    },
  });
};

export const useCreateIssueComment = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateIssueCommentInput) => issueService.createComment(issueId!, input),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useUpdateIssueComment = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ commentId, input }: { commentId: string; input: UpdateIssueCommentInput }) =>
      issueService.updateComment(commentId, input),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useDeleteIssueComment = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (commentId: string) => issueService.deleteComment(commentId),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useAddIssueCommentAttachments = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ commentId, input }: { commentId: string; input: AddIssueCommentAttachmentsInput }) =>
      issueService.addCommentAttachments(commentId, input),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useRemoveIssueCommentAttachment = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ commentId, attachmentId }: { commentId: string; attachmentId: string }) =>
      issueService.removeCommentAttachment(commentId, attachmentId),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useCreateLabel = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateLabelInput) => issueService.createLabel(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueQueryKeys.workspace(workspaceId) });
    },
  });
};

export const useUpdateLabel = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ labelId, input }: { labelId: string; input: UpdateLabelInput }) =>
      issueService.updateLabel(labelId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueQueryKeys.workspace(workspaceId) });
    },
  });
};

export const useDeleteLabel = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (labelId: string) => issueService.deleteLabel(labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueQueryKeys.workspace(workspaceId) });
    },
  });
};

export const useAttachIssueLabels = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: AttachIssueLabelsInput) => issueService.attachIssueLabels(issueId!, input),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useAttachIssueLabelsAny = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ issueId, input }: { issueId: string; input: AttachIssueLabelsInput }) =>
      issueService.attachIssueLabels(issueId, input),
    onSuccess: (_data, variables) => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, variables.issueId);
    },
  });
};

export const useRemoveIssueLabel = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (labelId: string) => issueService.removeIssueLabel(issueId!, labelId),
    onSuccess: () => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId);
    },
  });
};

export const useRemoveIssueLabelAny = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ issueId, labelId }: { issueId: string; labelId: string }) =>
      issueService.removeIssueLabel(issueId, labelId),
    onSuccess: (_data, variables) => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, variables.issueId);
    },
  });
};
