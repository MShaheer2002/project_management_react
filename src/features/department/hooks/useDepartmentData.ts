import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { sidebarQueryKeys } from '@features/sidebar';
import { workspaceQueryKeys } from '@features/workspace';
import { departmentService } from '../services/departmentService';
import type {
  AddDepartmentMembersInput,
  CreateDepartmentInput,
  ListDepartmentMembersInput,
  ListDepartmentsInput,
  UpdateDepartmentInput,
} from '../types';

export const departmentQueryKeys = {
  all: ['departments'] as const,
  workspace: (workspaceId: string | undefined) => [...departmentQueryKeys.all, workspaceId] as const,
  directory: (workspaceId: string | undefined, params: object) =>
    [...departmentQueryKeys.workspace(workspaceId), 'directory', params] as const,
  options: (workspaceId: string | undefined, params: object) =>
    [...departmentQueryKeys.workspace(workspaceId), 'options', params] as const,
  detail: (workspaceId: string | undefined, departmentId: string | undefined) =>
    [...departmentQueryKeys.workspace(workspaceId), 'detail', departmentId] as const,
  members: (
    workspaceId: string | undefined,
    departmentId: string | undefined,
    params: object
  ) => [...departmentQueryKeys.detail(workspaceId, departmentId), 'members', params] as const,
};

export const useDepartmentsDirectory = (params: ListDepartmentsInput = {}, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: departmentQueryKeys.directory(workspaceId, params),
    queryFn: ({ pageParam }) =>
      departmentService.listDirectory({
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useDepartmentOptions = (params: ListDepartmentsInput = {}, options?: { enabled?: boolean }) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: departmentQueryKeys.options(workspaceId, params),
    queryFn: ({ pageParam }) =>
      departmentService.listOptions({
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId) && (options?.enabled ?? true),
  });
};

export const useDepartmentDetail = (departmentId: string | undefined) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: departmentQueryKeys.detail(workspaceId, departmentId),
    queryFn: () => departmentService.getById(departmentId!),
    enabled: Boolean(workspaceId && departmentId),
  });
};

export const useDepartmentMembers = (
  departmentId: string | undefined,
  params: ListDepartmentMembersInput = {},
  options?: { enabled?: boolean }
) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useInfiniteQuery({
    queryKey: departmentQueryKeys.members(workspaceId, departmentId, params),
    queryFn: ({ pageParam }) =>
      departmentService.listMembers(departmentId!, {
        ...params,
        cursor: pageParam || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(workspaceId && departmentId) && (options?.enabled ?? true),
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: CreateDepartmentInput) => departmentService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['teams', workspaceId] });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};

export const useUpdateDepartment = (departmentId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: UpdateDepartmentInput) => departmentService.update(departmentId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['teams', workspaceId] });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};

export const useDeleteDepartment = (departmentId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: () => departmentService.delete(departmentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['teams', workspaceId] });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};

export const useAddDepartmentMembers = (departmentId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: AddDepartmentMembersInput) => departmentService.addMembers(departmentId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['teams', workspaceId] });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};

export const useRemoveDepartmentMember = (departmentId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (userId: string) => departmentService.removeMember(departmentId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['teams', workspaceId] });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
    },
  });
};
