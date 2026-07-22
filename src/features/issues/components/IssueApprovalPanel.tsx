import React from 'react';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useToastStore } from '@/app/stores/useToastStore';
import { getApiErrorMessage } from '@shared/services';
import { useApproveIssueStatus, useIssueApprovalStatus, useRevokeIssueApproval } from '../hooks/useIssueData';

/**
 * Shows the approval gate for whatever status the issue currently sits in, and
 * lets the current user approve or retract their own approval. Renders nothing
 * if the current status doesn't require approval.
 */
export const IssueApprovalPanel: React.FC<{ issueId: string | undefined; currentUserId: string | undefined }> = ({
  issueId,
  currentUserId,
}) => {
  const showToast = useToastStore((s) => s.showToast);
  const { data: approval } = useIssueApprovalStatus(issueId);
  const approveMutation = useApproveIssueStatus(issueId);
  const revokeMutation = useRevokeIssueApproval(issueId);

  if (!approval || !approval.required) {
    return null;
  }

  const hasApproved = approval.approvals.some((entry) => entry.userId === currentUserId);

  const handleApprove = () => {
    approveMutation.mutate(undefined, {
      onError: (error: unknown) => showToast(getApiErrorMessage(error) || 'Failed to approve.', 'error'),
    });
  };

  const handleRevoke = () => {
    revokeMutation.mutate(undefined, {
      onError: (error: unknown) => showToast(getApiErrorMessage(error) || 'Failed to revoke approval.', 'error'),
    });
  };

  return (
    <div className={`rounded-xl border p-4 ${approval.satisfied ? 'border-green-500/20 bg-green-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {approval.satisfied ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-500" />
          ) : (
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-amber-500" />
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Approval required</p>
            <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
              {approval.currentCount} of {approval.requiredCount} approval{approval.requiredCount === 1 ? '' : 's'} to leave {approval.statusLabel}
            </p>
          </div>
        </div>
        {hasApproved ? (
          <button
            type="button"
            onClick={handleRevoke}
            disabled={revokeMutation.isPending}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-border-dark dark:text-gray-300 dark:hover:bg-white/5"
          >
            {revokeMutation.isPending && <Loader2 size={12} className="animate-spin" />}
            Revoke my approval
          </button>
        ) : (
          <button
            type="button"
            onClick={handleApprove}
            disabled={approveMutation.isPending}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {approveMutation.isPending && <Loader2 size={12} className="animate-spin" />}
            Approve
          </button>
        )}
      </div>

      {approval.approvals.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {approval.approvals.map((entry) => (
            <span
              key={entry.userId}
              className="rounded-full border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 dark:border-border-dark dark:bg-card-dark dark:text-gray-300"
            >
              {entry.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
