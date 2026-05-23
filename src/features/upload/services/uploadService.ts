import axios, { type AxiosProgressEvent } from 'axios';
import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';
import type {
  PreparedUpload,
  PresignFileRequest,
  PresignFilesRequest,
  PresignedUploadInstruction,
  UploadFileInput,
  UploadFileSelection,
  UploadFilesInput,
  UploadPreparedFileInput,
  UploadProgress,
  UploadedFileReference,
} from '../types';

const directUploadClient = axios.create({
  timeout: 120000,
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
});

const buildClientId = (clientId?: string): string => {
  const trimmed = clientId?.trim();
  if (trimmed) return trimmed;

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const buildPresignRequest = (selection: UploadFileSelection): PresignFileRequest => ({
  fileName: selection.file.name,
  contentType: selection.file.type || 'application/octet-stream',
  size: selection.file.size,
  kind: selection.kind,
});

const hasHeader = (headers: Record<string, string>, name: string): boolean =>
  Object.keys(headers).some((key) => key.toLowerCase() === name.toLowerCase());

const buildUploadHeaders = (file: File, headers: Record<string, string>): Record<string, string> => {
  const nextHeaders = { ...headers };

  if (!hasHeader(nextHeaders, 'Content-Type')) {
    nextHeaders['Content-Type'] = file.type || 'application/octet-stream';
  }

  return nextHeaders;
};

const buildProgress = (file: File, event: AxiosProgressEvent): UploadProgress => {
  const total = event.total ?? file.size;
  const percent = total > 0 ? Math.min(100, Math.round((event.loaded * 100) / total)) : null;

  return {
    loaded: event.loaded,
    total,
    percent,
  };
};

const toUploadedFileReference = (preparedUpload: PreparedUpload): UploadedFileReference => ({
  clientId: preparedUpload.clientId,
  fileName: preparedUpload.request.fileName,
  contentType: preparedUpload.request.contentType,
  size: preparedUpload.request.size,
  kind: preparedUpload.kind,
  key: preparedUpload.instruction.key,
  assetUrl: preparedUpload.instruction.assetUrl,
  reference: preparedUpload.instruction.assetUrl ?? preparedUpload.instruction.key,
});

const uploadPreparedFile = async (input: UploadPreparedFileInput): Promise<UploadedFileReference> => {
  const { preparedUpload, signal, onProgress } = input;

  await directUploadClient.request({
    url: preparedUpload.instruction.uploadUrl,
    method: preparedUpload.instruction.method || 'PUT',
    data: preparedUpload.file,
    headers: buildUploadHeaders(preparedUpload.file, preparedUpload.instruction.headers),
    signal,
    onUploadProgress: (event) => {
      onProgress?.(buildProgress(preparedUpload.file, event));
    },
  });

  return toUploadedFileReference(preparedUpload);
};

const presignFile = async (input: UploadFileSelection): Promise<PreparedUpload> => {
  const clientId = buildClientId(input.clientId);
  const request = buildPresignRequest(input);
  const { data } = await privateApi.post<ApiResponse<PresignedUploadInstruction>>(
    '/uploads/presigned-url',
    request
  );

  return {
    clientId,
    file: input.file,
    kind: input.kind,
    request,
    instruction: {
      ...data.data,
      clientId,
    },
  };
};

const presignFiles = async (files: UploadFileSelection[]): Promise<PreparedUpload[]> => {
  if (files.length === 0) return [];

  const selections = files.map((file) => ({
    ...file,
    clientId: buildClientId(file.clientId),
  }));

  const request: PresignFilesRequest = {
    files: selections.map((selection) => ({
      clientId: selection.clientId,
      ...buildPresignRequest(selection),
    })),
  };

  const { data } = await privateApi.post<ApiResponse<PresignedUploadInstruction[]>>(
    '/uploads/presigned-urls',
    request
  );

  const instructionByClientId = new Map(
    data.data.map((instruction) => [instruction.clientId, instruction] as const)
  );

  return selections.map((selection) => {
    const instruction = instructionByClientId.get(selection.clientId);

    if (!instruction) {
      throw new Error(`Missing presigned upload instruction for clientId ${selection.clientId}`);
    }

    return {
      clientId: selection.clientId,
      file: selection.file,
      kind: selection.kind,
      request: buildPresignRequest(selection),
      instruction,
    };
  });
};

const uploadFile = async (input: UploadFileInput): Promise<UploadedFileReference> => {
  const preparedUpload = await presignFile(input);
  return uploadPreparedFile({
    preparedUpload,
    signal: input.signal,
    onProgress: input.onProgress,
  });
};

const uploadFiles = async (input: UploadFilesInput): Promise<UploadedFileReference[]> => {
  if (input.files.length === 0) return [];

  const preparedUploads = await presignFiles(input.files);

  return Promise.all(
    preparedUploads.map((preparedUpload) =>
      uploadPreparedFile({
        preparedUpload,
        signal: input.signal,
        onProgress: (progress) => {
          input.onFileProgress?.({
            clientId: preparedUpload.clientId,
            ...progress,
          });
        },
      })
    )
  );
};

export const uploadService = {
  presignFile,
  presignFiles,
  uploadPreparedFile,
  uploadFile,
  uploadFiles,
};
