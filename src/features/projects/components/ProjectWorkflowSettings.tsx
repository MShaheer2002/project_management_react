import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToastStore } from '@/app/stores/useToastStore';
import { getApiErrorMessage } from '@shared/services';
import { WorkflowStatusesEditor, WorkflowAutomationEditor } from '@shared/components/workflow/WorkflowEditors';
import {
  useClearProjectWorkflowOverride,
  useMergeProjectWorkflowStatus,
  useProjectWorkflow,
  useUpdateProjectWorkflowAutomation,
  useUpdateProjectWorkflowStatuses,
} from '../hooks/useProjectData';
import { projectService } from '../services/projectService';

/**
 * Lets a project either inherit the workspace's default workflow, or define its
 * own. Reuses the same status/transition/entry-rule/automation editors as the
 * workspace settings page — only the data source and save/usage functions differ.
 */
export const ProjectWorkflowSettings: React.FC<{ projectId: string; canManage: boolean }> = ({ projectId, canManage }) => {
  const showToast = useToastStore((s) => s.showToast);
  const { data: workflow, isLoading } = useProjectWorkflow(projectId);
  const updateStatuses = useUpdateProjectWorkflowStatuses(projectId);
  const clearOverride = useClearProjectWorkflowOverride(projectId);
  const updateAutomation = useUpdateProjectWorkflowAutomation(projectId);
  const mergeStatus = useMergeProjectWorkflowStatus(projectId);
  const [customizing, setCustomizing] = useState(false);

  if (isLoading || !workflow) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Workflow</h2>
          <p className="text-sm text-gray-400">Statuses, transitions, and automation for this project.</p>
        </div>
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 dark:border-border-dark dark:bg-card-dark">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      </section>
    );
  }

  const isOverridden = workflow.source === 'project';
  const showEditors = isOverridden || customizing;

  const handleRevert = () => {
    clearOverride.mutate(undefined, {
      onSuccess: () => {
        showToast('Reverted to the workspace default workflow.', 'success');
        setCustomizing(false);
      },
      onError: (error: unknown) => {
        showToast(getApiErrorMessage(error) || 'Failed to revert workflow.', 'error');
      },
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Workflow</h2>
          <p className="text-sm text-gray-400">
            {isOverridden
              ? 'This project uses its own custom workflow.'
              : 'This project uses the workspace default workflow.'}
          </p>
        </div>
        {canManage && isOverridden && (
          <button
            type="button"
            onClick={handleRevert}
            disabled={clearOverride.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-border-dark dark:text-gray-300 dark:hover:bg-white/5"
          >
            {clearOverride.isPending && <Loader2 size={14} className="animate-spin" />}
            Revert to workspace default
          </button>
        )}
        {canManage && !isOverridden && !customizing && (
          <button
            type="button"
            onClick={() => setCustomizing(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            Customize workflow for this project
          </button>
        )}
      </div>

      {showEditors && (
        <>
          <WorkflowStatusesEditor
            initialStatuses={workflow.statuses}
            canManage={canManage}
            onSave={(data) => updateStatuses.mutateAsync(data).then((saved) => saved.statuses)}
            getStatusUsage={async (statusKey, limit) => {
              const usage = await projectService.getWorkflowStatusUsage(projectId, statusKey, limit);
              return {
                ...usage,
                issues: usage.issues.map((issue) => ({ ...issue, project: null })),
              };
            }}
            onMergeStatus={isOverridden
              ? (sourceKey, targetStatusKey) => mergeStatus.mutateAsync({ sourceKey, targetStatusKey }).then((saved) => saved.statuses)
              : undefined}
          />
          <WorkflowAutomationEditor
            initialStatuses={workflow.statuses}
            initialAutomation={workflow.automation}
            canManage={canManage}
            onSave={(payload) => updateAutomation.mutateAsync(payload).then((saved) => saved.automation)}
          />
        </>
      )}
    </section>
  );
};
