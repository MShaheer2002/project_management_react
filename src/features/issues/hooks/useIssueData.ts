import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { dashboardQueryKeys } from '@features/dashboard';
import { departmentQueryKeys } from '@features/department';
import { projectQueryKeys } from '@features/projects';
import { teamQueryKeys } from '@features/team';
import { workspaceQueryKeys } from '@features/workspace';
import { issueService } from '../services/issueService';
import type {
  AddIssueAttachmentsInput,
  AddIssueCommentAttachmentsInput,
  AddIssueDependencyInput,
  AddIssueWatchersInput,
  CreateIssueCommentInput,
  CreateIssueInput,
  CreateIssueSubtaskInput,
  ListIssueActivityInput,
  ListIssueCommentsInput,
  ListIssuesInput,
  ReorderIssueSubtasksInput,
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
  queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.detail(workspaceId) });
  queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.workspace(workspaceId) });
  queryClient.invalidateQueries({ queryKey: teamQueryKeys.workspace(workspaceId) });
  queryClient.invalidateQueries({ queryKey: departmentQueryKeys.workspace(workspaceId) });

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

export const useUpdateIssueStatus = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (status: NonNullable<UpdateIssueInput['status']>) =>
      issueService.updateStatus(issueId!, status),
    onSuccess: (issue) => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issueId, {
        projectId: issue.projectId,
        teamId: issue.teamId,
        departmentId: issue.departmentId,
      });
    },
  });
};

export const useUpdateAnyIssueStatus = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ issueId, status }: { issueId: string; status: NonNullable<UpdateIssueInput['status']> }) =>
      issueService.updateStatus(issueId, status),
    onSuccess: (issue) => {
      invalidateIssueRelatedQueries(queryClient, workspaceId, issue.id, {
        projectId: issue.projectId,
        teamId: issue.teamId,
        departmentId: issue.departmentId,
      });
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
