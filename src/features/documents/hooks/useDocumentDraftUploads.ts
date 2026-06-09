import { useUploadFile } from '@features/upload';
import type { CreateDocumentInput } from '@shared/types/documents';
import { toDocumentFileRef } from '../utils';
import type { PendingDocumentDraft, UploadedDocumentDraft } from '../types';

type DraftChangeHandler = (
  draftId: string,
  updater: (draft: PendingDocumentDraft) => PendingDocumentDraft
) => void;

const buildCreateInput = (draft: PendingDocumentDraft, fileRef: CreateDocumentInput['file']): CreateDocumentInput => ({
  name: draft.name.trim(),
  description: draft.description.trim() || null,
  file: fileRef,
});

export const useDocumentDraftUploads = () => {
  const uploadFile = useUploadFile();

  const uploadDrafts = async (
    drafts: PendingDocumentDraft[],
    onDraftChange: DraftChangeHandler
  ): Promise<UploadedDocumentDraft[]> => {
    const results: UploadedDocumentDraft[] = [];

    for (const draft of drafts) {
      if (!draft.name.trim()) {
        onDraftChange(draft.id, (current) => ({
          ...current,
          status: 'failed',
          error: 'Document name is required.',
        }));
        throw new Error('Document name is required.');
      }

      let fileRef = draft.uploadedFile;

      if (!fileRef) {
        onDraftChange(draft.id, (current) => ({
          ...current,
          status: 'preparing',
          progress: 0,
          error: null,
        }));

        try {
          const uploaded = await uploadFile.mutateAsync({
            file: draft.file,
            kind: 'document',
            onProgress: (progress) => {
              onDraftChange(draft.id, (current) => ({
                ...current,
                status: 'uploading',
                progress: progress.percent,
              }));
            },
          });

          fileRef = toDocumentFileRef(uploaded);

          onDraftChange(draft.id, (current) => ({
            ...current,
            status: 'uploaded',
            progress: 100,
            error: null,
            uploadedFile: fileRef,
          }));
        } catch (error) {
          onDraftChange(draft.id, (current) => ({
            ...current,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Could not upload document.',
          }));
          throw error;
        }
      }

      results.push({
        draftId: draft.id,
        input: buildCreateInput(draft, fileRef),
      });
    }

    return results;
  };

  return {
    isUploading: uploadFile.isPending,
    uploadDrafts,
  };
};
