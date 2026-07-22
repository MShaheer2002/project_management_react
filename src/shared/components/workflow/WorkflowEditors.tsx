/**
 * Shared workflow editing UI — statuses, transitions, entry rules, cycle behavior,
 * and automation config. Scope-agnostic: callers (workspace settings, project
 * settings) supply the initial data and save/usage-lookup functions as props,
 * so the same editor works whether it's editing the workspace default workflow
 * or a single project's override.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Download, GitMerge, GripVertical, Loader2, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToastStore } from '@/app/stores/useToastStore';
import type { WorkflowAutomationConfig, WorkspaceStatus } from '@/types';
import type { ApiAxiosError } from '@shared/services/types';
import type { WorkspaceMemberOption } from '@features/workspace';
import type { WorkspaceStatusRemovalResolution } from '@features/workspace/services/workspaceService';
import { Modal } from '@shared/components/ui/Modal';
import { MemberSearchDialog } from '@shared/components/ui/MemberSearchDialog';

const STATUS_COLORS = [
  '#6b7280', '#3b82f6', '#f59e0b', '#8b5cf6', '#22c55e',
  '#ec4899', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
];
const STATUS_CATEGORY_OPTIONS: Array<{ value: WorkspaceStatus['category']; label: string }> = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'unstarted', label: 'Unstarted' },
  { value: 'active', label: 'Active' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];
const TRANSITION_ROLE_OPTIONS: Array<{ value: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST'; label: string }> = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'GUEST', label: 'Guest' },
];

const toKebabCase = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const WorkflowConfigSection: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, children, className }) => (
  <div className={`-mx-4 space-y-3 border-t border-gray-200/90 px-4 py-4 first:border-t-0 first:pt-0 first:pb-4 dark:border-border-dark/90 ${className ?? ''}`}>
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">{title}</h4>
      <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{description}</p>
    </div>
    {children}
  </div>
);

const WorkflowCheckboxItem: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, disabled, onChange }) => (
  <label className={`flex items-start justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.03] ${disabled ? 'opacity-50' : ''}`}>
    <div className="min-w-0">
      <div className="text-xs font-medium text-gray-800 dark:text-gray-100">{label}</div>
      {description ? <div className="mt-0.5 text-[11px] leading-4 text-gray-400">{description}</div> : null}
    </div>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-primary focus:ring-primary/20"
    />
  </label>
);

const TransitionUserPicker: React.FC<{
  selectedUserIds: string[];
  disabled?: boolean;
  onAdd: (userId: string) => void;
  onRemove: (userId: string) => void;
}> = ({ selectedUserIds, disabled, onAdd, onRemove }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nameCache, setNameCache] = useState<Record<string, WorkspaceMemberOption>>({});

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {selectedUserIds.map((userId) => (
        <span
          key={userId}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-700 dark:border-border-dark dark:bg-white/5 dark:text-gray-200"
        >
          {nameCache[userId]?.name ?? 'Member'}
          {!disabled && (
            <button
              type="button"
              onClick={() => onRemove(userId)}
              className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={10} />
            </button>
          )}
        </span>
      ))}

      {!disabled && (
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-500 transition-colors hover:border-primary/40 hover:text-primary dark:border-border-dark"
        >
          <Plus size={10} /> Add person
        </button>
      )}

      <MemberSearchDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        excludeIds={selectedUserIds}
        title="Add person"
        onSelect={(member) => {
          setNameCache((prev) => (prev[member.id] ? prev : { ...prev, [member.id]: member }));
          onAdd(member.id);
        }}
      />
    </div>
  );
};

const createDefaultWorkflowStatus = (label: string, key: string, order: number): WorkspaceStatus => ({
  key,
  label,
  color: STATUS_COLORS[order % STATUS_COLORS.length],
  order,
  category: 'active',
  isActive: true,
  isFinal: false,
  showOnBoard: true,
  visibility: {
    board: true,
    list: true,
    filters: true,
    create: true,
    cycleBoard: true,
    cycleList: true,
  },
  cycle: {
    allowedInCycle: true,
    countsAsCompleted: false,
    countsAsCarryOver: true,
    planIntoThisStatus: false,
  },
  transitions: {
    mode: 'free',
    to: [],
    allowRollback: false,
    allowedRoles: ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'],
    allowedUserIds: [],
    assigneeOnly: false,
    creatorOnly: false,
  },
  rules: {
    requireAssignee: false,
    requireDueDate: false,
    requireAllSubtasksComplete: false,
    requireAcceptanceCriteria: false,
    requireParentIssue: false,
    requireIntegrationRef: false,
  },
  approval: {
    required: false,
    requiredCount: 1,
    reviewerSource: 'project_members',
    reviewerUserIds: [],
  },
});

export type WorkflowStatusUsage = {
  statusKey: string;
  label: string;
  issueCount: number;
  truncated?: boolean;
  issues: Array<{ id: string; publicId: string; title: string; project: { id: string; name: string } | null }>;
};

export const WorkflowStatusesEditor: React.FC<{
  initialStatuses: WorkspaceStatus[];
  canManage: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onSave: (data: { statuses: WorkspaceStatus[]; removalResolutions: WorkspaceStatusRemovalResolution[] }) => Promise<WorkspaceStatus[]>;
  onSaved?: (saved: WorkspaceStatus[]) => void;
  getStatusUsage: (statusKey: string, limit?: number) => Promise<WorkflowStatusUsage>;
  onMergeStatus?: (sourceKey: string, targetStatusKey: string) => Promise<WorkspaceStatus[]>;
}> = ({ initialStatuses, canManage, onDirtyChange, onSave, onSaved, getStatusUsage, onMergeStatus }) => {
  const showToast = useToastStore((s) => s.showToast);
  const workspaceStatuses = initialStatuses;
  const [statuses, setStatuses] = useState<WorkspaceStatus[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [transitionSearch, setTransitionSearch] = useState('');
  const [removalResolutions, setRemovalResolutions] = useState<Record<string, WorkspaceStatusRemovalResolution>>({});
  const [checkingStatusUsageKey, setCheckingStatusUsageKey] = useState<string | null>(null);
  const [statusRemovalDialog, setStatusRemovalDialog] = useState<{
    status: WorkspaceStatus;
    issueCount: number;
    issues: Array<{
      id: string;
      publicId: string;
      title: string;
      project: {
        id: string;
        name: string;
      } | null;
    }>;
    action: 'move' | 'delete';
    targetStatusKey: string;
  } | null>(null);
  const [mergeDialog, setMergeDialog] = useState<{ status: WorkspaceStatus; targetStatusKey: string } | null>(null);
  const [exportingStatusKey, setExportingStatusKey] = useState<string | null>(null);

  useEffect(() => {
    setStatuses(workspaceStatuses.map((s, i) => ({ ...s, order: i })));
    setHasChanges(false);
    setRemovalResolutions({});
  }, [workspaceStatuses]);

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  useEffect(() => {
    setExpandedKeys((current) => {
      const statusKeys = workspaceStatuses.map((status) => status.key);
      const persisted = current.filter((key) => statusKeys.includes(key));
      return persisted;
    });
  }, [workspaceStatuses]);

  const saveMutation = useMutation({
    mutationFn: (data: { statuses: WorkspaceStatus[]; removalResolutions: WorkspaceStatusRemovalResolution[] }) =>
      onSave(data),
    onSuccess: (saved) => {
      showToast('Workflow updated.', 'success');
      setHasChanges(false);
      setRemovalResolutions({});
      onSaved?.(saved);
    },
    onError: (error: unknown) => {
      const msg = (error as ApiAxiosError)?.response?.data?.error?.message || 'Failed to save statuses.';
      showToast(msg, 'error');
    },
  });

  const update = useCallback((fn: (prev: WorkspaceStatus[]) => WorkspaceStatus[]) => {
    setStatuses((prev) => {
      const next = fn(prev);
      setHasChanges(true);
      return next;
    });
  }, []);

  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label) return;
    const key = toKebabCase(label);
    if (statuses.some((s) => s.key === key)) { showToast('Status key already exists.', 'error'); return; }
    update((prev) => [...prev, createDefaultWorkflowStatus(label, key, prev.length)]);
    setExpandedKeys((prev) => [...new Set([...prev, key])]);
    setNewLabel('');
    setAddingNew(false);
  };

  const handleRemove = (key: string) => {
    if (statuses.length <= 1) { showToast('Need at least one status.', 'error'); return; }
    const target = statuses.find((s) => s.key === key);
    if (target?.isFinal && statuses.filter((s) => s.isFinal).length <= 1) { showToast('Need at least one final status.', 'error'); return; }
    update((prev) => prev.filter((s) => s.key !== key).map((s, i) => ({ ...s, order: i })));
    setExpandedKeys((prev) => prev.filter((item) => item !== key));
    setRemovalResolutions((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleRequestRemove = useCallback(async (status: WorkspaceStatus) => {
    if (statuses.length <= 1) {
      showToast('Need at least one status.', 'error');
      return;
    }
    if (status.isFinal && statuses.filter((item) => item.isFinal).length <= 1) {
      showToast('Need at least one final status.', 'error');
      return;
    }

    setCheckingStatusUsageKey(status.key);
    try {
      const usage = await getStatusUsage(status.key);
      if (usage.issueCount <= 0) {
        handleRemove(status.key);
        return;
      }

      const targetStatusKey =
        statuses.find((candidate) => candidate.key !== status.key && !candidate.isFinal)?.key
        ?? statuses.find((candidate) => candidate.key !== status.key)?.key
        ?? '';

      setStatusRemovalDialog({
        status,
        issueCount: usage.issueCount,
        issues: usage.issues,
        action: 'move',
        targetStatusKey,
      });
    } catch (error) {
      const msg = (error as ApiAxiosError)?.response?.data?.error?.message || 'Failed to check workflow usage.';
      showToast(msg, 'error');
    } finally {
      setCheckingStatusUsageKey((current) => (current === status.key ? null : current));
    }
  }, [handleRemove, showToast, statuses, getStatusUsage]);

  const confirmStatusRemoval = useCallback(() => {
    if (!statusRemovalDialog) return;
    if (statusRemovalDialog.action === 'move' && !statusRemovalDialog.targetStatusKey) {
      showToast('Select another workflow for the existing issues.', 'error');
      return;
    }

    setRemovalResolutions((prev) => ({
      ...prev,
      [statusRemovalDialog.status.key]: {
        statusKey: statusRemovalDialog.status.key,
        action: statusRemovalDialog.action,
        targetStatusKey: statusRemovalDialog.action === 'move' ? statusRemovalDialog.targetStatusKey : null,
      },
    }));

    handleRemove(statusRemovalDialog.status.key);
    setStatusRemovalDialog(null);
  }, [handleRemove, showToast, statusRemovalDialog]);

  const mergeMutation = useMutation({
    mutationFn: ({ sourceKey, targetStatusKey }: { sourceKey: string; targetStatusKey: string }) =>
      onMergeStatus!(sourceKey, targetStatusKey),
    onSuccess: (saved) => {
      showToast('Statuses merged.', 'success');
      setMergeDialog(null);
      onSaved?.(saved);
    },
    onError: (error: unknown) => {
      const msg = (error as ApiAxiosError)?.response?.data?.error?.message || 'Failed to merge statuses.';
      showToast(msg, 'error');
    },
  });

  const downloadIssuesAsCsv = (status: WorkspaceStatus, issues: WorkflowStatusUsage['issues']) => {
    const header = ['Issue ID', 'Title', 'Project'];
    const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = issues.map((issue) => [issue.publicId, issue.title, issue.project?.name ?? ''].map(escapeCell).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${status.key}-issues.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportUsage = useCallback(async (status: WorkspaceStatus) => {
    setExportingStatusKey(status.key);
    try {
      const usage = await getStatusUsage(status.key, 1000);
      if (usage.issues.length === 0) {
        showToast('No issues to export.', 'info');
        return;
      }
      downloadIssuesAsCsv(status, usage.issues);
      if (usage.truncated) {
        showToast(`Exported the first 1000 of ${usage.issueCount} issues.`, 'info');
      }
    } catch (error) {
      const msg = (error as ApiAxiosError)?.response?.data?.error?.message || 'Failed to export issues.';
      showToast(msg, 'error');
    } finally {
      setExportingStatusKey((current) => (current === status.key ? null : current));
    }
  }, [getStatusUsage, showToast]);

  const handleToggleFinal = (key: string) => {
    const target = statuses.find((s) => s.key === key);
    if (target?.isFinal && statuses.filter((s) => s.isFinal).length <= 1) { showToast('Need at least one final status.', 'error'); return; }
    update((prev) => prev.map((s) => s.key === key ? { ...s, isFinal: !s.isFinal } : s));
  };

  const handleColorChange = (key: string, color: string) => {
    update((prev) => prev.map((s) => s.key === key ? { ...s, color } : s));
  };

  const handleToggleBoardVisibility = (key: string) => {
    const visibleCount = statuses.filter((s) => s.visibility.board !== false).length;
    const target = statuses.find((s) => s.key === key);
    if (target?.visibility.board !== false && visibleCount <= 1) {
      showToast('At least one status must stay visible on the board.', 'error');
      return;
    }
    update((prev) => prev.map((s) => s.key === key ? {
      ...s,
      showOnBoard: s.visibility.board === false,
      visibility: { ...s.visibility, board: s.visibility.board === false },
    } : s));
  };

  const handleCategoryChange = (key: string, category: WorkspaceStatus['category']) => {
    update((prev) => prev.map((status) => {
      if (status.key !== key) return status;
      const isFinal = category === 'done' ? true : category === 'cancelled' ? false : status.isFinal;
      return {
        ...status,
        category,
        isFinal,
        visibility: {
          ...status.visibility,
          create: category === 'done' || category === 'cancelled' ? false : status.visibility.create,
          cycleBoard: category === 'backlog' || category === 'cancelled' ? false : status.visibility.cycleBoard,
          cycleList: category === 'cancelled' ? false : status.visibility.cycleList,
        },
        cycle: {
          ...status.cycle,
          allowedInCycle: category !== 'cancelled',
          countsAsCompleted: category === 'done' ? true : category === 'cancelled' ? false : status.cycle.countsAsCompleted,
          countsAsCarryOver: category === 'done' || category === 'cancelled' ? false : status.cycle.countsAsCarryOver,
        },
      };
    }));
  };

  const handleVisibilityChange = (key: string, field: keyof WorkspaceStatus['visibility'], checked: boolean) => {
    update((prev) => prev.map((status) => {
      if (status.key !== key) return status;
      const nextVisibility = { ...status.visibility, [field]: checked };
      return {
        ...status,
        showOnBoard: field === 'board' ? checked : status.showOnBoard,
        visibility: nextVisibility,
      };
    }));
  };

  const handleActiveChange = (key: string, checked: boolean) => {
    update((prev) => prev.map((status) => {
      if (status.key !== key) return status;

      if (!checked) {
        return {
          ...status,
          isActive: false,
          showOnBoard: false,
          visibility: {
            ...status.visibility,
            board: false,
            create: false,
            cycleBoard: false,
            cycleList: false,
          },
        };
      }

      const nextVisibility = {
        ...status.visibility,
        board: status.visibility.board,
        create: status.visibility.create || !status.isFinal,
        cycleBoard: status.visibility.cycleBoard || (status.category !== 'backlog' && status.category !== 'cancelled'),
        cycleList: true,
      };

      return {
        ...status,
        isActive: true,
        showOnBoard: nextVisibility.board,
        visibility: nextVisibility,
      };
    }));
  };

  const handleCycleConfigChange = (key: string, field: keyof WorkspaceStatus['cycle'], checked: boolean) => {
    update((prev) => prev.map((status) => {
      if (status.key !== key) return status;
      if (field === 'planIntoThisStatus' && checked) {
        return {
          ...status,
          cycle: { ...status.cycle, planIntoThisStatus: true },
        };
      }
      return {
        ...status,
        cycle: { ...status.cycle, [field]: checked },
      };
    }).map((status) => field === 'planIntoThisStatus' && checked && status.key !== key
      ? { ...status, cycle: { ...status.cycle, planIntoThisStatus: false } }
      : status));
  };

  const handleTransitionModeChange = (key: string, mode: WorkspaceStatus['transitions']['mode']) => {
    update((prev) => prev.map((status) => status.key === key
      ? {
          ...status,
          transitions: {
            ...status.transitions,
            mode,
            to: mode === 'free' ? [] : status.transitions.to,
          },
        }
      : status));
  };

  const handleTransitionTargetToggle = (key: string, targetKey: string, checked: boolean) => {
    update((prev) => prev.map((status) => {
      if (status.key !== key) return status;
      const nextTargets = checked
        ? [...new Set([...status.transitions.to, targetKey])]
        : status.transitions.to.filter((value) => value !== targetKey);
      return {
        ...status,
        transitions: {
          ...status.transitions,
          to: nextTargets,
        },
      };
    }));
  };

  const handleTransitionRoleToggle = (key: string, role: WorkspaceStatus['transitions']['allowedRoles'][number], checked: boolean) => {
    update((prev) => prev.map((status) => {
      if (status.key !== key) return status;
      const nextRoles = checked
        ? [...new Set([...status.transitions.allowedRoles, role])]
        : status.transitions.allowedRoles.filter((value) => value !== role);
      return {
        ...status,
        transitions: {
          ...status.transitions,
          allowedRoles: nextRoles.length > 0 ? nextRoles : status.transitions.allowedRoles,
        },
      };
    }));
  };

  const handleTransitionUserAdd = (key: string, userId: string) => {
    update((prev) => prev.map((status) => status.key === key
      ? {
          ...status,
          transitions: {
            ...status.transitions,
            allowedUserIds: [...new Set([...status.transitions.allowedUserIds, userId])],
          },
        }
      : status));
  };

  const handleTransitionUserRemove = (key: string, userId: string) => {
    update((prev) => prev.map((status) => status.key === key
      ? {
          ...status,
          transitions: {
            ...status.transitions,
            allowedUserIds: status.transitions.allowedUserIds.filter((value) => value !== userId),
          },
        }
      : status));
  };

  const handleTransitionConstraintChange = (key: string, field: 'assigneeOnly' | 'creatorOnly' | 'allowRollback', checked: boolean) => {
    update((prev) => prev.map((status) => status.key === key
      ? {
          ...status,
          transitions: {
            ...status.transitions,
            [field]: checked,
          },
        }
      : status));
  };

  const handleRuleChange = (key: string, field: keyof WorkspaceStatus['rules'], checked: boolean) => {
    update((prev) => prev.map((status) => status.key === key
      ? {
          ...status,
          rules: {
            ...status.rules,
            [field]: checked,
          },
        }
      : status));
  };

  const handleApprovalRequiredChange = (key: string, required: boolean) => {
    update((prev) => prev.map((status) => status.key === key
      ? { ...status, approval: { ...status.approval, required } }
      : status));
  };

  const handleApprovalRequiredCountChange = (key: string, requiredCount: number) => {
    update((prev) => prev.map((status) => status.key === key
      ? { ...status, approval: { ...status.approval, requiredCount: Math.max(1, requiredCount) } }
      : status));
  };

  const handleApprovalReviewerSourceChange = (key: string, reviewerSource: WorkspaceStatus['approval']['reviewerSource']) => {
    update((prev) => prev.map((status) => status.key === key
      ? { ...status, approval: { ...status.approval, reviewerSource } }
      : status));
  };

  const handleApprovalReviewerAdd = (key: string, userId: string) => {
    update((prev) => prev.map((status) => status.key === key
      ? {
          ...status,
          approval: {
            ...status.approval,
            reviewerUserIds: [...new Set([...status.approval.reviewerUserIds, userId])],
          },
        }
      : status));
  };

  const handleApprovalReviewerRemove = (key: string, userId: string) => {
    update((prev) => prev.map((status) => status.key === key
      ? {
          ...status,
          approval: {
            ...status.approval,
            reviewerUserIds: status.approval.reviewerUserIds.filter((id) => id !== userId),
          },
        }
      : status));
  };

  const handleRename = (key: string) => {
    const label = editLabel.trim();
    if (!label) return;
    const newKey = toKebabCase(label);
    if (newKey !== key && statuses.some((s) => s.key === newKey)) { showToast('Status key already exists.', 'error'); return; }
    update((prev) => prev.map((s) => s.key === key ? { ...s, key: newKey, label } : s));
    if (newKey !== key) {
      setExpandedKeys((prev) => prev.map((item) => (item === key ? newKey : item)));
    }
    setEditingKey(null);
    setEditLabel('');
  };

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => (
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    ));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDragEnd = () => {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
      update((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(dragOverIdx, 0, moved);
        return next.map((s, i) => ({ ...s, order: i }));
      });
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleSave = () => {
    const finalCount = statuses.filter((s) => s.isFinal).length;
    if (finalCount === 0) { showToast('At least one status must be marked as final (completion).', 'error'); return; }
    saveMutation.mutate({
      statuses: statuses.map((s, i) => ({ ...s, order: i })),
      removalResolutions: Object.values(removalResolutions),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Workflow</h3>
          <p className="mt-1 text-xs text-gray-400">Define the statuses issues move through. Drag to reorder and decide which statuses appear on board.</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <button
              type="button"
              onClick={() => { setAddingNew(true); setNewLabel(''); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary dark:border-border-dark"
            >
              <Plus size={13} /> Add status
            </button>
          )}
          {hasChanges && canManage && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {saveMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Save
            </button>
          )}
        </div>
      </div>

      <div className={`space-y-1${saveMutation.isPending ? ' pointer-events-none opacity-60' : ''}`}>
        {statuses.map((status, idx) => {
          const isExpanded = expandedKeys.includes(status.key);
          const visibilitySummary = [
            status.visibility.board ? 'Board' : null,
            status.visibility.list ? 'List' : null,
            status.visibility.cycleBoard ? 'Cycle board' : null,
            status.visibility.cycleList ? 'Cycle list' : null,
          ].filter(Boolean).join(' · ');

          return (
            <div
              key={status.key}
              className={`rounded-lg border p-3 transition-all ${
                dragOverIdx === idx ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white dark:border-border-dark dark:bg-card-dark'
              }`}
            >
            <div
              draggable={canManage}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className="group flex items-center gap-3"
            >
              {canManage && (
                <GripVertical size={14} className="shrink-0 cursor-grab text-gray-300 active:cursor-grabbing dark:text-gray-600" />
              )}

              <button
                type="button"
                onClick={() => toggleExpanded(status.key)}
                className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:text-primary"
                aria-label={isExpanded ? `Collapse ${status.label}` : `Expand ${status.label}`}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {/* Color dot with picker */}
              <div className="relative">
                <input
                  type="color"
                  value={status.color}
                  onChange={(e) => handleColorChange(status.key, e.target.value)}
                  disabled={!canManage}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: status.color }} />
              </div>

              {/* Label */}
              {editingKey === status.key ? (
                <input
                  autoFocus
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename(status.key); if (e.key === 'Escape') setEditingKey(null); }}
                  className="min-w-0 flex-1 rounded border border-primary/40 bg-transparent px-2 py-0.5 text-sm outline-none"
                />
              ) : (
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-text-primary-dark">{status.label}</div>
                  {!isExpanded && (
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400">
                      <span>{STATUS_CATEGORY_OPTIONS.find((option) => option.value === status.category)?.label ?? 'Active'}</span>
                      {visibilitySummary ? <span>{visibilitySummary}</span> : null}
                    </div>
                  )}
                </div>
              )}

              {/* Final badge */}
              {status.isFinal && (
                <span className="shrink-0 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-500">
                  Done
                </span>
              )}
              {status.isActive === false && (
                <span className="shrink-0 rounded-full bg-gray-500/10 px-2 py-0.5 text-[10px] font-bold text-gray-400">
                  Inactive
                </span>
              )}
              {status.visibility.board === false && (
                <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  List only
                </span>
              )}

              {/* Actions */}
              {canManage && (
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {editingKey === status.key ? (
                    <button type="button" onClick={() => handleRename(status.key)} className="rounded p-1 text-primary hover:bg-primary/10"><Check size={13} /></button>
                  ) : (
                    <button type="button" onClick={() => { setEditingKey(status.key); setEditLabel(status.label); }} className="rounded p-1 text-gray-400 hover:text-primary"><Pencil size={13} /></button>
                  )}
                  <button
                    type="button"
                    onClick={() => { void handleExportUsage(status); }}
                    disabled={exportingStatusKey === status.key}
                    title="Export issues on this status (CSV)"
                    className="rounded p-1 text-gray-400 hover:text-primary disabled:opacity-50"
                  >
                    {exportingStatusKey === status.key ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  </button>
                  {onMergeStatus && statuses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setMergeDialog({
                        status,
                        targetStatusKey: statuses.find((candidate) => candidate.key !== status.key)?.key ?? '',
                      })}
                      title="Merge into another status"
                      className="rounded p-1 text-gray-400 hover:text-primary"
                    >
                      <GitMerge size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { void handleRequestRemove(status); }}
                    disabled={checkingStatusUsageKey === status.key}
                    className="rounded p-1 text-gray-400 hover:text-red-500 disabled:opacity-50"
                  >
                    {checkingStatusUsageKey === status.key ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              )}
            </div>

            {isExpanded ? (
            <div className="mt-3 px-4 py-3">
              <WorkflowConfigSection
                title="Lifecycle"
                description="Keep a workflow active or archive it from day-to-day operations."
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <WorkflowCheckboxItem
                    label="Active workflow"
                    description="Inactive workflows stay on historical issues but are removed from create, board, and cycle views."
                    checked={status.isActive !== false}
                    disabled={!canManage}
                    onChange={(checked) => handleActiveChange(status.key, checked)}
                  />
                </div>
              </WorkflowConfigSection>

              <WorkflowConfigSection
                title="Category"
                description="Overall stage type."
              >
                <select
                  value={status.category}
                  disabled={!canManage}
                  onChange={(event) => handleCategoryChange(status.key, event.target.value as WorkspaceStatus['category'])}
                  className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-primary dark:border-border-dark"
                >
                  {STATUS_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </WorkflowConfigSection>

              <WorkflowConfigSection
                title="Visibility"
                description="Where this status appears."
              >
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {([
                    ['board', 'Board'],
                    ['list', 'List'],
                    ['filters', 'Filters'],
                    ['create', 'Create'],
                    ['cycleBoard', 'Cycle board'],
                    ['cycleList', 'Cycle list'],
                  ] as Array<[keyof WorkspaceStatus['visibility'], string]>).map(([field, label]) => (
                    <WorkflowCheckboxItem
                      key={field}
                      label={label}
                      checked={status.visibility[field]}
                      disabled={!canManage}
                      onChange={(checked) => handleVisibilityChange(status.key, field, checked)}
                    />
                  ))}
                </div>
              </WorkflowConfigSection>

              <WorkflowConfigSection
                title="Cycle Behavior"
                description="Cycle planning and reporting."
              >
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {([
                    ['allowedInCycle', 'Allow in cycles'],
                    ['countsAsCompleted', 'Counts complete'],
                    ['countsAsCarryOver', 'Counts carry-over'],
                    ['planIntoThisStatus', 'Default status'],
                  ] as Array<[keyof WorkspaceStatus['cycle'], string]>).map(([field, label]) => (
                    <WorkflowCheckboxItem
                      key={field}
                      label={label}
                      checked={status.cycle[field]}
                      disabled={!canManage}
                      onChange={(checked) => handleCycleConfigChange(status.key, field, checked)}
                    />
                  ))}
                </div>
              </WorkflowConfigSection>

              <WorkflowConfigSection
                title="Transition Rules"
                description="Movement permissions."
              >
                <div className="divide-y divide-gray-200/80 dark:divide-border-dark/80">
                  <div className="pb-4">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Movement mode</div>
                    <select
                      value={status.transitions.mode}
                      disabled={!canManage}
                      onChange={(event) => handleTransitionModeChange(status.key, event.target.value as WorkspaceStatus['transitions']['mode'])}
                      className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-primary dark:border-border-dark sm:max-w-xs"
                    >
                      <option value="free">Free movement</option>
                      <option value="restricted">Restricted next states</option>
                    </select>
                    <p className="mt-2 text-[11px] text-gray-400">
                      {status.transitions.mode === 'free'
                        ? 'Can move to any status.'
                        : 'Can move only to checked statuses.'}
                    </p>
                  </div>

                  {status.transitions.mode === 'restricted' && (
                    <div className="py-4">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{status.label}</span>
                        <span className="text-[11px] text-gray-400">can move to:</span>
                      </div>

                      <WorkflowCheckboxItem
                        label="Allow rollback"
                        description="Can always move back to any earlier status below."
                        checked={status.transitions.allowRollback}
                        disabled={!canManage}
                        onChange={(checked) => handleTransitionConstraintChange(status.key, 'allowRollback', checked)}
                      />

                      {statuses.length > 6 && (
                        <div className="relative mt-3 mb-1">
                          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={transitionSearch}
                            onChange={(event) => setTransitionSearch(event.target.value)}
                            placeholder="Filter statuses..."
                            className="w-full rounded-lg border border-gray-200 bg-transparent py-1.5 pl-8 pr-3 text-xs outline-none transition-colors placeholder:text-gray-400 focus:border-primary dark:border-border-dark"
                          />
                        </div>
                      )}

                      {(() => {
                        const query = transitionSearch.trim().toLowerCase();
                        const candidates = statuses.filter(
                          (candidate) => candidate.key !== status.key && candidate.label.toLowerCase().includes(query),
                        );
                        const earlier = candidates.filter((candidate) => candidate.order < status.order);
                        const laterOrSame = candidates.filter((candidate) => candidate.order >= status.order);

                        const renderGroup = (title: string, group: WorkspaceStatus[], isRollbackGroup: boolean) => {
                          if (group.length === 0) return null;
                          return (
                            <div className="mt-3">
                              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                                {title}
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {group.map((candidate) => {
                                  const coveredByRollback = isRollbackGroup && status.transitions.allowRollback;
                                  return (
                                    <WorkflowCheckboxItem
                                      key={candidate.key}
                                      label={candidate.label}
                                      description={coveredByRollback ? 'Allowed (rollback)' : undefined}
                                      checked={coveredByRollback || status.transitions.to.includes(candidate.key)}
                                      disabled={!canManage || coveredByRollback}
                                      onChange={(checked) => handleTransitionTargetToggle(status.key, candidate.key, checked)}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        };

                        return (
                          <>
                            {renderGroup('Backward', earlier, true)}
                            {renderGroup('Forward', laterOrSame, false)}
                            {candidates.length === 0 && (
                              <p className="mt-3 text-[11px] text-gray-400">No statuses match "{transitionSearch}".</p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  <div className="py-4">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Who can move issues here</div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {TRANSITION_ROLE_OPTIONS.map((option) => (
                        <WorkflowCheckboxItem
                          key={option.value}
                          label={option.label}
                          checked={status.transitions.allowedRoles.includes(option.value)}
                          disabled={!canManage}
                          onChange={(checked) => handleTransitionRoleToggle(status.key, option.value, checked)}
                        />
                      ))}
                      {([
                        ['assigneeOnly', 'Assignee only'],
                        ['creatorOnly', 'Creator only'],
                      ] as Array<['assigneeOnly' | 'creatorOnly', string]>).map(([field, label]) => (
                        <WorkflowCheckboxItem
                          key={field}
                          label={label}
                          checked={status.transitions[field]}
                          disabled={!canManage}
                          onChange={(checked) => handleTransitionConstraintChange(status.key, field, checked)}
                        />
                      ))}
                    </div>
                    <TransitionUserPicker
                      selectedUserIds={status.transitions.allowedUserIds}
                      disabled={!canManage}
                      onAdd={(userId) => handleTransitionUserAdd(status.key, userId)}
                      onRemove={(userId) => handleTransitionUserRemove(status.key, userId)}
                    />
                  </div>
                </div>
              </WorkflowConfigSection>

              <WorkflowConfigSection
                title="Entry Rules"
                description="Required before entry."
              >
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {([
                    ['requireAssignee', 'Require assignee'],
                    ['requireDueDate', 'Require due date'],
                    ['requireAllSubtasksComplete', 'Require subtasks complete'],
                    ['requireAcceptanceCriteria', 'Require acceptance criteria'],
                    ['requireParentIssue', 'Require parent issue'],
                    ['requireIntegrationRef', 'Require integration ref'],
                  ] as Array<[keyof WorkspaceStatus['rules'], string]>).map(([field, label]) => (
                    <WorkflowCheckboxItem
                      key={field}
                      label={label}
                      checked={status.rules[field]}
                      disabled={!canManage}
                      onChange={(checked) => handleRuleChange(status.key, field, checked)}
                    />
                  ))}
                </div>
              </WorkflowConfigSection>

              <WorkflowConfigSection
                title="Approval Gate"
                description="Require reviewer sign-off before this status can move forward."
              >
                <WorkflowCheckboxItem
                  label="Require approval to leave this status"
                  description="Backward/rollback moves are never blocked — only forward progress needs sign-off."
                  checked={status.approval.required}
                  disabled={!canManage}
                  onChange={(checked) => handleApprovalRequiredChange(status.key, checked)}
                />

                {status.approval.required && (
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                          Required approvals
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={status.approval.requiredCount}
                          disabled={!canManage}
                          onChange={(event) => handleApprovalRequiredCountChange(status.key, Number(event.target.value) || 1)}
                          className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-border-dark"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                          Who can approve
                        </span>
                        <select
                          value={status.approval.reviewerSource}
                          disabled={!canManage}
                          onChange={(event) => handleApprovalReviewerSourceChange(status.key, event.target.value as WorkspaceStatus['approval']['reviewerSource'])}
                          className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-border-dark"
                        >
                          <option value="project_members">Project members</option>
                          <option value="team_lead">Team lead</option>
                          <option value="department_head">Department head</option>
                          <option value="manual">Specific people</option>
                        </select>
                      </label>
                    </div>

                    {status.approval.reviewerSource === 'manual' && (
                      <div>
                        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                          Reviewers
                        </span>
                        <TransitionUserPicker
                          selectedUserIds={status.approval.reviewerUserIds}
                          disabled={!canManage}
                          onAdd={(userId) => handleApprovalReviewerAdd(status.key, userId)}
                          onRemove={(userId) => handleApprovalReviewerRemove(status.key, userId)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </WorkflowConfigSection>
            </div>
            ) : null}
          </div>
          );
        })}

        {/* Add new inline */}
        {addingNew && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-white p-3 dark:bg-card-dark">
            <div className="h-3.5 w-3.5 rounded-full bg-gray-400" />
            <input
              autoFocus
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAddingNew(false); }}
              placeholder="Status name..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            <button type="button" onClick={handleAdd} className="rounded p-1 text-primary hover:bg-primary/10"><Check size={13} /></button>
            <button type="button" onClick={() => setAddingNew(false)} className="rounded p-1 text-gray-400 hover:text-gray-600"><X size={13} /></button>
          </div>
        )}
      </div>

      <Modal
        isOpen={statusRemovalDialog !== null}
        onClose={() => setStatusRemovalDialog(null)}
        title="Resolve issues before deleting workflow"
        maxWidth="max-w-lg"
      >
        {statusRemovalDialog && (
          <div className="space-y-5">
            <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{statusRemovalDialog.issueCount} issue(s)</span>{' '}
              are currently in <span className="font-semibold text-gray-900 dark:text-gray-100">{statusRemovalDialog.status.label}</span>.
              Choose what should happen before this workflow is removed.
            </p>

            {statusRemovalDialog.issues.length > 0 ? (
              <div className="rounded-xl border border-gray-200 dark:border-border-dark">
                <div className="border-b border-gray-200 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:border-border-dark">
                  Affected issues
                </div>
                <div className="max-h-52 divide-y divide-gray-200 overflow-y-auto dark:divide-border-dark">
                  {statusRemovalDialog.issues.map((issue) => (
                    <div key={issue.id} className="px-4 py-3">
                      <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{issue.publicId}</div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{issue.title}</div>
                      {issue.project ? (
                        <div className="mt-1 text-[11px] text-gray-400">{issue.project.name}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
                {statusRemovalDialog.issueCount > statusRemovalDialog.issues.length ? (
                  <div className="border-t border-gray-200 px-4 py-2 text-[11px] text-gray-400 dark:border-border-dark">
                    Showing {statusRemovalDialog.issues.length} of {statusRemovalDialog.issueCount} affected issues.
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 dark:border-border-dark">
                <input
                  type="radio"
                  checked={statusRemovalDialog.action === 'move'}
                  onChange={() => setStatusRemovalDialog((current) => current ? { ...current, action: 'move' } : current)}
                  className="mt-1 h-4 w-4 border-gray-300 text-primary focus:ring-primary/20"
                />
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Move issues to another workflow</div>
                    <div className="mt-1 text-xs text-gray-400">Keep the issues and move them into a workflow that will remain active.</div>
                  </div>
                  <select
                    value={statusRemovalDialog.targetStatusKey}
                    disabled={statusRemovalDialog.action !== 'move'}
                    onChange={(event) => setStatusRemovalDialog((current) => current ? { ...current, targetStatusKey: event.target.value } : current)}
                    className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-primary disabled:opacity-50 dark:border-border-dark"
                  >
                    {statuses
                      .filter((candidate) => candidate.key !== statusRemovalDialog.status.key)
                      .map((candidate) => (
                        <option key={candidate.key} value={candidate.key}>
                          {candidate.label}
                        </option>
                      ))}
                  </select>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-red-200/70 p-4 dark:border-red-500/20">
                <input
                  type="radio"
                  checked={statusRemovalDialog.action === 'delete'}
                  onChange={() => setStatusRemovalDialog((current) => current ? { ...current, action: 'delete' } : current)}
                  className="mt-1 h-4 w-4 border-gray-300 text-red-500 focus:ring-red-500/20"
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-red-500">Delete all issues in this workflow</div>
                  <div className="mt-1 text-xs leading-5 text-gray-400">
                    This removes the workflow and permanently deletes all issues currently assigned to it.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusRemovalDialog(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-border-dark dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStatusRemoval}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={mergeDialog !== null}
        onClose={() => setMergeDialog(null)}
        title="Merge status"
        maxWidth="max-w-sm"
      >
        {mergeDialog && (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
              Every issue on <span className="font-semibold text-gray-900 dark:text-gray-100">{mergeDialog.status.label}</span> moves
              to the status you pick below, and <span className="font-semibold text-gray-900 dark:text-gray-100">{mergeDialog.status.label}</span> is
              removed from this workflow. This happens immediately — it isn't part of the pending changes above.
            </p>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Merge into</span>
              <select
                value={mergeDialog.targetStatusKey}
                onChange={(event) => setMergeDialog((current) => (current ? { ...current, targetStatusKey: event.target.value } : current))}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-border-dark"
              >
                {statuses
                  .filter((candidate) => candidate.key !== mergeDialog.status.key)
                  .map((candidate) => (
                    <option key={candidate.key} value={candidate.key}>{candidate.label}</option>
                  ))}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMergeDialog(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-border-dark dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={mergeMutation.isPending || !mergeDialog.targetStatusKey}
                onClick={() => mergeMutation.mutate({ sourceKey: mergeDialog.status.key, targetStatusKey: mergeDialog.targetStatusKey })}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {mergeMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Merge
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export const WorkflowAutomationEditor: React.FC<{
  initialStatuses: WorkspaceStatus[];
  initialAutomation: WorkflowAutomationConfig | null;
  canManage: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onSave: (payload: WorkflowAutomationConfig) => Promise<WorkflowAutomationConfig>;
  onSaved?: (saved: WorkflowAutomationConfig) => void;
}> = ({ initialStatuses, initialAutomation, canManage, onDirtyChange, onSave, onSaved }) => {
  const showToast = useToastStore((s) => s.showToast);
  const workspaceStatuses = initialStatuses;
  const [config, setConfig] = useState<WorkflowAutomationConfig | null>(initialAutomation);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setConfig(initialAutomation);
    setHasChanges(false);
  }, [initialAutomation]);

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const statusOptions = useMemo(
    () => workspaceStatuses.map((status) => ({ value: status.key, label: status.label, isFinal: status.isFinal })),
    [workspaceStatuses],
  );
  const finalOptions = statusOptions.filter((status) => status.isFinal);
  const activeOptions = statusOptions.filter((status) => !status.isFinal && workspaceStatuses.find((item) => item.key === status.value)?.showOnBoard !== false);
  const cycleBoardOptions = statusOptions.filter(
    (status) => !status.isFinal && workspaceStatuses.find((item) => item.key === status.value)?.visibility.cycleBoard !== false,
  );

  const updateConfig = useCallback((updater: (current: WorkflowAutomationConfig) => WorkflowAutomationConfig) => {
    setConfig((current) => {
      if (!current) return current;
      setHasChanges(true);
      return updater(current);
    });
  }, []);

  const saveMutation = useMutation({
    mutationFn: (payload: WorkflowAutomationConfig) => onSave(payload),
    onSuccess: (saved) => {
      showToast('Automation rules updated.', 'success');
      setHasChanges(false);
      onSaved?.(saved);
    },
    onError: (error: unknown) => {
      const msg = (error as ApiAxiosError)?.response?.data?.error?.message || 'Failed to save automation rules.';
      showToast(msg, 'error');
    },
  });

  if (!config) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Automation Rules</h3>
          <p className="mt-1 text-xs text-gray-400">Turn repetitive workflow steps into consistent workspace behavior without adding noisy background rules.</p>
        </div>
        {hasChanges && canManage && (
          <button
            type="button"
            onClick={() => saveMutation.mutate(config)}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save
          </button>
        )}
      </div>

      <div className={`grid gap-3${saveMutation.isPending ? ' pointer-events-none opacity-60' : ''}`}>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-text-primary-dark">When all subtasks are complete</h4>
              <p className="mt-1 text-xs text-gray-400">Either surface a completion suggestion or move the issue into a final status automatically.</p>
            </div>
            <input
              type="checkbox"
              checked={config.subtaskCompletion.enabled}
              disabled={!canManage}
              onChange={(e) => updateConfig((current) => ({
                ...current,
                subtaskCompletion: { ...current.subtaskCompletion, enabled: e.target.checked },
              }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
            />
          </div>
          {config.subtaskCompletion.enabled && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select
                value={config.subtaskCompletion.mode}
                disabled={!canManage}
                onChange={(e) => updateConfig((current) => ({
                  ...current,
                  subtaskCompletion: {
                    ...current.subtaskCompletion,
                    mode: e.target.value as WorkflowAutomationConfig['subtaskCompletion']['mode'],
                  },
                }))}
                className="rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-border-dark"
              >
                <option value="suggest">Suggest completion</option>
                <option value="move">Move automatically</option>
              </select>
              <select
                value={config.subtaskCompletion.targetStatusKey ?? ''}
                disabled={!canManage}
                onChange={(e) => updateConfig((current) => ({
                  ...current,
                  subtaskCompletion: {
                    ...current.subtaskCompletion,
                    targetStatusKey: e.target.value || null,
                  },
                }))}
                className="rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-border-dark"
              >
                {finalOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-text-primary-dark">When a cycle starts</h4>
              <p className="mt-1 text-xs text-gray-400">Move planned work from a holding state into the first active state for execution.</p>
            </div>
            <input
              type="checkbox"
              checked={config.cycleStart.enabled}
              disabled={!canManage}
              onChange={(e) => updateConfig((current) => ({
                ...current,
                cycleStart: { ...current.cycleStart, enabled: e.target.checked },
              }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
            />
          </div>
          {config.cycleStart.enabled && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select
                value={config.cycleStart.fromStatusKey ?? ''}
                disabled={!canManage}
                onChange={(e) => updateConfig((current) => ({
                  ...current,
                  cycleStart: {
                    ...current.cycleStart,
                    fromStatusKey: e.target.value || null,
                  },
                }))}
                className="rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-border-dark"
              >
                {statusOptions.filter((status) => !status.isFinal).map((status) => (
                  <option key={status.value} value={status.value}>
                    From {status.label}
                  </option>
                ))}
              </select>
              <select
                value={config.cycleStart.targetStatusKey ?? ''}
                disabled={!canManage}
                onChange={(e) => updateConfig((current) => ({
                  ...current,
                  cycleStart: {
                    ...current.cycleStart,
                    targetStatusKey: e.target.value || null,
                  },
                }))}
                className="rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-border-dark"
              >
                {cycleBoardOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    To {status.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-text-primary-dark">When work becomes overdue</h4>
              <p className="mt-1 text-xs text-gray-400">Send a focused reminder into notifications so overdue work does not silently age in place.</p>
            </div>
            <input
              type="checkbox"
              checked={config.overdue.enabled}
              disabled={!canManage}
              onChange={(e) => updateConfig((current) => ({
                ...current,
                overdue: { ...current.overdue, enabled: e.target.checked },
              }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-border-dark dark:bg-card-dark">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-text-primary-dark">GitHub pull requests</h4>
            <p className="mt-1 text-xs text-gray-400">These targets are used when GitHub auto-move settings are enabled in the integrations panel.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Opened PR
                <input
                  type="checkbox"
                  checked={config.githubPullRequest.opened.enabled}
                  disabled={!canManage}
                  onChange={(e) => updateConfig((current) => ({
                    ...current,
                    githubPullRequest: {
                      ...current.githubPullRequest,
                      opened: { ...current.githubPullRequest.opened, enabled: e.target.checked },
                    },
                  }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                />
              </label>
              <select
                value={config.githubPullRequest.opened.targetStatusKey ?? ''}
                disabled={!canManage || !config.githubPullRequest.opened.enabled}
                onChange={(e) => updateConfig((current) => ({
                  ...current,
                  githubPullRequest: {
                    ...current.githubPullRequest,
                    opened: { ...current.githubPullRequest.opened, targetStatusKey: e.target.value || null },
                  },
                }))}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-border-dark"
              >
                {activeOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Merged PR
                <input
                  type="checkbox"
                  checked={config.githubPullRequest.merged.enabled}
                  disabled={!canManage}
                  onChange={(e) => updateConfig((current) => ({
                    ...current,
                    githubPullRequest: {
                      ...current.githubPullRequest,
                      merged: { ...current.githubPullRequest.merged, enabled: e.target.checked },
                    },
                  }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                />
              </label>
              <select
                value={config.githubPullRequest.merged.targetStatusKey ?? ''}
                disabled={!canManage || !config.githubPullRequest.merged.enabled}
                onChange={(e) => updateConfig((current) => ({
                  ...current,
                  githubPullRequest: {
                    ...current.githubPullRequest,
                    merged: { ...current.githubPullRequest.merged, targetStatusKey: e.target.value || null },
                  },
                }))}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-border-dark"
              >
                {finalOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
