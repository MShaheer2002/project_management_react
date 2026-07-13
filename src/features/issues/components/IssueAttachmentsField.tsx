import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  ExternalLink,
  FileVideo2,
  HardDrive,
  ImageIcon,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { uploadKindAccept, useOpenViewUploadUrl, useUploadFile, type UploadedFileReference } from '@features/upload';
import { useDriveConnection, driveService } from '@features/drive';
import type { DriveFolderContext } from '@features/drive';
import { getApiErrorCode, getApiErrorMessage } from '@shared/services';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '@/AppContext';
import type { IssueAttachment } from '@/types';

type AttachmentUploadState = 'uploading' | 'uploaded' | 'failed';

type AttachmentListItem = IssueAttachment & {
  status: AttachmentUploadState;
  progress: number | null;
  error?: string;
  file?: File;
  previewUrl?: string | null;
  usesObjectUrl?: boolean;
  isDriveUpload?: boolean;
};

type IssueAttachmentsFieldProps = {
  value: IssueAttachment[];
  onChange: (attachments: IssueAttachment[]) => void;
  driveFolderContext?: DriveFolderContext;
  embedded?: boolean;
};

const acceptedMimePrefixes = ['image/', 'video/'];

const buildClientId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const isImage = (contentType: string) => contentType.startsWith('image/');
const isVideo = (contentType: string) => contentType.startsWith('video/');

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const toIssueAttachment = (uploaded: UploadedFileReference): IssueAttachment => ({
  id: uploaded.clientId,
  fileName: uploaded.fileName,
  contentType: uploaded.contentType,
  size: uploaded.size,
  kind: uploaded.kind === 'video' ? 'video' : 'attachment',
  key: uploaded.key,
  assetUrl: uploaded.assetUrl,
  reference: uploaded.reference,
});

const buildStoredItem = (attachment: IssueAttachment): AttachmentListItem => ({
  ...attachment,
  status: 'uploaded',
  progress: 100,
  previewUrl: attachment.assetUrl ?? null,
  usesObjectUrl: false,
});

const buildUploadErrorMessage = (error: unknown) => {
  const code = getApiErrorCode(error);

  if (code === 'UPLOAD_TYPE_NOT_ALLOWED') {
    return 'This file type is not allowed.';
  }

  if (code === 'UPLOAD_FILE_TOO_LARGE') {
    return 'This file is too large to upload.';
  }

  if (isAxiosError(error) && !error.response && error.message === 'Network Error') {
    return 'Upload blocked by bucket CORS. The file reached presign, but S3 rejected the browser upload.';
  }

  return getApiErrorMessage(error) || 'Upload failed. Try again.';
};

/** Inline editable filename — click pencil icon to rename, blur/enter to save */
const InlineRename: React.FC<{
  fileName: string;
  driveFileId: string;
  onRenamed: (newName: string) => void;
}> = ({ fileName, driveFileId, onRenamed }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(fileName);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === fileName) {
      setValue(fileName);
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const result = await driveService.renameFile(driveFileId, trimmed);
      onRenamed(result.name);
      setEditing(false);
    } catch (error) {
      console.error('[InlineRename] Failed to rename:', error);
      setValue(fileName);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [value, fileName, driveFileId, onRenamed]);

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => void save()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save();
            if (e.key === 'Escape') { setValue(fileName); setEditing(false); }
          }}
          disabled={saving}
          className="min-w-0 flex-1 truncate rounded border border-primary/40 bg-transparent px-1 py-0.5 text-sm font-semibold text-gray-800 outline-none focus:border-primary dark:text-gray-100 disabled:opacity-50"
          maxLength={255}
        />
        {saving && <Loader2 size={12} className="animate-spin text-gray-400" />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 min-w-0">
      <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
        {fileName}
      </p>
      <button
        type="button"
        onClick={() => { setValue(fileName); setEditing(true); }}
        className="shrink-0 rounded p-0.5 text-gray-300 opacity-0 transition-opacity group-hover/item:opacity-100 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
        title="Rename file"
      >
        <Pencil size={11} />
      </button>
    </div>
  );
};

