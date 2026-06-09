import React from 'react';
import { Download, ExternalLink, FileText, Loader2, Pencil, Save, Trash2, X } from 'lucide-react';
import { formatDocumentSize, getDocumentTypeLabel } from '../utils';
import type { DocumentRecord } from '../types';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

interface DocumentListProps {
  documents: DocumentRecord[];
  canManage: boolean;
  editingDocumentId: string | null;
  editName: string;
  editDescription: string;
  savingDocumentId: string | null;
  deletingDocumentId: string | null;
  openingDocumentId: string | null;
  onStartEdit: (document: DocumentRecord) => void;
  onCancelEdit: () => void;
  onEditNameChange: (value: string) => void;
  onEditDescriptionChange: (value: string) => void;
  onSaveEdit: (documentId: string) => void;
  onDelete: (document: DocumentRecord) => void;
  onOpen: (document: DocumentRecord) => void;
  onDownload: (document: DocumentRecord) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  canManage,
  editingDocumentId,
  editName,
  editDescription,
  savingDocumentId,
  deletingDocumentId,
  openingDocumentId,
  onStartEdit,
  onCancelEdit,
  onEditNameChange,
  onEditDescriptionChange,
  onSaveEdit,
  onDelete,
  onOpen,
  onDownload,
}) => (
  <div className="divide-y divide-gray-100 dark:divide-border-dark/40">
    {documents.map((document) => {
      const isEditing = editingDocumentId === document.id;
      const isSaving = savingDocumentId === document.id;
      const isDeleting = deletingDocumentId === document.id;
      const isOpening = openingDocumentId === document.id;

      return (
        <div key={document.id} className="group flex items-start justify-between gap-4 py-4">
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="grid gap-2">
                <input
                  value={editName}
                  onChange={(event) => onEditNameChange(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                />
                <textarea
                  value={editDescription}
                  onChange={(event) => onEditDescriptionChange(event.target.value)}
                  rows={2}
                  placeholder="Description"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSaveEdit(document.id)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold dark:border-border-dark"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold">{document.name}</p>
                {document.description && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{document.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1.5">
                    {document.uploadedBy.avatar ? (
                      <img
                        src={document.uploadedBy.avatar}
                        alt={document.uploadedBy.name}
                        className="h-4 w-4 rounded-full"
                      />
                    ) : (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[8px] font-bold text-primary">
                        {document.uploadedBy.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {document.uploadedBy.name}
                  </span>
                  <span>{document.fileName}</span>
                  <span>{dateFormatter.format(new Date(document.createdAt))}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:bg-white/5 dark:text-gray-300">
                    {getDocumentTypeLabel(document)}
                  </span>
                  <span className="text-[10px] font-medium">{formatDocumentSize(document.sizeBytes)}</span>
                </div>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => onOpen(document)}
                disabled={isOpening}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-primary disabled:opacity-60"
                title="Open"
              >
                {isOpening ? <Loader2 size={15} className="animate-spin" /> : <ExternalLink size={15} />}
              </button>
              <button
                type="button"
                onClick={() => onDownload(document)}
                disabled={isOpening}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-primary disabled:opacity-60"
                title="Download"
              >
                <Download size={15} />
              </button>
              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={() => onStartEdit(document)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-primary"
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(document)}
                    disabled={isDeleting}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-red-500 disabled:opacity-60"
                    title="Delete"
                  >
                    {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
);
