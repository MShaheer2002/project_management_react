import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/app/stores/useToastStore';
import { driveService } from '../services/driveService';
import { driveQueryKeys } from './useDriveData';
import type { ApiAxiosError } from '@shared/services/types';
import type { DriveSharing, DriveTarget } from '../types';

/**
 * Start the Google Drive OAuth flow.
 * Returns { authUrl } — caller opens this in a popup or redirect.
 */
export const useConnectDrive = () => {
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (mode: DriveTarget = 'PERSONAL') => driveService.connect(mode),
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

/** My Drive settings: who can open my files, and where my uploads go. */
export const useUpdateDriveSettings = () => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  return useMutation({
    mutationFn: (input: { sharing?: DriveSharing; uploadTarget?: DriveTarget }) => driveService.updateSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driveQueryKeys.connection() });
      showToast('Saved', 'success');
    },
    onError: (err: ApiAxiosError) => showToast(err.response?.data?.error?.message || 'Could not save', 'error'),
  });
};

/** Workspace Drive sharing (owners and admins). */
export const useUpdateWorkspaceDrive = () => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  return useMutation({
    mutationFn: (sharing: DriveSharing) => driveService.updateWorkspaceDrive(sharing),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driveQueryKeys.connection() });
      showToast('Saved', 'success');
    },
    onError: (err: ApiAxiosError) => showToast(err.response?.data?.error?.message || 'Could not save', 'error'),
  });
};

/** Disconnect the Workspace Drive (owners and admins). */
export const useDisconnectWorkspaceDrive = () => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  return useMutation({
    mutationFn: driveService.disconnectWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driveQueryKeys.connection() });
      showToast('Workspace Drive disconnected', 'success');
    },
    onError: (err: ApiAxiosError) => showToast(err.response?.data?.error?.message || 'Could not disconnect', 'error'),
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
