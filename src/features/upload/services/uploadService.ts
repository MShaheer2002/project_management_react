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
  ViewUploadUrlResponse,
  UploadedFileReference,
} from '../types';

const logUploadDebug = (message: string, payload?: unknown) => {
  if (typeof payload === 'undefined') {
    console.log(`[UploadService] ${message}`);
    return;
  }

  console.log(`[UploadService] ${message}`, payload);
};

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

  logUploadDebug('Starting direct upload', {
    clientId: preparedUpload.clientId,
    fileName: preparedUpload.request.fileName,
    kind: preparedUpload.kind,
    method: preparedUpload.instruction.method || 'PUT',
    uploadUrl: preparedUpload.instruction.uploadUrl,
    key: preparedUpload.instruction.key,
    assetUrl: preparedUpload.instruction.assetUrl,
  });

  try {
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
  } catch (error) {
    console.error('[UploadService] Direct upload failed', {
      clientId: preparedUpload.clientId,
      fileName: preparedUpload.request.fileName,
      key: preparedUpload.instruction.key,
      error,
    });
    throw error;
  }

  const uploadedReference = toUploadedFileReference(preparedUpload);

  logUploadDebug('Direct upload completed', uploadedReference);

  return uploadedReference;
};

const getViewUrl = async (key: string): Promise<ViewUploadUrlResponse> => {
  const trimmedKey = key.trim();

  if (!trimmedKey) {
    throw new Error('Attachment key is required.');
  }

  logUploadDebug('Requesting view URL', { key: trimmedKey });

  const { data } = await privateApi.get<ApiResponse<ViewUploadUrlResponse>>('/uploads/view-url', {
    params: { key: trimmedKey },
  });

  logUploadDebug('Received view URL', {
    key: data.data.key,
    expiresIn: data.data.expiresIn,
  });

  return data.data;
};

const presignFile = async (input: UploadFileSelection): Promise<PreparedUpload> => {
  const clientId = buildClientId(input.clientId);
  const request = buildPresignRequest(input);
  logUploadDebug('Requesting presigned upload URL', {
    clientId,
    request,
  });
  const { data } = await privateApi.post<ApiResponse<PresignedUploadInstruction>>(
    '/uploads/presigned-url',
    request
  );

  const preparedUpload = {
    clientId,
    file: input.file,
    kind: input.kind,
    request,
    instruction: {
      ...data.data,
      clientId,
    },
  };

  logUploadDebug('Received presigned upload URL', {
    clientId,
    uploadUrl: preparedUpload.instruction.uploadUrl,
    method: preparedUpload.instruction.method,
    key: preparedUpload.instruction.key,
    assetUrl: preparedUpload.instruction.assetUrl,
  });

  return preparedUpload;
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

  logUploadDebug('Requesting batch presigned upload URLs', request);

  const { data } = await privateApi.post<ApiResponse<PresignedUploadInstruction[]>>(
    '/uploads/presigned-urls',
    request
  );

  const instructionByClientId = new Map(
    data.data.map((instruction) => [instruction.clientId, instruction] as const)
  );

  const preparedUploads = selections.map((selection) => {
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

  logUploadDebug(
    'Received batch presigned upload URLs',
    preparedUploads.map((upload) => ({
      clientId: upload.clientId,
      uploadUrl: upload.instruction.uploadUrl,
      method: upload.instruction.method,
      key: upload.instruction.key,
      assetUrl: upload.instruction.assetUrl,
    }))
  );

  return preparedUploads;
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
  getViewUrl,
  uploadPreparedFile,
  uploadFile,
  uploadFiles,
};