export const IssueAttachmentsField: React.FC<IssueAttachmentsFieldProps> = ({
  value,
  onChange,
  driveFolderContext,
  embedded = false,
}) => {
  const { showToast } = useApp();
  const uploadFile = useUploadFile();
  const openViewUploadUrl = useOpenViewUploadUrl();
  const { data: driveConnection } = useDriveConnection();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const driveInputRef = useRef<HTMLInputElement | null>(null);
  const controllersRef = useRef<Map<string, AbortController>>(new Map());
  const itemsRef = useRef<AttachmentListItem[]>([]);
  const hasLocalStateRef = useRef(false);

  const [items, setItems] = useState<AttachmentListItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const uploadPolicy = useAuthStore((s) => s.workspace?.uploadPolicy) ?? 'BOTH';
  const isDriveConnected = driveConnection?.connected ?? false;

  // Upload policy enforcement:
  // BOTH = show S3 + Drive (if connected)
  // SYSTEM_ONLY = show S3 only, hide Drive entirely
  // DRIVE_ONLY = show Drive only (must be connected), hide S3
  const showSystemUpload = uploadPolicy === 'BOTH' || uploadPolicy === 'SYSTEM_ONLY';
  const showDriveUpload = (uploadPolicy === 'BOTH' || uploadPolicy === 'DRIVE_ONLY') && isDriveConnected;
  const showDriveConnectPrompt = uploadPolicy === 'DRIVE_ONLY' && !isDriveConnected;

  itemsRef.current = items;

  useEffect(() => {
    if (hasLocalStateRef.current) return;
    setItems(value.map(buildStoredItem));
  }, [value]);

  useEffect(() => {
    return () => {
      controllersRef.current.forEach((controller) => controller.abort());
      itemsRef.current.forEach((item) => {
        if (item.usesObjectUrl && item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  const uploadedCount = useMemo(
    () => items.filter((item) => item.status === 'uploaded').length,
    [items]
  );

  // Sync uploaded attachments to parent whenever items change.
  // Runs as an effect — clean separation between child state and parent state.
  const pendingSyncRef = useRef(false);

  useEffect(() => {
    if (!pendingSyncRef.current) return;
    pendingSyncRef.current = false;

    onChange(
      items
        .filter((item) => item.status === 'uploaded')
        .map(({ status, progress, error, file, previewUrl, usesObjectUrl, isDriveUpload, ...attachment }) => attachment)
    );
  }, [items, onChange]);

  const updateItems = (
    updater: (current: AttachmentListItem[]) => AttachmentListItem[],
    options?: { sync?: boolean; local?: boolean }
  ) => {
    const shouldSync = options?.sync ?? true;
    const shouldMarkLocal = options?.local ?? true;

    if (shouldMarkLocal) {
      hasLocalStateRef.current = true;
    }

    if (shouldSync) {
      pendingSyncRef.current = true;
    }

    setItems(updater);
  };

  const removeItem = (id: string) => {
    const controller = controllersRef.current.get(id);
    if (controller) {
      controller.abort();
      controllersRef.current.delete(id);
    }

    const current = itemsRef.current.find((item) => item.id === id);
    if (current?.usesObjectUrl && current.previewUrl) {
      URL.revokeObjectURL(current.previewUrl);
    }

    updateItems((existing) => existing.filter((item) => item.id !== id));
  };

  const performUpload = async (itemId: string, queuedItem?: AttachmentListItem) => {
    const current = queuedItem ?? itemsRef.current.find((item) => item.id === itemId);
    if (!current?.file) {
      console.log('[IssueAttachmentsField] performUpload skipped: no file found', { itemId });
      return;
    }

    console.log('[IssueAttachmentsField] performUpload starting', {
      itemId,
      fileName: current.file.name,
      contentType: current.file.type,
      size: current.file.size,
    });

    const controller = new AbortController();
    controllersRef.current.set(itemId, controller);

    updateItems(
      (existing) =>
        existing.map((item) =>
          item.id === itemId
            ? { ...item, status: 'uploading', progress: 0, error: undefined }
            : item
        ),
      { sync: false }
    );

    try {
      const uploaded = await uploadFile.mutateAsync({
        file: current.file,
        kind: current.file.type.startsWith('video/') ? 'video' : 'attachment',
        clientId: itemId,
        signal: controller.signal,
        onProgress: ({ percent }) => {
          updateItems(
            (existing) =>
              existing.map((item) =>
                item.id === itemId ? { ...item, progress: percent } : item
              ),
            { sync: false, local: false }
          );
        },
      });

      controllersRef.current.delete(itemId);

      updateItems((existing) =>
        existing.map((item) => {
          if (item.id !== itemId) return item;

          if (item.usesObjectUrl && item.previewUrl && uploaded.assetUrl) {
            URL.revokeObjectURL(item.previewUrl);
          }

          return {
            ...item,
            ...toIssueAttachment(uploaded),
            status: 'uploaded',
            progress: 100,
            error: undefined,
            file: undefined,
            previewUrl: uploaded.assetUrl ?? item.previewUrl ?? null,
            usesObjectUrl: uploaded.assetUrl ? false : item.usesObjectUrl,
          };
        })
      );
    } catch (error) {
      controllersRef.current.delete(itemId);

      if (controller.signal.aborted) {
        console.log('[IssueAttachmentsField] performUpload aborted', { itemId });
        return;
      }

      console.error('[IssueAttachmentsField] performUpload failed', {
        itemId,
        fileName: current.file.name,
        error,
      });

      const message = buildUploadErrorMessage(error);

      updateItems(
        (existing) =>
          existing.map((item) =>
            item.id === itemId
              ? { ...item, status: 'failed', progress: null, error: message }
              : item
          ),
        { sync: false }
      );

      showToast(message, 'error', 'Attachment upload failed');
    }
  };

  const performDriveUpload = async (itemId: string, queuedItem?: AttachmentListItem) => {
    const current = queuedItem ?? itemsRef.current.find((item) => item.id === itemId);
    if (!current?.file) return;

    const controller = new AbortController();
    controllersRef.current.set(itemId, controller);

    updateItems(
      (existing) =>
        existing.map((item) =>
          item.id === itemId
            ? { ...item, status: 'uploading', progress: 0, error: undefined }
            : item
        ),
      { sync: false }
    );

    try {
      const result = await driveService.uploadFile(current.file, {
        onProgress: (percent) => {
          updateItems(
            (existing) =>
              existing.map((item) =>
                item.id === itemId ? { ...item, progress: percent } : item
              ),
            { sync: false, local: false }
          );
        },
        signal: controller.signal,
        folderContext: driveFolderContext,
      });

      controllersRef.current.delete(itemId);

      updateItems((existing) =>
        existing.map((item) => {
          if (item.id !== itemId) return item;

          if (item.usesObjectUrl && item.previewUrl) {
            URL.revokeObjectURL(item.previewUrl);
          }

          return {
            ...item,
            fileName: result.fileName,
            contentType: result.mimeType,
            size: result.sizeBytes,
            kind: result.mimeType.startsWith('video/') ? 'video' as const : 'attachment' as const,
            key: result.driveFileId,
            assetUrl: result.driveUrl,
            reference: result.driveUrl,
            status: 'uploaded',
            progress: 100,
            error: undefined,
            file: undefined,
            previewUrl: null,
            usesObjectUrl: false,
          };
        })
      );
    } catch (error) {
      controllersRef.current.delete(itemId);

      if (controller.signal.aborted) return;

      const message =
        error instanceof Error ? error.message : 'Drive upload failed. Try again.';

      updateItems(
        (existing) =>
          existing.map((item) =>
            item.id === itemId
              ? { ...item, status: 'failed', progress: null, error: message }
              : item
          ),
        { sync: false }
      );

      showToast(message, 'error', 'Drive upload failed');
    }
  };

  const queueFiles = (files: File[]) => {
    console.log(
      '[IssueAttachmentsField] queueFiles called',
      files.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      }))
    );

    const nextFiles = files.filter((file) =>
      acceptedMimePrefixes.some((prefix) => file.type.startsWith(prefix))
    );

    if (nextFiles.length !== files.length) {
      showToast('Only images and videos can be attached.', 'error', 'Unsupported file');
    }

    if (nextFiles.length === 0) return;

    const queuedItems = nextFiles.map<AttachmentListItem>((file) => {
      const previewUrl = URL.createObjectURL(file);
      return {
        id: buildClientId(),
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        kind: file.type.startsWith('video/') ? 'video' : 'attachment',
        key: '',
        assetUrl: null,
        reference: '',
        file,
        status: 'uploading',
        progress: 0,
        previewUrl,
        usesObjectUrl: true,
      };
    });

    updateItems((existing) => [...queuedItems, ...existing], { sync: false });
    queuedItems.forEach((item) => {
      void performUpload(item.id, item);
    });
  };

  const queueDriveFiles = (files: File[]) => {
    if (files.length === 0) return;

    const queuedItems = files.map<AttachmentListItem>((file) => {
      const previewUrl = file.type.startsWith('image/') || file.type.startsWith('video/')
        ? URL.createObjectURL(file)
        : null;
      return {
        id: buildClientId(),
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        kind: file.type.startsWith('video/') ? 'video' : 'attachment',
        key: '',
        assetUrl: null,
        reference: '',
        file,
        status: 'uploading',
        progress: 0,
        previewUrl,
        usesObjectUrl: Boolean(previewUrl),
        isDriveUpload: true,
      };
    });

    updateItems((existing) => [...queuedItems, ...existing], { sync: false });
    queuedItems.forEach((item) => {
      void performDriveUpload(item.id, item);
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    queueFiles(nextFiles);
    event.target.value = '';
  };

  const handleDriveInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    queueDriveFiles(nextFiles);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    queueFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const handleRetry = (id: string) => {
    const target = itemsRef.current.find((item) => item.id === id);
    if (!target?.file) {
      showToast('This attachment can no longer be retried.', 'error');
      return;
    }

    if (target.isDriveUpload) {
      void performDriveUpload(id);
    } else {
      void performUpload(id);
    }
  };

  const handleOpenAttachment = async (item: AttachmentListItem) => {
    // Drive links are direct URLs — open them directly
    if (item.assetUrl && item.assetUrl.includes('drive.google.com')) {
      window.open(item.assetUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const key = item.key.trim();

    if (!key) {
      if (item.assetUrl) {
        window.open(item.assetUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      showToast('This attachment cannot be opened yet.', 'error');
      return;
    }

    try {
      await openViewUploadUrl(key);
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to open attachment.', 'error');
    }
  };

  return (
    <div className={embedded ? 'space-y-4' : 'space-y-4 border-t border-gray-100 pt-12 dark:border-border-dark'}>
      {showSystemUpload && (
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={uploadKindAccept.attachment}
          onChange={handleInputChange}
          className="hidden"
        />
      )}
      {showDriveUpload && (
        <input
          ref={driveInputRef}
          type="file"
          multiple
          onChange={handleDriveInputChange}
          className="hidden"
        />
      )}

      {!embedded && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
              <Paperclip size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Attachments</h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {uploadedCount > 0 ? `${uploadedCount} uploaded` : 'Images, videos & files'}
              </p>
            </div>
          </div>

          {!showDriveConnectPrompt && (
            <div className="flex items-center gap-2">
              {showDriveUpload && (
                <button
                  type="button"
                  onClick={() => driveInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                  title="Upload to your Google Drive — any file type"
                >
                  <HardDrive size={14} />
                  Upload to Drive
                </button>
              )}
              {showSystemUpload && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-white/10 dark:hover:bg-white/[0.05]"
                >
                  <Plus size={14} />
                  Add files
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Drive-only policy but user hasn't connected Drive — show connect prompt */}
      {showDriveConnectPrompt && (
        <div className="flex min-h-[88px] w-full items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-5 py-5 text-center dark:border-blue-500/30 dark:bg-blue-500/5">
          <div className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-400 dark:border-blue-500/30 dark:bg-blue-500/10">
              <HardDrive size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Connect Google Drive to upload files
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Your workspace requires uploads through Google Drive.{' '}
                <a
                  href="/integrations"
                  className="font-semibold text-primary hover:underline"
                >
                  Connect in Integrations
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* System upload drop zone — only shown when system upload is allowed */}
      {showSystemUpload && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex min-h-[88px] w-full items-center justify-center rounded-xl border border-dashed px-5 py-5 text-center transition-all ${
            isDragOver
              ? 'border-gray-300 bg-gray-50 dark:border-white/10 dark:bg-white/[0.04]'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/70 dark:border-border-dark dark:hover:border-white/10 dark:hover:bg-white/[0.03]'
          }`}
        >
          <div className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400 dark:border-border-dark dark:bg-white/[0.04]">
              <Upload size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Drop files here or click to browse
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {showDriveUpload
                  ? 'System storage for images & videos. Use "Upload to Drive" for any file type.'
                  : 'Attach images and videos with direct upload.'}
              </p>
            </div>
          </div>
        </button>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group/item rounded-xl border border-gray-200 bg-white p-3 dark:border-border-dark dark:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                  {isImage(item.contentType) && item.previewUrl ? (
                    <img src={item.previewUrl} alt={item.fileName} className="h-full w-full object-cover" />
                  ) : isVideo(item.contentType) && item.previewUrl ? (
                    <video src={item.previewUrl} className="h-full w-full object-cover" muted playsInline />
                  ) : isVideo(item.contentType) ? (
                    <FileVideo2 size={18} className="text-gray-400" />
                  ) : item.assetUrl?.includes('drive.google.com') ? (
                    <HardDrive size={18} className="text-blue-400" />
                  ) : (
                    <ImageIcon size={18} className="text-gray-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {item.status === 'uploaded' && item.assetUrl?.includes('drive.google.com') && item.key ? (
                      <InlineRename
                        fileName={item.fileName}
                        driveFileId={item.key}
                        onRenamed={(newName) => {
                          updateItems(
                            (existing) =>
                              existing.map((i) =>
                                i.id === item.id ? { ...i, fileName: newName } : i
                              ),
                          );
                        }}
                      />
                    ) : (
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {item.fileName}
                      </p>
                    )}
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:bg-white/[0.06]">
                      {isVideo(item.contentType) ? 'Video' : isImage(item.contentType) ? 'Image' : 'File'}
                    </span>
                    {item.assetUrl?.includes('drive.google.com') && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-500 dark:bg-blue-500/10">
                        Drive
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span>{formatBytes(item.size)}</span>
                    {item.status === 'uploading' && (
                      <span>{item.progress !== null ? `${item.progress}% uploaded` : 'Uploading'}</span>
                    )}
                    {item.status === 'uploaded' && <span>Uploaded</span>}
                    {item.status === 'failed' && <span className="text-gray-500 dark:text-gray-400">{item.error}</span>}
                  </div>

                  {item.status === 'uploading' && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${item.progress ?? 0}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {item.status === 'uploaded' && (
                    <button
                      type="button"
                      onClick={() => void handleOpenAttachment(item)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                      title="Open attachment"
                    >
                      <ExternalLink size={15} />
                    </button>
                  )}

                  {item.status === 'failed' && item.file && (
                    <button
                      type="button"
                      onClick={() => handleRetry(item.id)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                      title="Retry upload"
                    >
                      <RefreshCcw size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                    title={item.status === 'uploading' ? 'Cancel upload' : 'Remove attachment'}
                  >
                    {item.status === 'uploading' ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
