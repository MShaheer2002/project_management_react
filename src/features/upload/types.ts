export type UploadKind = 'workspace-logo' | 'avatar' | 'attachment' | 'video' | 'document';

export type UploadStatus = 'idle' | 'preparing' | 'uploading' | 'uploaded' | 'failed';

export const uploadKindAccept: Record<UploadKind, string> = {
  'workspace-logo': 'image/*',
  avatar: 'image/*',
  attachment: 'image/*,video/*',
  video: 'video/*',
  document:
    '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown,text/csv',
};

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number | null;
}

export interface UploadProgressUpdate extends UploadProgress {
  clientId: string;
}

export interface UploadFileSelection {
  file: File;
  kind: UploadKind;
  clientId?: string;
}

export interface PresignFileRequest {
  fileName: string;
  contentType: string;
  size: number;
  kind: UploadKind;
}

export interface PresignFilesRequest {
  files: Array<PresignFileRequest & { clientId: string }>;
}

export interface PresignedUploadInstruction {
  clientId?: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  key: string;
  expiresIn: number;
  assetUrl: string | null;
}

export interface ViewUploadUrlResponse {
  key: string;
  url: string;
  expiresIn: number;
}

export interface PreparedUpload {
  clientId: string;
  file: File;
  kind: UploadKind;
  request: PresignFileRequest;
  instruction: PresignedUploadInstruction;
}

export interface UploadPreparedFileInput {
  preparedUpload: PreparedUpload;
  signal?: AbortSignal;
  onProgress?: (progress: UploadProgress) => void;
}

export interface UploadFileInput extends UploadFileSelection {
  signal?: AbortSignal;
  onProgress?: (progress: UploadProgress) => void;
}

export interface UploadFilesInput {
  files: UploadFileSelection[];
  signal?: AbortSignal;
  onFileProgress?: (progress: UploadProgressUpdate) => void;
}

export interface UploadedFileReference {
  clientId: string;
  fileName: string;
  contentType: string;
  size: number;
  kind: UploadKind;
  key: string;
  assetUrl: string | null;
  reference: string;
}
