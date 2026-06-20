import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';
import type {
  DriveConnectionStatus,
  DriveConnectResponse,
  DriveUploadResult,
} from '../types';

/**
 * Google Drive service — per-user (not workspace-scoped).
 * Routes are under /me/drive (no X-Workspace-Id header needed).
 *
 * SECURITY: All uploads are proxied through our backend.
 * Google Drive access tokens NEVER leave the server.
 * Frontend sends file bytes to our API, backend forwards to Google Drive.
 */
export const driveService = {
  /** GET /me/drive — Check connection status */
  getStatus: async (): Promise<DriveConnectionStatus> => {
    const { data } = await privateApi.get<ApiResponse<DriveConnectionStatus>>(
      '/me/drive',
    );
    return data.data;
  },

  /** POST /me/drive/connect — Start OAuth flow */
  connect: async (): Promise<DriveConnectResponse> => {
    const { data } = await privateApi.post<ApiResponse<DriveConnectResponse>>(
      '/me/drive/connect',
    );
    return data.data;
  },

  /** DELETE /me/drive/disconnect — Revoke tokens and delete connection */
  disconnect: async (): Promise<void> => {
    await privateApi.delete('/me/drive/disconnect');
  },

  /**
   * POST /me/drive/upload — Upload a file to the user's Google Drive.
   *
   * File bytes are sent to our backend via multipart/form-data.
   * The backend proxies the file to Google Drive using the user's
   * encrypted access token — the token NEVER reaches the browser.
   *
   * Flow: Browser → Our Backend → Google Drive API
   *
   * @param file - The File to upload
   * @param options - Upload options
   * @param options.onProgress - Optional progress callback (0-100)
   * @param options.signal - Optional AbortSignal for cancellation
   * @param options.folderContext - Optional folder hierarchy context
   */
  uploadFile: async (
    file: File,
    options?: {
      onProgress?: (percent: number) => void;
      signal?: AbortSignal;
      folderContext?: {
        workspaceName?: string;
        teamName?: string;
        projectName?: string;
        issueIdentifier?: string;
      };
    },
  ): Promise<DriveUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    // Append folder context — backend creates the folder hierarchy in Drive
    // Trussen/{workspaceName}/{teamName}/{projectName}/{issueIdentifier}/file.png
    const ctx = options?.folderContext;
    if (ctx?.workspaceName) formData.append('workspaceName', ctx.workspaceName);
    if (ctx?.teamName) formData.append('teamName', ctx.teamName);
    if (ctx?.projectName) formData.append('projectName', ctx.projectName);
    if (ctx?.issueIdentifier) formData.append('issueIdentifier', ctx.issueIdentifier);

    const { data } = await privateApi.post<ApiResponse<DriveUploadResult>>(
      '/me/drive/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: options?.signal,
        timeout: 120000, // 2 minutes for large files
        onUploadProgress: (event) => {
          if (event.total && options?.onProgress) {
            options.onProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      },
    );

    return data.data;
  },

  /** PATCH /me/drive/rename — Rename a file in the user's Google Drive */
  renameFile: async (fileId: string, newName: string): Promise<{ id: string; name: string }> => {
    const { data } = await privateApi.patch<ApiResponse<{ id: string; name: string }>>(
      '/me/drive/rename',
      { fileId, newName },
    );
    return data.data;
  },
};
