import { useState } from 'react';
import { Check, RotateCcw, X, Loader2, AlertTriangle } from 'lucide-react';
import type { AiMutationRecord } from '../types';

interface AiChangeCardProps {
  mutation: AiMutationRecord;
  onAccept: (mutationId: string) => Promise<void>;
  onRevert: (mutationId: string) => Promise<void>;
}

/**
 * Review affordance for a workspace change the AI made.
 *
 * The AI can never delete, so nearly every change it makes is reversible — which
 * is why changes execute immediately and are reviewed afterwards rather than
 * being gated behind a confirmation dialog on every action.
 *
 * Rejecting a *create* is the one case that cannot undo itself: removing the
 * created entity would be a deletion, and that rule holds here too. The card
 * says so plainly instead of offering an Undo that would silently do nothing.
 */
export function AiChangeCard({ mutation, onAccept, onRevert }: AiChangeCardProps) {
  const [pendingAction, setPendingAction] = useState<'accept' | 'revert' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isResolved = mutation.status !== 'PENDING';
  const isBusy = pendingAction !== null;

  const handle = async (action: 'accept' | 'revert') => {
    setPendingAction(action);
    setError(null);
    try {
      await (action === 'accept' ? onAccept(mutation.id) : onRevert(mutation.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not work. Try again.');
    } finally {
      setPendingAction(null);
    }
  };

  if (isResolved) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-500 dark:border-border-dark dark:text-gray-400">
        <ResolvedIcon status={mutation.status} />
        <span className="truncate">
          <span className="font-medium text-gray-600 dark:text-gray-300">{mutation.targetLabel}</span>
          {' · '}
          {resolvedLabel(mutation.status)}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/25 bg-primary/[0.03] p-2.5 dark:border-primary/30 dark:bg-primary/[0.06]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-gray-800 dark:text-gray-100">
            {mutation.targetLabel}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">
            {mutation.summary}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
          {mutation.kind === 'CREATE' ? 'New' : 'Changed'}
        </span>
      </div>

      {error && (
        <p className="mt-1.5 flex items-start gap-1 text-[10px] text-red-600 dark:text-red-400">
          <AlertTriangle size={10} className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => void handle('accept')}
          disabled={isBusy}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pendingAction === 'accept' ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
          Keep
        </button>

        <button
          type="button"
          onClick={() => void handle('revert')}
          disabled={isBusy}
          title={
            mutation.revertable
              ? 'Restore the previous values'
              : 'This was newly created — I can’t remove it, but I’ll mark it rejected'
          }
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-border-dark dark:text-gray-300 dark:hover:bg-white/[0.04]"
        >
          {pendingAction === 'revert' ? (
            <Loader2 size={11} className="animate-spin" />
          ) : mutation.revertable ? (
            <RotateCcw size={11} />
          ) : (
            <X size={11} />
          )}
          {mutation.revertable ? 'Undo' : 'Reject'}
        </button>
      </div>
    </div>
  );
}

function ResolvedIcon({ status }: { status: AiMutationRecord['status'] }) {
  if (status === 'ACCEPTED') return <Check size={11} className="shrink-0 text-green-600 dark:text-green-500" />;
  if (status === 'REVERTED') return <RotateCcw size={11} className="shrink-0" />;
  return <X size={11} className="shrink-0" />;
}

function resolvedLabel(status: AiMutationRecord['status']): string {
  switch (status) {
    case 'ACCEPTED':
      return 'kept';
    case 'REVERTED':
      return 'undone';
    case 'REJECTED':
      return 'rejected — remove it in the app if you don’t want it';
    case 'EXPIRED':
      return 'no longer reviewable';
    default:
      return status.toLowerCase();
  }
}
