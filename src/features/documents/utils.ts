import type { UploadedFileReference } from '@features/upload';
import type { DocumentRecord, PendingDocumentDraft } from './types';

export const DOCUMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
  'text/csv',
]);

const readableTypeMap: Record<string, string> = {
  pdf: 'PDF',
  doc: 'DOC',
  docx: 'DOCX',
  xls: 'XLS',
  xlsx: 'XLSX',
  ppt: 'PPT',
  pptx: 'PPTX',
  txt: 'TXT',
  md: 'MD',
  csv: 'CSV',
};

const buildDraftId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `document-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const trimExtension = (fileName: string): string => fileName.replace(/\.[^.]+$/, '');

export const validateDocumentFile = (file: File): string | null => {
  if (file.size > DOCUMENT_MAX_SIZE_BYTES) {
    return 'Documents must be 10 MB or smaller.';
  }

  if (!DOCUMENT_ALLOWED_MIME_TYPES.has(file.type || '')) {
    return 'This file type is not supported.';
  }

  return null;
};

export const createPendingDocumentDraft = (file: File): PendingDocumentDraft => ({
  id: buildDraftId(),
  file,
  name: trimExtension(file.name) || file.name,
  description: '',
  status: 'idle',
  progress: null,
  error: null,
  uploadedFile: null,
});

export const createPendingDocumentDrafts = (files: File[]): {
  drafts: PendingDocumentDraft[];
  errors: string[];
} => {
  const drafts: PendingDocumentDraft[] = [];
  const errors: string[] = [];

  files.forEach((file) => {
    const error = validateDocumentFile(file);
    if (error) {
      errors.push(`${file.name}: ${error}`);
      return;
    }

    drafts.push(createPendingDocumentDraft(file));
  });

  return { drafts, errors };
};

export const toDocumentFileRef = (uploadedFile: UploadedFileReference) => ({
  key: uploadedFile.key,
  fileName: uploadedFile.fileName,
  contentType: uploadedFile.contentType,
  size: uploadedFile.size,
  kind: 'document' as const,
  assetUrl: uploadedFile.assetUrl,
});

export const formatDocumentSize = (sizeBytes: number): string => {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getDocumentTypeLabel = (document: Pick<DocumentRecord, 'fileName' | 'mimeType'>): string => {
  const extension = document.fileName.split('.').pop()?.toLowerCase() ?? '';
  if (extension && readableTypeMap[extension]) {
    return readableTypeMap[extension];
  }

  if (document.mimeType === 'application/pdf') return 'PDF';
  if (document.mimeType === 'text/markdown') return 'MD';
  if (document.mimeType === 'text/plain') return 'TXT';
  if (document.mimeType === 'text/csv') return 'CSV';
  return 'DOC';
};
