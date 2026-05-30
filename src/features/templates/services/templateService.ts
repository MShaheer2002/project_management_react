import type { AxiosRequestConfig } from 'axios';
import { isAxiosError } from 'axios';
import { privateApi } from '@shared/services/privateApi';
import type { ApiPaginatedResponse, ApiResponse } from '@shared/services/types';
import { workspaceService, type WorkspaceMemberOption } from '@features/workspace/services/workspaceService';
import type {
  IssueTemplate,
  TemplateActivationConflictDetails,
  TemplateActivationResult,
  TemplateApplyDraft,
  TemplateDefaultConflictDetails,
  TemplateDefaultsResponse,
  TemplateDraftInput,
  TemplateListInput,
  TemplateCreator,
} from '../types';

const mutationConfig = {
  skipGlobalErrorToast: true,
} as AxiosRequestConfig & { skipGlobalErrorToast: boolean };

type RawTemplateUser = TemplateCreator & {
  role?: string;
};

type RawTemplate = Omit<IssueTemplate, 'createdBy'> & {
  createdBy?: RawTemplateUser;
  updatedBy?: RawTemplateUser | null;
  creator?: RawTemplateUser;
  updater?: RawTemplateUser | null;
};

type RawTemplatesListResponse = ApiResponse<RawTemplate[]> | ApiPaginatedResponse<RawTemplate>;

type RawTemplateDefaultsResponse = ApiResponse<TemplateDefaultsResponse> | TemplateDefaultsResponse;

type RawTemplateActivationResponse = ApiResponse<TemplateActivationResult> | TemplateActivationResult;

type RawTemplateApplyResponse = ApiResponse<TemplateApplyDraft> | TemplateApplyDraft;

type RawTemplateActivationConflictError = {
  success: false;
  error: {
    code: 'TEMPLATE_ALREADY_ACTIVE' | 'TEMPLATE_ACTIVATION_CONFLICT';
    message: string;
    details?: TemplateActivationConflictDetails;
  };
};

type RawTemplateDefaultConflictError = {
  success: false;
  error: {
    code: 'TEMPLATE_DEFAULT_CONFLICT';
    message: string;
    details?: TemplateDefaultConflictDetails;
  };
};

const normalizeTemplateUser = (user: RawTemplateUser): TemplateCreator => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatar ?? null,
});

const normalizeTemplate = (template: RawTemplate): IssueTemplate => ({
  ...template,
  createdBy: normalizeTemplateUser(template.createdBy ?? template.creator ?? {
    id: '',
    name: 'Unknown',
    email: '',
    avatar: null,
  }),
  customCategory: template.customCategory ?? null,
  customStatus: template.customStatus ?? null,
  scopeType: template.scopeType ?? 'WORKSPACE',
  scopeId: template.scopeId ?? null,
  isDefault: template.isDefault ?? false,
  defaultAssigneeId: template.defaultAssigneeId ?? null,
  defaultEstimate: template.defaultEstimate ?? null,
  defaultDueDateOffset: template.defaultDueDateOffset ?? null,
  defaultSeverity: template.defaultSeverity ?? null,
  stepsToReproduceTemplate: template.stepsToReproduceTemplate ?? null,
  expectedBehaviorTemplate: template.expectedBehaviorTemplate ?? null,
  actualBehaviorTemplate: template.actualBehaviorTemplate ?? null,
  acceptanceCriteriaTemplate: template.acceptanceCriteriaTemplate ?? null,
  relatedIssueKeysTemplate: template.relatedIssueKeysTemplate ?? null,
  notesTemplate: template.notesTemplate ?? null,
  lifecycle: template.lifecycle ?? 'ACTIVE',
  isActive: template.isActive ?? false,
  appliedByCurrentUser: template.appliedByCurrentUser ?? false,
  appliedAt: template.appliedAt ?? null,
  appliedDraft: template.appliedDraft ?? null,
  activeVersion: template.activeVersion ?? 1,
  deletedAt: template.deletedAt ?? null,
  lastAppliedAt: template.lastAppliedAt ?? null,
  updatedById: template.updatedById ?? template.updater?.id ?? null,
});

