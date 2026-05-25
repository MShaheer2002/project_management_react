import React, { useMemo, useRef, useState } from 'react';
import {
  Loader2,
  MessageSquare,
  Send,
  Trash2,
  Pencil,
  CornerDownRight,
  Paperclip,
  X,
  Plus,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '@/AppContext';
import { useWorkspaceMemberOptions } from '@features/workspace';
import { AttachmentMediaPreview } from '@features/upload';
import { useUploadFile } from '@features/upload';
import {
  useAddIssueCommentAttachments,
  useCreateIssueComment,
  useDeleteIssueComment,
  useIssueComments,
  useRemoveIssueCommentAttachment,
  useUpdateIssueComment,
} from '../hooks/useIssueData';
import type { IssueComment, IssueCommentAttachmentInput } from '../types';

type IssueCommentsThreadProps = {
  issueId: string;
  compact?: boolean;
};

type ThreadComment = IssueComment & { children: ThreadComment[] };

type DraftAttachment = {
  clientId: string;
  fileName: string;
  contentType: string;
  size: number;
  kind: 'attachment' | 'video';
  previewUrl: string;
  key?: string;
  assetUrl?: string | null;
  status: 'uploading' | 'uploaded' | 'failed';
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const buildThread = (comments: IssueComment[]): ThreadComment[] => {
  const map = new Map<string, ThreadComment>();
  const roots: ThreadComment[] = [];

  comments.forEach((comment) => {
    map.set(comment.id, { ...comment, children: [] });
  });

  comments.forEach((comment) => {
    const node = map.get(comment.id);
    if (!node) return;

    if (comment.parentId) {
      const parent = map.get(comment.parentId);
      if (parent) {
        parent.children.push(node);
        return;
      }
    }

    roots.push(node);
  });

  return roots;
};

const toAttachmentInput = (item: DraftAttachment): IssueCommentAttachmentInput | null => {
  if (!item.key) return null;

  return {
    key: item.key,
    fileName: item.fileName,
    contentType: item.contentType,
    size: item.size,
    kind: item.kind,
    assetUrl: item.assetUrl ?? null,
  };
};

const Avatar: React.FC<{ name: string | null; avatar: string | null }> = ({ name, avatar }) => {
  if (avatar) {
    return <img src={avatar} alt={name || 'User'} className="h-7 w-7 rounded-full object-cover" />;
  }

  const initial = (name || 'U').trim().charAt(0).toUpperCase();
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
      {initial}
    </div>
  );
};

const DraftAttachmentList: React.FC<{
  items: DraftAttachment[];
  onRemove: (clientId: string) => void;
}> = ({ items, onRemove }) => {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.clientId}
          className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-border-dark dark:bg-black/20"
        >
          <div className="h-20 w-full bg-gray-50 dark:bg-white/[0.03]">
            {item.contentType.startsWith('video/') ? (
              <video src={item.previewUrl} className="h-full w-full object-cover" muted playsInline />
            ) : (
              <img src={item.previewUrl} alt={item.fileName} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="px-2 py-1.5">
            <p className="truncate text-[11px] font-medium text-gray-700 dark:text-gray-200">{item.fileName}</p>
            <p className="text-[10px] text-gray-400">
              {item.status === 'uploaded' ? 'Uploaded' : item.status === 'uploading' ? 'Uploading...' : 'Upload failed'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.clientId)}
            className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};

const CommentAttachmentGallery: React.FC<{
  attachments: NonNullable<IssueComment['attachments']>;
  canManage: boolean;
  onRemove: (attachmentId: string) => void;
  onOpen: (attachment: NonNullable<IssueComment['attachments']>[number]) => void;
}> = ({ attachments, canManage, onRemove, onOpen }) => {
  if (!attachments.length) return null;

  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-border-dark dark:bg-black/20"
        >
          <button
            type="button"
            onClick={() => onOpen(attachment)}
            className="h-24 w-full bg-gray-50 text-left dark:bg-white/[0.03]"
          >
            <AttachmentMediaPreview
              contentType={attachment.contentType}
              fileName={attachment.fileName}
              attachmentKey={attachment.key}
              assetUrl={attachment.assetUrl}
              className="h-full w-full object-cover"
            />
          </button>
          <div className="px-2 py-1.5">
            <p className="truncate text-[11px] font-medium text-gray-700 dark:text-gray-200">{attachment.fileName}</p>
            <p className="text-[10px] text-gray-400">{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => onRemove(attachment.id)}
              className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

const CommentComposer: React.FC<{
  onSubmit: (value: string, attachments: IssueCommentAttachmentInput[]) => Promise<void>;
  placeholder: string;
  submitLabel: string;
  compact?: boolean;
}> = ({ onSubmit, placeholder, submitLabel, compact }) => {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [draftAttachments, setDraftAttachments] = useState<DraftAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFile = useUploadFile();

  const mentionOptionsQuery = useWorkspaceMemberOptions(
    {
      q: mentionQuery || undefined,
      sort: 'name:asc',
      limit: 6,
    },
    { enabled: mentionOpen }
  );
  const mentionOptions = mentionOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const updateMentionState = (nextValue: string, cursorPos: number) => {
    const textBeforeCursor = nextValue.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/(^|\s)@([a-zA-Z0-9._-]{0,30})$/);

    if (!mentionMatch) {
      setMentionOpen(false);
      setMentionQuery('');
      setMentionStartIndex(null);
      return;
    }

    const query = mentionMatch[2] ?? '';
    const start = textBeforeCursor.length - query.length - 1;
    setMentionOpen(true);
    setMentionQuery(query);
    setMentionStartIndex(start);
  };

  const handleInsertMention = (memberName: string) => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStartIndex === null) return;

    const cursorPos = textarea.selectionStart ?? value.length;
    const beforeMention = value.slice(0, mentionStartIndex);
    const afterMention = value.slice(cursorPos);
    const inserted = `@${memberName} `;
    const nextValue = `${beforeMention}${inserted}${afterMention}`;
    setValue(nextValue);
    setMentionOpen(false);
    setMentionQuery('');
    setMentionStartIndex(null);

    requestAnimationFrame(() => {
      const nextCursor = (beforeMention + inserted).length;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selected = Array.from(files).filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'));
    if (selected.length === 0) return;

    const localItems: DraftAttachment[] = selected.map((file, idx) => ({
      clientId: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
      kind: file.type.startsWith('video/') ? 'video' : 'attachment',
      previewUrl: URL.createObjectURL(file),
      status: 'uploading',
    }));

    setDraftAttachments((current) => [...current, ...localItems]);

    try {
      for (let index = 0; index < selected.length; index += 1) {
        const file = selected[index];
        const localItem = localItems[index];
        const uploaded = await uploadFile.mutateAsync({
          file,
          kind: file.type.startsWith('video/') ? 'video' : 'attachment',
          clientId: localItem.clientId,
        });

        setDraftAttachments((current) =>
          current.map((item) =>
            item.clientId === localItem.clientId
              ? {
                  ...item,
                  key: uploaded.key,
                  assetUrl: uploaded.assetUrl,
                  status: 'uploaded',
                }
              : item
          )
        );
      }
    } catch {
      setDraftAttachments((current) =>
        current.map((item) =>
          localItems.some((l) => l.clientId === item.clientId) ? { ...item, status: 'failed' } : item
        )
      );
    }
  };

  const removeDraftAttachment = (clientId: string) => {
    setDraftAttachments((current) => {
      const target = current.find((item) => item.clientId === clientId);
      if (target?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.clientId !== clientId);
    });
  };

  const handleSubmit = async () => {
    const trimmed = value.trim();
    const hasUploading = draftAttachments.some((item) => item.status === 'uploading');
    const hasFailed = draftAttachments.some((item) => item.status === 'failed');
    if ((!trimmed && draftAttachments.length === 0) || isSubmitting || hasUploading || hasFailed) return;

    const attachmentInputs = draftAttachments
      .filter((item) => item.status === 'uploaded')
      .map(toAttachmentInput)
      .filter((item): item is IssueCommentAttachmentInput => Boolean(item));

    setIsSubmitting(true);
    try {
      await onSubmit(trimmed, attachmentInputs);
      setValue('');
      setDraftAttachments((current) => {
        current.forEach((item) => {
          if (item.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(item.previewUrl);
          }
        });
        return [];
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2 rounded-2xl border border-gray-200/80 bg-gray-50/60 p-3 dark:border-border-dark dark:bg-white/[0.02]">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value;
            const cursorPos = event.target.selectionStart ?? nextValue.length;
            setValue(nextValue);
            updateMentionState(nextValue, cursorPos);
          }}
          onClick={(event) => {
            const cursorPos = (event.target as HTMLTextAreaElement).selectionStart ?? value.length;
            updateMentionState(value, cursorPos);
          }}
          onKeyUp={(event) => {
            const cursorPos = (event.target as HTMLTextAreaElement).selectionStart ?? value.length;
            updateMentionState(value, cursorPos);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && mentionOpen && mentionOptions.length === 1) {
              event.preventDefault();
              handleInsertMention(mentionOptions[0].name);
            }
          }}
          onBlur={() => {
            setTimeout(() => setMentionOpen(false), 120);
          }}
          onFocus={(event) => {
            const cursorPos = event.target.selectionStart ?? value.length;
            updateMentionState(value, cursorPos);
          }}
          placeholder={placeholder}
          className={`w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-black/20 ${compact ? 'min-h-[72px]' : 'min-h-[96px]'}`}
        />
        {mentionOpen && (
          <div className="absolute left-2 z-30 mt-1 w-[260px] max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl dark:border-border-dark dark:bg-card-dark">
            {mentionOptionsQuery.isLoading ? (
              <div className="px-3 py-2 text-xs text-gray-400">Loading users...</div>
            ) : mentionOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">No matching users</div>
            ) : (
              mentionOptions.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleInsertMention(member.name)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-all hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                    {(member.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate text-[11px] text-gray-500 dark:text-gray-300">{member.email}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <DraftAttachmentList items={draftAttachments} onRemove={removeDraftAttachment} />

      <div className="flex items-center justify-between">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*"
            multiple
            onChange={(event) => {
              void handleFilesSelected(event.target.files);
              event.currentTarget.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-300"
          >
            <Paperclip size={13} />
            Attach
          </button>
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={
            (!value.trim() && draftAttachments.every((item) => item.status !== 'uploaded')) ||
            isSubmitting ||
            draftAttachments.some((item) => item.status === 'uploading' || item.status === 'failed')
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
};

const CommentNode: React.FC<{
  comment: ThreadComment;
  depth?: number;
  compact?: boolean;
  currentUserId?: string;
  role?: string;
  onReply: (parentId: string, body: string, attachments: IssueCommentAttachmentInput[]) => Promise<void>;
  onUpdate: (commentId: string, body: string, attachments?: IssueCommentAttachmentInput[]) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onAddAttachments: (commentId: string, attachments: IssueCommentAttachmentInput[]) => Promise<void>;
  onRemoveAttachment: (commentId: string, attachmentId: string) => Promise<void>;
  onOpenAttachment: (attachment: NonNullable<IssueComment['attachments']>[number]) => void;
}> = ({
  comment,
  depth = 0,
  compact,
  currentUserId,
  role,
  onReply,
  onUpdate,
  onDelete,
  onAddAttachments,
  onRemoveAttachment,
  onOpenAttachment,
}) => {
  const { showToast } = useApp();
  const [showReply, setShowReply] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.body);
  const [uploadingInline, setUploadingInline] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFile = useUploadFile();
  const canEdit = currentUserId === comment.author.id;
  const canDelete = canEdit || role === 'admin' || role === 'owner';

  const handleSaveEdit = async () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      showToast('Comment cannot be empty.', 'error');
      return;
    }
    await onUpdate(comment.id, trimmed, comment.attachments ?? []);
    setIsEditing(false);
  };

  const handleInlineFileAdd = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selected = Array.from(files).filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'));
    if (selected.length === 0) return;

    setUploadingInline(true);
    try {
      const inputs: IssueCommentAttachmentInput[] = [];

      for (const file of selected) {
        const uploaded = await uploadFile.mutateAsync({
          file,
          kind: file.type.startsWith('video/') ? 'video' : 'attachment',
        });

        inputs.push({
          key: uploaded.key,
          fileName: uploaded.fileName,
          contentType: uploaded.contentType,
          size: uploaded.size,
          kind: uploaded.kind === 'video' ? 'video' : 'attachment',
          assetUrl: uploaded.assetUrl,
        });
      }

      await onAddAttachments(comment.id, inputs);
      showToast('Attachment added.', 'success');
    } catch {
      showToast('Failed to upload attachment.', 'error');
    } finally {
      setUploadingInline(false);
    }
  };

  return (
    <div className={`${depth > 0 ? 'mt-3 border-l border-gray-200 pl-4 dark:border-border-dark' : ''}`}>
      <div className="rounded-xl border border-gray-100 bg-white/80 p-3 shadow-sm dark:border-border-dark dark:bg-white/[0.01]">
        {depth > 0 && (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Reply
          </p>
        )}
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar name={comment.author.name} avatar={comment.author.avatar} />
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">{comment.author.name || comment.author.email}</p>
              <p className="text-[11px] text-gray-400">{formatTimestamp(comment.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowReply((current) => !current)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary dark:hover:bg-white/[0.06]"
              title="Reply"
            >
              <CornerDownRight size={13} />
            </button>
            {canEdit && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  multiple
                  onChange={(event) => {
                    void handleInlineFileAdd(event.target.files);
                    event.currentTarget.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary dark:hover:bg-white/[0.06]"
                  title="Add attachment"
                >
                  {uploadingInline ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                </button>
              </>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditing((current) => !current)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary dark:hover:bg-white/[0.06]"
                title="Edit"
              >
                <Pencil size={13} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => void onDelete(comment.id)}
                className="rounded p-1 text-gray-400 hover:bg-red-500/10 hover:text-red-500"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.04]"
              rows={compact ? 3 : 4}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditValue(comment.body);
                  setIsEditing(false);
                }}
                className="px-2 py-1 text-xs font-medium text-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveEdit()}
                className="rounded bg-primary px-3 py-1 text-xs font-bold text-white"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">{comment.body}</p>
        )}

        <CommentAttachmentGallery
          attachments={comment.attachments ?? []}
          canManage={canEdit}
          onRemove={(attachmentId) => void onRemoveAttachment(comment.id, attachmentId)}
          onOpen={onOpenAttachment}
        />
      </div>

      {showReply && (
        <div className="mt-2 border-l border-gray-200 pl-3 dark:border-border-dark">
          <p className="mb-1.5 text-[10px] font-medium tracking-wide text-gray-400">
            Replying to {comment.author.name || comment.author.email}
          </p>
          <CommentComposer
            compact={compact}
            placeholder="Write a reply..."
            submitLabel="Reply"
            onSubmit={(body, attachments) => onReply(comment.id, body, attachments).then(() => setShowReply(false))}
          />
        </div>
      )}

      {comment.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.children.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              depth={depth + 1}
              compact={compact}
              currentUserId={currentUserId}
              role={role}
              onReply={onReply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddAttachments={onAddAttachments}
              onRemoveAttachment={onRemoveAttachment}
              onOpenAttachment={onOpenAttachment}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MediaViewer: React.FC<{
  attachment: NonNullable<IssueComment['attachments']>[number];
  onClose: () => void;
}> = ({ attachment, onClose }) => {
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close preview"
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-1.5 text-white transition-all hover:bg-white/20"
      >
        <XCircle size={18} />
      </button>
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-white/80">
          <p className="truncate font-semibold">{attachment.fileName}</p>
          <p>{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <div className="flex max-h-[78vh] min-h-[240px] items-center justify-center bg-black">
          {attachment.contentType.startsWith('video/') ? (
            <video
              controls
              autoPlay
              className="max-h-[78vh] max-w-full"
              src={attachment.assetUrl ?? undefined}
            />
          ) : (
            <AttachmentMediaPreview
              contentType={attachment.contentType}
              fileName={attachment.fileName}
              attachmentKey={attachment.key}
              assetUrl={attachment.assetUrl}
              className="max-h-[78vh] max-w-full object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const IssueCommentsThread: React.FC<IssueCommentsThreadProps> = ({ issueId, compact }) => {
  const { showToast } = useApp();
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const role = useAuthStore((state) => state.workspace?.role);

  const commentsQuery = useIssueComments(issueId, { limit: 50 }, { enabled: Boolean(issueId) });
  const createComment = useCreateIssueComment(issueId);
  const updateComment = useUpdateIssueComment(issueId);
  const deleteComment = useDeleteIssueComment(issueId);
  const addCommentAttachments = useAddIssueCommentAttachments(issueId);
  const removeCommentAttachment = useRemoveIssueCommentAttachment(issueId);
  const [viewerAttachment, setViewerAttachment] = useState<NonNullable<IssueComment['attachments']>[number] | null>(null);

  const allComments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [commentsQuery.data]
  );
  const threadedComments = useMemo(() => buildThread(allComments), [allComments]);

  const handleCreate = async (body: string, parentId?: string, attachments: IssueCommentAttachmentInput[] = []) => {
    try {
      await createComment.mutateAsync({ body, parentId: parentId ?? null, attachments });
    } catch (error) {
      showToast((error as Error)?.message || 'Failed to create comment.', 'error');
    }
  };

  const handleUpdate = async (
    commentId: string,
    body: string,
    attachments: IssueCommentAttachmentInput[] = []
  ) => {
    try {
      await updateComment.mutateAsync({ commentId, input: { body, attachments } });
      showToast('Comment updated.', 'success');
    } catch (error) {
      showToast((error as Error)?.message || 'Failed to update comment.', 'error');
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync(commentId);
      showToast('Comment deleted.', 'success');
    } catch (error) {
      showToast((error as Error)?.message || 'Failed to delete comment.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <CommentComposer
        compact={compact}
        placeholder="Write a comment... Use @ to mention"
        submitLabel="Comment"
        onSubmit={(value, attachments) => handleCreate(value, undefined, attachments)}
      />

      {commentsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 size={14} className="animate-spin" /> Loading comments...
        </div>
      ) : threadedComments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 p-4 text-sm text-gray-500 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-400">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} />
            No comments yet. Start the discussion.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {threadedComments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              compact={compact}
              currentUserId={currentUserId}
              role={role}
              onReply={(parentId, body, attachments) => handleCreate(body, parentId, attachments)}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAddAttachments={async (commentId, attachments) => {
                await addCommentAttachments.mutateAsync({ commentId, input: { attachments } });
              }}
              onRemoveAttachment={async (commentId, attachmentId) => {
                await removeCommentAttachment.mutateAsync({ commentId, attachmentId });
              }}
              onOpenAttachment={(attachment) => setViewerAttachment(attachment)}
            />
          ))}
        </div>
      )}

      {commentsQuery.hasNextPage && (
        <button
          type="button"
          onClick={() => commentsQuery.fetchNextPage()}
          disabled={commentsQuery.isFetchingNextPage}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-300"
        >
          {commentsQuery.isFetchingNextPage ? 'Loading...' : 'Load older comments'}
        </button>
      )}

      {viewerAttachment && (
        <MediaViewer attachment={viewerAttachment} onClose={() => setViewerAttachment(null)} />
      )}
    </div>
  );
};
