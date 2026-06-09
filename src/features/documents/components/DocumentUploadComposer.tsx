import React, { useRef } from 'react';
import { Loader2, Plus, UploadCloud, X } from 'lucide-react';
import { uploadKindAccept } from '@features/upload';
import { formatDocumentSize, getDocumentTypeLabel } from '../utils';
import type { PendingDocumentDraft } from '../types';

interface DocumentUploadComposerProps {
  title: string;
  description: string;
  drafts: PendingDocumentDraft[];
  onAddFiles: (files: File[]) => void;
  onUpdateDraft: (draftId: string, patch: Partial<PendingDocumentDraft>) => void;
  onRemoveDraft: (draftId: string) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export const DocumentUploadComposer: React.FC<DocumentUploadComposerProps> = ({
  title,
  description,
  drafts,
  onAddFiles,
  onUpdateDraft,
  onRemoveDraft,
  onSubmit,
  submitLabel = 'Upload documents',
  isSubmitting = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">{description}</p>

        <div className="flex shrink-0 items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={uploadKindAccept.document}
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) {
                onAddFiles(files);
              }
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary dark:border-border-dark"
          >
            <Plus size={15} />
            Add files
          </button>
          {onSubmit && drafts.length > 0 && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
              {submitLabel}
            </button>
          )}
        </div>
      </div>

      {drafts.length > 0 && (
        <div className="mt-4 divide-y divide-gray-100 dark:divide-border-dark/40">
          {drafts.map((draft) => (
            <div key={draft.id} className="py-3 first:pt-0">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto]">
                <input
                  value={draft.name}
                  onChange={(event) => onUpdateDraft(draft.id, { name: event.target.value, error: null })}
                  placeholder="Name"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                />
                <input
                  value={draft.description}
                  onChange={(event) => onUpdateDraft(draft.id, { description: event.target.value, error: null })}
                  placeholder="Optional description"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                />
                <button
                  type="button"
                  onClick={() => onRemoveDraft(draft.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                <span className="font-medium text-gray-500 dark:text-gray-300">
                  {getDocumentTypeLabel({ fileName: draft.file.name, mimeType: draft.file.type })}
                </span>
                <span>{draft.file.name}</span>
                <span>{formatDocumentSize(draft.file.size)}</span>
                {draft.status !== 'idle' && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {draft.status === 'uploading' && draft.progress !== null
                      ? `Uploading ${draft.progress}%`
                      : draft.status === 'preparing'
                        ? 'Preparing'
                        : draft.status === 'uploaded'
                          ? 'Ready'
                          : 'Attention'}
                  </span>
                )}
              </div>

              {draft.error && <p className="mt-1.5 text-xs font-medium text-red-500">{draft.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