const unwrapResponse = <T>(data: ApiResponse<T> | T): T => {
  if (typeof data === 'object' && data !== null && 'success' in data && (data as ApiResponse<T>).success) {
    return (data as ApiResponse<T>).data;
  }
  return data as T;
};

const normalizeList = (data: RawTemplatesListResponse): IssueTemplate[] => {
  if ('meta' in data && Array.isArray(data.data)) {
    return data.data.map(normalizeTemplate);
  }
  const unwrapped = unwrapResponse(data as ApiResponse<RawTemplate[]> | RawTemplate[]);
  return Array.isArray(unwrapped) ? unwrapped.map(normalizeTemplate) : [];
};

const normalizeMemberOption = (member: WorkspaceMemberOption): TemplateCreator => ({
  id: member.id,
  name: member.name,
  email: member.email,
  avatar: null,
});

const normalizeDefaults = (data: RawTemplateDefaultsResponse): TemplateDefaultsResponse => unwrapResponse(data as ApiResponse<TemplateDefaultsResponse> | TemplateDefaultsResponse);

const normalizeActivationResult = (data: RawTemplateActivationResponse): TemplateActivationResult =>
  unwrapResponse(data as ApiResponse<TemplateActivationResult> | TemplateActivationResult);

const normalizeApplyDraft = (data: RawTemplateApplyResponse): TemplateApplyDraft =>
  unwrapResponse(data as ApiResponse<TemplateApplyDraft> | TemplateApplyDraft);

const withWorkspaceParams = (input: TemplateListInput = {}) => ({
  ...input,
  category: input.category === 'all' ? undefined : input.category,
  issueType: input.issueType === 'all' ? undefined : input.issueType,
  scopeType: input.scopeType === 'all' ? undefined : input.scopeType,
  creatorId: input.creatorId === 'all' ? undefined : input.creatorId,
  lifecycle: input.lifecycle === 'all' ? undefined : input.lifecycle,
  isActive: input.isActive === 'all' ? undefined : input.isActive,
});

const withCacheBust = <T extends Record<string, unknown>>(params: T = {} as T): T & { _ts: number } => ({
  ...params,
  _ts: Date.now(),
});

