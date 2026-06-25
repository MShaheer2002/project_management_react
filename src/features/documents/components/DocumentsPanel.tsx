import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  FileText,
  FolderPlus,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { FolderOpenIcon } from '@/assets/svg/FolderOpenIcon';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '@/AppContext';
import { useViewUploadUrl } from '@features/upload';
import { canManageDocuments } from '@shared/permissions';
import { getApiErrorCode, getApiErrorMessage } from '@shared/services';
import { DocumentList } from './DocumentList';
import { DocumentPreview } from './DocumentPreview';
import { DocumentUploadComposer } from './DocumentUploadComposer';
import {
  useCreateFolder,
  useCreateProjectDocument,
  useCreateTeamDocument,
  useCreateWorkspaceDocument,
  useDeleteFolder,
  useMoveDocument,
  useDeleteProjectDocument,
  useDeleteTeamDocument,
  useDeleteWorkspaceDocument,
  useFolderBreadcrumbs,
  useFolders,
  useProjectDocuments,
  useRenameFolder,
  useTeamDocuments,
  useUpdateProjectDocument,
  useUpdateTeamDocument,
  useUpdateWorkspaceDocument,
  useWorkspaceDocuments,
} from '../hooks/useDocumentsData';
import { useDocumentDraftUploads } from '../hooks/useDocumentDraftUploads';
import { createPendingDocumentDrafts, getDocumentTypeLabel } from '../utils';
import type { DocumentFolder, DocumentRecord, PendingDocumentDraft } from '../types';

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

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<PendingDocumentDraft[]>([]);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingDocumentId, setSavingDocumentId] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
  const [fileMenuId, setFileMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const newFolderInputRef = useRef<HTMLInputElement | null>(null);
  const renameFolderInputRef = useRef<HTMLInputElement | null>(null);

  // Resolve the entity ID for the service calls
  const resolvedEntityId = scope === 'workspace' ? workspaceId : entityId;

  // Folder queries
  const foldersQuery = useFolders(scope, resolvedEntityId, currentFolderId);
  const breadcrumbsQuery = useFolderBreadcrumbs(scope, resolvedEntityId, currentFolderId);
  const folders = foldersQuery.data ?? [];
  const breadcrumbs = breadcrumbsQuery.data ?? [];

  // Folder mutations
  const createFolder = useCreateFolder(scope, resolvedEntityId);
  const renameFolder = useRenameFolder(scope, resolvedEntityId);
  const deleteFolder = useDeleteFolder(scope, resolvedEntityId);
  const moveDocument = useMoveDocument(scope, resolvedEntityId);

  const docParams = useMemo(
    () => ({ sort: 'createdAt:desc' as const, limit: 20, folderId: currentFolderId }),
    [currentFolderId]
  );

  const workspaceDocumentsQuery = useWorkspaceDocuments(workspaceId, docParams, {
    enabled: scope === 'workspace' && Boolean(workspaceId),
  });
  const teamDocumentsQuery = useTeamDocuments(scope === 'team' ? entityId : undefined, docParams, {
    enabled: scope === 'team',
  });
  const projectDocumentsQuery = useProjectDocuments(
    scope === 'project' ? entityId : undefined,
    docParams,
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

  const handlePreview = async (document: DocumentRecord) => {
    setPreviewDoc(document);
    setPreviewUrl(null);
    setPreviewLoading(true);
    try {
      const result = await viewUploadUrl.mutateAsync(document.key);
      setPreviewUrl(result.url);
    } catch {
      showToast('Could not load preview.', 'error');
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
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
      showToast('Could not download document right now.', 'error');
    } finally {
      setOpeningDocumentId(null);
    }
  };

  const handleUploadDrafts = async () => {
    if (drafts.length === 0) return;

    try {
      const preparedDrafts = await uploadDrafts(drafts, updateDraft);

      for (const item of preparedDrafts) {
        const input = { ...item.input, folderId: currentFolderId };
        if (scope === 'workspace') {
          await createWorkspaceDocument.mutateAsync(input);
        } else if (scope === 'team') {
          await createTeamDocument.mutateAsync(input);
        } else {
          await createProjectDocument.mutateAsync(input);
        }
      }

      setDrafts([]);
      showToast('Documents uploaded.', 'success');
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'DOCUMENT_UPLOAD_FORBIDDEN') {
        showToast('You do not have permission to add documents here.', 'error');
        return;
      }
      showToast(getApiErrorMessage(error) || 'Could not finish uploading.', 'error');
    }
  };

  const handleSaveEdit = async (documentId: string) => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      showToast('Document name is required.', 'error');
      return;
    }

    setSavingDocumentId(documentId);
    try {
      const input = { name: trimmedName, description: editDescription.trim() || null };

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
      showToast(getApiErrorMessage(error) || 'Failed to update document.', 'error');
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
      showToast(getApiErrorMessage(error) || 'Failed to delete document.', 'error');
    } finally {
      setDeletingDocumentId(null);
    }
  };

  // ── Folder handlers ──

  const handleCreateFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    try {
      await createFolder.mutateAsync({ name: trimmed, parentId: currentFolderId });
      setIsCreatingFolder(false);
      setNewFolderName('');
      showToast('Folder created.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to create folder.', 'error');
    }
  };

  const handleRenameFolder = async (folderId: string) => {
    const trimmed = renameFolderName.trim();
    if (!trimmed) return;

    try {
      await renameFolder.mutateAsync({ folderId, input: { name: trimmed } });
      setRenamingFolderId(null);
      setRenameFolderName('');
      showToast('Folder renamed.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to rename folder.', 'error');
    }
  };

  const handleDeleteFolder = async (folder: DocumentFolder) => {
    if (!window.confirm(`Delete folder "${folder.name}" and all its contents?`)) return;

    try {
      await deleteFolder.mutateAsync(folder.id);
      showToast('Folder deleted.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to delete folder.', 'error');
    }
  };

  const handleNavigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setIsCreatingFolder(false);
    setNewFolderName('');
    setRenamingFolderId(null);
    setFolderMenuId(null);
  };

  const handleStartCreateFolder = () => {
    setIsCreatingFolder(true);
    setNewFolderName('');
    setTimeout(() => newFolderInputRef.current?.focus(), 0);
  };

  const panelRef = useRef<HTMLDivElement | null>(null);
  const isFileInputOpen = useRef(false);

  const openFilePicker = () => {
    isFileInputOpen.current = true;
    fileInputRef.current?.click();
    const resetFlag = () => {
      isFileInputOpen.current = false;
      setIsDragging(false);
      window.removeEventListener('focus', resetFlag);
    };
    window.addEventListener('focus', resetFlag, { once: true });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFileInputOpen.current) return;
    if (!isDragging && e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const related = e.relatedTarget as Node | null;
    if (panelRef.current && !panelRef.current.contains(related)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleAddFiles(files);
  }, [handleAddFiles]);

  const handleDropOnFolder = useCallback(
    async (folderId: string, files: File[]) => {
      const result = createPendingDocumentDrafts(files);
      if (result.errors.length > 0) {
        showToast(result.errors[0], 'error', 'Upload blocked');
      }
      if (result.drafts.length === 0) return;

      try {
        const preparedDrafts = await uploadDrafts(result.drafts, () => {});
        for (const item of preparedDrafts) {
          const input = { ...item.input, folderId };
          if (scope === 'workspace') {
            await createWorkspaceDocument.mutateAsync(input);
          } else if (scope === 'team') {
            await createTeamDocument.mutateAsync(input);
          } else {
            await createProjectDocument.mutateAsync(input);
          }
        }
        showToast('Documents uploaded.', 'success');
      } catch (error) {
        const code = getApiErrorCode(error);
        if (code === 'DOCUMENT_UPLOAD_FORBIDDEN') {
          showToast('You do not have permission to add documents here.', 'error');
          return;
        }
        showToast(getApiErrorMessage(error) || 'Could not finish uploading.', 'error');
      }
    },
    [scope, uploadDrafts, createWorkspaceDocument, createTeamDocument, createProjectDocument, showToast]
  );

  if (documentsQuery.isLoading && foldersQuery.isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-gray-100 p-4 dark:border-border-dark/40">
              <div className="h-3 w-40 rounded bg-gray-200 dark:bg-white/10" />
              <div className="mt-2 h-2.5 w-24 rounded bg-gray-100 dark:bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasContent = folders.length > 0 || documents.length > 0 || drafts.length > 0;

  const folderDragHandlers = (folderId: string) => ({
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverFolderId(folderId);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const relatedTarget = e.relatedTarget as Node | null;
      if (!e.currentTarget.contains(relatedTarget)) {
        setDragOverFolderId(null);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverFolderId(null);
      setIsDragging(false);

      // Check if a document is being dragged (internal move)
      const docId = e.dataTransfer.getData('application/x-document-id');
      if (docId) {
        moveDocument.mutate(
          { documentId: docId, input: { folderId } },
          { onSuccess: () => showToast('Document moved.', 'success'), onError: () => showToast('Failed to move document.', 'error') }
        );
        return;
      }

      // Otherwise it's OS files being dropped
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) void handleDropOnFolder(folderId, files);
    },
  });

  // ── Shared sub-renders ──

  const renderFolderContextMenu = (folder: DocumentFolder) => {
    if (!canManage || renamingFolderId === folder.id) return null;
    return (
      <div className="absolute right-1.5 top-1.5 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFolderMenuId(folderMenuId === folder.id ? null : folder.id);
          }}
          className="rounded p-1 opacity-0 transition-all hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-white/10"
        >
          <MoreHorizontal size={14} className="text-gray-400 dark:text-text-secondary-dark" />
        </button>

        {folderMenuId === folder.id && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setFolderMenuId(null)} />
            <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-border-dark dark:bg-card-dark dark:shadow-black/40">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFolderMenuId(null);
                  setRenamingFolderId(folder.id);
                  setRenameFolderName(folder.name);
                  setTimeout(() => renameFolderInputRef.current?.focus(), 0);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-text-primary-dark dark:hover:bg-white/5"
              >
                <Pencil size={12} />
                Rename
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFolderMenuId(null);
                  void handleDeleteFolder(folder);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderNewFolderInlineInput = () => {
    if (!isCreatingFolder) return null;
    return (
      <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-white p-3 dark:bg-card-dark">
        <FolderOpenIcon size={16} className="shrink-0 text-primary" />
        <input
          ref={newFolderInputRef}
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleCreateFolder();
            if (e.key === 'Escape') {
              setIsCreatingFolder(false);
              setNewFolderName('');
            }
          }}
          placeholder="Folder name..."
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-text-primary-dark dark:placeholder:text-text-secondary-dark"
          disabled={createFolder.isPending}
        />
        {createFolder.isPending && (
          <Loader2 size={14} className="shrink-0 animate-spin text-primary" />
        )}
      </div>
    );
  };

  const renderRenameFolderInput = (folder: DocumentFolder) => (
    <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-white p-3 dark:bg-card-dark">
      <FolderOpenIcon size={16} className="shrink-0 text-primary" />
      <input
        ref={renameFolderInputRef}
        type="text"
        value={renameFolderName}
        onChange={(e) => setRenameFolderName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void handleRenameFolder(folder.id);
          if (e.key === 'Escape') {
            setRenamingFolderId(null);
            setRenameFolderName('');
          }
        }}
        placeholder="Folder name..."
        className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-text-primary-dark dark:placeholder:text-text-secondary-dark"
        disabled={renameFolder.isPending}
      />
      {renameFolder.isPending && (
        <Loader2 size={14} className="shrink-0 animate-spin text-primary" />
      )}
    </div>
  );

  // ── Document list props (shared between views) ──

  const documentListProps = {
    documents,
    canManage,
    editingDocumentId,
    editName,
    editDescription,
    savingDocumentId,
    deletingDocumentId,
    openingDocumentId,
    onStartEdit: (document: DocumentRecord) => {
      setEditingDocumentId(document.id);
      setEditName(document.name);
      setEditDescription(document.description ?? '');
    },
    onCancelEdit: () => {
      setEditingDocumentId(null);
      setEditName('');
      setEditDescription('');
    },
    onEditNameChange: setEditName,
    onEditDescriptionChange: setEditDescription,
    onSaveEdit: (documentId: string) => void handleSaveEdit(documentId),
    onDelete: (document: DocumentRecord) => void handleDelete(document),
    onOpen: (document: DocumentRecord) => void handlePreview(document),
    onDownload: (document: DocumentRecord) => void handleDownload(document),
  };

  return (
    <div
      ref={panelRef}
      className="p-6"
      onDragOver={canManage ? handleDragOver : undefined}
      onDragLeave={canManage ? handleDragLeave : undefined}
      onDrop={canManage ? handleDrop : undefined}
    >
      {/* Breadcrumbs */}
      {currentFolderId && (
        <nav className="mb-3 flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => handleNavigateToFolder(null)}
            className="text-primary transition-colors hover:text-primary/80"
          >
            {title}
          </button>
          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight size={12} className="text-gray-400 dark:text-text-secondary-dark" />
              <button
                type="button"
                onClick={() => handleNavigateToFolder(crumb.id)}
                className={
                  crumb.id === currentFolderId
                    ? 'text-gray-700 dark:text-text-primary-dark'
                    : 'text-primary transition-colors hover:text-primary/80'
                }
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-gray-900 dark:text-text-primary-dark">{title}</h2>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-text-secondary-dark">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle pill */}
          {hasContent && (
            <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-border-dark dark:bg-white/5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-1.5 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-card-dark dark:text-text-primary-dark'
                    : 'text-gray-400 hover:text-gray-600 dark:text-text-secondary-dark dark:hover:text-text-primary-dark'
                }`}
                title="Grid view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-md p-1.5 transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-card-dark dark:text-text-primary-dark'
                    : 'text-gray-400 hover:text-gray-600 dark:text-text-secondary-dark dark:hover:text-text-primary-dark'
                }`}
                title="List view"
              >
                <List size={14} />
              </button>
            </div>
          )}

          {canManage && hasContent && (
            <>
              <button
                type="button"
                onClick={handleStartCreateFolder}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary dark:border-border-dark dark:hover:border-primary/40"
              >
                <FolderPlus size={13} />
                New folder
              </button>
              <button
                type="button"
                onClick={openFilePicker}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary dark:border-border-dark dark:hover:border-primary/40"
              >
                <Plus size={13} />
                Add file
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      {canManage && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.md,.doc,.docx,.txt,.csv,.xls,.xlsx"
          className="hidden"
          onClick={() => { isFileInputOpen.current = true; }}
          onChange={(e) => {
            isFileInputOpen.current = false;
            setIsDragging(false);
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) handleAddFiles(files);
            e.target.value = '';
          }}
        />
      )}

      {/* Pending drafts */}
      {drafts.length > 0 && (
        <div className="mt-4">
          <DocumentUploadComposer
            title=""
            description=""
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

      {/* Folders + Documents */}
      <div className="relative mt-5">
        {/* Drag overlay — floats on top of content */}
        {isDragging && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/50 bg-white/90 backdrop-blur-sm dark:bg-bg-dark/90">
            <UploadCloud size={32} className="text-primary" />
            <p className="mt-2 text-sm font-semibold text-primary">Drop files here</p>
          </div>
        )}
        <div>
          {documentsQuery.error ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">Could not load documents.</p>
              <button type="button" onClick={() => documentsQuery.refetch()} className="mt-2 text-xs font-semibold text-red-400 underline">
                Retry
              </button>
            </div>
          ) : documents.length === 0 && folders.length === 0 && drafts.length === 0 ? (
            /* ── Empty state ── */
            <div
              className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 py-12 text-center transition-colors hover:border-primary/40 dark:border-border-dark"
            >
              {isCreatingFolder && canManage && (
                <div className="mb-4 w-full max-w-sm px-6 text-left">
                  {renderNewFolderInlineInput()}
                </div>
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-white/5">
                <FileText size={18} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-text-primary-dark">{emptyTitle}</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-gray-400 dark:text-text-secondary-dark">{emptyDescription}</p>
              {canManage && (
                <div className="relative z-10 mt-3 flex items-center gap-3 pointer-events-auto">
                  <button
                    type="button"
                    onClick={handleStartCreateFolder}
                    className="rounded px-1 py-0.5 text-xs font-medium text-primary transition-colors hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    Create a folder
                  </button>
                  <span className="text-xs text-gray-300 dark:text-text-secondary-dark">or</span>
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="rounded px-1 py-0.5 text-xs font-medium text-primary transition-colors hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    Upload files
                  </button>
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* ── Grid view (Mac Finder style) ── */
            <>
              {/* Folders + files as icon grid */}
              <div className="flex flex-wrap gap-4">
                {/* New folder inline input (full-width) */}
                {isCreatingFolder && (
                  <div className="w-full">{renderNewFolderInlineInput()}</div>
                )}

                {/* Folder items */}
                {folders.map((folder) => (
                  <div key={folder.id} className="group relative">
                    {renamingFolderId === folder.id ? (
                      <div className="w-[120px]">{renderRenameFolderInput(folder)}</div>
                    ) : (
                      <div
                        {...(canManage ? folderDragHandlers(folder.id) : {})}
                        onClick={() => handleNavigateToFolder(folder.id)}
                        className={`flex w-[120px] cursor-pointer flex-col items-center rounded-xl p-3 transition-all ${
                          dragOverFolderId === folder.id
                            ? 'bg-primary/10 ring-2 ring-primary dark:bg-primary/20'
                            : 'hover:bg-gray-100/60 dark:hover:bg-white/5'
                        }`}
                      >
                        <FolderOpenIcon size={64} className="text-blue-400" />
                        <span className="mt-2 w-full truncate text-center text-xs font-medium text-gray-900 dark:text-text-primary-dark">
                          {folder.name}
                        </span>
                      </div>
                    )}
                    {renderFolderContextMenu(folder)}
                  </div>
                ))}

                {/* File items */}
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    draggable={canManage}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/x-document-id', doc.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className="group relative flex w-[120px] cursor-pointer flex-col items-center rounded-xl p-3 transition-all hover:bg-gray-100/60 dark:hover:bg-white/5"
                    onClick={() => void handlePreview(doc)}
                  >
                    <div className="flex h-16 w-14 flex-col items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {getDocumentTypeLabel(doc)}
                      </span>
                    </div>
                    <span className="mt-2 w-full truncate text-center text-xs font-medium text-gray-900 dark:text-text-primary-dark">
                      {doc.name}
                    </span>

                    {/* Context menu trigger */}
                    <div className="absolute right-0.5 top-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileMenuId(fileMenuId === doc.id ? null : doc.id);
                        }}
                        className="rounded p-1 hover:bg-gray-200 dark:hover:bg-white/10"
                      >
                        <MoreHorizontal size={14} className="text-gray-400" />
                      </button>

                      {fileMenuId === doc.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setFileMenuId(null); }} />
                          <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-border-dark dark:bg-card-dark dark:shadow-black/40">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setFileMenuId(null); void handlePreview(doc); }}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-text-primary-dark dark:hover:bg-white/5"
                            >
                              <FileText size={12} /> Preview
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setFileMenuId(null); void handleDownload(doc); }}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-text-primary-dark dark:hover:bg-white/5"
                            >
                              <UploadCloud size={12} className="rotate-180" /> Download
                            </button>
                            {canManage && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFileMenuId(null);
                                    setEditingDocumentId(doc.id);
                                    setEditName(doc.name);
                                    setEditDescription(doc.description ?? '');
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-text-primary-dark dark:hover:bg-white/5"
                                >
                                  <Pencil size={12} /> Rename
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setFileMenuId(null); void handleDelete(doc); }}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {documentsQuery.hasNextPage && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => documentsQuery.fetchNextPage()}
                    disabled={documentsQuery.isFetchingNextPage}
                    className="text-xs font-semibold text-gray-400 transition-colors hover:text-primary disabled:opacity-60"
                  >
                    {documentsQuery.isFetchingNextPage && <Loader2 size={13} className="mr-1 inline animate-spin" />}
                    Load more
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ── List view ── */
            <>
              {/* Folders as rows */}
              {(folders.length > 0 || isCreatingFolder) && (
                <div className="mb-4 space-y-1">
                  {isCreatingFolder && renderNewFolderInlineInput()}

                  {folders.map((folder) => (
                    <div key={folder.id} className="group relative">
                      {renamingFolderId === folder.id ? (
                        renderRenameFolderInput(folder)
                      ) : (
                        <div
                          {...(canManage ? folderDragHandlers(folder.id) : {})}
                          onClick={() => handleNavigateToFolder(folder.id)}
                          className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-3 text-left transition-all ${
                            dragOverFolderId === folder.id
                              ? 'bg-primary/10 ring-2 ring-primary dark:bg-primary/20'
                              : 'hover:bg-gray-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <FolderOpenIcon size={18} className="shrink-0 text-blue-400" />
                          <span className="min-w-0 truncate text-sm font-medium text-gray-900 dark:text-text-primary-dark">
                            {folder.name}
                          </span>
                          <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:bg-white/5 dark:text-text-secondary-dark">
                            {folder.childCount + folder.documentCount}
                          </span>
                        </div>
                      )}
                      {renderFolderContextMenu(folder)}
                    </div>
                  ))}
                </div>
              )}

              {/* Documents rows */}
              {documents.length > 0 && (
                <>
                  <DocumentList {...documentListProps} />

                  {documentsQuery.hasNextPage && (
                    <div className="mt-3 flex justify-center">
                      <button
                        type="button"
                        onClick={() => documentsQuery.fetchNextPage()}
                        disabled={documentsQuery.isFetchingNextPage}
                        className="text-xs font-semibold text-gray-400 transition-colors hover:text-primary disabled:opacity-60"
                      >
                        {documentsQuery.isFetchingNextPage && <Loader2 size={13} className="mr-1 inline animate-spin" />}
                        Load more
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {previewDoc && (
        <DocumentPreview
          name={previewDoc.name}
          fileName={previewDoc.fileName}
          mimeType={previewDoc.mimeType}
          url={previewUrl}
          isLoading={previewLoading}
          onClose={() => { setPreviewDoc(null); setPreviewUrl(null); }}
          onOpenExternal={() => {
            if (previewUrl) openResolvedUrl(previewUrl);
          }}
          onDownload={() => void handleDownload(previewDoc)}
        />
      )}
    </div>
  );
};
