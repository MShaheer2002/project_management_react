import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { activityQueryKeys } from '@features/activity';
import { issueQueryKeys } from '@features/issues';
import { teamQueryKeys } from '@features/team';
import { cycleService } from '../services/cycleService';
import type {
  CarryOverCycleInput,
  CompleteCycleInput,
  CreateCycleInput,
  ListCycleIssuesInput,
  ListCyclesInput,
  PlanIssuesInput,
  UpdateCycleInput,
} from '../types';

export const cycleQueryKeys = {
  all: ['cycles'] as const,
  workspace: (workspaceId: string | undefined) => [...cycleQueryKeys.all, workspaceId] as const,
  list: (workspaceId: string | undefined, params: object) =>
    [...cycleQueryKeys.workspace(workspaceId), 'list', params] as const,
  current: (workspaceId: string | undefined, teamId: string | undefined) =>
    [...cycleQueryKeys.workspace(workspaceId), 'current', teamId] as const,
  detail: (workspaceId: string | undefined, cycleId: string | undefined) =>
    [...cycleQueryKeys.workspace(workspaceId), 'detail', cycleId] as const,
  issues: (workspaceId: string | undefined, cycleId: string | undefined, params: object) =>
    [...cycleQueryKeys.detail(workspaceId, cycleId), 'issues', params] as const,
};

const invalidateCycleRelatedQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string | undefined,
  cycleId?: string
) => {
  queryClient.invalidateQueries({ queryKey: cycleQueryKeys.workspace(workspaceId) });
  queryClient.invalidateQueries({ queryKey: issueQueryKeys.workspace(workspaceId) });
  queryClient.invalidateQueries({ queryKey: teamQueryKeys.workspace(workspaceId) });
  queryClient.invalidateQueries({ queryKey: activityQueryKeys.workspace(workspaceId) });
  if (cycleId) {
    queryClient.invalidateQueries({ queryKey: cycleQueryKeys.detail(workspaceId, cycleId) });
  }
};

export const useCycles = (params: ListCyclesInput = {}, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: cycleQueryKeys.list(workspaceId, params),
    queryFn: ({ pageParam }) => cycleService.list({ ...params, cursor: pageParam || undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useCurrentCycle = (teamId?: string, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: cycleQueryKeys.current(workspaceId, teamId),
    queryFn: () => cycleService.current(teamId),
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useCycleDetail = (cycleId: string | undefined) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: cycleQueryKeys.detail(workspaceId, cycleId),
    queryFn: () => cycleService.getById(cycleId!),
    enabled: Boolean(workspaceId && cycleId),
  });
};

export const useCycleIssues = (
  cycleId: string | undefined,
  params: ListCycleIssuesInput = {},
  options?: { enabled?: boolean }
) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: cycleQueryKeys.issues(workspaceId, cycleId, params),
    queryFn: ({ pageParam }) => cycleService.listIssues(cycleId!, { ...params, cursor: pageParam || undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId && cycleId) && (options?.enabled ?? true),
  });
};

export const useCreateCycle = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateCycleInput) => cycleService.create(input),
    onSuccess: (cycle) => invalidateCycleRelatedQueries(queryClient, workspaceId, cycle.id),
  });
};

export const useUpdateCycle = (cycleId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: UpdateCycleInput) => cycleService.update(cycleId!, input),
    onSuccess: () => invalidateCycleRelatedQueries(queryClient, workspaceId, cycleId),
  });
};

export const useDeleteCycle = (cycleId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: () => cycleService.delete(cycleId!),
    onSuccess: () => invalidateCycleRelatedQueries(queryClient, workspaceId, cycleId),
  });
};

export const useCompleteCycle = (cycleId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: CompleteCycleInput) => cycleService.complete(cycleId!, input),
    onSuccess: () => invalidateCycleRelatedQueries(queryClient, workspaceId, cycleId),
  });
};

export const useReopenCycle = (cycleId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: () => cycleService.reopen(cycleId!),
    onSuccess: () => invalidateCycleRelatedQueries(queryClient, workspaceId, cycleId),
  });
};

export const useCarryOverCycle = (cycleId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: CarryOverCycleInput) => cycleService.carryOver(cycleId!, input),
    onSuccess: () => invalidateCycleRelatedQueries(queryClient, workspaceId, cycleId),
  });
};

export const usePlanCycleIssues = (cycleId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: PlanIssuesInput) => cycleService.planIssues(cycleId!, input),
    onSuccess: () => invalidateCycleRelatedQueries(queryClient, workspaceId, cycleId),
  });
};

export const useAssignIssuesToCycle = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: ({ cycleId, issueIds }: { cycleId: string; issueIds: string[] }) =>
      cycleService.planIssues(cycleId, { issueIds }),
    onSuccess: (_result, variables) => invalidateCycleRelatedQueries(queryClient, workspaceId, variables.cycleId),
  });
};

export const useAssignIssueToCycle = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (cycleId: string) => cycleService.assignIssue(issueId!, cycleId),
    onSuccess: (issue) => invalidateCycleRelatedQueries(queryClient, workspaceId, issue.cycleId ?? undefined),
  });
};

export const useUnassignIssueFromCycle = (issueId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: () => cycleService.unassignIssue(issueId!),
    onSuccess: (issue) => invalidateCycleRelatedQueries(queryClient, workspaceId, issue.cycleId ?? undefined),
  });
};

export const useRemoveCycleIssue = (cycleId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (issueId: string) => cycleService.removeIssue(cycleId!, issueId),
    onSuccess: () => invalidateCycleRelatedQueries(queryClient, workspaceId, cycleId),
  });
};
