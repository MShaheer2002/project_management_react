import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  Bug,
  Calendar,
  Clock3,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  Copy,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Plus,
  Share2,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '@/AppContext';
import { PRIORITY_COLORS, STATUS_LABELS, ISSUE_TYPE_CONFIG } from '@/constants';
import { canDeleteIssues } from '@shared/permissions';
import { getApiErrorCode, getApiErrorMessage } from '@shared/services';
import { useOpenViewUploadUrl } from '@features/upload';
import { AttachmentMediaPreview } from '@features/upload';
import { useWorkspaceMemberOptions } from '@features/workspace';
import {
  IssueAttachmentsField,
  IssueActivityTimeline,
  IssueCommentsThread,
  SubtaskList,
  useAddIssueAttachments,
  useDeleteIssue,
  useIssueDetail,
  useRemoveIssueAttachment,
  useUpdateIssue,
  useUpdateIssueStatus,
} from '@features/issues';
import type { IssueAttachment, IssueType, Priority, Status } from '@/types';

const TypeBadge: React.FC<{ type: IssueType }> = ({ type }) => {
  const config = ISSUE_TYPE_CONFIG[type];
  return (
    <span className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
      {type === 'task' && <CheckSquare size={12} />}
      {type === 'bug' && <Bug size={12} />}
      {type === 'issue' && <Zap size={12} />}
      {config.label}
    </span>
  );
};

const FieldLabel: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="flex items-center gap-2 text-gray-400">
    {icon}
    {children}
  </div>
);

const AvatarFallback: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => (
  <div className={`flex items-center justify-center rounded-full bg-primary/10 text-primary ${className}`}>
    <span className="text-xs font-bold">{name.charAt(0).toUpperCase()}</span>
  </div>
);

const PrioritySelect: React.FC<{
  value: Priority;
  disabled?: boolean;
  onChange: (value: Priority) => void;
}> = ({ value, disabled, onChange }) => (
  <div className="relative group">
    <select
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value as Priority)}
      className={`w-full cursor-pointer appearance-none rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium outline-none transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/5 ${PRIORITY_COLORS[value]}`}
    >
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
      <option value="urgent">Urgent</option>
    </select>
    <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
  </div>
);

const StatusSelect: React.FC<{
  value: Status;
  disabled?: boolean;
  onChange: (value: Status) => void;
}> = ({ value, disabled, onChange }) => (
  <div className="relative group">
    <select
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value as Status)}
      className="w-full cursor-pointer appearance-none rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium outline-none transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/5"
    >
      {Object.entries(STATUS_LABELS).map(([status, label]) => (
        <option key={status} value={status}>
          {label}
        </option>
      ))}
    </select>
    <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
  </div>
);

const renderRichText = (value: string | undefined, fallback: string) => {
  if (!value?.trim()) {
    return <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">{fallback}</p>;
  }

  return (
    <div
      className="text-base leading-relaxed text-gray-700 dark:text-gray-300 [&_a]:text-primary [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 dark:[&_code]:bg-white/10"
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );
};

const normalizeDateForInput = (value?: string) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const normalizeTimeForInput = (value?: string) => {
  if (!value) return '';
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(11, 16);
};

