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
