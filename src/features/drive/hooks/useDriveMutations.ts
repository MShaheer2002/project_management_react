import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/app/stores/useToastStore';
import { driveService } from '../services/driveService';
import { driveQueryKeys } from './useDriveData';
import type { ApiAxiosError } from '@shared/services/types';

/**
 * Start the Google Drive OAuth flow.
 * Returns { authUrl } — caller opens this in a popup or redirect.
 */
export const useConnectDrive = () => {
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: driveService.connect,
    onError: (err: ApiAxiosError) => {
      const code = err.response?.data?.error?.code;
      if (code === 'DRIVE_NOT_CONFIGURED') {
        showToast('Google Drive integration is not configured on this server', 'error');
      } else {
        showToast(
          err.response?.data?.error?.message || 'Failed to start Google Drive connection',
          'error',
        );
      }
    },
  });
};

/**
 * Disconnect Google Drive for the current user.
 * Revokes the token and deletes the connection.
 */
export const useDisconnectDrive = () => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: driveService.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driveQueryKeys.connection() });
      showToast('Google Drive disconnected', 'success');
    },
    onError: (err: ApiAxiosError) => {
      showToast(
        err.response?.data?.error?.message || 'Failed to disconnect Google Drive',
        'error',
      );
    },
  });
};

/**
 * Upload a file to the user's Google Drive via backend proxy.
 * Token never leaves the server.
 */
export const useDriveUpload = () =>
  useMutation({
    mutationFn: ({
      file,
      onProgress,
      signal,
      folderContext,
    }: {
      file: File;
      onProgress?: (percent: number) => void;
      signal?: AbortSignal;
      folderContext?: { workspaceName?: string; teamName?: string; projectName?: string; issueIdentifier?: string };
    }) => driveService.uploadFile(file, { onProgress, signal, folderContext }),
  });
