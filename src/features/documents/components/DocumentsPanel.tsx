import React, { useMemo, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '@/AppContext';
import { useViewUploadUrl } from '@features/upload';
import { canManageDocuments } from '@shared/permissions';
import { getApiErrorCode, getApiErrorMessage } from '@shared/services';
import { DocumentEmptyState } from './DocumentEmptyState';
import { DocumentList } from './DocumentList';
import { DocumentUploadComposer } from './DocumentUploadComposer';
import {
  useCreateProjectDocument,
  useCreateTeamDocument,
  useCreateWorkspaceDocument,
  useDeleteProjectDocument,
  useDeleteTeamDocument,
  useDeleteWorkspaceDocument,
  useProjectDocuments,
  useTeamDocuments,
  useUpdateProjectDocument,
  useUpdateTeamDocument,
  useUpdateWorkspaceDocument,
  useWorkspaceDocuments,
} from '../hooks/useDocumentsData';
import { useDocumentDraftUploads } from '../hooks/useDocumentDraftUploads';
import { createPendingDocumentDrafts } from '../utils';
import type { DocumentRecord, PendingDocumentDraft } from '../types';

type DocumentsPanelScope = 'workspace' | 'team' | 'project';

interface DocumentsPanelProps {
  scope: DocumentsPanelScope;
  workspaceId?: string;
  entityId: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}

const openResolvedUrl = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const DocumentsPanel: React.FC<DocumentsPanelProps> = ({
  scope,
  workspaceId,
  entityId,
  title,
  description,
  emptyTitle,
  emptyDescription,
}) => {
  const { showToast } = useApp();
  const role = useAuthStore((state) => state.workspace?.role);
  const canManage = canManageDocuments(role);

  const [drafts, setDrafts] = useState<PendingDocumentDraft[]>([]);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingDocumentId, setSavingDocumentId] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);

  const workspaceDocumentsQuery = useWorkspaceDocuments(
    workspaceId,
    { sort: 'createdAt:desc', limit: 20 },
    { enabled: scope === 'workspace' && Boolean(workspaceId) }
  );
  const teamDocumentsQuery = useTeamDocuments(
    scope === 'team' ? entityId : undefined,
    { sort: 'createdAt:desc', limit: 20 },
    { enabled: scope === 'team' }
  );
  const projectDocumentsQuery = useProjectDocuments(
    scope === 'project' ? entityId : undefined,
    { sort: 'createdAt:desc', limit: 20 },
    { enabled: scope === 'project' }
  );

  const createWorkspaceDocument = useCreateWorkspaceDocument(workspaceId);
  const updateWorkspaceDocument = useUpdateWorkspaceDocument(workspaceId);
  const deleteWorkspaceDocument = useDeleteWorkspaceDocument(workspaceId);
  const createTeamDocument = useCreateTeamDocument(scope === 'team' ? entityId : undefined);
  const updateTeamDocument = useUpdateTeamDocument(scope === 'team' ? entityId : undefined);
  const deleteTeamDocument = useDeleteTeamDocument(scope === 'team' ? entityId : undefined);
  const createProjectDocument = useCreateProjectDocument(scope === 'project' ? entityId : undefined);
  const updateProjectDocument = useUpdateProjectDocument(scope === 'project' ? entityId : undefined);
  const deleteProjectDocument = useDeleteProjectDocument(scope === 'project' ? entityId : undefined);
  const viewUploadUrl = useViewUploadUrl();
  const { isUploading, uploadDrafts } = useDocumentDraftUploads();

  const documentsQuery =
    scope === 'workspace'
      ? workspaceDocumentsQuery
      : scope === 'team'
        ? teamDocumentsQuery
        : projectDocumentsQuery;

  const documents = useMemo(
    () => documentsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [documentsQuery.data]
  );

  const updateDraft = (draftId: string, updater: (draft: PendingDocumentDraft) => PendingDocumentDraft) => {
    setDrafts((current) => current.map((draft) => (draft.id === draftId ? updater(draft) : draft)));
  };

  const handleAddFiles = (files: File[]) => {
    const result = createPendingDocumentDrafts(files);
    if (result.errors.length > 0) {
      showToast(result.errors[0], 'error', 'Upload blocked');
    }
    if (result.drafts.length > 0) {
      setDrafts((current) => [...current, ...result.drafts]);
    }
  };

  const handleOpen = async (document: DocumentRecord) => {
    setOpeningDocumentId(document.id);
    try {
      const result = await viewUploadUrl.mutateAsync(document.key);
      openResolvedUrl(result.url);
    } catch {
      showToast('Could not open document right now. Please try again.', 'error', 'Open failed');
    } finally {
      setOpeningDocumentId(null);
    }
  };

  const handleDownload = async (document: DocumentRecord) => {
    setOpeningDocumentId(document.id);
    try {
      const result = await viewUploadUrl.mutateAsync(document.key);
      const anchor = window.document.createElement('a');
      anchor.href = result.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.download = document.fileName;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      showToast('Could not open document right now. Please try again.', 'error', 'Download failed');
    } finally {
      setOpeningDocumentId(null);
    }
  };

  const handleUploadDrafts = async () => {
    if (drafts.length === 0) return;

    try {
      const preparedDrafts = await uploadDrafts(drafts, updateDraft);

      for (const item of preparedDrafts) {
        if (scope === 'workspace') {
          await createWorkspaceDocument.mutateAsync(item.input);
        } else if (scope === 'team') {
          await createTeamDocument.mutateAsync(item.input);
        } else {
          await createProjectDocument.mutateAsync(item.input);
        }
      }

      setDrafts([]);
      showToast('Documents uploaded.', 'success');
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'DOCUMENT_UPLOAD_FORBIDDEN') {
        showToast('You do not have permission to add documents here.', 'error', 'Permission denied');
        return;
      }
      showToast(getApiErrorMessage(error) || 'Could not finish uploading documents.', 'error', 'Upload failed');
    }
  };

  const handleSaveEdit = async (documentId: string) => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      showToast('Document name is required.', 'error', 'Validation error');
      return;
    }

    setSavingDocumentId(documentId);
    try {
      const input = {
        name: trimmedName,
        description: editDescription.trim() || null,
      };

      if (scope === 'workspace') {
        await updateWorkspaceDocument.mutateAsync({ documentId, input });
      } else if (scope === 'team') {
        await updateTeamDocument.mutateAsync({ documentId, input });
      } else {
        await updateProjectDocument.mutateAsync({ documentId, input });
      }

      setEditingDocumentId(null);
      setEditName('');
      setEditDescription('');
      showToast('Document updated.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update document.', 'error', 'Update failed');
    } finally {
      setSavingDocumentId(null);
    }
  };

  const handleDelete = async (document: DocumentRecord) => {
    if (!window.confirm(`Delete "${document.name}"?`)) return;

    setDeletingDocumentId(document.id);
    try {
      if (scope === 'workspace') {
        await deleteWorkspaceDocument.mutateAsync(document.id);
      } else if (scope === 'team') {
        await deleteTeamDocument.mutateAsync(document.id);
      } else {
        await deleteProjectDocument.mutateAsync(document.id);
      }
      showToast('Document deleted.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to delete document.', 'error', 'Delete failed');
    } finally {
      setDeletingDocumentId(null);
    }
  };

  /* ---------- Loading skeleton ---------- */
  if (documentsQuery.isLoading) {
    return (
      <div className="p-6">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="animate-pulse p-5">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-white/10" />
            <div className="mt-3 h-3 w-64 rounded bg-gray-100 dark:bg-white/5" />
          </div>
          <div className="border-t border-gray-100 p-5 dark:border-border-dark/40">
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-3 w-12 rounded bg-gray-100 dark:bg-white/5" />
                  <div className="h-5 w-8 rounded bg-gray-200 dark:bg-white/10" />
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100 p-5 dark:border-border-dark/40">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse py-4">
                <div className="h-3 w-48 rounded bg-gray-200 dark:bg-white/10" />
                <div className="mt-2 h-2.5 w-32 rounded bg-gray-100 dark:bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
        {/* Header */}
        <div className="flex items-start gap-3 p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold">{title}</h2>
            <p className="mt-0.5 text-xs leading-5 text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 border-t border-gray-100 dark:border-border-dark/40">
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Total</p>
            <p className="mt-1 text-lg font-bold">{documents.length}</p>
          </div>
          <div className="border-l border-gray-100 px-5 py-4 dark:border-border-dark/40">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Pending</p>
            <p className="mt-1 text-lg font-bold">{drafts.length}</p>
          </div>
          <div className="border-l border-gray-100 px-5 py-4 dark:border-border-dark/40">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Access</p>
            <p className="mt-1 text-sm font-semibold">{canManage ? 'Manage' : 'View only'}</p>
          </div>
        </div>

        {/* Upload section */}
        {canManage && (
          <div className="border-t border-gray-100 p-5 dark:border-border-dark/40">
            <DocumentUploadComposer
              title="Attach reference material"
              description="Add documents that help people understand the work quickly. Files upload directly and stay attached here for the team."
              drafts={drafts}
              onAddFiles={handleAddFiles}
              onUpdateDraft={(draftId, patch) =>
                setDrafts((current) =>
                  current.map((draft) => (draft.id === draftId ? { ...draft, ...patch } : draft))
                )
              }
              onRemoveDraft={(draftId) =>
                setDrafts((current) => current.filter((draft) => draft.id !== draftId))
              }
              onSubmit={() => void handleUploadDrafts()}
              isSubmitting={isUploading || createWorkspaceDocument.isPending || createTeamDocument.isPending || createProjectDocument.isPending}
            />
          </div>
        )}

        {/* Document list / empty / error */}
        <div className="border-t border-gray-100 dark:border-border-dark/40">
          {documentsQuery.error ? (
            <div className="p-5">
              <p className="text-sm text-red-500">Could not load documents right now.</p>
              <button
                type="button"
                onClick={() => documentsQuery.refetch()}
                className="mt-2 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white"
              >
                Retry
              </button>
            </div>
          ) : documents.length === 0 ? (
            <DocumentEmptyState
              title={emptyTitle}
              description={emptyDescription}
              canManage={canManage}
              onAdd={() => {
                const button = window.document.querySelector<HTMLInputElement>('input[type="file"][accept]');
                button?.click();
              }}
            />
          ) : (
            <div className="px-5">
              <DocumentList
                documents={documents}
                canManage={canManage}
                editingDocumentId={editingDocumentId}
                editName={editName}
                editDescription={editDescription}
                savingDocumentId={savingDocumentId}
                deletingDocumentId={deletingDocumentId}
                openingDocumentId={openingDocumentId}
                onStartEdit={(document) => {
                  setEditingDocumentId(document.id);
                  setEditName(document.name);
                  setEditDescription(document.description ?? '');
                }}
                onCancelEdit={() => {
                  setEditingDocumentId(null);
                  setEditName('');
                  setEditDescription('');
                }}
                onEditNameChange={setEditName}
                onEditDescriptionChange={setEditDescription}
                onSaveEdit={(documentId) => void handleSaveEdit(documentId)}
                onDelete={(document) => void handleDelete(document)}
                onOpen={(document) => void handleOpen(document)}
                onDownload={(document) => void handleDownload(document)}
              />

              {documentsQuery.hasNextPage && (
                <div className="flex justify-center border-t border-gray-100 py-4 dark:border-border-dark/40">
                  <button
                    type="button"
                    onClick={() => documentsQuery.fetchNextPage()}
                    disabled={documentsQuery.isFetchingNextPage}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60 dark:border-border-dark"
                  >
                    {documentsQuery.isFetchingNextPage && <Loader2 size={15} className="animate-spin" />}
                    Load more
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
