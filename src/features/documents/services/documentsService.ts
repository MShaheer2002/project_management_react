import type { AxiosRequestConfig } from 'axios';
import { privateApi } from '@shared/services/privateApi';
import type { ApiPaginatedResponse, ApiResponse } from '@shared/services/types';
import type { CreateDocumentInput } from '@shared/types/documents';
import type {
  DocumentListResult,
  DocumentRecord,
  ListDocumentsInput,
  UpdateDocumentInput,
} from '../types';

const mutationConfig = {
  skipGlobalErrorToast: true,
} as AxiosRequestConfig & { skipGlobalErrorToast: boolean };

const toListResult = (response: ApiPaginatedResponse<DocumentRecord>): DocumentListResult => ({
  items: response.data,
  meta: response.meta,
});

export const documentsService = {
  listWorkspace: async (workspaceId: string, params: ListDocumentsInput = {}): Promise<DocumentListResult> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<DocumentRecord>>(
      `/workspaces/${workspaceId}/documents`,
      { params }
    );
    return toListResult(data);
  },

  createWorkspace: async (workspaceId: string, input: CreateDocumentInput): Promise<DocumentRecord> => {
    const { data } = await privateApi.post<ApiResponse<DocumentRecord>>(
      `/workspaces/${workspaceId}/documents`,
      input,
      mutationConfig
    );
    return data.data;
  },

  updateWorkspace: async (
    workspaceId: string,
    documentId: string,
    input: UpdateDocumentInput
  ): Promise<DocumentRecord> => {
    const { data } = await privateApi.patch<ApiResponse<DocumentRecord>>(
      `/workspaces/${workspaceId}/documents/${documentId}`,
      input,
      mutationConfig
    );
    return data.data;
  },

  deleteWorkspace: async (workspaceId: string, documentId: string): Promise<void> => {
    await privateApi.delete(`/workspaces/${workspaceId}/documents/${documentId}`, mutationConfig);
  },

  listTeam: async (teamId: string, params: ListDocumentsInput = {}): Promise<DocumentListResult> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<DocumentRecord>>(`/teams/${teamId}/documents`, {
      params,
    });
    return toListResult(data);
  },

  createTeam: async (teamId: string, input: CreateDocumentInput): Promise<DocumentRecord> => {
    const { data } = await privateApi.post<ApiResponse<DocumentRecord>>(
      `/teams/${teamId}/documents`,
      input,
      mutationConfig
    );
    return data.data;
  },

  updateTeam: async (teamId: string, documentId: string, input: UpdateDocumentInput): Promise<DocumentRecord> => {
    const { data } = await privateApi.patch<ApiResponse<DocumentRecord>>(
      `/teams/${teamId}/documents/${documentId}`,
      input,
      mutationConfig
    );
    return data.data;
  },

  deleteTeam: async (teamId: string, documentId: string): Promise<void> => {
    await privateApi.delete(`/teams/${teamId}/documents/${documentId}`, mutationConfig);
  },

  listProject: async (projectId: string, params: ListDocumentsInput = {}): Promise<DocumentListResult> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<DocumentRecord>>(
      `/projects/${projectId}/documents`,
      { params }
    );
    return toListResult(data);
  },

  createProject: async (projectId: string, input: CreateDocumentInput): Promise<DocumentRecord> => {
    const { data } = await privateApi.post<ApiResponse<DocumentRecord>>(
      `/projects/${projectId}/documents`,
      input,
      mutationConfig
    );
    return data.data;
  },

  updateProject: async (
    projectId: string,
    documentId: string,
    input: UpdateDocumentInput
  ): Promise<DocumentRecord> => {
    const { data } = await privateApi.patch<ApiResponse<DocumentRecord>>(
      `/projects/${projectId}/documents/${documentId}`,
      input,
      mutationConfig
    );
    return data.data;
  },

  deleteProject: async (projectId: string, documentId: string): Promise<void> => {
    await privateApi.delete(`/projects/${projectId}/documents/${documentId}`, mutationConfig);
  },
};
