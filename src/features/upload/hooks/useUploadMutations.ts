import { useMutation } from '@tanstack/react-query';
import { uploadService } from '../services/uploadService';
import type {
  UploadFileInput,
  UploadFileSelection,
  UploadFilesInput,
  UploadPreparedFileInput,
} from '../types';

export const usePresignUploadFile = () =>
  useMutation({
    mutationFn: (input: UploadFileSelection) => uploadService.presignFile(input),
  });

export const usePresignUploadFiles = () =>
  useMutation({
    mutationFn: (files: UploadFileSelection[]) => uploadService.presignFiles(files),
  });

export const useUploadPreparedFile = () =>
  useMutation({
    mutationFn: (input: UploadPreparedFileInput) => uploadService.uploadPreparedFile(input),
  });

export const useUploadFile = () =>
  useMutation({
    mutationFn: (input: UploadFileInput) => uploadService.uploadFile(input),
  });

export const useUploadFiles = () =>
  useMutation({
    mutationFn: (input: UploadFilesInput) => uploadService.uploadFiles(input),
  });

export const useViewUploadUrl = () =>
  useMutation({
    mutationFn: (key: string) => uploadService.getViewUrl(key),
  });

export const useOpenViewUploadUrl = () => {
  const viewUploadUrl = useViewUploadUrl();

  return async (key: string) => {
    const popup = window.open('about:blank', '_blank');

    if (popup) {
      popup.opener = null;
    }

    try {
      const result = await viewUploadUrl.mutateAsync(key);
      const targetUrl = result.url;

      if (popup) {
        popup.location.href = targetUrl;
        popup.focus();
      } else {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }

      return targetUrl;
    } catch (error) {
      if (popup) {
        popup.close();
      }

      throw error;
    }
  };
};
