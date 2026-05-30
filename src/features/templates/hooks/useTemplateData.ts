import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { workspaceService } from '@features/workspace/services/workspaceService';
import { templateService } from '../services/templateService';
import type { TemplateDraftInput, TemplateListInput } from '../types';

export const templateQueryKeys = {
  all: ['templates'] as const,
  workspace: (workspaceId: string | undefined) => [...templateQueryKeys.all, workspaceId] as const,
  defaults: (workspaceId: string | undefined) => [...templateQueryKeys.workspace(workspaceId), 'defaults'] as const,
  active: (workspaceId: string | undefined, params: object) =>
    [...templateQueryKeys.workspace(workspaceId), 'active', params] as const,
  list: (workspaceId: string | undefined, input: TemplateListInput) =>
    [...templateQueryKeys.workspace(workspaceId), 'list', input] as const,
  detail: (workspaceId: string | undefined, templateId: string | undefined) =>
    [...templateQueryKeys.workspace(workspaceId), 'detail', templateId] as const,
  applied: (workspaceId: string | undefined, userId: string | undefined, templateId: string | undefined) =>
    [...templateQueryKeys.workspace(workspaceId), 'applied', userId, templateId] as const,
  creators: (workspaceId: string | undefined, params: object) =>
    [...templateQueryKeys.workspace(workspaceId), 'creators', params] as const,
  assignees: (workspaceId: string | undefined, params: object) =>
    [...templateQueryKeys.workspace(workspaceId), 'assignees', params] as const,
};

const invalidateTemplates = (queryClient: ReturnType<typeof useQueryClient>, workspaceId: string | undefined, templateId?: string) => {
  queryClient.invalidateQueries({ queryKey: templateQueryKeys.workspace(workspaceId) });
  if (templateId) {
    queryClient.invalidateQueries({ queryKey: templateQueryKeys.detail(workspaceId, templateId) });
  }
};

export const useTemplateDefaults = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: templateQueryKeys.defaults(workspaceId),
    queryFn: () => templateService.getDefaults(),
    enabled: Boolean(workspaceId),
  });
};

export const useTemplates = (input: TemplateListInput) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: templateQueryKeys.list(workspaceId, input),
    queryFn: () => templateService.list(input),
    enabled: Boolean(workspaceId),
  });
};

export const useActiveTemplates = (params: Record<string, unknown> = {}) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: templateQueryKeys.active(workspaceId, params),
    queryFn: () => templateService.getActive(params),
    enabled: Boolean(workspaceId),
  });
};

export const useTemplateDetail = (templateId: string | undefined) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: templateQueryKeys.detail(workspaceId, templateId),
    queryFn: () => templateService.getById(templateId!),
    enabled: Boolean(workspaceId && templateId),
  });
};

export const useTemplateCreators = (params: Record<string, unknown> = {}) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: templateQueryKeys.creators(workspaceId, params),
    queryFn: async () => {
      if (!workspaceId) return [];
      const result = await workspaceService.listMemberOptions(workspaceId, {
        limit: typeof params.limit === 'number' ? params.limit : 100,
        sort: (params.sort as 'name:asc' | 'name:desc' | 'joinedAt:asc' | 'joinedAt:desc' | undefined) ?? 'name:asc',
        q: typeof params.q === 'string' ? params.q : undefined,
        role: (params.role as 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST' | undefined) ?? undefined,
      });
      return result.items.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        avatar: null,
      }));
    },
    enabled: Boolean(workspaceId),
  });
};

export const useTemplateAssignableUsers = (params: Record<string, unknown> = {}) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useQuery({
    queryKey: templateQueryKeys.assignees(workspaceId, params),
    queryFn: () => templateService.listAssignableUsers({ ...params, workspaceId }),
    enabled: Boolean(workspaceId),
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: TemplateDraftInput) => templateService.create(input),
    onSuccess: (template) => invalidateTemplates(queryClient, workspaceId, template.id),
  });
};

export const useUpdateTemplate = (templateId: string | undefined) => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: TemplateDraftInput) => templateService.update(templateId!, input),
    onSuccess: () => invalidateTemplates(queryClient, workspaceId, templateId),
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (templateId: string) => templateService.delete(templateId),
    onSuccess: () => invalidateTemplates(queryClient, workspaceId),
  });
};

export const useDuplicateTemplate = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (templateId: string) => templateService.duplicate(templateId),
    onSuccess: (template) => invalidateTemplates(queryClient, workspaceId, template.id),
  });
};

export const useApplyTemplate = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const userId = useAuthStore((s) => s.currentUser?.id);

  return useMutation({
    mutationFn: (templateId: string) => templateService.apply(templateId),
    onSuccess: (draft) => {
      if (workspaceId && userId) {
        const appliedState = {
          templateId: draft.templateId,
          appliedByCurrentUser: true,
          appliedAt: new Date().toISOString(),
          appliedDraft: draft,
        };
        queryClient.setQueryData(templateQueryKeys.applied(workspaceId, userId, draft.templateId), appliedState);
        queryClient.setQueryData(templateQueryKeys.detail(workspaceId, draft.templateId), (current: unknown) =>
          current && typeof current === 'object'
            ? {
                ...(current as Record<string, unknown>),
                ...appliedState,
              }
            : current
        );
      }
      invalidateTemplates(queryClient, workspaceId);
    },
  });
};

export const useActivateTemplate = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (templateId: string) => templateService.activate(templateId),
    onSuccess: (template) => invalidateTemplates(queryClient, workspaceId, template.id),
  });
};

export const useConfirmActivateTemplate = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (templateId: string) => templateService.confirmActivate(templateId),
    onSuccess: (template) => invalidateTemplates(queryClient, workspaceId, template.id),
  });
};

export const useDeactivateTemplate = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (templateId: string) => templateService.deactivate(templateId),
    onSuccess: (template) => invalidateTemplates(queryClient, workspaceId, template.id),
  });
};

export const useConfirmDefaultTemplate = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (templateId: string) => templateService.confirmDefault(templateId),
    onSuccess: (template) => invalidateTemplates(queryClient, workspaceId, template.id),
  });
};
