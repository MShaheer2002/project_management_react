import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  Users,
  Calendar as CalendarIcon, 
  Tag, 
  Flag, 
  Layers, 
  RotateCcw, 
  Hash,
  CheckSquare,
  ChevronDown,
  Trash2,
  Building2,
  Clock,
  Settings,
  MoreVertical,
  Search,
  Check,
  Bug,
  FileText,
  Zap,
  Sparkles
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '../AppContext';
import { ISSUE_TYPE_CONFIG } from '../constants';
import { useWorkspaceStatuses } from '@shared/hooks/useWorkspaceStatuses';
import {
  IssueAttachment,
  IssueDependency,
  IssueIntegrationRef,
  IssueType,
  Priority,
  Status,
  Severity,
  IssueSubtask,
} from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { RichTextEditor } from '../components/RichTextEditor';
import { LabelChip } from '@shared/components/ui/LabelChip';
import { getApiFieldErrors, getApiErrorMessage } from '@shared/services';
import { useDepartmentOptions } from '@features/department';
import { useActiveTemplates } from '@features/templates';
import { useProjectOptions } from '@features/projects';
import { useWorkspaceMemberOptions } from '@features/workspace';
import {
  IssueLabelRow,
  IssueAttachmentsField,
  useAttachIssueLabelsAny,
  useCreateLabel,
  useIssueLabels,
  IssueSystemParametersPanel,
  useAddIssueDependencyAny,
  useAddIssueWatchersAny,
  useCreateIssue,
  useUpdateAnyIssue,
  useUpdateIssueIntegrationRefsAny,
} from '@features/issues';

interface Subtask extends IssueSubtask {
  isEditing?: boolean;
}

type IssueDraftSnapshot = {
  title?: string;
  description?: string;
  type?: IssueType;
  projectId?: string;
  priority?: Priority;
  status?: Status;
  templateId?: string;
  assigneeId?: string;
  departmentId?: string;
  dueDate?: string;
  dueTime?: string;
  estimate?: string | number;
  selectedLabelIds?: string[];
  subtasks?: Subtask[];
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity?: Severity;
  acceptanceCriteria?: string;
  relatedIssues?: string;
  notes?: string;
  parentIssueId?: string;
  dependencies?: IssueDependency[];
  watcherIds?: string[];
  integrationRefs?: IssueIntegrationRef[];
  attachments?: IssueAttachment[];
};

const DEFAULT_NEW_LABEL_COLOR = '#38bdf8';

const normalizeDateForInput = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) return '';
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const normalizeTimeForInput = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) return '12:00';
  const trimmed = value.trim();

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '12:00';
  return parsed.toISOString().slice(11, 16);
};

const addDaysToDateInput = (days: number): string => {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
};

