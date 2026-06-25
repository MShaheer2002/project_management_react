import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { AiMarkdown } from '@features/ai/components/AiMarkdown';
import {
  AlertCircle,
  Bug,
  Calendar,
  Clock3,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ExternalLink,
  History,
  Maximize2,
  MoreHorizontal,
  Paperclip,
  Trash2,
  User,
  X,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '@/AppContext';
import { ISSUE_TYPE_CONFIG, PRIORITY_COLORS, STATUS_LABELS } from '@/constants';
import { canDeleteIssues } from '@shared/permissions';
import { getApiErrorCode, getApiErrorMessage } from '@shared/services';
import { useOpenViewUploadUrl } from '@features/upload';
import { AttachmentMediaPreview } from '@features/upload';
import { useWorkspaceMemberOptions } from '@features/workspace';
import { useIssueSocketRoom } from '@features/notifications';
import {
  IssueActivityTimeline,
  IssueCommentsThread,
  IssueLabelsEditor,
  SubtaskList,
  useDeleteIssue,
  useIssueDetail,
  useUpdateIssue,
  useUpdateIssueStatus,
} from '@features/issues';
import type { IssueType, Priority, Status } from '@/types';

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

const AvatarFallback: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
    <span className="text-xs font-bold">{name.charAt(0).toUpperCase()}</span>
  </div>
);

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

