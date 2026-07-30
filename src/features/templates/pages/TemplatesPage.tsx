import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  CheckSquare,
  Clock,
  Copy,
  ChevronDown,
  FileText,
  Flag,
  Hash,
  Layers,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '@/AppContext';
import { ISSUE_TYPE_CONFIG } from '@shared/constants';
import { canManageTemplates } from '@shared/permissions';
import type { IssueType, Priority, Severity, Status } from '@/types';
import {
  useActivateTemplate,
  useConfirmActivateTemplate,
  useCreateTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
  useDeactivateTemplate,
  useTemplateAssignableUsers,
  useTemplateDefaults,
  useTemplateCreators,
  useTemplateDetail,
  useTemplates,
  useUpdateTemplate,
} from '../hooks/useTemplateData';
import { templateService } from '../services/templateService';
import type {
  IssueTemplate,
  TemplateActivationConflictDetails,
  TemplateAssigneeType,
  TemplateCategory,
  TemplateCategoryMode,
  TemplateDraftInput,
  TemplateSort,
} from '../types';

const assigneeText: Record<TemplateAssigneeType, string> = {
  UNASSIGNED: 'Unassigned',
  CREATOR: 'Creator',
  SPECIFIC_USER: 'Specific user',
};

const categoryTone: Record<TemplateCategory, string> = {
  Bug: 'bg-red-500/10 text-red-400 border-red-500/20',
  Feature: 'bg-primary/10 text-primary border-primary/20',
  Task: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  QA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Research: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Security: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Release: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Onboarding: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const customCategoryTone = 'bg-slate-500/10 text-slate-400 border-slate-500/20';

const issueTypeOptions: IssueType[] = ['task', 'bug', 'issue'];
const severityOptions: Severity[] = ['low', 'medium', 'high'];
const formatDisplayLabel = (value: string) =>
  value
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const createEmptyDraft = (): TemplateDraftInput => ({
  name: '',
  description: '',
  category: 'Task',
  customCategory: '',
  categoryOptions: [],
  issueType: 'task',
  titleTemplate: '',
  contentTemplate: '',
  defaultPriority: 'medium',
  priorityOptions: [],
  defaultStatus: 'todo',
  customStatus: '',
  statusOptions: [],
  defaultAssigneeType: 'UNASSIGNED',
  defaultAssigneeId: null,
  defaultEstimate: null,
  defaultDueDateOffset: null,
  defaultLabelIds: [],
  labelOptions: [],
  checklistItems: [],
  defaultSeverity: null,
  stepsToReproduceTemplate: '',
  expectedBehaviorTemplate: '',
  actualBehaviorTemplate: '',
  acceptanceCriteriaTemplate: '',
  relatedIssueKeysTemplate: '',
  notesTemplate: '',
});

const normalizeLabel = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '-');
const getTemplateStatusLabel = (status: string, customStatus?: string | null) => customStatus?.trim() || formatDisplayLabel(status);

const normalizeOptionalText = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const serializeTemplateDraft = (draft: TemplateDraftInput): TemplateDraftInput => ({
  ...draft,
  customCategory: draft.category === 'Custom' ? normalizeOptionalText(draft.customCategory) : null,
  customStatus: normalizeOptionalText(draft.customStatus),
  defaultAssigneeId: draft.defaultAssigneeType === 'SPECIFIC_USER' ? draft.defaultAssigneeId ?? null : null,
  stepsToReproduceTemplate: normalizeOptionalText(draft.stepsToReproduceTemplate),
  expectedBehaviorTemplate: normalizeOptionalText(draft.expectedBehaviorTemplate),
  actualBehaviorTemplate: normalizeOptionalText(draft.actualBehaviorTemplate),
  acceptanceCriteriaTemplate: normalizeOptionalText(draft.acceptanceCriteriaTemplate),
  relatedIssueKeysTemplate: normalizeOptionalText(draft.relatedIssueKeysTemplate),
  notesTemplate: normalizeOptionalText(draft.notesTemplate),
});

const useDismissOnOutsideClick = (
  refs: React.RefObject<HTMLElement | null>[],
  onDismiss: () => void,
  enabled: boolean
) => {
  useEffect(() => {
    if (!enabled) return undefined;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (refs.some((ref) => ref.current?.contains(target))) return;
      onDismiss();
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [enabled, onDismiss, refs]);
};

const templateToDraft = (template: IssueTemplate): TemplateDraftInput => ({
  name: template.name,
  description: template.description,
  category: template.category,
  customCategory: template.customCategory ?? '',
  categoryOptions: template.categoryOptions,
  issueType: template.issueType,
  titleTemplate: template.titleTemplate,
  contentTemplate: template.contentTemplate,
  defaultPriority: template.defaultPriority,
  priorityOptions: template.priorityOptions,
  defaultStatus: template.defaultStatus,
  customStatus: template.customStatus ?? '',
  statusOptions: template.statusOptions,
  defaultAssigneeType: template.defaultAssigneeType,
  defaultAssigneeId: template.defaultAssigneeId ?? null,
  defaultEstimate: template.defaultEstimate ?? null,
  defaultDueDateOffset: template.defaultDueDateOffset ?? null,
  defaultLabelIds: template.defaultLabelIds,
  labelOptions: template.labelOptions,
  checklistItems: template.checklistItems,
  defaultSeverity: template.defaultSeverity ?? null,
  stepsToReproduceTemplate: template.stepsToReproduceTemplate ?? '',
  expectedBehaviorTemplate: template.expectedBehaviorTemplate ?? '',
  actualBehaviorTemplate: template.actualBehaviorTemplate ?? '',
  acceptanceCriteriaTemplate: template.acceptanceCriteriaTemplate ?? '',
  relatedIssueKeysTemplate: template.relatedIssueKeysTemplate ?? '',
  notesTemplate: template.notesTemplate ?? '',
});

const formatDate = (value?: string | null) => {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
};

const toRelative = (value?: string | null) => {
  if (!value) return 'Never used';
  const days = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 86400000));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

const HeaderIcon = () => (
  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
    <FileText size={20} />
  </div>
);