export const IssueDetailPage: React.FC = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const { showToast, setSelectedIssueId } = useApp();
  const currentUser = useAuthStore((state) => state.currentUser);
  const role = useAuthStore((state) => state.workspace?.role);

  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [isAttachmentComposerOpen, setIsAttachmentComposerOpen] = useState(false);
  const [newAttachments, setNewAttachments] = useState<IssueAttachment[]>([]);

  const issueQuery = useIssueDetail(issueId);
  const issue = issueQuery.data;
  const errorCode = getApiErrorCode(issueQuery.error);
  const issueResourceId = issue?.entityId ?? issueId;
  const assigneeOptionsQuery = useWorkspaceMemberOptions(
    {
      sort: 'name:asc',
      limit: 100,
    },
    { enabled: Boolean(issueId) }
  );
  const updateIssue = useUpdateIssue(issueResourceId);
  const updateIssueStatus = useUpdateIssueStatus(issueResourceId);
  const deleteIssue = useDeleteIssue(issueResourceId);
  const addIssueAttachments = useAddIssueAttachments(issueResourceId);
  const removeIssueAttachment = useRemoveIssueAttachment(issueResourceId);
  const openViewUploadUrl = useOpenViewUploadUrl();

  useEffect(() => {
    setSelectedIssueId(null);
  }, [setSelectedIssueId]);

  useEffect(() => {
    setNewAttachments([]);
    setIsAttachmentComposerOpen(false);
  }, [issue?.id]);

  const displayIssueId = issue?.id || issueId || '';
  const canDelete = canDeleteIssues(role);
  const assigneeOptions = useMemo(() => {
    const items = assigneeOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
    if (!issue?.assignee) return items;
    if (items.some((item) => item.id === issue.assignee?.id)) return items;

    return [
      {
        id: issue.assignee.id,
        name: issue.assignee.name,
        email: issue.assignee.email,
        role: 'MEMBER',
      },
      ...items,
    ];
  }, [assigneeOptionsQuery.data, issue?.assignee]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Issue link copied.', 'success');
    } catch {
      showToast('Could not copy the issue link.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    const confirmed = window.confirm('Delete this issue permanently?');
    if (!confirmed) return;

    try {
      await deleteIssue.mutateAsync();
      showToast('Issue deleted.', 'success');
      navigate('/issues');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to delete issue.', 'error');
    }
  };

  const handleStatusChange = async (nextStatus: Status) => {
    try {
      await updateIssueStatus.mutateAsync(nextStatus);
      showToast(`Status updated to ${STATUS_LABELS[nextStatus]}.`, 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update status.', 'error');
    }
  };

  const handlePriorityChange = async (nextPriority: Priority) => {
    try {
      await updateIssue.mutateAsync({ priority: nextPriority });
      showToast('Priority updated.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update priority.', 'error');
    }
  };

  const handleAssigneeChange = async (nextAssigneeId: string) => {
    try {
      await updateIssue.mutateAsync({ assigneeId: nextAssigneeId || null });
      showToast(nextAssigneeId ? 'Assignee updated.' : 'Issue unassigned.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update assignee.', 'error');
    }
  };

  const handleDueDateChange = async (nextDueDate: string) => {
    try {
      await updateIssue.mutateAsync({ dueDate: nextDueDate || null });
      showToast(nextDueDate ? 'Due date updated.' : 'Due date cleared.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update due date.', 'error');
    }
  };

  const handleDueTimeChange = async (nextDueTime: string) => {
    try {
      await updateIssue.mutateAsync({ dueTime: nextDueTime || null });
      showToast(nextDueTime ? 'Due time updated.' : 'Due time cleared.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update due time.', 'error');
    }
  };

  const handleAddAttachments = async () => {
    if (!issue || newAttachments.length === 0) {
      setIsAttachmentComposerOpen(false);
      return;
    }

    try {
      await addIssueAttachments.mutateAsync({
        attachments: newAttachments.map((attachment) => ({
          fileName: attachment.fileName,
          contentType: attachment.contentType,
          size: attachment.size,
          kind: attachment.kind,
          key: attachment.key,
          assetUrl: attachment.assetUrl ?? null,
          reference: attachment.reference,
        })),
      });
      setNewAttachments([]);
      setIsAttachmentComposerOpen(false);
      showToast('Attachments added.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to add attachments.', 'error');
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await removeIssueAttachment.mutateAsync(attachmentId);
      showToast('Attachment removed.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to remove attachment.', 'error');
    }
  };

  const handleOpenAttachment = async (attachment: IssueAttachment) => {
    const key = attachment.key.trim();

    if (!key) {
      if (attachment.assetUrl) {
        window.open(attachment.assetUrl, '_blank', 'noopener,noreferrer');
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

  if (issueQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Loading issue...
      </div>
    );
  }

  if (!issue || errorCode === 'ISSUE_NOT_FOUND') {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <h1 className="text-xl font-bold">Issue not found</h1>
        <button onClick={() => navigate(-1)} className="mt-4 flex items-center gap-2 font-medium text-primary hover:underline">
          <ChevronLeft size={16} />
          Go back
        </button>
      </div>
    );
  }

  if (issueQuery.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <AlertCircle size={26} className="text-red-500" />
        <div className="space-y-1">
          <h1 className="text-lg font-bold">Failed to load issue</h1>
          <p className="text-sm text-gray-400">The issue detail request did not complete.</p>
        </div>
        <button
          type="button"
          onClick={() => issueQuery.refetch()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col overflow-hidden bg-white dark:bg-bg-dark"
    >
      <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur-md dark:border-border-dark dark:bg-bg-dark/80">
        <div className="flex min-w-0 items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex min-w-0 items-center gap-2 truncate text-xs font-medium text-gray-400">
            <span className="truncate">{issue.project?.name || 'No Project'}</span>
            <span className="shrink-0">/</span>
            <span className="shrink-0 font-mono">{displayIssueId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
            title="Copy issue link"
          >
            <Copy size={18} />
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
            title="Share issue"
          >
            <Share2 size={18} />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
              title="Delete issue"
            >
              {deleteIssue.isPending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
          )}
          {!canDelete && (
            <button
              type="button"
              className="rounded-md p-1.5 text-gray-300 dark:text-gray-600"
              title="Delete is restricted to admins and owners"
              disabled
            >
              <MoreHorizontal size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-hide">
          <div className="mx-auto max-w-3xl space-y-10">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <TypeBadge type={issue.type || 'task'} />
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400">
                  <span>Created by</span>
                  <div className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
                    {issue.creator?.avatar ? (
                      <img src={issue.creator.avatar} className="h-4 w-4 rounded-full" alt={issue.creator.name} />
                    ) : issue.creator?.name ? (
                      <AvatarFallback name={issue.creator.name} className="h-4 w-4" />
                    ) : null}
                    <span>{issue.creator?.name || 'Unknown'}</span>
                  </div>
                  <span>•</span>
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{issue.title}</h1>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Description</h3>
              <div className="rounded-xl p-4 -mx-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                {renderRichText(issue.description, 'No description provided.')}
              </div>
            </div>

            {issue.type === 'bug' && (
              <div className="space-y-8 border-t border-gray-100 pt-8 dark:border-border-dark">
                {issue.stepsToReproduce && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Steps to Reproduce</h4>
                    <div className="rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-600 dark:bg-white/5 dark:text-gray-400">
                      <p className="whitespace-pre-wrap">{issue.stepsToReproduce}</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {issue.expectedBehavior && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Expected Behavior</h4>
                      <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        <p className="whitespace-pre-wrap">{issue.expectedBehavior}</p>
                      </div>
                    </div>
                  )}
                  {issue.actualBehavior && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Actual Behavior</h4>
                      <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        <p className="whitespace-pre-wrap">{issue.actualBehavior}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {issue.type === 'issue' && issue.acceptanceCriteria && (
              <div className="space-y-4 border-t border-gray-100 pt-8 dark:border-border-dark">
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Acceptance Criteria</h4>
                <div className="rounded-xl border border-primary/10 bg-primary/[0.04] p-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  <p className="whitespace-pre-wrap">{issue.acceptanceCriteria}</p>
                </div>
              </div>
            )}

            <div className="space-y-4 border-t border-gray-100 pt-8 dark:border-border-dark">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
                    <Paperclip size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Attachments</h3>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {issue.attachments.length > 0 ? `${issue.attachments.length} attached` : 'No files attached'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAttachmentComposerOpen((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-white/10 dark:hover:bg-white/[0.05]"
                >
                  <Plus size={14} />
                  Add files
                </button>
              </div>

              {isAttachmentComposerOpen && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
                  <IssueAttachmentsField value={newAttachments} onChange={setNewAttachments} />
                  <div className="mt-4 flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-border-dark">
                    <button
                      type="button"
                      onClick={() => {
                        setNewAttachments([]);
                        setIsAttachmentComposerOpen(false);
                      }}
                      className="px-3 py-2 text-sm font-medium text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddAttachments}
                      disabled={addIssueAttachments.isPending || newAttachments.length === 0}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {addIssueAttachments.isPending && <Loader2 size={15} className="animate-spin" />}
                      Save attachments
                    </button>
                  </div>
                </div>
              )}

              {issue.attachments.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {issue.attachments.map((attachment) => {
                    return (
                      <div
                        key={attachment.id}
                        className="rounded-xl border border-gray-200 bg-white p-3 dark:border-border-dark dark:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                            <AttachmentMediaPreview
                              contentType={attachment.contentType}
                              fileName={attachment.fileName}
                              attachmentKey={attachment.key}
                              assetUrl={attachment.assetUrl}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {attachment.fileName}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                              <span>{(attachment.size / (1024 * 1024)).toFixed(attachment.size >= 1024 * 1024 ? 1 : 2)} MB</span>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:bg-white/[0.06]">
                                {attachment.contentType.startsWith('video/') ? 'Video' : 'Image'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => void handleOpenAttachment(attachment)}
                              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                              title="Open attachment"
                            >
                              <ExternalLink size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(attachment.id)}
                              disabled={removeIssueAttachment.isPending}
                              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-8 dark:border-border-dark">
              <SubtaskList issue={issue} />
            </div>

            <div className="space-y-6 pt-10">
              <div className="flex gap-8 border-b border-gray-100 dark:border-border-dark">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`relative pb-4 text-sm font-bold transition-all ${activeTab === 'comments' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Discussion
                  {activeTab === 'comments' && <motion.div layoutId="activeTabDetail" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`relative pb-4 text-sm font-bold transition-all ${activeTab === 'activity' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Activity
                  {activeTab === 'activity' && <motion.div layoutId="activeTabDetail" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {activeTab === 'comments' ? (
                    <IssueCommentsThread issueId={issueResourceId} />
                  ) : (
                    <IssueActivityTimeline issueId={issueResourceId} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <aside className="hidden w-[320px] shrink-0 border-l border-gray-200 bg-gray-50/70 p-6 dark:border-border-dark dark:bg-black/20 xl:block">
          <div className="space-y-6">
            <div className="grid grid-cols-[110px_1fr] gap-y-5 text-sm">
              <FieldLabel icon={<CheckCircle2 size={14} />}>Status</FieldLabel>
              <StatusSelect
                value={issue.status}
                disabled={updateIssueStatus.isPending}
                onChange={handleStatusChange}
              />

              <FieldLabel icon={<AlertCircle size={14} />}>Priority</FieldLabel>
              <PrioritySelect
                value={issue.priority}
                disabled={updateIssue.isPending}
                onChange={handlePriorityChange}
              />

              <FieldLabel icon={<User size={14} />}>Assignee</FieldLabel>
              <div className="relative group">
                <select
                  disabled={updateIssue.isPending}
                  value={issue.assigneeId || ''}
                  onChange={(event) => handleAssigneeChange(event.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium outline-none transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/5"
                >
                  <option value="">Unassigned</option>
                  {assigneeOptions.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              <FieldLabel icon={<Calendar size={14} />}>Due Date</FieldLabel>
              <input
                type="date"
                value={normalizeDateForInput(issue.dueDate)}
                onChange={(event) => handleDueDateChange(event.target.value)}
                className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium outline-none transition-all hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/20 [color-scheme:light] dark:hover:bg-white/5 dark:focus:bg-white/5 dark:[color-scheme:dark]"
              />

              <FieldLabel icon={<Clock3 size={14} />}>Due Time</FieldLabel>
              <input
                type="time"
                value={normalizeTimeForInput(issue.dueTime)}
                onChange={(event) => handleDueTimeChange(event.target.value)}
                className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium outline-none transition-all hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/20 [color-scheme:light] dark:hover:bg-white/5 dark:focus:bg-white/5 dark:[color-scheme:dark]"
              />

              <FieldLabel icon={<Paperclip size={14} />}>Files</FieldLabel>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {issue.attachments.length} attached
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Project scope</h3>
              <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <span className="font-semibold text-gray-500 dark:text-gray-300">Project:</span>{' '}
                  {issue.project?.name || 'No project'}
                </p>
                <p>
                  <span className="font-semibold text-gray-500 dark:text-gray-300">Team:</span>{' '}
                  {issue.team?.name || 'No team'}
                </p>
                <p>
                  <span className="font-semibold text-gray-500 dark:text-gray-300">Department:</span>{' '}
                  {issue.department?.name || 'No department'}
                </p>
              </div>
            </div>

            {issue.labels.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Labels</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {issue.labels.map((label) => (
                    <span key={label} className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500 dark:bg-white/[0.06] dark:text-gray-300">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </motion.div>
  );
};