export const ContextPanel: React.FC = () => {
  const { selectedIssueId, setSelectedIssueId, showToast } = useApp();
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.workspace?.role);
  const canDelete = canDeleteIssues(role);

  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  useIssueSocketRoom(selectedIssueId || undefined);

  const issueQuery = useIssueDetail(selectedIssueId || undefined);
  const issue = issueQuery.data;
  const errorCode = getApiErrorCode(issueQuery.error);
  const issueResourceId = issue?.entityId ?? selectedIssueId ?? undefined;
  const assigneeOptionsQuery = useWorkspaceMemberOptions(
    {
      sort: 'name:asc',
      limit: 100,
    },
    { enabled: Boolean(selectedIssueId) }
  );
  const updateIssue = useUpdateIssue(issueResourceId);
  const updateIssueStatus = useUpdateIssueStatus(issueResourceId);
  const deleteIssue = useDeleteIssue(issueResourceId);
  const openViewUploadUrl = useOpenViewUploadUrl();

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

  if (!selectedIssueId) return null;

  const handleDelete = async () => {
    if (!canDelete || !selectedIssueId) return;
    const confirmed = window.confirm('Delete this issue permanently?');
    if (!confirmed) return;

    try {
      await deleteIssue.mutateAsync();
      showToast('Issue deleted.', 'success');
      setSelectedIssueId(null);
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to delete issue.', 'error');
    }
  };

  const handleOpenAttachment = async (attachment: { key: string; assetUrl?: string | null }) => {
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

  const handleStatusChange = async (status: Status) => {
    try {
      await updateIssueStatus.mutateAsync(status);
      showToast(`Status updated to ${STATUS_LABELS[status]}.`, 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update status.', 'error');
    }
  };

  const handlePriorityChange = async (priority: Priority) => {
    try {
      await updateIssue.mutateAsync({ priority });
      showToast('Priority updated.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update priority.', 'error');
    }
  };

  const handleAssigneeChange = async (assigneeId: string) => {
    try {
      await updateIssue.mutateAsync({ assigneeId: assigneeId || null });
      showToast(assigneeId ? 'Assignee updated.' : 'Issue unassigned.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update assignee.', 'error');
    }
  };

  const handleDueDateChange = async (dueDate: string) => {
    try {
      await updateIssue.mutateAsync({ dueDate: dueDate || null });
      showToast(dueDate ? 'Due date updated.' : 'Due date cleared.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update due date.', 'error');
    }
  };

  const handleDueTimeChange = async (dueTime: string) => {
    try {
      await updateIssue.mutateAsync({ dueTime: dueTime || null });
      showToast(dueTime ? 'Due time updated.' : 'Due time cleared.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update due time.', 'error');
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 z-40 flex h-full w-[450px] flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-border-dark dark:bg-sidebar-dark"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-border-dark">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <span>{issue?.id || selectedIssueId}</span>
          </div>
          <div className="h-4 w-px bg-gray-200 dark:bg-border-dark" />
          <button
            onClick={() => {
              navigate(`/issues/${issue?.entityId || selectedIssueId}`);
              setSelectedIssueId(null);
            }}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-primary"
          >
            <Maximize2 size={12} />
            Open Full Page
          </button>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && (
            <button
              onClick={handleDelete}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
              title="Delete issue"
            >
              {deleteIssue.isPending ? <History size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
          )}
          <button className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5">
            <MoreHorizontal size={18} />
          </button>
          <button
            onClick={() => setSelectedIssueId(null)}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {issueQuery.isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading issue...</div>
        ) : issueQuery.isError || !issue || errorCode === 'ISSUE_NOT_FOUND' ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <AlertCircle size={24} className="text-red-500" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold">Issue unavailable</h2>
              <p className="text-sm text-gray-400">This issue could not be loaded from the server.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TypeBadge type={issue.type || 'task'} />
              </div>
              <h2 className="pr-8 text-xl font-semibold leading-tight">{issue.title}</h2>
              <div className="rounded-lg p-2 text-sm leading-relaxed text-text-secondary-light transition-all hover:bg-gray-50 dark:text-text-secondary-dark dark:hover:bg-white/5">
                {issue.description ? (
                  /<[^>]+>/.test(issue.description.trim()) ? (
                    <div
                      className="[&_a]:text-primary [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 dark:[&_code]:bg-white/10"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(issue.description) }}
                    />
                  ) : (
                    <AiMarkdown content={issue.description} className="text-sm leading-relaxed" />
                  )
                ) : (
                  'No description provided.'
                )}
              </div>

              {issue.type === 'bug' && (
                <div className="space-y-4 border-t border-gray-100 pt-4 dark:border-border-dark">
                  {issue.stepsToReproduce && (
                    <div>
                      <h4 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Steps to Reproduce</h4>
                      <p className="whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400">{issue.stepsToReproduce}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {issue.expectedBehavior && (
                      <div>
                        <h4 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Expected</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{issue.expectedBehavior}</p>
                      </div>
                    )}
                    {issue.actualBehavior && (
                      <div>
                        <h4 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Actual</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{issue.actualBehavior}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {issue.type === 'issue' && issue.acceptanceCriteria && (
                <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-border-dark">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Acceptance Criteria</h4>
                  <p className="whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400">{issue.acceptanceCriteria}</p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 dark:border-border-dark">
                <SubtaskList issue={issue} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-6 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <CheckCircle2 size={14} />
                Status
              </div>
              <div className="relative group">
                <select
                  value={issue.status}
                  onChange={(event) => handleStatusChange(event.target.value as Status)}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium outline-none transition-all hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  {Object.entries(STATUS_LABELS).map(([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <AlertCircle size={14} />
                Priority
              </div>
              <div className="relative group">
                <select
                  value={issue.priority}
                  onChange={(event) => handlePriorityChange(event.target.value as Priority)}
                  className={`w-full cursor-pointer appearance-none rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium outline-none transition-all hover:bg-gray-100 dark:hover:bg-white/5 ${PRIORITY_COLORS[issue.priority]}`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <User size={14} />
                Assignee
              </div>
              <div className="relative group">
                <select
                  value={issue.assigneeId || ''}
                  onChange={(event) => handleAssigneeChange(event.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium outline-none transition-all hover:bg-gray-100 dark:hover:bg-white/5"
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

              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={14} />
                Due Date
              </div>
              <input
                type="date"
                value={normalizeDateForInput(issue.dueDate)}
                onChange={(event) => handleDueDateChange(event.target.value)}
                className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium outline-none transition-all hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/20 [color-scheme:light] dark:hover:bg-white/5 dark:focus:bg-white/5 dark:[color-scheme:dark]"
              />

              <div className="flex items-center gap-2 text-gray-400">
                <Clock3 size={14} />
                Due Time
              </div>
              <input
                type="time"
                value={normalizeTimeForInput(issue.dueTime)}
                onChange={(event) => handleDueTimeChange(event.target.value)}
                className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium outline-none transition-all hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/20 [color-scheme:light] dark:hover:bg-white/5 dark:focus:bg-white/5 dark:[color-scheme:dark]"
              />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Project scope</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
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

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Labels</h3>
              <IssueLabelsEditor
                issueId={issueResourceId}
                selectedLabels={
                  issue.labelObjects?.length
                    ? issue.labelObjects
                    : issue.labels.map((label, index) => ({
                        id: `${label}-${index}`,
                        name: label,
                        color: '#64748b',
                      }))
                }
              />
            </div>

            {issue.assignee && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Assigned to</h3>
                <div className="flex items-center gap-3">
                  {issue.assignee.avatar ? (
                    <img src={issue.assignee.avatar} className="h-8 w-8 rounded-full" alt={issue.assignee.name} />
                  ) : (
                    <AvatarFallback name={issue.assignee.name} />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{issue.assignee.name}</p>
                    <p className="truncate text-xs text-gray-400">{issue.assignee.email}</p>
                  </div>
                </div>
              </div>
            )}

            {issue.attachments.length > 0 && (
              <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <Paperclip size={12} />
                  Attachments
                </div>
                {issue.attachments.map((attachment) => {
                  return (
                    <div key={attachment.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-border-dark">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-white/[0.05]">
                        <AttachmentMediaPreview
                          contentType={attachment.contentType}
                          fileName={attachment.fileName}
                          attachmentKey={attachment.key}
                          assetUrl={attachment.assetUrl}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{attachment.fileName}</p>
                        <p className="text-[11px] text-gray-400">
                          {attachment.contentType.startsWith('video/') ? 'Video' : 'Image'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleOpenAttachment(attachment)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                        title="Open attachment"
                      >
                          <ExternalLink size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2">
              <div className="mb-4 flex gap-6 border-b border-gray-200 dark:border-border-dark">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`relative pb-2 text-sm font-medium transition-all ${activeTab === 'comments' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Comments
                  {activeTab === 'comments' && <motion.div layoutId="contextPanelTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`relative pb-2 text-sm font-medium transition-all ${activeTab === 'activity' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Activity
                  {activeTab === 'activity' && <motion.div layoutId="contextPanelTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {activeTab === 'comments' ? (
                    <IssueCommentsThread issueId={issueResourceId} compact />
                  ) : (
                    <IssueActivityTimeline issueId={issueResourceId} compact />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
