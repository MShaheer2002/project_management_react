import type { ApiListMeta } from '@shared/services/types';
import type { CreateDocumentInput, DocumentFileRef } from '@shared/types/documents';

export type DocumentScope = 'WORKSPACE' | 'TEAM' | 'PROJECT';
export type DocumentSort = 'createdAt:desc' | 'createdAt:asc' | 'name:asc' | 'name:desc';
export type DocumentDraftStatus = 'idle' | 'preparing' | 'uploading' | 'uploaded' | 'failed';

export interface DocumentPerson {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface DocumentRecord {
  id: string;
  workspaceId: string;
  scope: DocumentScope;
  teamId: string | null;
  projectId: string | null;
  name: string;
  description: string | null;
  key: string;
  fileName: string;
  fileUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: DocumentPerson;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentListResult {
  items: DocumentRecord[];
  meta: ApiListMeta;
}

export interface ListDocumentsInput {
  q?: string;
  cursor?: string;
  limit?: number;
  sort?: DocumentSort;
  folderId?: string | null;
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentId: string | null;
  childCount: number;
  documentCount: number;
  createdBy: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface FolderBreadcrumb {
  id: string;
  name: string;
}

export interface CreateFolderInput {
  name: string;
  parentId?: string | null;
}

export interface RenameFolderInput {
  name: string;
}

export interface MoveFolderInput {
  parentId: string | null;
}

export interface MoveDocumentInput {
  folderId: string | null;
}

export interface UpdateDocumentInput {
  name: string;
  description?: string | null;
}

export interface PendingDocumentDraft {
  id: string;
  file: File;
  name: string;
  description: string;
  status: DocumentDraftStatus;
  progress: number | null;
  error: string | null;
  uploadedFile: DocumentFileRef | null;
}

export interface UploadedDocumentDraft {
  draftId: string;
  input: CreateDocumentInput;
}
