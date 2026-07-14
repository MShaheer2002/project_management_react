import React, { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  Bug,
  Calendar,
  CalendarRange,
  Clock3,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  Copy,
  ExternalLink,
  Loader2,
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
import { normalizeRichTextValue, RichTextEditor } from '@/components/RichTextEditor';
import { PRIORITY_COLORS, ISSUE_TYPE_CONFIG } from '@/constants';
import { getStatusLabel } from '@shared/constants/statuses';
import { useWorkspaceStatuses } from '@shared/hooks/useWorkspaceStatuses';
import { canDeleteIssues } from '@shared/permissions';
import { getApiErrorCode, getApiErrorMessage } from '@shared/services';
import { normalizeDateForInput, normalizeTimeForInput } from '@shared/utils/date';
import { useOpenViewUploadUrl } from '@features/upload';
import { AttachmentMediaPreview } from '@features/upload';
import { useWorkspaceMemberOptions } from '@features/workspace';
import { useIssueSocketRoom } from '@features/notifications';
import { useAssignIssueToCycle, useCycles, useUnassignIssueFromCycle } from '@features/cycles';
import {
  IssueAttachmentsField,
  IssueActivityTimeline,
  IssueSystemParametersPanel,
  IssueCommentsThread,
  IssueLabelsEditor,
  IssueRelationsSection,
  IssueSystemContextSection,
  SubtaskList,
  useAddIssueDependency,
  useAddIssueAttachments,
  useAddIssueWatchers,
  useDeleteIssue,
  useIssueDetail,
  useProjectAssignmentGuard,
  useRemoveIssueDependency,
  useRemoveIssueAttachment,
  useRemoveIssueWatcher,
  useUpdateIssue,
  useUpdateIssueIntegrationRefs,
  useUpdateIssueStatus,
} from '@features/issues';
import { IssueGitHubActivity, IssueFigmaDesigns } from '@features/integrations';
import type { IssueAttachment, IssueDependency, IssueIntegrationRef, IssueType, Priority, Status } from '@/types';

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

const ISSUE_LONGFORM_CARD =
  'rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-border-dark dark:bg-white/[0.03]';

const ISSUE_LONGFORM_RICH_TEXT =
  'text-[15px] leading-8 text-gray-700 dark:text-gray-300 [&_h1]:mb-5 [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h2]:mb-4 [&_h2]:text-[2rem] [&_h2]:font-bold [&_h2]:tracking-tight [&_h3]:mb-3 [&_h3]:text-[1.6rem] [&_h3]:font-semibold [&_p]:my-0 [&_p+p]:mt-5 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-8 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-8 [&_li]:my-2 [&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 dark:[&_code]:bg-white/10 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-black/5 [&_pre]:p-4 dark:[&_pre]:bg-black/20 [&_strong]:font-semibold [&_a]:text-primary';

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
}> = ({ value, disabled, onChange }) => {
  const workspaceStatuses = useWorkspaceStatuses();
  return (
    <div className="relative group">
      <select
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value as Status)}
        className="w-full cursor-pointer appearance-none rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium outline-none transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/5"
      >
        {workspaceStatuses.map((ws) => (
          <option key={ws.key} value={ws.key}>
            {ws.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
};

const renderRichText = (value: string | undefined, fallback: string) => {
  if (!value?.trim()) {
    return <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">{fallback}</p>;
  }

  const normalized = normalizeRichTextValue(value);

  return (
    <div
      className={`rich-text-content ${ISSUE_LONGFORM_RICH_TEXT}`}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(normalized) }}
    />
  );
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingSteps, setIsEditingSteps] = useState(false);
  const [isEditingExpected, setIsEditingExpected] = useState(false);
  const [isEditingActual, setIsEditingActual] = useState(false);
  const [isEditingAcceptance, setIsEditingAcceptance] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [stepsDraft, setStepsDraft] = useState('');
  const [expectedDraft, setExpectedDraft] = useState('');
  const [actualDraft, setActualDraft] = useState('');
  const [acceptanceDraft, setAcceptanceDraft] = useState('');
  const [systemParentIssueId, setSystemParentIssueId] = useState('');
  const [systemDependencies, setSystemDependencies] = useState<IssueDependency[]>([]);
  const [systemWatcherIds, setSystemWatcherIds] = useState<string[]>([]);
  const [systemIntegrationRefs, setSystemIntegrationRefs] = useState<IssueIntegrationRef[]>([]);
  const descriptionEditorRef = useRef<HTMLDivElement | null>(null);
  const stepsEditorRef = useRef<HTMLDivElement | null>(null);
  const expectedEditorRef = useRef<HTMLDivElement | null>(null);
  const actualEditorRef = useRef<HTMLDivElement | null>(null);
  const acceptanceEditorRef = useRef<HTMLDivElement | null>(null);
  const { dialog: projectAssignmentDialog, handleAssignmentError } = useProjectAssignmentGuard();
  useIssueSocketRoom(issueId);

  const issueQuery = useIssueDetail(issueId);
  const issue = issueQuery.data;
  const errorCode = getApiErrorCode(issueQuery.error);
  const issueResourceId = issue?.entityId ?? issueId ?? '';
  const assigneeOptionsQuery = useWorkspaceMemberOptions(
    {
      sort: 'name:asc',
      limit: 100,
    },
    { enabled: Boolean(issueId) }
  );
  const updateIssue = useUpdateIssue(issueResourceId);
  const updateIssueStatus = useUpdateIssueStatus(issueResourceId);
  const updateIssueIntegrationRefs = useUpdateIssueIntegrationRefs(issueResourceId);
  const deleteIssue = useDeleteIssue(issueResourceId);
  const assignIssueToCycle = useAssignIssueToCycle(issueResourceId);
  const addIssueDependency = useAddIssueDependency(issueResourceId);
  const addIssueAttachments = useAddIssueAttachments(issueResourceId);
  const addIssueWatchers = useAddIssueWatchers(issueResourceId);
  const removeIssueDependency = useRemoveIssueDependency(issueResourceId);
  const removeIssueAttachment = useRemoveIssueAttachment(issueResourceId);
  const removeIssueWatcher = useRemoveIssueWatcher(issueResourceId);
  const unassignIssueFromCycle = useUnassignIssueFromCycle(issueResourceId);
  const openViewUploadUrl = useOpenViewUploadUrl();
  const cyclesQuery = useCycles(
    {
      teamId: issue?.teamId,
      sort: 'startsAt:desc',
      limit: 50,
    },
    { enabled: Boolean(issue?.teamId) }
  );

  useEffect(() => {
    setSelectedIssueId(null);
  }, [setSelectedIssueId]);

  useEffect(() => {
    setNewAttachments([]);
    setIsAttachmentComposerOpen(false);
  }, [issue?.id]);

  useEffect(() => {
    setTitleDraft(issue?.title ?? '');
    setDescriptionDraft(issue?.description ?? '');
    setStepsDraft(issue?.stepsToReproduce ?? '');
    setExpectedDraft(issue?.expectedBehavior ?? '');
    setActualDraft(issue?.actualBehavior ?? '');
    setAcceptanceDraft(issue?.acceptanceCriteria ?? '');
    setSystemParentIssueId(issue?.parent?.id ?? '');
    setSystemDependencies((issue?.dependencies ?? []).map((dependency) => ({ issueId: dependency.issueId, relation: dependency.relation })));
    setSystemWatcherIds((issue?.watchers ?? []).map((watcher) => watcher.id));
    setSystemIntegrationRefs(issue?.integrationRefs ?? []);
    setIsEditingTitle(false);
    setIsEditingDescription(false);
    setIsEditingSteps(false);
    setIsEditingExpected(false);
    setIsEditingActual(false);
    setIsEditingAcceptance(false);
  }, [
    issue?.acceptanceCriteria,
    issue?.actualBehavior,
    issue?.description,
    issue?.expectedBehavior,
    issue?.id,
    issue?.integrationRefs,
    issue?.parent?.id,
    issue?.stepsToReproduce,
    issue?.title,
    issue?.watchers,
  ]);

  const displayIssueId = issue?.id || (/^[A-Z]+-\d+$/i.test(issueId ?? '') ? issueId ?? '' : '');
  const canDelete = canDeleteIssues(role);
  const availableCycles = useMemo(
    () => (cyclesQuery.data?.pages.flatMap((page) => page.items) ?? []).filter((cycle) => cycle.status !== 'COMPLETED'),
    [cyclesQuery.data]
  );
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

  const workspaceStatuses = useWorkspaceStatuses();

  const handleStatusChange = async (nextStatus: Status) => {
    try {
      await updateIssueStatus.mutateAsync(nextStatus);
      showToast(`Status updated to ${getStatusLabel(workspaceStatuses, nextStatus)}.`, 'success');
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
      const nextAssignee = assigneeOptions.find((member) => member.id === nextAssigneeId);
      const didHandleProjectMembership = nextAssigneeId
        && issue.projectId
        && handleAssignmentError(error, {
          assigneeId: nextAssigneeId,
          assigneeName: nextAssignee?.name ?? 'Selected member',
          projectId: issue.projectId,
          projectName: issue.project?.name ?? 'this project',
          retry: async () => {
            await updateIssue.mutateAsync({ assigneeId: nextAssigneeId });
            showToast('Assignee updated.', 'success');
          },
        });

      if (didHandleProjectMembership) {
        return;
      }

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

  const handleTypeChange = async (nextType: IssueType) => {
    try {
      await updateIssue.mutateAsync({ type: nextType });
      showToast('Type updated.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update type.', 'error');
    }
  };

  const handleCycleChange = async (nextCycleId: string) => {
    try {
      if (!nextCycleId) {
        await unassignIssueFromCycle.mutateAsync();
        showToast('Issue moved back to backlog.', 'success');
        return;
      }
      await assignIssueToCycle.mutateAsync(nextCycleId);
      showToast('Cycle updated.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update cycle.', 'error');
    }
  };

  const handleTitleSave = async () => {
    const nextTitle = titleDraft.trim();
    if (!nextTitle) {
      showToast('Issue title cannot be empty.', 'error');
      setTitleDraft(issue.title);
      setIsEditingTitle(false);
      return;
    }

    if (nextTitle === issue.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      await updateIssue.mutateAsync({ title: nextTitle });
      setIsEditingTitle(false);
      showToast('Title updated.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update title.', 'error');
    }
  };

  const handleDescriptionSave = async () => {
    const normalizedCurrent = (issue.description ?? '').trim();
    const normalizedNext = descriptionDraft.trim();

    if (normalizedCurrent === normalizedNext) {
      setIsEditingDescription(false);
      return;
    }

    try {
      await updateIssue.mutateAsync({ description: normalizedNext ? descriptionDraft : null });
      setIsEditingDescription(false);
      showToast(normalizedNext ? 'Description updated.' : 'Description cleared.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to update description.', 'error');
    }
  };

  const handleTextFieldSave = async (
    field: 'stepsToReproduce' | 'expectedBehavior' | 'actualBehavior' | 'acceptanceCriteria',
    nextValue: string,
    currentValue: string | null | undefined,
    stopEditing: () => void,
    label: string
  ) => {
    const normalizedCurrent = (currentValue ?? '').trim();
    const normalizedNext = nextValue.trim();

    if (normalizedCurrent === normalizedNext) {
      stopEditing();
      return;
    }

    try {
      await updateIssue.mutateAsync({ [field]: normalizedNext ? nextValue : null });
      stopEditing();
      showToast(`${label} updated.`, 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || `Failed to update ${label.toLowerCase()}.`, 'error');
    }
  };

  const handleParentIssueChange = async (nextParentIssueId: string) => {
    const normalizedNext = nextParentIssueId || '';
    if (normalizedNext === systemParentIssueId) {
      return;
    }

    const previousParentIssueId = systemParentIssueId;
    setSystemParentIssueId(normalizedNext);

    try {
      await updateIssue.mutateAsync({ parentIssueId: normalizedNext || null });
      showToast(normalizedNext ? 'Parent issue updated.' : 'Parent issue cleared.', 'success');
    } catch (error) {
      setSystemParentIssueId(previousParentIssueId);
      showToast(getApiErrorMessage(error) || 'Failed to update parent issue.', 'error');
    }
  };

  const handleDependenciesChange = async (nextDependencies: IssueDependency[]) => {
    const previousDependencies = systemDependencies;
    setSystemDependencies(nextDependencies);

    const previousMap = new Map(previousDependencies.map((dependency) => [dependency.issueId, dependency.relation]));
    const nextMap = new Map(nextDependencies.map((dependency) => [dependency.issueId, dependency.relation]));
    const removed = previousDependencies.filter((dependency) => !nextMap.has(dependency.issueId));
    const added = nextDependencies.filter((dependency) => !previousMap.has(dependency.issueId));
    const changed = nextDependencies.filter((dependency) => {
      const previousRelation = previousMap.get(dependency.issueId);
      return previousRelation && previousRelation !== dependency.relation;
    });

    try {
      for (const dependency of removed) {
        await removeIssueDependency.mutateAsync(dependency.issueId);
      }

      for (const dependency of changed) {
        await removeIssueDependency.mutateAsync(dependency.issueId);
        await addIssueDependency.mutateAsync({ issueId: dependency.issueId, relation: dependency.relation });
      }

      for (const dependency of added) {
        await addIssueDependency.mutateAsync({ issueId: dependency.issueId, relation: dependency.relation });
      }

      showToast('Dependencies updated.', 'success');
    } catch (error) {
      setSystemDependencies(previousDependencies);
      showToast(getApiErrorMessage(error) || 'Failed to update dependencies.', 'error');
    }
  };

  const handleWatcherIdsChange = async (nextWatcherIds: string[]) => {
    const previousWatcherIds = systemWatcherIds;
    setSystemWatcherIds(nextWatcherIds);

    const previousSet = new Set(previousWatcherIds);
    const nextSet = new Set(nextWatcherIds);
    const addedUserIds = nextWatcherIds.filter((watcherId) => !previousSet.has(watcherId));
    const removedUserIds = previousWatcherIds.filter((watcherId) => !nextSet.has(watcherId));

    try {
      if (addedUserIds.length > 0) {
        await addIssueWatchers.mutateAsync({ userIds: addedUserIds });
      }

      for (const watcherId of removedUserIds) {
        await removeIssueWatcher.mutateAsync(watcherId);
      }

      showToast('Watchers updated.', 'success');
    } catch (error) {
      setSystemWatcherIds(previousWatcherIds);
      showToast(getApiErrorMessage(error) || 'Failed to update watchers.', 'error');
    }
  };

  const handleIntegrationRefsChange = async (nextIntegrationRefs: IssueIntegrationRef[]) => {
    const previousIntegrationRefs = systemIntegrationRefs;
    setSystemIntegrationRefs(nextIntegrationRefs);

    try {
      await updateIssueIntegrationRefs.mutateAsync({ integrationRefs: nextIntegrationRefs });
      showToast('Integration references updated.', 'success');
    } catch (error) {
      setSystemIntegrationRefs(previousIntegrationRefs);
      showToast(getApiErrorMessage(error) || 'Failed to update integration references.', 'error');
    }
  };

  useEffect(() => {
    if (!isEditingDescription) return undefined;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (descriptionEditorRef.current?.contains(target)) return;
      void handleDescriptionSave();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDescriptionDraft(issue.description ?? '');
        setIsEditingDescription(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDescriptionSave, isEditingDescription, issue?.description]);

  useEffect(() => {
    if (!isEditingSteps) return undefined;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (stepsEditorRef.current?.contains(target)) return;
      void handleTextFieldSave('stepsToReproduce', stepsDraft, issue.stepsToReproduce, () => setIsEditingSteps(false), 'Steps to reproduce');
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setStepsDraft(issue.stepsToReproduce ?? '');
        setIsEditingSteps(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditingSteps, issue?.stepsToReproduce, stepsDraft, updateIssue]);

  useEffect(() => {
    if (!isEditingExpected) return undefined;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (expectedEditorRef.current?.contains(target)) return;
      void handleTextFieldSave('expectedBehavior', expectedDraft, issue.expectedBehavior, () => setIsEditingExpected(false), 'Expected behavior');
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpectedDraft(issue.expectedBehavior ?? '');
        setIsEditingExpected(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [expectedDraft, isEditingExpected, issue?.expectedBehavior, updateIssue]);

  useEffect(() => {
    if (!isEditingActual) return undefined;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (actualEditorRef.current?.contains(target)) return;
      void handleTextFieldSave('actualBehavior', actualDraft, issue.actualBehavior, () => setIsEditingActual(false), 'Actual behavior');
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActualDraft(issue.actualBehavior ?? '');
        setIsEditingActual(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [actualDraft, isEditingActual, issue?.actualBehavior, updateIssue]);

  useEffect(() => {
    if (!isEditingAcceptance) return undefined;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (acceptanceEditorRef.current?.contains(target)) return;
      void handleTextFieldSave('acceptanceCriteria', acceptanceDraft, issue.acceptanceCriteria, () => setIsEditingAcceptance(false), 'Acceptance criteria');
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAcceptanceDraft(issue.acceptanceCriteria ?? '');
        setIsEditingAcceptance(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [acceptanceDraft, isEditingAcceptance, issue?.acceptanceCriteria, updateIssue]);

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
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-hide">
          <div className="mx-auto max-w-3xl space-y-10">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative group">
                  <select
                    value={issue.type || 'task'}
                    onChange={(event) => void handleTypeChange(event.target.value as IssueType)}
                    className={`cursor-pointer appearance-none rounded px-2 py-0.5 pr-6 text-[10px] font-bold uppercase tracking-wider outline-none transition-all hover:opacity-90 ${ISSUE_TYPE_CONFIG[issue.type || 'task'].color}`}
                  >
                    <option value="task">Task</option>
                    <option value="bug">Bug</option>
                    <option value="issue">Issue</option>
                  </select>
                  <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-70" />
                </div>
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

              <div className="space-y-3">
                {isEditingTitle ? (
                  <div className="rounded-xl border border-gray-200/80 px-1 dark:border-border-dark">
                    <input
                      type="text"
                      value={titleDraft}
                      onChange={(event) => setTitleDraft(event.target.value)}
                      onBlur={() => void handleTitleSave()}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          void handleTitleSave();
                        }
                        if (event.key === 'Escape') {
                          setTitleDraft(issue.title);
                          setIsEditingTitle(false);
                        }
                      }}
                      autoFocus
                      className="w-full border-none bg-transparent px-0 py-0 text-3xl font-bold tracking-tight text-gray-900 outline-none ring-0 dark:text-gray-100"
                    />
                  </div>
                ) : (
                  <h1
                    onClick={() => setIsEditingTitle(true)}
                    className="cursor-text text-3xl font-bold tracking-tight text-gray-900 transition-colors hover:text-primary dark:text-gray-100 dark:hover:text-primary"
                  >
                    {issue.title}
                  </h1>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Description</h3>
              <div className="-mx-4">
                {isEditingDescription ? (
                  <div
                    ref={descriptionEditorRef}
                    className={ISSUE_LONGFORM_CARD}
                  >
                    <RichTextEditor
                      value={descriptionDraft}
                      onChange={setDescriptionDraft}
                      placeholder="Add issue details, context, and requirements..."
                      minHeight="220px"
                      variant="inline"
                      interpretMarkdown
                      contentClassName={ISSUE_LONGFORM_RICH_TEXT}
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDescription(true)}
                    className={`cursor-text ${ISSUE_LONGFORM_CARD}`}
                  >
                    {renderRichText(issue.description, 'Click to add description.')}
                  </div>
                )}
              </div>
            </div>

            {issue.type === 'bug' && (
              <div className="space-y-8 border-t border-gray-100 pt-8 dark:border-border-dark">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Steps to Reproduce</h4>
                  {isEditingSteps ? (
                    <div ref={stepsEditorRef} className={ISSUE_LONGFORM_CARD}>
                      <RichTextEditor
                        value={stepsDraft}
                        onChange={setStepsDraft}
                        placeholder="Click to add steps to reproduce."
                        minHeight="180px"
                        variant="inline"
                        interpretMarkdown
                        contentClassName={ISSUE_LONGFORM_RICH_TEXT}
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsEditingSteps(true)}
                      className={`cursor-text ${ISSUE_LONGFORM_CARD}`}
                    >
                      {renderRichText(issue.stepsToReproduce, 'Click to add steps to reproduce.')}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Expected Behavior</h4>
                    {isEditingExpected ? (
                      <div ref={expectedEditorRef} className={ISSUE_LONGFORM_CARD}>
                        <RichTextEditor
                          value={expectedDraft}
                          onChange={setExpectedDraft}
                          placeholder="Click to add expected behavior."
                          minHeight="180px"
                          variant="inline"
                          interpretMarkdown
                          contentClassName={ISSUE_LONGFORM_RICH_TEXT}
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsEditingExpected(true)}
                        className={`cursor-text ${ISSUE_LONGFORM_CARD}`}
                      >
                        {renderRichText(issue.expectedBehavior, 'Click to add expected behavior.')}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Actual Behavior</h4>
                    {isEditingActual ? (
                      <div ref={actualEditorRef} className={ISSUE_LONGFORM_CARD}>
                        <RichTextEditor
                          value={actualDraft}
                          onChange={setActualDraft}
                          placeholder="Click to add actual behavior."
                          minHeight="180px"
                          variant="inline"
                          interpretMarkdown
                          contentClassName={ISSUE_LONGFORM_RICH_TEXT}
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsEditingActual(true)}
                        className={`cursor-text ${ISSUE_LONGFORM_CARD}`}
                      >
                        {renderRichText(issue.actualBehavior, 'Click to add actual behavior.')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {issue.type === 'issue' && (
              <div className="space-y-4 border-t border-gray-100 pt-8 dark:border-border-dark">
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Acceptance Criteria</h4>
                {isEditingAcceptance ? (
                  <div ref={acceptanceEditorRef} className={ISSUE_LONGFORM_CARD}>
                    <RichTextEditor
                      value={acceptanceDraft}
                      onChange={setAcceptanceDraft}
                      placeholder="Click to add acceptance criteria."
                      minHeight="180px"
                      variant="inline"
                      interpretMarkdown
                      contentClassName={ISSUE_LONGFORM_RICH_TEXT}
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingAcceptance(true)}
                    className={`cursor-text ${ISSUE_LONGFORM_CARD}`}
                  >
                    {renderRichText(issue.acceptanceCriteria, 'Click to add acceptance criteria.')}
                  </div>
                )}
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
                  <IssueAttachmentsField
                    value={newAttachments}
                    onChange={setNewAttachments}
                    embedded
                    driveFolderContext={{
                      workspaceName: useAuthStore.getState().workspace?.name,
                      projectName: issue?.project?.name,
                      issueIdentifier: issue?.id,
                    }}
                  />
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

            <IssueRelationsSection dependencies={issue.dependencies} />

            <IssueSystemContextSection
              parent={issue.parent}
              watchers={issue.watchers}
              integrationRefs={issue.integrationRefs}
            />

            <IssueGitHubActivity issueId={issueResourceId} />

            <IssueFigmaDesigns
              description={issue.description}
              figmaUrls={
                issue.integrationRefs
                  ?.filter((ref) => ref.provider === 'figma' && ref.url)
                  .map((ref) => ref.url!) ?? undefined
              }
            />

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

        <aside className="hidden h-full w-[320px] shrink-0 overflow-y-auto border-l border-gray-200 bg-gray-50/70 p-6 scrollbar-hide dark:border-border-dark dark:bg-black/20 xl:block">
          <div className="space-y-6 pb-8">
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

              <FieldLabel icon={<CalendarRange size={14} />}>Cycle</FieldLabel>
              <div className="relative group">
                <select
                  value={issue.cycleId || ''}
                  onChange={(event) => void handleCycleChange(event.target.value)}
                  disabled={cyclesQuery.isLoading || assignIssueToCycle.isPending || unassignIssueFromCycle.isPending}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium outline-none transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/5"
                >
                  <option value="">{cyclesQuery.isLoading ? 'Loading cycles...' : 'Backlog / No cycle'}</option>
                  {availableCycles.map((cycle) => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
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

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-card-dark">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Labels</h3>
              <div className="mt-3">
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
            </div>

            <div className="h-px bg-gray-100 dark:bg-border-dark" />

            <IssueSystemParametersPanel
              projectId={issue.projectId}
              parentIssueId={systemParentIssueId}
              dependencies={systemDependencies}
              watcherIds={systemWatcherIds}
              integrationRefs={systemIntegrationRefs}
              onParentIssueIdChange={(nextParentIssueId) => void handleParentIssueChange(nextParentIssueId)}
              onDependenciesChange={(nextDependencies) => void handleDependenciesChange(nextDependencies)}
              onWatcherIdsChange={(nextWatcherIds) => void handleWatcherIdsChange(nextWatcherIds)}
              onIntegrationRefsChange={(nextIntegrationRefs) => void handleIntegrationRefsChange(nextIntegrationRefs)}
            />
          </div>
        </aside>
      </div>
      {projectAssignmentDialog}
    </motion.div>
  );
};
