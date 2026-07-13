import React, { useCallback, useMemo, useState } from 'react';
import { Loader2, UserPlus2 } from 'lucide-react';
import { useApp } from '@/AppContext';
import { useAddProjectMembers } from '@features/projects';
import { Modal } from '@shared/components/ui/Modal';
import { getApiErrorCode, getApiErrorMessage } from '@shared/services';

type AssignmentRetryContext = {
  assigneeId: string;
  assigneeName: string;
  projectId: string;
  projectName: string;
  retry: () => Promise<void>;
  canAutoAdd?: boolean;
  confirmLabel?: string;
};

type ProjectAssignmentGuardResult = {
  dialog: React.ReactNode;
  openAssignmentDialog: (context: AssignmentRetryContext) => void;
  handleAssignmentError: (error: unknown, context: AssignmentRetryContext) => boolean;
};

export const useProjectAssignmentGuard = (): ProjectAssignmentGuardResult => {
  const { showToast } = useApp();
  const [pendingContext, setPendingContext] = useState<AssignmentRetryContext | null>(null);
  const addProjectMembers = useAddProjectMembers(pendingContext?.projectId);

  const closeDialog = useCallback(() => {
    if (addProjectMembers.isPending) return;
    setPendingContext(null);
  }, [addProjectMembers.isPending]);

  const openAssignmentDialog = useCallback((context: AssignmentRetryContext) => {
    setPendingContext(context);
  }, []);

  const handleAssignmentError = useCallback((error: unknown, context: AssignmentRetryContext) => {
    if (getApiErrorCode(error) !== 'ASSIGNEE_NOT_PROJECT_MEMBER') {
      return false;
    }

    setPendingContext(context);
    return true;
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingContext) return;

    try {
      try {
        await addProjectMembers.mutateAsync({ userIds: [pendingContext.assigneeId] });
      } catch (error) {
        const errorCode = getApiErrorCode(error);
        if (errorCode !== 'MEMBER_ALREADY_IN_PROJECT') {
          throw error;
        }
      }

      await pendingContext.retry();
      setPendingContext(null);
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to add the member to the project.', 'error');
    }
  }, [addProjectMembers, pendingContext, showToast]);

  const dialog = useMemo(() => (
    <Modal
      isOpen={Boolean(pendingContext)}
      onClose={closeDialog}
      title="Add member to project"
      maxWidth="max-w-md"
    >
      {pendingContext ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-primary/20 bg-primary/6 p-4 dark:border-primary/15 dark:bg-primary/10">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <UserPlus2 size={18} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {pendingContext.assigneeName} is not part of {pendingContext.projectName} yet.
                </p>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {pendingContext.canAutoAdd === false
                    ? 'This member must be added to the project before the issue can be assigned. You do not currently have permission to add project members.'
                    : 'Add this member to the project first, then Trussen will complete the assignment automatically.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeDialog}
              disabled={addProjectMembers.isPending}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-border-dark dark:text-gray-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            {pendingContext.canAutoAdd !== false ? (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={addProjectMembers.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addProjectMembers.isPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus2 size={14} />}
                {pendingContext.confirmLabel ?? 'Add to project and assign'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  ), [addProjectMembers.isPending, closeDialog, handleConfirm, pendingContext]);

  return {
    dialog,
    openAssignmentDialog,
    handleAssignmentError,
  };
};
