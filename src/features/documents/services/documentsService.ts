import type { AxiosRequestConfig } from 'axios';
import { privateApi } from '@shared/services/privateApi';
import type { ApiPaginatedResponse, ApiResponse } from '@shared/services/types';
import type { CreateDocumentInput } from '@shared/types/documents';
import type {
  CreateFolderInput,
  DocumentFolder,
  DocumentListResult,
  DocumentRecord,
  FolderBreadcrumb,
  ListDocumentsInput,
  MoveDocumentInput,
  MoveFolderInput,
  RenameFolderInput,
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

  // ── Workspace folder operations ──

  listWorkspaceFolders: async (
    workspaceId: string,
    params: { parentId?: string | null } = {}
  ): Promise<DocumentFolder[]> => {
    const { data } = await privateApi.get<ApiResponse<DocumentFolder[]>>(
      `/workspaces/${workspaceId}/documents/folders`,
      { params }
    );
    return data.data;
  },

  getWorkspaceFolderBreadcrumbs: async (
    workspaceId: string,
    folderId: string
  ): Promise<FolderBreadcrumb[]> => {
    const { data } = await privateApi.get<ApiResponse<{ items: FolderBreadcrumb[] }>>(
      `/workspaces/${workspaceId}/documents/folders/${folderId}/breadcrumbs`
    );
    return data.data.items;
  },

  createWorkspaceFolder: async (workspaceId: string, input: CreateFolderInput): Promise<DocumentFolder> => {
    const { data } = await privateApi.post<ApiResponse<DocumentFolder>>(
      `/workspaces/${workspaceId}/documents/folders`,
      input,
      mutationConfig
    );
    return data.data;
  },

  renameWorkspaceFolder: async (
    workspaceId: string,
    folderId: string,
    input: RenameFolderInput
  ): Promise<DocumentFolder> => {
    const { data } = await privateApi.patch<ApiResponse<DocumentFolder>>(
      `/workspaces/${workspaceId}/documents/folders/${folderId}`,
      input,
      mutationConfig
    );
    return data.data;
  },

  deleteWorkspaceFolder: async (workspaceId: string, folderId: string): Promise<void> => {
    await privateApi.delete(`/workspaces/${workspaceId}/documents/folders/${folderId}`, mutationConfig);
  },

  moveWorkspaceFolder: async (
    workspaceId: string,
    folderId: string,
    input: MoveFolderInput
  ): Promise<void> => {
    await privateApi.post(
      `/workspaces/${workspaceId}/documents/folders/${folderId}/move`,
      input,
      mutationConfig
    );
  },

  moveWorkspaceDocument: async (
    workspaceId: string,
    documentId: string,
    input: MoveDocumentInput
  ): Promise<void> => {
    await privateApi.post(
      `/workspaces/${workspaceId}/documents/${documentId}/move`,
      input,
      mutationConfig
    );
  },

  // ── Team folder operations ──

  listTeamFolders: async (
    teamId: string,
    params: { parentId?: string | null } = {}
  ): Promise<DocumentFolder[]> => {
    const { data } = await privateApi.get<ApiResponse<DocumentFolder[]>>(
      `/teams/${teamId}/documents/folders`,
      { params }
    );
    return data.data;
  },

  getTeamFolderBreadcrumbs: async (teamId: string, folderId: string): Promise<FolderBreadcrumb[]> => {
    const { data } = await privateApi.get<ApiResponse<{ items: FolderBreadcrumb[] }>>(
      `/teams/${teamId}/documents/folders/${folderId}/breadcrumbs`
    );
    return data.data.items;
  },

  createTeamFolder: async (teamId: string, input: CreateFolderInput): Promise<DocumentFolder> => {
    const { data } = await privateApi.post<ApiResponse<DocumentFolder>>(
      `/teams/${teamId}/documents/folders`,
      input,
      mutationConfig
    );
    return data.data;
  },

  renameTeamFolder: async (
    teamId: string,
    folderId: string,
    input: RenameFolderInput
  ): Promise<DocumentFolder> => {
    const { data } = await privateApi.patch<ApiResponse<DocumentFolder>>(
      `/teams/${teamId}/documents/folders/${folderId}`,
      input,
      mutationConfig
    );
    return data.data;
  },

  deleteTeamFolder: async (teamId: string, folderId: string): Promise<void> => {
    await privateApi.delete(`/teams/${teamId}/documents/folders/${folderId}`, mutationConfig);
  },

  moveTeamFolder: async (teamId: string, folderId: string, input: MoveFolderInput): Promise<void> => {
    await privateApi.post(`/teams/${teamId}/documents/folders/${folderId}/move`, input, mutationConfig);
  },

  moveTeamDocument: async (teamId: string, documentId: string, input: MoveDocumentInput): Promise<void> => {
    await privateApi.post(`/teams/${teamId}/documents/${documentId}/move`, input, mutationConfig);
  },

  // ── Project folder operations ──

  listProjectFolders: async (
    projectId: string,
    params: { parentId?: string | null } = {}
  ): Promise<DocumentFolder[]> => {
    const { data } = await privateApi.get<ApiResponse<DocumentFolder[]>>(
      `/projects/${projectId}/documents/folders`,
      { params }
    );
    return data.data;
  },

  getProjectFolderBreadcrumbs: async (projectId: string, folderId: string): Promise<FolderBreadcrumb[]> => {
    const { data } = await privateApi.get<ApiResponse<{ items: FolderBreadcrumb[] }>>(
      `/projects/${projectId}/documents/folders/${folderId}/breadcrumbs`
    );
    return data.data.items;
  },

  createProjectFolder: async (projectId: string, input: CreateFolderInput): Promise<DocumentFolder> => {
    const { data } = await privateApi.post<ApiResponse<DocumentFolder>>(
      `/projects/${projectId}/documents/folders`,
      input,
      mutationConfig
    );
    return data.data;
  },

  renameProjectFolder: async (
    projectId: string,
    folderId: string,
    input: RenameFolderInput
  ): Promise<DocumentFolder> => {
    const { data } = await privateApi.patch<ApiResponse<DocumentFolder>>(
      `/projects/${projectId}/documents/folders/${folderId}`,
      input,
      mutationConfig
    );
    return data.data;
  },

  deleteProjectFolder: async (projectId: string, folderId: string): Promise<void> => {
    await privateApi.delete(`/projects/${projectId}/documents/folders/${folderId}`, mutationConfig);
  },

  moveProjectFolder: async (
    projectId: string,
    folderId: string,
    input: MoveFolderInput
  ): Promise<void> => {
    await privateApi.post(
      `/projects/${projectId}/documents/folders/${folderId}/move`,
      input,
      mutationConfig
    );
  },

  moveProjectDocument: async (
    projectId: string,
    documentId: string,
    input: MoveDocumentInput
  ): Promise<void> => {
    await privateApi.post(
      `/projects/${projectId}/documents/${documentId}/move`,
      input,
      mutationConfig
    );
  },
};