export const templateService = {
  getDefaults: async (): Promise<TemplateDefaultsResponse> => {
    const { data } = await privateApi.get<RawTemplateDefaultsResponse>('/templates/defaults', {
      params: withCacheBust(),
    });
    return normalizeDefaults(data);
  },

  list: async (input: TemplateListInput = {}): Promise<IssueTemplate[]> => {
    const { data } = await privateApi.get<RawTemplatesListResponse>('/templates', {
      params: withCacheBust(withWorkspaceParams(input)),
    });
    return normalizeList(data);
  },

  getActive: async (params: Record<string, unknown> = {}): Promise<IssueTemplate[]> => {
    const { data } = await privateApi.get<RawTemplatesListResponse>('/templates/active', {
      params: withCacheBust(params),
    });
    return normalizeList(data);
  },

  getById: async (templateId: string): Promise<IssueTemplate | null> => {
    const { data } = await privateApi.get<ApiResponse<RawTemplate> | RawTemplate>(`/templates/${templateId}`, {
      params: withCacheBust(),
    });
    const template = unwrapResponse(data as ApiResponse<RawTemplate> | RawTemplate);
    return template ? normalizeTemplate(template as RawTemplate) : null;
  },

  create: async (input: TemplateDraftInput): Promise<IssueTemplate> => {
    const { data } = await privateApi.post<ApiResponse<RawTemplate> | RawTemplate>('/templates', input, mutationConfig);
    return normalizeTemplate(unwrapResponse(data as ApiResponse<RawTemplate> | RawTemplate));
  },

  update: async (templateId: string, input: TemplateDraftInput): Promise<IssueTemplate> => {
    const { data } = await privateApi.patch<ApiResponse<RawTemplate> | RawTemplate>(`/templates/${templateId}`, input, mutationConfig);
    return normalizeTemplate(unwrapResponse(data as ApiResponse<RawTemplate> | RawTemplate));
  },

  delete: async (templateId: string): Promise<void> => {
    await privateApi.delete(`/templates/${templateId}`, mutationConfig);
  },

  duplicate: async (templateId: string): Promise<IssueTemplate> => {
    const { data } = await privateApi.post<ApiResponse<RawTemplate> | RawTemplate>(`/templates/${templateId}/duplicate`, {}, mutationConfig);
    return normalizeTemplate(unwrapResponse(data as ApiResponse<RawTemplate> | RawTemplate));
  },

  apply: async (templateId: string): Promise<TemplateApplyDraft> => {
    const { data } = await privateApi.post<ApiResponse<TemplateApplyDraft> | TemplateApplyDraft>(
      `/templates/${templateId}/apply`,
      {},
      mutationConfig
    );
    return normalizeApplyDraft(data);
  },

  activate: async (templateId: string): Promise<TemplateActivationResult> => {
    const { data } = await privateApi.post<ApiResponse<TemplateActivationResult> | TemplateActivationResult>(
      `/templates/${templateId}/activate`,
      {},
      mutationConfig
    );
    return normalizeActivationResult(data);
  },

  confirmActivate: async (templateId: string): Promise<TemplateActivationResult> => {
    const { data } = await privateApi.post<ApiResponse<TemplateActivationResult> | TemplateActivationResult>(
      `/templates/${templateId}/activate/confirm`,
      {},
      mutationConfig
    );
    return normalizeActivationResult(data);
  },

  confirmDefault: async (templateId: string): Promise<IssueTemplate> => {
    const { data } = await privateApi.post<ApiResponse<RawTemplate> | RawTemplate>(
      `/templates/${templateId}/default/confirm`,
      {},
      mutationConfig
    );
    return normalizeTemplate(unwrapResponse(data as ApiResponse<RawTemplate> | RawTemplate));
  },

  deactivate: async (templateId: string): Promise<TemplateActivationResult> => {
    const { data } = await privateApi.post<ApiResponse<TemplateActivationResult> | TemplateActivationResult>(
      `/templates/${templateId}/deactivate`,
      {},
      mutationConfig
    );
    return normalizeActivationResult(data);
  },

  listAssignableUsers: async (params: Record<string, unknown> = {}): Promise<TemplateCreator[]> => {
    const workspaceId = params.workspaceId as string | undefined;
    if (!workspaceId) return [];

    const result = await workspaceService.listMemberOptions(workspaceId, {
      limit: typeof params.limit === 'number' ? params.limit : 100,
      sort: (params.sort as 'name:asc' | 'name:desc' | 'joinedAt:asc' | 'joinedAt:desc' | undefined) ?? 'name:asc',
      q: typeof params.q === 'string' ? params.q : undefined,
      role: (params.role as 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST' | undefined) ?? undefined,
    });

    return result.items.map(normalizeMemberOption);
  },

  inspectActivationError: (error: unknown): TemplateActivationConflictDetails | null => {
    const candidate = isAxiosError<RawTemplateActivationConflictError>(error) ? error.response?.data : (error as RawTemplateActivationConflictError | undefined);
    if (!candidate?.error) return null;
    if (candidate.error.code !== 'TEMPLATE_ALREADY_ACTIVE' && candidate.error.code !== 'TEMPLATE_ACTIVATION_CONFLICT') return null;
    return candidate.error.details ? { ...candidate.error.details, message: candidate.error.message } : null;
  },

  inspectDefaultError: (error: unknown): TemplateDefaultConflictDetails | null => {
    const candidate = isAxiosError<RawTemplateDefaultConflictError>(error)
      ? error.response?.data
      : (error as RawTemplateDefaultConflictError | undefined);
    if (!candidate?.error || candidate.error.code !== 'TEMPLATE_DEFAULT_CONFLICT') return null;
    return candidate.error.details ? { ...candidate.error.details, message: candidate.error.message } : null;
  },
};