export const CreateIssuePage: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const workspaceStatuses = useWorkspaceStatuses();
  const draftKey = `issue_draft:${workspaceId ?? 'unknown'}`;

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IssueType>('task');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>('todo');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [departmentId, setDepartmentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('12:00');
  const [estimate, setEstimate] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [labelSearch, setLabelSearch] = useState('');
  
  // Bug Specific State
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  
  // Feature/Issue Specific State
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [relatedIssues, setRelatedIssues] = useState('');
  const [notes, setNotes] = useState('');
  const [parentIssueId, setParentIssueId] = useState('');
  const [dependencies, setDependencies] = useState<IssueDependency[]>([]);
  const [watcherIds, setWatcherIds] = useState<string[]>([]);
  const [integrationRefs, setIntegrationRefs] = useState<IssueIntegrationRef[]>([]);
  const [attachments, setAttachments] = useState<IssueAttachment[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [lastAutoAppliedType, setLastAutoAppliedType] = useState<IssueType | null>(null);
  
  // UI State
  const [errors, setErrors] = useState<{ project?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [showComplexityDialog, setShowComplexityDialog] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const labelRef = useRef<HTMLDivElement>(null);
  const projectOptionsQuery = useProjectOptions({
    sort: 'name:asc',
    limit: 100,
  });
  const departmentOptionsQuery = useDepartmentOptions(
    {
      sort: 'name:asc',
      limit: 100,
    },
    { enabled: true }
  );
  const assigneeOptionsQuery = useWorkspaceMemberOptions(
    {
      sort: 'name:asc',
      limit: 100,
    },
    { enabled: true }
  );
  const createIssue = useCreateIssue();
  const updateAnyIssue = useUpdateAnyIssue();
  const addIssueDependencyAny = useAddIssueDependencyAny();
  const addIssueWatchersAny = useAddIssueWatchersAny();
  const updateIssueIntegrationRefsAny = useUpdateIssueIntegrationRefsAny();
  const attachIssueLabelsAny = useAttachIssueLabelsAny();
  const createLabel = useCreateLabel();
  const labelsQuery = useIssueLabels(
    {
      q: labelSearch.trim() || undefined,
      sort: 'name:asc',
      limit: 100,
    },
    { enabled: true }
  );
  const projectOptions = projectOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const departmentOptions = departmentOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const assigneeOptions = assigneeOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const labels = labelsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const issueDraftFromRoute = (location.state as { issueDraft?: IssueDraftSnapshot } | null)?.issueDraft ?? null;
  const activeTemplatesQuery = useActiveTemplates({});
  const activeTemplates = activeTemplatesQuery.data ?? [];
  const effectiveTemplate = useMemo(() => {
    return activeTemplates.find((template) => template.issueType === type) ?? null;
  }, [activeTemplates, type]);
  const selectedLabels = selectedLabelIds
    .map((id) => labels.find((label) => label.id === id))
    .filter((label): label is IssueLabelRow => Boolean(label));

  const hydrateDraft = useCallback((draft: IssueDraftSnapshot) => {
    setTitle(draft.title || '');
    setDescription(draft.description || '');
    setType(draft.type || 'task');
    setProjectId(draft.projectId || '');
    setPriority(draft.priority || 'medium');
    setStatus(draft.status || 'todo');
    setAssigneeId(draft.assigneeId || undefined);
    setDepartmentId(draft.departmentId || '');
    setSelectedTemplateId(draft.templateId || '');
    setLastAutoAppliedType(draft.templateId ? draft.type ?? 'task' : null);
    setDueDate(normalizeDateForInput(draft.dueDate));
    setDueTime(normalizeTimeForInput(draft.dueTime));
    setEstimate(typeof draft.estimate === 'number' ? String(draft.estimate) : draft.estimate || '');
    setSelectedLabelIds(draft.selectedLabelIds || []);
    setSubtasks(draft.subtasks || []);
    setStepsToReproduce(draft.stepsToReproduce || '');
    setExpectedBehavior(draft.expectedBehavior || '');
    setActualBehavior(draft.actualBehavior || '');
    setSeverity(draft.severity || 'medium');
    setAcceptanceCriteria(draft.acceptanceCriteria || '');
    setRelatedIssues(draft.relatedIssues || '');
    setNotes(draft.notes || '');
    setParentIssueId(draft.parentIssueId || '');
    setDependencies(draft.dependencies || []);
    setWatcherIds(draft.watcherIds || []);
    setIntegrationRefs(draft.integrationRefs || []);
    setAttachments(draft.attachments || []);
  }, []);

  // Click outside for label dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (labelRef.current && !labelRef.current.contains(event.target as Node)) {
        setShowLabelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (projectOptions.length === 0) return;

    setProjectId((current) => {
      if (current && projectOptions.some((option) => option.id === current)) {
        return current;
      }

      return projectOptions[0].id;
    });
  }, [projectOptions]);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const projectParam = searchParams.get('projectId');

    if (statusParam && workspaceStatuses.some((s) => s.key === statusParam)) {
      setStatus(statusParam as Status);
    }

    if (projectParam) {
      setProjectId(projectParam);
    }
  }, [searchParams]);

  const resetTemplateDrivenState = (nextType: IssueType) => {
    lastAppliedRef.current = null;
    setSelectedTemplateId('');
    setLastAutoAppliedType(null);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('todo');
    setEstimate(nextType === 'task' ? '1' : '');
    setSelectedLabelIds([]);
    setSubtasks([]);
    setStepsToReproduce('');
    setExpectedBehavior('');
    setActualBehavior('');
    setSeverity('medium');
    setAcceptanceCriteria('');
    setRelatedIssues('');
    setNotes('');
    setParentIssueId('');
    setDependencies([]);
    setWatcherIds([]);
    setIntegrationRefs([]);
    setAttachments([]);
  };

  const lastAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!effectiveTemplate) return;

    const key = `${effectiveTemplate.id}:${type}`;
    if (lastAppliedRef.current === key) return;
    lastAppliedRef.current = key;

    const t = effectiveTemplate;
    setSelectedTemplateId(t.id);
    setLastAutoAppliedType(type);
    setTitle(t.titleTemplate || '');
    setDescription(t.contentTemplate || '');
    setPriority(t.defaultPriority);
    setStatus(t.defaultStatus);
    setAssigneeId(t.defaultAssigneeType === 'SPECIFIC_USER' ? t.defaultAssigneeId ?? undefined : undefined);
    setEstimate(t.defaultEstimate != null ? String(t.defaultEstimate) : '');
    setSelectedLabelIds(t.defaultLabelIds ?? []);
    setSubtasks((t.checklistItems ?? []).map((item, index) => ({
      id: `${t.id}-${index}-${item.slice(0, 12)}`,
      title: item,
      completed: false,
      order: index,
      isEditing: false,
    })));
    setSeverity(t.defaultSeverity ?? 'medium');
    setStepsToReproduce(t.stepsToReproduceTemplate ?? '');
    setExpectedBehavior(t.expectedBehaviorTemplate ?? '');
    setActualBehavior(t.actualBehaviorTemplate ?? '');
    setAcceptanceCriteria(t.acceptanceCriteriaTemplate ?? '');
    setRelatedIssues(t.relatedIssueKeysTemplate ?? '');
    setNotes(t.notesTemplate ?? '');
    if (typeof t.defaultDueDateOffset === 'number') {
      setDueDate(addDaysToDateInput(t.defaultDueDateOffset));
    }
  }, [effectiveTemplate, type]);

  // Validation
  const validate = () => {
    const newErrors: { project?: string } = {};
    if (!projectId) newErrors.project = 'Project selection is required';
    setErrors(newErrors);
    const hasAcceptanceCriteria = acceptanceCriteria.trim().length > 0;
    const parsedComplexity = Number.parseInt(estimate, 10);
    const hasValidComplexity =
      !Number.isNaN(parsedComplexity) && parsedComplexity >= 1 && parsedComplexity <= 5;
    if (!title.trim()) {
      showToast('Please enter an issue title', 'error');
    } else if (newErrors.project) {
      showToast('Please select a project', 'error');
    } else if (type === 'task' && !hasValidComplexity) {
      showToast('Please select a complexity between 1 (lowest) and 5 (highest)', 'error');
    } else if (type === 'issue' && !hasAcceptanceCriteria) {
      showToast('Please add acceptance criteria for issue type', 'error');
    }
    return (
      title.trim().length > 0 &&
      Object.keys(newErrors).length === 0 &&
      (type !== 'task' || hasValidComplexity) &&
      (type !== 'issue' || hasAcceptanceCriteria)
    );
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const cleanSubtasks = subtasks
        .map((subtask) => ({ ...subtask, title: subtask.title.trim(), isEditing: false }))
        .filter((subtask) => subtask.title.length > 0)
        .map(({ isEditing, ...rest }) => rest);
      const cleanIntegrationRefs = integrationRefs.filter((ref) => ref.label || ref.externalId || ref.url);
      const cleanAcceptanceCriteria = acceptanceCriteria.trim();

      const parsedComplexity = Number.parseInt(estimate, 10);
      const normalizedComplexity = Number.isNaN(parsedComplexity)
        ? null
        : Math.min(5, Math.max(1, parsedComplexity));
      const templateId = selectedTemplateId && lastAutoAppliedType === type ? selectedTemplateId : undefined;

      const createdIssue = await createIssue.mutateAsync({
        title: title.trim(),
        description,
        type,
        templateId,
        status,
        priority,
        assigneeId: assigneeId || null,
        projectId,
        labels: [],
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        estimate: normalizedComplexity,
        subtasks: cleanSubtasks.map((subtask) => ({
          title: subtask.title,
          order: subtask.order,
        })),
        attachments: attachments.map((attachment) => ({
          fileName: attachment.fileName,
          contentType: attachment.contentType,
          size: attachment.size,
          kind: attachment.kind,
          key: attachment.key,
          assetUrl: attachment.assetUrl ?? null,
          reference: attachment.reference,
        })),
        stepsToReproduce: type === 'bug' ? stepsToReproduce : undefined,
        expectedBehavior: type === 'bug' ? expectedBehavior : undefined,
        actualBehavior: type === 'bug' ? actualBehavior : undefined,
        severity: type === 'bug' ? severity : undefined,
        acceptanceCriteria: type === 'issue' ? cleanAcceptanceCriteria : undefined,
        relatedIssueKeys:
          type === 'issue'
            ? relatedIssues.split(',').map((value) => value.trim()).filter(Boolean)
            : undefined,
        notes: type === 'issue' ? notes : undefined,
        departmentId: departmentId || null,
      });
      const createdIssueResourceId = createdIssue.entityId ?? createdIssue.id;

      if (selectedLabelIds.length > 0) {
        await attachIssueLabelsAny.mutateAsync({
          issueId: createdIssueResourceId,
          input: { labelIds: selectedLabelIds },
        });
      }

      if (parentIssueId) {
        await updateAnyIssue.mutateAsync({
          issueId: createdIssueResourceId,
          input: {
            parentIssueId,
            ...(type === 'issue' ? { acceptanceCriteria: cleanAcceptanceCriteria } : {}),
          },
        });
      }

      if (dependencies.length > 0) {
        await Promise.all(
          dependencies.map((dependency) =>
            addIssueDependencyAny.mutateAsync({
              issueId: createdIssueResourceId,
              input: {
                relatedId: dependency.issueId,
                relation: dependency.relation,
              },
            })
          )
        );
      }

      if (watcherIds.length > 0) {
        await addIssueWatchersAny.mutateAsync({
          issueId: createdIssueResourceId,
          input: { userIds: watcherIds },
        });
      }

      if (cleanIntegrationRefs.length > 0) {
        await updateIssueIntegrationRefsAny.mutateAsync({
          issueId: createdIssueResourceId,
          input: { integrationRefs: cleanIntegrationRefs },
        });
      }

      setIsSubmitting(false);
      showToast(
        cleanSubtasks.length > 0
          ? `Issue created with ${cleanSubtasks.length} subtask${cleanSubtasks.length > 1 ? 's' : ''}`
          : 'Issue created successfully'
      );
      localStorage.removeItem(draftKey);
      navigate(`/issues/${createdIssueResourceId}`);
    } catch (error) {
      setIsSubmitting(false);
      const apiFieldErrors = getApiFieldErrors(error);
      const projectErrors = apiFieldErrors.projectId?.[0] || apiFieldErrors.project?.[0];
      setErrors(projectErrors ? { project: projectErrors } : {});
      showToast(getApiErrorMessage(error) || 'Failed to create issue.', 'error');
    }
  };

  // Subtask Management
  const addSubtask = () => {
    if (!newSubtask.trim()) {
      showToast('Subtask title cannot be empty', 'error');
      return;
    }
    const newTask: Subtask = {
      id: Math.random().toString(36).substr(2, 9),
      title: newSubtask.trim(),
      completed: false,
      order: subtasks.length,
      isEditing: false
    };
    setSubtasks([...subtasks, newTask]);
    setNewSubtask('');
  };

  const updateSubtaskTitle = (id: string, newTitle: string) => {
    const cleaned = newTitle.trim();
    if (!cleaned) {
      setSubtasks(subtasks.filter(s => s.id !== id));
      showToast('Empty subtask removed', 'info');
      return;
    }

    setSubtasks(subtasks.map(s => s.id === id ? { ...s, title: cleaned, isEditing: false } : s));
  };

  const toggleSubtaskEdit = (id: string) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, isEditing: !s.isEditing } : s));
  };

  // Draft Logic
  useEffect(() => {
    // Clean up legacy unscoped draft key
    localStorage.removeItem('issue_draft');

    if (issueDraftFromRoute) {
      hydrateDraft(issueDraftFromRoute);
      localStorage.removeItem(draftKey);
      return;
    }

    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        hydrateDraft(JSON.parse(savedDraft) as IssueDraftSnapshot);
      } catch (e) {
        console.error('Failed to load draft');
      }
    }
  }, [hydrateDraft, issueDraftFromRoute]);

  const saveDraft = useCallback(() => {
    setIsSaving(true);
    const templateId = selectedTemplateId && lastAutoAppliedType === type ? selectedTemplateId : '';
    const draft = {
      title,
      description,
      type,
      projectId,
      priority,
      status,
      templateId,
      assigneeId,
      departmentId,
      dueDate,
      dueTime,
      estimate,
      selectedLabelIds,
      subtasks,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity,
      acceptanceCriteria,
      relatedIssues,
      notes,
      parentIssueId,
      dependencies,
      watcherIds,
      integrationRefs,
      attachments,
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 800);
  }, [title, description, type, projectId, priority, status, selectedTemplateId, lastAutoAppliedType, assigneeId, departmentId, dueDate, dueTime, estimate, selectedLabelIds, subtasks, stepsToReproduce, expectedBehavior, actualBehavior, severity, acceptanceCriteria, relatedIssues, notes, parentIssueId, dependencies, watcherIds, integrationRefs, attachments]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || description) saveDraft();
    }, 5000);
    return () => clearTimeout(timer);
  }, [title, description, subtasks, saveDraft]);

  useEffect(() => {
    if (type === 'task' && !estimate) {
      setEstimate('1');
    }
  }, [type, estimate]);

  // Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleCreate();
      if (e.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, projectId]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex flex-col h-full bg-white dark:bg-bg-dark selection:bg-primary/20 overflow-hidden"
    >
      {/* Precision Header */}
      <header className="h-14 border-b border-gray-200 dark:border-border-dark flex items-center justify-between px-6 sticky top-0 z-50 bg-white/80 dark:bg-bg-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-6 flex-1">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 transition-all hover:text-primary active:scale-95"
            title="Cancel and return (Esc)"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex-1 max-w-4xl relative">
            <input 
              autoFocus
              type="text" 
              placeholder="Issue title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none outline-none w-full placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-all text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-primary">
                <RotateCcw size={10} className="animate-spin" />
                SAVING...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1.5 opacity-60">
                SAVED {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : (
              <span className="opacity-40">DRAFT</span>
            )}
          </div>
          
          <button 
            onClick={handleCreate}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95 group"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus size={18} className="transition-transform duration-300" />
            )}
            <span>Create Issue</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Section - Unified Editing Surface */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-white dark:bg-bg-dark">
          <div className="max-w-4xl mx-auto px-10 py-12 space-y-12 pb-32">
            
            {/* Type Selector */}
            <div className="space-y-6">
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Issue Type</label>
              <div className="flex gap-4">
                {(['task', 'bug', 'issue'] as IssueType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      if (t !== type) {
                        resetTemplateDrivenState(t);
                      }
                      setType(t);
                    }}
                    className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${
                      type === t 
                        ? 'bg-primary/5 border-primary text-primary shadow-sm' 
                        : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {t === 'task' && <CheckSquare size={18} />}
                    {t === 'bug' && <Bug size={18} />}
                    {t === 'issue' && <Zap size={18} />}
                    <span className="text-sm font-bold capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Fields based on Type */}
            <div className="space-y-8">
              <div className="space-y-6">
                <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Description</label>
                <RichTextEditor 
                  value={description}
                  onChange={setDescription}
                  placeholder={`Describe this ${type}...`}
                  minHeight="300px"
                />
              </div>

              {type === 'bug' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8 pt-8 border-t border-gray-100 dark:border-border-dark"
                >
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Steps to Reproduce</label>
                    <textarea 
                      value={stepsToReproduce}
                      onChange={(e) => setStepsToReproduce(e.target.value)}
                      placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..."
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Expected Behavior</label>
                      <textarea 
                        value={expectedBehavior}
                        onChange={(e) => setExpectedBehavior(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Actual Behavior</label>
                      <textarea 
                        value={actualBehavior}
                        onChange={(e) => setActualBehavior(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Severity</label>
                    <div className="flex gap-4">
                      {(['low', 'medium', 'high'] as Severity[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSeverity(s)}
                          className={`flex-1 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                            severity === s 
                              ? 'bg-red-500/10 border-red-500 text-red-500 shadow-sm' 
                              : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {type === 'issue' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8 pt-8 border-t border-gray-100 dark:border-border-dark"
                >
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Acceptance Criteria</label>
                    <textarea 
                      value={acceptanceCriteria}
                      onChange={(e) => setAcceptanceCriteria(e.target.value)}
                      placeholder="What defines this feature as complete?"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px]"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Related Issues</label>
                    <input 
                      type="text"
                      value={relatedIssues}
                      onChange={(e) => setRelatedIssues(e.target.value)}
                      placeholder="LIN-101, LIN-102..."
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Optional Notes</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Subtasks System */}
            <div className="space-y-6 pt-12 border-t border-gray-100 dark:border-border-dark">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <CheckSquare size={16} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Subtasks</h3>
                </div>
                <div className="flex items-center gap-4">
                   <div className="h-1.5 w-32 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary" 
                      animate={{ width: `${subtasks.length > 0 ? (subtasks.filter(s => s.completed).length / subtasks.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {subtasks.filter(s => s.completed).length} / {subtasks.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {subtasks.map(subtask => (
                    <motion.div 
                      key={subtask.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-gray-100 dark:hover:border-border-dark"
                    >
                      <button 
                        onClick={() => setSubtasks(subtasks.map(s => s.id === subtask.id ? { ...s, completed: !s.completed } : s))}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${subtask.completed ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'border-gray-200 dark:border-gray-700'}`}
                      >
                        {subtask.completed && <Check size={12} strokeWidth={4} />}
                      </button>
                      
                      {subtask.isEditing ? (
                        <input 
                          autoFocus
                          type="text"
                          defaultValue={subtask.title}
                          onBlur={(e) => updateSubtaskTitle(subtask.id, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && updateSubtaskTitle(subtask.id, (e.target as HTMLInputElement).value)}
                          className="flex-1 bg-transparent text-sm font-medium outline-none text-primary"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => toggleSubtaskEdit(subtask.id)}
                          className={`text-sm flex-1 cursor-text ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300 font-medium'}`}
                        >
                          {subtask.title}
                        </span>
                      )}

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => toggleSubtaskEdit(subtask.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-primary transition-colors">
                          <Settings size={14} />
                        </button>
                        <button onClick={() => setSubtasks(subtasks.filter(s => s.id !== subtask.id))} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-gray-100 dark:border-border-dark focus-within:border-primary focus-within:bg-primary/5 focus-within:shadow-xl focus-within:shadow-primary/5 transition-all group">
                  <div className="w-5 h-5 rounded-lg border-2 border-gray-200 dark:border-gray-800 flex items-center justify-center group-focus-within:border-primary transition-colors">
                    <Plus size={10} className="text-gray-300 group-focus-within:text-primary" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Add a subtask (Enter)..." 
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                    className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  />
                  <button 
                    onClick={addSubtask}
                    disabled={!newSubtask.trim()}
                    className="px-4 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold uppercase opacity-0 group-focus-within:opacity-100 transition-all disabled:opacity-30 shadow-lg shadow-primary/25"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <IssueAttachmentsField value={attachments} onChange={setAttachments} />
          </div>
        </div>

        {/* Right Section - Metadata Sidebar */}
        <div className="w-[380px] bg-gray-50/20 dark:bg-black/10 overflow-y-auto p-10 border-l border-gray-100 dark:border-border-dark scrollbar-hide relative z-40">
          
          <div className="space-y-12">
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 px-1">Context Parameters</span>
                <div className="space-y-8 mt-6">
                  {/* Project Selection */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                      <Layers size={13} className="text-primary" /> Project Source
                    </label>
                    <div className="relative group">
                      <select 
                        value={projectId}
                        onChange={(e) => {
                          setProjectId(e.target.value);
                          if (errors.project) setErrors({ ...errors, project: undefined });
                        }}
                        className={`w-full bg-gray-50 dark:bg-white/5 border px-5 py-4 text-sm font-medium rounded-2xl outline-none appearance-none transition-all ${
                          errors.project ? 'border-red-500 bg-red-50 dark:bg-red-500/5' : 'border-transparent focus:ring-2 focus:ring-primary/20 shadow-sm group-hover:bg-gray-100 dark:group-hover:bg-white/10'
                        }`}
                        disabled={projectOptionsQuery.isLoading || projectOptions.length === 0}
                      >
                        {projectOptionsQuery.isLoading ? (
                          <option value="">Loading projects...</option>
                        ) : projectOptions.length === 0 ? (
                          <option value="">No projects available</option>
                        ) : (
                          projectOptions.map((projectOption) => (
                            <option key={projectOption.id} value={projectOption.id}>
                              {projectOption.name}
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none group-hover:text-primary transition-colors" />
                    </div>
                  </div>

                  {/* Priority & Status Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                        <Flag size={13} className="text-primary" /> Priority
                      </label>
                      <div className="relative group">
                        <select 
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as Priority)}
                          className="w-full bg-gray-50 dark:bg-white/5 border border-transparent px-5 py-4 text-sm font-medium rounded-2xl shadow-sm outline-none appearance-none focus:ring-2 focus:ring-primary/20 transition-all group-hover:bg-gray-100 dark:group-hover:bg-white/10"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                        <Hash size={13} className="text-primary" /> Status
                      </label>
                      <div className="relative group">
                        <select 
                          value={status}
                          onChange={(e) => setStatus(e.target.value as Status)}
                          className="w-full bg-gray-50 dark:bg-white/5 border border-transparent px-5 py-4 text-sm font-medium rounded-2xl shadow-sm outline-none appearance-none focus:ring-2 focus:ring-primary/20 transition-all group-hover:bg-gray-100 dark:group-hover:bg-white/10"
                        >
                          {workspaceStatuses.map((ws) => (
                            <option key={ws.key} value={ws.key}>{ws.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                      <Users size={13} className="text-primary" /> Assignee
                    </label>
                    <div className="relative group">
                      <select
                        value={assigneeId || ''}
                        onChange={(e) => setAssigneeId(e.target.value || undefined)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-transparent px-5 py-4 text-sm font-medium rounded-2xl shadow-sm outline-none appearance-none focus:ring-2 focus:ring-primary/20 transition-all group-hover:bg-gray-100 dark:group-hover:bg-white/10"
                      >
                        <option value="">Unassigned</option>
                        {assigneeOptions.map((user) => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none" />
                    </div>
                  </div>

                  {/* Labels Selector */}
                  <div className="space-y-3 relative" ref={labelRef}>
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                      <Tag size={13} className="text-primary" /> Labels
                    </label>
                    <button 
                      onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                      className="w-full flex items-center flex-wrap gap-2 min-h-[56px] bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-3 text-sm shadow-sm hover:ring-2 hover:ring-primary/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-left group"
                    >
                      {selectedLabels.length === 0 ? (
                        <span className="text-gray-300 dark:text-gray-600 italic text-sm">Categorize...</span>
                      ) : (
                        selectedLabels.map((label) => <LabelChip key={label.id} label={label.name} />)
                      )}
                      <MoreVertical size={14} className="ml-auto text-gray-400 shrink-0 group-hover:text-primary transition-colors" />
                    </button>

                    <AnimatePresence>
                      {showLabelDropdown && (
                        <motion.div 
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute left-0 right-0 mt-3 bg-white dark:bg-[#1C1F2B] border border-gray-200 dark:border-border-dark rounded-2xl shadow-3xl z-[60] p-4 space-y-4 backdrop-blur-xl"
                        >
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-border-dark focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <Search size={14} className="text-gray-400" />
                            <input
                              type="text"
                              value={labelSearch}
                              onChange={(e) => setLabelSearch(e.target.value)}
                              placeholder="Search or create label..."
                              className="bg-transparent text-[10px] font-medium w-full focus:outline-none placeholder:text-gray-400"
                            />
                          </div>
                          <div className="space-y-1.5 min-h-[150px] max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                            {labels.map(label => (
                              <button 
                                key={label.id}
                                onClick={() => {
                                  if (selectedLabelIds.includes(label.id)) setSelectedLabelIds(selectedLabelIds.filter(id => id !== label.id));
                                  else setSelectedLabelIds([...selectedLabelIds, label.id]);
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-[11px] font-bold group ${selectedLabelIds.includes(label.id) ? 'bg-primary/10 text-primary shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                              >
                                <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: label.color }} />
                                <span className="flex-1 text-left tracking-wide uppercase">{label.name}</span>
                                {selectedLabelIds.includes(label.id) && <Check size={14} strokeWidth={3} />}
                              </button>
                            ))}
                            {labelSearch.trim() && !labels.some((label) => label.name.toLowerCase() === labelSearch.trim().toLowerCase()) && (
                              <button
                                onClick={async () => {
                                  try {
                                    const created = await createLabel.mutateAsync({
                                      name: labelSearch.trim(),
                                      color: DEFAULT_NEW_LABEL_COLOR,
                                    });
                                    setSelectedLabelIds((current) => (current.includes(created.id) ? current : [...current, created.id]));
                                    setLabelSearch('');
                                  } catch (error) {
                                    showToast(getApiErrorMessage(error) || 'Failed to create label.', 'error');
                                  }
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-[11px] font-bold text-primary bg-primary/5 hover:bg-primary/10"
                              >
                                <Plus size={13} />
                                <span className="flex-1 text-left">Create "{labelSearch.trim()}"</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-border-dark mx-1" />

              {/* Timeline Parameters */}
              <div className="space-y-8 px-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 block">Execution Window</span>
                
                <div className="flex gap-6">
                  <div className="flex-1 space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                      <CalendarIcon size={13} className="text-primary" /> Target Date
                    </label>
                    <input 
                      type="date" 
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-gray-100 [color-scheme:light] dark:hover:bg-white/10 dark:[color-scheme:dark]"
                    />
                  </div>
                  <div className="w-32 space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                      <Clock size={13} className="text-primary" /> Time
                    </label>
                    <input 
                      type="time" 
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-gray-100 [color-scheme:light] dark:hover:bg-white/10 dark:[color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                      <Clock size={13} className="text-primary" /> Complexity
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowComplexityDialog(true)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-gray-100 dark:hover:bg-white/10 text-left"
                    >
                      <span className="text-gray-900 dark:text-white">
                        {estimate || 'Select complexity'}
                      </span>
                      <span className="ml-2 text-[10px] font-bold text-gray-400 tracking-tight">Pts</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                      <Building2 size={13} className="text-primary" /> Dept.
                    </label>
                    <div className="relative group">
                       <select 
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-transparent px-5 py-4 text-sm font-medium rounded-2xl shadow-sm outline-none appearance-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-gray-100 dark:hover:bg-white/10"
                      >
                        <option value="">None</option>
                        {departmentOptions.map((department) => (
                          <option key={department.id} value={department.id}>{department.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-border-dark mx-1" />

              <IssueSystemParametersPanel
                projectId={projectId}
                parentIssueId={parentIssueId}
                dependencies={dependencies}
                watcherIds={watcherIds}
                integrationRefs={integrationRefs}
                onParentIssueIdChange={setParentIssueId}
                onDependenciesChange={setDependencies}
                onWatcherIdsChange={setWatcherIds}
                onIntegrationRefsChange={setIntegrationRefs}
              />

            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showComplexityDialog && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Close complexity dialog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowComplexityDialog(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-border-dark dark:bg-card-dark"
            >
              <div className="flex items-start justify-between border-b border-gray-100 px-4 py-4 dark:border-border-dark">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Select complexity</h3>
                  <p className="mt-1 text-xs text-gray-400">1 is lowest complexity, 5 is highest complexity.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowComplexityDialog(false)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary dark:hover:bg-white/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2 p-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setEstimate(String(value));
                      setShowComplexityDialog(false);
                    }}
                    className={`rounded-lg border px-3 py-3 text-sm font-bold transition-all ${
                      estimate === String(value)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-primary/40 hover:bg-primary/5 dark:border-border-dark dark:bg-white/5 dark:text-gray-200'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