const TypeBadge: React.FC<{ type: IssueType }> = ({ type }) => {
  const config = ISSUE_TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${config.color}`}>
      {config.label}
    </span>
  );
};

const TemplateCard: React.FC<{
  template: IssueTemplate;
  canManage: boolean;
  onDelete: (template: IssueTemplate) => void;
  onDuplicate: (template: IssueTemplate) => void;
}> = ({ template, canManage, onDelete, onDuplicate }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative rounded-xl border border-gray-200 bg-white/70 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 dark:border-border-dark dark:bg-card-dark">
      <button onClick={() => navigate(`/templates/${template.id}`)} className="w-full text-left">
        <div className="flex items-start gap-3 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold tracking-tight">{template.name}</h2>
            <p className="mt-0.5 text-[11px] text-gray-400">Updated {formatDate(template.updatedAt)}</p>
          </div>
        </div>

        <p className="mt-3 min-h-[36px] text-sm leading-6 text-gray-500 dark:text-gray-400 line-clamp-2">{template.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <TypeBadge type={template.issueType} />
          <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:bg-white/5 dark:text-gray-400">
            {formatDisplayLabel(String(template.defaultPriority))}
          </span>
          {template.isActive && <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Active</span>}
        </div>

      </button>

      {canManage && (
        <div className="absolute right-3 top-3">
          <button
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((open) => !open);
            }}
            className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-all hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-white/5"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 text-sm shadow-xl dark:border-border-dark dark:bg-card-dark">
              <Link to={`/templates/${template.id}/edit`} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/5">
                <FileText size={14} /> Edit
              </Link>
              <button onClick={() => onDuplicate(template)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-white/5">
                <Copy size={14} /> Duplicate
              </button>
              <button onClick={() => onDelete(template)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-400 hover:bg-red-500/10">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TemplatesListView: React.FC = () => {
  const { showToast } = useApp();
  const role = useAuthStore((state) => state.workspace?.role);
  const canManage = canManageTemplates(role);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const deferredSearch = useDeferredValue(search);
  const issueType = (searchParams.get('type') as IssueType | 'all' | null) ?? 'all';

  const listInput = useMemo(
    () => ({ q: deferredSearch.trim() || undefined, issueType }),
    [deferredSearch, issueType]
  );
  const templatesQuery = useTemplates(listInput);
  const templates = templatesQuery.data ?? [];
  const deleteTemplate = useDeleteTemplate();
  const duplicateTemplate = useDuplicateTemplate();

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (deferredSearch.trim()) next.set('q', deferredSearch.trim());
    else next.delete('q');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const handleDelete = async (template: IssueTemplate) => {
    if (!window.confirm(`Delete ${template.name}? Existing issues created from this template will not change.`)) return;
    await deleteTemplate.mutateAsync(template.id);
    showToast('Template deleted.', 'success');
  };

  const handleDuplicate = async (template: IssueTemplate) => {
    const copy = await duplicateTemplate.mutateAsync(template.id);
    showToast(`${copy.name} created.`, 'success');
  };

  return (
    <div className="flex h-full flex-col bg-gray-50/30 dark:bg-transparent">
      <header className="border-b border-gray-200 px-6 py-4 dark:border-border-dark">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HeaderIcon />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold tracking-tight xl:text-xl">Issue Templates</h1>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-primary">Workspace</span>
              </div>
              <p className="text-xs text-gray-400">Reusable blueprints for consistent issue creation</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative min-w-[190px]">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search templates"
                className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
              />
            </div>
            <select value={issueType} onChange={(event) => updateParam('type', event.target.value)} className="min-w-[112px] rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium outline-none dark:border-border-dark dark:bg-white/5">
              <option value="all">All types</option>
              {issueTypeOptions.map((item) => <option key={item} value={item}>{ISSUE_TYPE_CONFIG[item].label}</option>)}
            </select>
            {canManage && (
              <Link to="/templates/new" className="inline-flex min-w-fit items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-3.5 py-1.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
                <Plus size={15} />
                New Template
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {templatesQuery.isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            <Loader2 size={18} className="mr-2 animate-spin" /> Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white/80 px-6 text-center dark:border-border-dark dark:bg-white/[0.03]">
            <FileText size={32} className="text-gray-500" />
            <h2 className="mt-5 text-lg font-bold">No templates found</h2>
            <p className="mt-2 max-w-sm text-sm text-gray-400">Create a reusable issue blueprint or adjust the current filters.</p>
            {canManage && <Link to="/templates/new" className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">Create Template</Link>}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white/70 p-4 dark:border-border-dark dark:bg-transparent">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Total templates</p>
                <p className="mt-2 text-2xl font-bold">{templates.length}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white/70 p-4 dark:border-border-dark dark:bg-transparent">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Issue types covered</p>
                <p className="mt-2 text-lg font-bold">{new Set(templates.map((template) => template.issueType)).size}</p>
                <p className="mt-1 text-xs text-gray-400">Issue, task, and bug templates</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  canManage={canManage}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TemplateFormView: React.FC<{ mode: 'create' | 'edit'; template?: IssueTemplate | null; isLoading?: boolean }> = ({ mode, template, isLoading }) => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const role = useAuthStore((state) => state.workspace?.role);
  const canManage = canManageTemplates(role);
  const usersQuery = useTemplateAssignableUsers();
  const defaultsQuery = useTemplateDefaults();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate(template?.id);
  const [draft, setDraft] = useState<TemplateDraftInput>(template ? templateToDraft(template) : createEmptyDraft());
  const [checklistInput, setChecklistInput] = useState('');
  const [labelDraft, setLabelDraft] = useState('');
  const [priorityDraft, setPriorityDraft] = useState('');
  const [showLabelComposer, setShowLabelComposer] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [showCategoryComposer, setShowCategoryComposer] = useState(false);
  const [showStatusComposer, setShowStatusComposer] = useState(false);
  const [showPriorityComposer, setShowPriorityComposer] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const priorityMenuRef = useRef<HTMLLabelElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (template) {
      const nextDraft = templateToDraft(template);
      setDraft(nextDraft);
      setShowStatusComposer(Boolean(nextDraft.customStatus?.trim()));
    } else if (defaultsQuery.data) {
      setDraft((current) => ({
        ...current,
        categoryOptions: defaultsQuery.data.categoryOptions,
        priorityOptions: defaultsQuery.data.priorityOptions,
        statusOptions: defaultsQuery.data.statusOptions,
        labelOptions: defaultsQuery.data.labelOptions,
      }));
    }
  }, [defaultsQuery.data, template]);

  useDismissOnOutsideClick([categoryMenuRef], () => setCategoryMenuOpen(false), categoryMenuOpen);
  useDismissOnOutsideClick([priorityMenuRef], () => setPriorityMenuOpen(false), priorityMenuOpen);
  useDismissOnOutsideClick([statusMenuRef], () => setStatusMenuOpen(false), statusMenuOpen);

  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  if (!canManage) {
    return <AccessDeniedView />;
  }

  const updateDraft = <K extends keyof TemplateDraftInput>(key: K, value: TemplateDraftInput[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const toggleLabel = (label: string) => {
    setDraft((current) => ({
      ...current,
      defaultLabelIds: current.defaultLabelIds.includes(label)
        ? current.defaultLabelIds.filter((item) => item !== label)
        : [...current.defaultLabelIds, label],
    }));
  };

  const addCustomLabel = () => {
    const normalized = normalizeLabel(labelDraft);
    if (!normalized) return;
    setDraft((current) => ({
      ...current,
      labelOptions: current.labelOptions.includes(normalized) ? current.labelOptions : [...current.labelOptions, normalized],
      defaultLabelIds: current.defaultLabelIds.includes(normalized)
        ? current.defaultLabelIds
        : [...current.defaultLabelIds, normalized],
    }));
    setLabelDraft('');
    setShowLabelComposer(false);
  };

  const addChecklistItem = () => {
    const value = checklistInput.trim();
    if (!value) return;
    setDraft((current) => ({ ...current, checklistItems: [...current.checklistItems, value] }));
    setChecklistInput('');
  };

  const save = async () => {
    if (!draft.name.trim()) return showToast('Template name is required.', 'error');
    if (!draft.description.trim()) return showToast('Template description is required.', 'error');
    if (!draft.contentTemplate.trim()) return showToast('Content template is required.', 'error');
    if (draft.category === 'Custom' && !(draft.customCategory ?? '').trim()) return showToast('Custom category is required when category is Custom.', 'error');
    if (draft.issueType === 'issue' && !draft.acceptanceCriteriaTemplate?.trim()) return showToast('Acceptance criteria template is required for issue templates.', 'error');
    if (draft.defaultAssigneeType === 'SPECIFIC_USER' && !draft.defaultAssigneeId) return showToast('Select a specific assignee.', 'error');

    const payload = serializeTemplateDraft(draft);
    try {
      const saved = mode === 'create' ? await createTemplate.mutateAsync(payload) : await updateTemplate.mutateAsync(payload);
      showToast(mode === 'create' ? 'Template created.' : 'Template updated.', 'success');
      navigate(`/templates/${saved.id}`);
    } catch {
      showToast('Failed to save template.', 'error');
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-gray-400"><Loader2 size={18} className="mr-2 animate-spin" /> Loading template...</div>;
  }

  return (
    <div className="flex h-full flex-col bg-gray-50/30 dark:bg-transparent">
      <header className="border-b border-gray-200 px-6 py-5 dark:border-border-dark">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Link to="/templates" className="hover:text-primary">Templates</Link>
              <span>/</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">{mode === 'create' ? 'New Template' : template?.name}</span>
            </div>
            <h1 className="mt-3 text-xl font-bold tracking-tight">{mode === 'create' ? 'Create issue template' : 'Edit issue template'}</h1>
            <p className="mt-1 text-sm text-gray-400">Define the issue body, defaults, labels, and subtasks users can apply later.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold dark:border-border-dark">Cancel</button>
            <button onClick={save} disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-60">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Save Template
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid w-full max-w-[1320px] grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-5">
            <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
              <h2 className="text-sm font-bold">Template details</h2>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Name</span>
                  <input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} placeholder="Bug Report" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-border-dark dark:bg-white/5" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Title template</span>
                  <input value={draft.titleTemplate} onChange={(event) => updateDraft('titleTemplate', event.target.value)} placeholder="[Bug] Short summary" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-border-dark dark:bg-white/5" />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Description</span>
                  <input value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} placeholder="What is this template for?" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-border-dark dark:bg-white/5" />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
              <h2 className="text-sm font-bold">Content template</h2>
              <p className="mt-1 text-xs text-gray-400">Markdown-style issue body users can edit before creating the issue.</p>
              <textarea value={draft.contentTemplate} onChange={(event) => updateDraft('contentTemplate', event.target.value)} placeholder="### Summary\n\n### Acceptance Criteria" className="mt-4 h-80 w-full resize-none rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-sm leading-6 outline-none focus:border-primary dark:border-border-dark dark:bg-white/5" />
            </section>

            {draft.issueType === 'bug' && (
              <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-bold">Bug fields</h2>
                    <p className="mt-1 text-xs text-gray-400">These map directly to the bug creation flow: severity, reproduction, expected, and actual behavior.</p>
                  </div>
                  <Bug size={18} className="text-red-400" />
                </div>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Steps to reproduce</span>
                    <textarea
                      value={draft.stepsToReproduceTemplate ?? ''}
                      onChange={(event) => updateDraft('stepsToReproduceTemplate', event.target.value)}
                      placeholder="1. Go to...\n2. Click...\n3. Observe..."
                      className="h-28 w-full resize-none rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-sm leading-6 outline-none focus:border-primary dark:border-border-dark dark:bg-white/5"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Expected behavior</span>
                    <textarea
                      value={draft.expectedBehaviorTemplate ?? ''}
                      onChange={(event) => updateDraft('expectedBehaviorTemplate', event.target.value)}
                      className="h-28 w-full resize-none rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-sm leading-6 outline-none focus:border-primary dark:border-border-dark dark:bg-white/5"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Actual behavior</span>
                    <textarea
                      value={draft.actualBehaviorTemplate ?? ''}
                      onChange={(event) => updateDraft('actualBehaviorTemplate', event.target.value)}
                      className="h-28 w-full resize-none rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-sm leading-6 outline-none focus:border-primary dark:border-border-dark dark:bg-white/5"
                    />
                  </label>
                </div>
              </section>
            )}

            {draft.issueType === 'issue' && (
              <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-bold">Issue / feature fields</h2>
                    <p className="mt-1 text-xs text-gray-400">Matches the issue creation rules: acceptance criteria is required, related issues and notes are optional.</p>
                  </div>
                  <Zap size={18} className="text-primary" />
                </div>
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Acceptance criteria</span>
                    <textarea
                      value={draft.acceptanceCriteriaTemplate ?? ''}
                      onChange={(event) => updateDraft('acceptanceCriteriaTemplate', event.target.value)}
                      placeholder="- [ ] User can...\n- [ ] System handles..."
                      className="h-32 w-full resize-none rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-sm leading-6 outline-none focus:border-primary dark:border-border-dark dark:bg-white/5"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Related issues template</span>
                    <input
                      value={draft.relatedIssueKeysTemplate ?? ''}
                      onChange={(event) => updateDraft('relatedIssueKeysTemplate', event.target.value)}
                      placeholder="LIN-101, LIN-102"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-border-dark dark:bg-white/5"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Optional notes</span>
                    <textarea
                      value={draft.notesTemplate ?? ''}
                      onChange={(event) => updateDraft('notesTemplate', event.target.value)}
                      className="h-28 w-full resize-none rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-sm leading-6 outline-none focus:border-primary dark:border-border-dark dark:bg-white/5"
                    />
                  </label>
                </div>
              </section>
            )}

            <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold">Checklist builder</h2>
                  <p className="mt-1 text-xs text-gray-400">Each checklist item becomes a subtask on the generated issue.</p>
                </div>
                <span className="text-xs font-semibold text-gray-400">{draft.checklistItems.length} items</span>
              </div>
              <div className="mt-4 flex gap-2">
                <input value={checklistInput} onChange={(event) => setChecklistInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addChecklistItem()} placeholder="Add checklist item" className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-border-dark dark:bg-white/5" />
                <button onClick={addChecklistItem} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">Add</button>
              </div>
              <div className="mt-4 space-y-2">
                {draft.checklistItems.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-400 dark:border-border-dark">No checklist items added.</p>
                ) : draft.checklistItems.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-border-dark">
                    <span className="flex items-center gap-2"><CheckSquare size={14} className="text-gray-400" /> {item}</span>
                    <button onClick={() => updateDraft('checklistItems', draft.checklistItems.filter((_, itemIndex) => itemIndex !== index))} className="text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
            <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
              <h2 className="text-sm font-bold">Default metadata</h2>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Category</span>
                  <div className="relative" ref={categoryMenuRef}>
                    <button
                      type="button"
                      onClick={() => setCategoryMenuOpen((current) => !current)}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors hover:border-primary dark:border-border-dark dark:bg-white/5"
                    >
                      <span className="truncate">
                        {draft.category === 'Custom' ? (draft.customCategory ?? '').trim() || 'Custom category' : draft.category}
                      </span>
                      <ChevronDown size={14} className="text-gray-400" />
                    </button>
                    {categoryMenuOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-gray-200 bg-[#171A22] p-2 shadow-2xl dark:border-border-dark">
                        <div className="max-h-64 overflow-y-auto pr-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryMenuOpen(false);
                              setShowCategoryComposer(true);
                            }}
                            className="mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-gray-200 transition-colors hover:bg-white/5 hover:text-primary"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <Plus size={14} className="shrink-0" />
                              <span className="truncate">Custom category</span>
                            </span>
                            <span className="truncate text-[10px] uppercase tracking-[0.16em] text-gray-400">Add custom category</span>
                          </button>
                          {draft.categoryOptions.map((item) => {
                            const selected = draft.category === item;
                            return (
                              <div
                                key={item}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                                  selected ? 'bg-primary/10 text-primary' : 'text-gray-200 hover:bg-white/5'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateDraft('category', item as TemplateCategoryMode);
                                    setCategoryMenuOpen(false);
                                  }}
                                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                >
                                  <span className="truncate">{item}</span>
                                  {selected && <CheckSquare size={14} className="shrink-0 text-primary" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDraft((current) => ({
                                      ...current,
                                      categoryOptions: current.categoryOptions.filter((value) => value !== item),
                                      category:
                                        current.category === 'Custom' && current.customCategory?.trim() === item
                                          ? current.categoryOptions.find((value) => value !== item)
                                              ? ((current.categoryOptions.find((value) => value !== item) as TemplateCategoryMode) ?? current.category)
                                              : current.category
                                          : current.category === item
                                            ? ((current.categoryOptions.find((value) => value !== item) as TemplateCategoryMode) ?? current.category)
                                            : current.category,
                                      customCategory: current.category === 'Custom' && current.customCategory?.trim() === item ? '' : current.customCategory,
                                    }));
                                  }}
                                  className="ml-2 flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/10 hover:text-red-400"
                                  aria-label={`Delete category ${item}`}
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Issue type</span>
                  <select value={draft.issueType} onChange={(event) => updateDraft('issueType', event.target.value as IssueType)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-border-dark dark:bg-white/5">
              {issueTypeOptions.map((item) => <option key={item} value={item}>{ISSUE_TYPE_CONFIG[item].label}</option>)}
                  </select>
                </label>
                <label className="block" ref={priorityMenuRef}>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Priority</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPriorityMenuOpen((current) => !current)}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors hover:border-primary dark:border-border-dark dark:bg-white/5"
                    >
                    <span className="truncate">{formatDisplayLabel(String(draft.defaultPriority))}</span>
                      <ChevronDown size={14} className="text-gray-400" />
                    </button>
                    {priorityMenuOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-gray-200 bg-[#171A22] p-2 shadow-2xl dark:border-border-dark">
                        <div className="max-h-60 overflow-y-auto pr-1">
                          {draft.priorityOptions.map((item) => {
                            const selected = draft.defaultPriority === item;
                            return (
                              <div
                                key={item}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                                  selected ? 'bg-primary/10 text-primary' : 'text-gray-200 hover:bg-white/5'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateDraft('defaultPriority', item as Priority);
                                  }}
                                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                >
                                  <span className="truncate">{formatDisplayLabel(item)}</span>
                                  {selected && <CheckSquare size={14} className="shrink-0 text-primary" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDraft((current) => ({
                                      ...current,
                                      priorityOptions: current.priorityOptions.filter((value) => value !== item),
                                      defaultPriority:
                                        current.defaultPriority === item
                                          ? ((current.priorityOptions.find((value) => value !== item) as Priority | undefined) ?? current.defaultPriority)
                                          : current.defaultPriority,
                                    }));
                                  }}
                                  className="ml-2 flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/10 hover:text-red-400"
                                  aria-label={`Delete priority ${item}`}
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPriorityMenuOpen(false);
                            setPriorityDraft('');
                            setShowPriorityComposer(true);
                          }}
                          className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-gray-200 transition-colors hover:bg-white/5 hover:text-primary"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Plus size={14} className="shrink-0" />
                            <span className="truncate">Custom priority</span>
                          </span>
                          <span className="truncate text-[10px] uppercase tracking-[0.16em] text-gray-400">Add custom priority</span>
                        </button>
                      </div>
                    )}
                  </div>
                </label>
                <div className="block md:col-span-2 relative" ref={statusMenuRef}>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Status</span>
                  <button
                    type="button"
                    onClick={() => setStatusMenuOpen((current) => !current)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors hover:border-primary dark:border-border-dark dark:bg-white/5"
                  >
                    <span className="truncate">{getTemplateStatusLabel(draft.defaultStatus, draft.customStatus)}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                  {statusMenuOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-gray-200 bg-[#171A22] p-2 shadow-2xl dark:border-border-dark">
                      <div className="max-h-60 overflow-y-auto pr-1">
                        {draft.statusOptions.map((item) => {
                          const selected = draft.defaultStatus === item;
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => {
                                updateDraft('defaultStatus', item as Status);
                                setStatusMenuOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                                selected ? 'bg-primary/10 text-primary' : 'text-gray-200 hover:bg-white/5'
                              }`}
                            >
                              <span>{formatDisplayLabel(item)}</span>
                              {selected && <CheckSquare size={14} className="text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusMenuOpen(false);
                          setShowStatusComposer(true);
                        }}
                        className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors text-gray-200 hover:bg-white/5 hover:text-primary"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Plus size={14} className="shrink-0" />
                          <span className="truncate">Custom label</span>
                        </span>
                        <span className="truncate text-[10px] uppercase tracking-[0.16em] text-gray-400">Add optional status label</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                </div>
                {draft.issueType === 'bug' && (
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Severity</span>
                    <select value={draft.defaultSeverity ?? 'medium'} onChange={(event) => updateDraft('defaultSeverity', event.target.value as Severity)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-border-dark dark:bg-white/5">
                      {severityOptions.map((item) => <option key={item} value={item}>{formatDisplayLabel(item)}</option>)}
                    </select>
                  </label>
                )}
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Assignee</span>
                  <select value={draft.defaultAssigneeType} onChange={(event) => updateDraft('defaultAssigneeType', event.target.value as TemplateAssigneeType)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-border-dark dark:bg-white/5">
                    <option value="UNASSIGNED">Unassigned</option>
                    <option value="CREATOR">Creator</option>
                    <option value="SPECIFIC_USER">Specific user</option>
                  </select>
                </label>
                {draft.defaultAssigneeType === 'SPECIFIC_USER' && (
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Specific user</span>
                    <select value={draft.defaultAssigneeId ?? ''} onChange={(event) => updateDraft('defaultAssigneeId', event.target.value || null)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-border-dark dark:bg-white/5">
                      <option value="">Select user</option>
                      {(usersQuery.data ?? []).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                  </label>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Estimate</span>
                    <input type="number" min={1} max={5} value={draft.defaultEstimate ?? ''} onChange={(event) => updateDraft('defaultEstimate', event.target.value ? Math.min(5, Math.max(1, Number(event.target.value))) : null)} placeholder="1-5" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-border-dark dark:bg-white/5" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Due offset</span>
                    <input type="number" min={0} value={draft.defaultDueDateOffset ?? ''} onChange={(event) => updateDraft('defaultDueDateOffset', event.target.value ? Number(event.target.value) : null)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-border-dark dark:bg-white/5" />
                  </label>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
              <h2 className="text-sm font-bold">Default labels</h2>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {draft.labelOptions.map((label) => {
                  const selected = draft.defaultLabelIds.includes(label);
                  return (
                    <span
                      key={label}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-all ${
                        selected ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-400 dark:border-border-dark'
                      }`}
                    >
                      <button type="button" onClick={() => toggleLabel(label)} className="max-w-[120px] truncate">
                        {label}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDraft((current) => ({
                            ...current,
                            labelOptions: current.labelOptions.filter((item) => item !== label),
                            defaultLabelIds: current.defaultLabelIds.filter((item) => item !== label),
                          }));
                        }}
                        className="text-gray-500 transition-colors hover:text-red-400"
                        aria-label={`Delete label ${label}`}
                      >
                        <Trash2 size={11} />
                      </button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowLabelComposer((current) => !current)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 transition-colors hover:border-primary hover:text-primary dark:border-border-dark"
                  aria-label="Add label"
                >
                  <Plus size={14} />
                </button>
              </div>
              {showLabelComposer && (
                <div className="mt-4 flex items-center gap-2">
                  <input
                    value={labelDraft}
                    onChange={(event) => setLabelDraft(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && addCustomLabel()}
                    placeholder="Create custom label"
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-border-dark dark:bg-white/5"
                  />
                  <button
                    type="button"
                    onClick={addCustomLabel}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-colors hover:border-primary hover:text-primary dark:border-border-dark dark:bg-white/5"
                    aria-label="Create label"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </section>

            {showStatusComposer && (
              <div
                className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    setShowStatusComposer(false);
                  }
                }}
              >
                <div className="flex min-h-full items-center justify-center px-4 py-8">
                  <div
                    className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11131A] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-gray-100">Custom status label</h3>
                        <p className="mt-1 text-xs text-gray-500">Add an optional label that appears beside the issue status.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowStatusComposer(false)}
                        className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 transition-colors hover:border-gray-500 hover:text-gray-200"
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <input
                        autoFocus
                        value={draft.customStatus ?? ''}
                        onChange={(event) => updateDraft('customStatus', event.target.value)}
                        placeholder="Ready for review, Launch pending, etc."
                        className="flex-1 rounded-xl border border-white/10 bg-[#0C0E14] px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!draft.customStatus?.trim()) return;
                          const value = draft.customStatus.trim();
                          setDraft((current) => ({
                            ...current,
                            statusOptions: current.statusOptions.includes(value) ? current.statusOptions : [...current.statusOptions, value],
                          }));
                          showToast(`Custom status "${value}" added.`, 'success');
                          setShowStatusComposer(false);
                        }}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20"
                        aria-label="Confirm custom status label"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showCategoryComposer && (
              <div
                className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    setShowCategoryComposer(false);
                  }
                }}
              >
                <div className="flex min-h-full items-center justify-center px-4 py-8">
                  <div
                    className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11131A] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-gray-100">Custom category</h3>
                        <p className="mt-1 text-xs text-gray-500">Add a template-specific category label.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCategoryComposer(false)}
                        className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 transition-colors hover:border-gray-500 hover:text-gray-200"
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <input
                        autoFocus
                        value={draft.customCategory ?? ''}
                        onChange={(event) => {
                          updateDraft('category', 'Custom');
                          updateDraft('customCategory', event.target.value);
                        }}
                        placeholder="Operations, Compliance, Launch..."
                        className="flex-1 rounded-xl border border-white/10 bg-[#0C0E14] px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!(draft.customCategory ?? '').trim()) return;
                          const value = (draft.customCategory ?? '').trim();
                          updateDraft('category', 'Custom');
                          setDraft((current) => ({
                            ...current,
                            categoryOptions: current.categoryOptions.includes(value) ? current.categoryOptions : [...current.categoryOptions, value],
                          }));
                          showToast(`Custom category "${value}" added.`, 'success');
                          setShowCategoryComposer(false);
                        }}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20"
                        aria-label="Confirm custom category"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showPriorityComposer && (
              <div
                className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    setShowPriorityComposer(false);
                  }
                }}
              >
                <div className="flex min-h-full items-center justify-center px-4 py-8">
                  <div
                    className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11131A] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-gray-100">Custom priority</h3>
                        <p className="mt-1 text-xs text-gray-500">Add a template-specific priority label.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPriorityComposer(false)}
                        className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 transition-colors hover:border-gray-500 hover:text-gray-200"
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <input
                        autoFocus
                        value={priorityDraft}
                        onChange={(event) => setPriorityDraft(event.target.value)}
                        placeholder="Critical, Blocker, etc."
                        className="flex-1 rounded-xl border border-white/10 bg-[#0C0E14] px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const value = priorityDraft.trim();
                          if (!value) return;
                          setDraft((current) => ({
                            ...current,
                            priorityOptions: current.priorityOptions.includes(value) ? current.priorityOptions : [...current.priorityOptions, value],
                          }));
                          setPriorityDraft('');
                          setShowPriorityComposer(false);
                          showToast(`Custom priority "${value}" added.`, 'success');
                        }}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20"
                        aria-label="Confirm custom priority"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </aside>
        </div>
      </div>
    </div>
  );
};

const TemplateDetailView: React.FC<{ templateId: string }> = ({ templateId }) => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const role = useAuthStore((state) => state.workspace?.role);
  const workspaceId = useAuthStore((state) => state.workspace?.id);
  const canManage = canManageTemplates(role);
  const templateQuery = useTemplateDetail(templateId);
  const deleteTemplate = useDeleteTemplate();
  const duplicateTemplate = useDuplicateTemplate();
  const activateTemplate = useActivateTemplate();
  const confirmActivateTemplate = useConfirmActivateTemplate();
  const deactivateTemplate = useDeactivateTemplate();
  const template = templateQuery.data;
  const isActiveInScope = Boolean(template?.isActive);
  const [activationConflict, setActivationConflict] = useState<TemplateActivationConflictDetails | null>(null);

  const handleActivate = async () => {
    if (!template) return;
    try {
      await activateTemplate.mutateAsync(template.id);
      showToast('Template activated.', 'success');
    } catch (error) {
      const conflict = templateService.inspectActivationError(error);
      if (conflict) {
        setActivationConflict(conflict);
        return;
      }
      showToast('Failed to activate template.', 'error');
    }
  };

  const handleConfirmActivate = async () => {
    if (!template) return;
    try {
      await confirmActivateTemplate.mutateAsync(template.id);
      setActivationConflict(null);
      showToast('Template activated.', 'success');
    } catch {
      showToast('Failed to confirm activation.', 'error');
    }
  };

  const handleDeactivate = async () => {
    if (!template) return;
    if (!window.confirm(`Deactivate ${template.name}? It will remain available but will no longer be the active template.`)) return;
    try {
      await deactivateTemplate.mutateAsync(template.id);
      showToast('Template deactivated.', 'success');
    } catch {
      showToast('Failed to deactivate template.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!template || !window.confirm(`Delete ${template.name}? Existing generated issues will remain unchanged.`)) return;
    await deleteTemplate.mutateAsync(template.id);
    showToast('Template deleted.', 'success');
    navigate('/templates');
  };

  const handleDuplicate = async () => {
    if (!template) return;
    const copy = await duplicateTemplate.mutateAsync(template.id);
    showToast(`${copy.name} created.`, 'success');
    navigate(`/templates/${copy.id}`);
  };

  if (templateQuery.isLoading) return <div className="flex h-full items-center justify-center text-sm text-gray-400"><Loader2 size={18} className="mr-2 animate-spin" /> Loading template...</div>;
  if (!template) return <NotFoundView />;

  return (
    <div className="flex h-full flex-col bg-gray-50/30 dark:bg-transparent">
      <header className="border-b border-gray-200 px-6 py-5 dark:border-border-dark">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Link to="/templates" className="hover:text-primary">Templates</Link>
              <span>/</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">{template.name}</span>
            </div>
              <div className="mt-3 flex items-center gap-3">
                <HeaderIcon />
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{template.name}</h1>
                  <p className="text-sm text-gray-400">{template.description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
            {isActiveInScope ? (
              <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400">
                <ShieldCheck size={15} />
                Active in scope
              </span>
            ) : (
              <Link to={`/templates/${template.id}/apply`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20">
                <Send size={15} /> Apply Template
              </Link>
            )}
            {canManage && (
              <>
                {template.isActive ? (
                  <button onClick={handleDeactivate} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold dark:border-border-dark">Deactivate</button>
                ) : (
                  <button onClick={handleActivate} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold dark:border-border-dark">Activate</button>
                )}
                <Link to={`/templates/${template.id}/edit`} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold dark:border-border-dark">Edit</Link>
                <button onClick={handleDuplicate} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold dark:border-border-dark">Duplicate</button>
                <button onClick={handleDelete} className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400">Delete</button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid w-full max-w-[1320px] grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <main className="space-y-5">
            <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                    template.category === 'Custom' ? customCategoryTone : categoryTone[template.category]
                  }`}
                >
                  {template.category === 'Custom' ? template.customCategory || 'Custom' : template.category}
                </span>
                <TypeBadge type={template.issueType} />
                <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:bg-white/5 dark:text-gray-400">{formatDisplayLabel(String(template.defaultPriority))}</span>
                {template.isActive && <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Active</span>}
              </div>
              <h2 className="mt-5 text-sm font-bold">Generated issue title</h2>
              <p className="mt-2 rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-sm font-semibold dark:border-border-dark dark:bg-white/5">{template.titleTemplate}</p>
              <h2 className="mt-5 text-sm font-bold">Generated issue description</h2>
              <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-sm leading-6 text-gray-600 dark:border-border-dark dark:bg-white/5 dark:text-gray-300">{template.contentTemplate}</pre>
              {template.issueType === 'bug' && (
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <TemplateFieldPreview title="Steps to reproduce" value={template.stepsToReproduceTemplate} />
                  <TemplateFieldPreview title="Expected" value={template.expectedBehaviorTemplate} />
                  <TemplateFieldPreview title="Actual" value={template.actualBehaviorTemplate} />
                </div>
              )}
              {template.issueType === 'issue' && (
                <div className="mt-5 space-y-3">
                  <TemplateFieldPreview title="Acceptance criteria" value={template.acceptanceCriteriaTemplate} />
                  <TemplateFieldPreview title="Related issues" value={template.relatedIssueKeysTemplate} />
                  <TemplateFieldPreview title="Notes" value={template.notesTemplate} />
                </div>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
              <h2 className="text-sm font-bold">Checklist subtasks</h2>
              <div className="mt-4 space-y-2">
                {template.checklistItems.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-border-dark">
                    <CheckSquare size={14} className="text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
            <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
              <h2 className="text-sm font-bold">Usage</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric icon={<Sparkles size={15} />} label="Applied" value={String(template.usageCount)} />
                <Metric icon={<Clock size={15} />} label="Last used" value={toRelative(template.lastAppliedAt)} />
                <Metric icon={<User size={15} />} label="Creator" value={template.createdBy.name} />
                <Metric icon={<Hash size={15} />} label="Updated" value={formatDate(template.updatedAt)} />
              </div>
            </section>
            <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
              <h2 className="text-sm font-bold">Defaults</h2>
              <div className="mt-4 space-y-3 text-sm">
                <DetailRow icon={<User size={15} />} label="Assignee" value={assigneeText[template.defaultAssigneeType]} />
                <DetailRow icon={<Hash size={15} />} label="Status" value={getTemplateStatusLabel(template.defaultStatus, template.customStatus)} />
                {template.issueType === 'bug' && <DetailRow icon={<Bug size={15} />} label="Severity" value={formatDisplayLabel(String(template.defaultSeverity ?? 'medium'))} />}
                <DetailRow icon={<Layers size={15} />} label="Estimate" value={template.defaultEstimate ? `${template.defaultEstimate} points` : 'None'} />
                <DetailRow icon={<Clock size={15} />} label="Due date" value={template.defaultDueDateOffset ? `+${template.defaultDueDateOffset} days` : 'None'} />
                <DetailRow icon={<Tag size={15} />} label="Labels" value={template.defaultLabelIds.join(', ') || 'None'} />
              </div>
            </section>
          </aside>
        </div>
      </div>
      {activationConflict && (
        <div
          className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActivationConflict(null);
          }}
        >
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11131A] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.55)]" onMouseDown={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-100">Activate template conflict</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {activationConflict.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivationConflict(null)}
                  className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 transition-colors hover:border-gray-500 hover:text-gray-200"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-300">
                <p className="font-semibold text-gray-100">An active {activationConflict.issueType} template already exists.</p>
                <p className="mt-2 text-gray-400">
                  Active: <span className="text-gray-100">{activationConflict.activeTemplate.name}</span>
                </p>
                <p className="text-gray-400">
                  New: <span className="text-gray-100">{activationConflict.candidateTemplate.name}</span>
                </p>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActivationConflict(null)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:border-white/20 hover:bg-white/5"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={handleConfirmActivate}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20"
                >
                  Yes, activate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ApplyTemplateView: React.FC<{ templateId: string }> = ({ templateId }) => {
  const navigate = useNavigate();
  const templateQuery = useTemplateDetail(templateId);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const template = templateQuery.data;

  useEffect(() => {
    if (!template) return;
    setDraftTitle(template.titleTemplate || '');
    setDraftDescription(template.contentTemplate || '');
  }, [template]);

  if (templateQuery.isLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-gray-400"><Loader2 size={18} className="mr-2 animate-spin" /> Loading template...</div>;
  }
  if (!template) return <NotFoundView />;

  const createIssue = () => {
    const dueDate =
      template.defaultDueDateOffset && template.defaultDueDateOffset > 0
        ? new Date(Date.now() + template.defaultDueDateOffset * 86400000).toISOString().slice(0, 10)
        : '';
    const issueDraft = {
      title: draftTitle,
      description: draftDescription,
      type: template.issueType,
      templateId: template.id,
      priority: template.defaultPriority,
      status: template.defaultStatus,
      assigneeId: template.defaultAssigneeType === 'SPECIFIC_USER' ? template.defaultAssigneeId ?? undefined : undefined,
      dueDate,
      dueTime: '12:00',
      estimate: template.defaultEstimate ? String(template.defaultEstimate) : '',
      selectedLabelIds: template.defaultLabelIds,
      subtasks: template.checklistItems.map((title, index) => ({
        id: `template-subtask-${index}`,
        title,
        completed: false,
        order: index,
      })),
      stepsToReproduce: template.stepsToReproduceTemplate ?? '',
      expectedBehavior: template.expectedBehaviorTemplate ?? '',
      actualBehavior: template.actualBehaviorTemplate ?? '',
      severity: template.defaultSeverity ?? 'medium',
      acceptanceCriteria: template.acceptanceCriteriaTemplate ?? '',
      relatedIssues: template.relatedIssueKeysTemplate ?? '',
      notes: template.notesTemplate ?? '',
    };
    navigate('/issues/create', { state: { issueDraft } });
  };

  return (
    <div className="flex h-full flex-col bg-gray-50/30 dark:bg-transparent">
      <header className="border-b border-gray-200 px-6 py-5 dark:border-border-dark">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Link to="/templates" className="hover:text-primary">Templates</Link>
              <span>/</span>
              <Link to={`/templates/${template.id}`} className="hover:text-primary">{template.name}</Link>
              <span>/</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">Apply</span>
            </div>
            <h1 className="mt-3 text-xl font-bold tracking-tight">Review issue draft</h1>
            <p className="mt-1 text-sm text-gray-400">Review the draft before creating the issue.</p>
          </div>
          <button onClick={createIssue} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20"><Send size={16} /> Continue to Create Issue</button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid w-full max-w-[1320px] grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <main className="space-y-5 rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Issue title</span>
              <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-border-dark dark:bg-white/5" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Issue description</span>
              <textarea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} className="h-96 w-full resize-none rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-sm leading-6 outline-none focus:border-primary dark:border-border-dark dark:bg-white/5" />
            </label>
          </main>
          <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
            <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
              <h2 className="text-sm font-bold">Defaults</h2>
              <div className="mt-4 space-y-3 text-sm">
                <DetailRow icon={<Flag size={15} />} label="Priority" value={formatDisplayLabel(String(template.defaultPriority))} />
                <DetailRow icon={<Hash size={15} />} label="Status" value={getTemplateStatusLabel(template.defaultStatus, template.customStatus)} />
                <DetailRow icon={<User size={15} />} label="Assignee" value={assigneeText[template.defaultAssigneeType]} />
                {template.issueType === 'bug' && <DetailRow icon={<Bug size={15} />} label="Severity" value={formatDisplayLabel(String(template.defaultSeverity ?? 'medium'))} />}
                <DetailRow icon={<Layers size={15} />} label="Estimate" value={template.defaultEstimate ? `${template.defaultEstimate} points` : 'None'} />
              </div>
            </section>
            {template.issueType === 'bug' && (
              <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
                <h2 className="text-sm font-bold">Bug fields</h2>
                <div className="mt-4 space-y-3">
                  <TemplateFieldPreview title="Steps" value={template.stepsToReproduceTemplate} />
                  <TemplateFieldPreview title="Expected" value={template.expectedBehaviorTemplate} />
                  <TemplateFieldPreview title="Actual" value={template.actualBehaviorTemplate} />
                </div>
              </section>
            )}
            {template.issueType === 'issue' && (
              <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
                <h2 className="text-sm font-bold">Issue fields</h2>
                <div className="mt-4 space-y-3">
                  <TemplateFieldPreview title="Acceptance criteria" value={template.acceptanceCriteriaTemplate} />
                  <TemplateFieldPreview title="Related issues" value={template.relatedIssueKeysTemplate} />
                  <TemplateFieldPreview title="Notes" value={template.notesTemplate} />
                </div>
              </section>
            )}
            {template.checklistItems.length > 0 && (
              <section className="rounded-xl border border-gray-200 bg-white/70 p-5 dark:border-border-dark dark:bg-transparent">
                <h2 className="text-sm font-bold">Subtasks</h2>
                <div className="mt-4 space-y-2">
                  {template.checklistItems.map((item) => <div key={item} className="text-sm text-gray-400">- {item}</div>)}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-lg border border-gray-200/70 bg-white/50 p-3 dark:border-border-dark dark:bg-white/[0.03]">
    <div className="flex items-center gap-2 text-gray-400">{icon}<span className="text-[10px] font-bold uppercase tracking-[0.14em]">{label}</span></div>
    <p className="mt-2 truncate text-sm font-semibold">{value}</p>
  </div>
);

const TemplateFieldPreview: React.FC<{ title: string; value?: string | null }> = ({ title, value }) => (
  <div className="rounded-lg border border-gray-200/70 bg-transparent p-4 dark:border-border-dark">
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">{title}</p>
    <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
      {value?.trim() || 'Not configured'}
    </pre>
  </div>
);

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="flex items-center gap-2 text-gray-400">{icon}{label}</span>
    <span className="truncate text-right font-semibold text-gray-700 dark:text-gray-200">{value}</span>
  </div>
);

const NotFoundView = () => (
  <div className="flex h-full flex-col items-center justify-center text-center">
    <AlertTriangle size={28} className="text-gray-500" />
    <h1 className="mt-4 text-lg font-bold">Template not found</h1>
    <p className="mt-2 text-sm text-gray-400">The template may have been deleted or moved.</p>
    <Link to="/templates" className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">Back to templates</Link>
  </div>
);

const AccessDeniedView = () => (
  <div className="flex h-full flex-col items-center justify-center text-center">
    <ShieldCheck size={28} className="text-primary" />
    <h1 className="mt-4 text-lg font-bold">Template management restricted</h1>
    <p className="mt-2 max-w-sm text-sm text-gray-400">
      Only workspace owners and admins can create or edit templates.
    </p>
    <Link to="/templates" className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">
      Back to templates
    </Link>
  </div>
);

export const TemplatesPage: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const location = useLocation();
  const isNew = location.pathname === '/templates/new';
  const isEdit = location.pathname.endsWith('/edit');
  const isApply = location.pathname.endsWith('/apply');
  const templateQuery = useTemplateDetail(isEdit ? templateId : undefined);

  if (isNew) return <TemplateFormView mode="create" />;
  if (isEdit) return <TemplateFormView mode="edit" template={templateQuery.data} isLoading={templateQuery.isLoading} />;
  if (isApply && templateId) return <ApplyTemplateView templateId={templateId} />;
  if (templateId) return <TemplateDetailView templateId={templateId} />;
  return <TemplatesListView />;
};
