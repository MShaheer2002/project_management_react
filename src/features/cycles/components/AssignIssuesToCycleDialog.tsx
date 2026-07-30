import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange, CheckCircle2, Loader2, X } from 'lucide-react';
import { useApp } from '@/AppContext';
import { getApiErrorMessage } from '@shared/services';
import { useAssignIssuesToCycle, useCycles } from '../hooks/useCycleData';

type AssignIssuesToCycleDialogProps = {
  open: boolean;
  onClose: () => void;
  teamId?: string;
  issueIds: string[];
};

export const AssignIssuesToCycleDialog: React.FC<AssignIssuesToCycleDialogProps> = ({
  open,
  onClose,
  teamId,
  issueIds,
}) => {
  const { showToast } = useApp();
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const cyclesQuery = useCycles(
    {
      teamId,
      sort: 'startsAt:desc',
      limit: 50,
    },
    { enabled: open && Boolean(teamId) }
  );
  const assignIssuesToCycle = useAssignIssuesToCycle();

  const availableCycles = useMemo(
    () =>
      (cyclesQuery.data?.pages.flatMap((page) => page.items) ?? []).filter((cycle) => cycle.status !== 'COMPLETED'),
    [cyclesQuery.data]
  );

  useEffect(() => {
    if (!open) {
      setSelectedCycleId('');
      return;
    }

    setSelectedCycleId((current) => current || availableCycles[0]?.id || '');
  }, [availableCycles, open]);

  if (!open) return null;

  const handleAssign = async () => {
    if (!selectedCycleId) {
      showToast('Select a cycle first.', 'error', 'Validation');
      return;
    }

    if (issueIds.length === 0) {
      showToast('Select at least one issue first.', 'error', 'Validation');
      return;
    }

    try {
      const result = await assignIssuesToCycle.mutateAsync({
        cycleId: selectedCycleId,
        issueIds,
      });
      const skippedCount = result.skipped.length;
      const addedCount = result.added.length;
      showToast(
        skippedCount > 0
          ? `${addedCount} issue${addedCount === 1 ? '' : 's'} added. ${skippedCount} skipped.`
          : `${addedCount} issue${addedCount === 1 ? '' : 's'} added to cycle.`,
        skippedCount > 0 ? 'info' : 'success'
      );
      onClose();
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to add issues to cycle.', 'error', 'Assignment failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close assign issues to cycle dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-border-dark dark:bg-card-dark">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-border-dark/70">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Issues To Cycle</h2>
            <p className="text-sm text-gray-400">
              {issueIds.length} selected issue{issueIds.length === 1 ? '' : 's'} will be assigned to the cycle you choose.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          {!teamId ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Select issues from the same team before assigning them to a cycle.
            </div>
          ) : cyclesQuery.isLoading ? (
            <div className="flex h-28 items-center justify-center text-sm text-gray-400">
              <Loader2 size={16} className="mr-2 animate-spin" />
              Loading team cycles...
            </div>
          ) : availableCycles.length > 0 ? (
            <div className="space-y-2">
              {availableCycles.map((cycle) => {
                const selected = selectedCycleId === cycle.id;
                return (
                  <button
                    key={cycle.id}
                    type="button"
                    onClick={() => setSelectedCycleId(cycle.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                      selected
                        ? 'border-primary/40 bg-primary/10 shadow-sm shadow-primary/10'
                        : 'border-gray-200 bg-white hover:border-primary/30 hover:bg-gray-50 dark:border-border-dark dark:bg-white/[0.03] dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">{cycle.name}</span>
                          <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:border-border-dark">
                            {cycle.status.toLowerCase()}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarRange size={12} />
                            {new Date(cycle.startsAt).toLocaleDateString()} - {new Date(cycle.endsAt).toLocaleDateString()}
                          </span>
                          <span>{cycle.stats.totalIssues} issues</span>
                        </div>
                      </div>
                      <div className={`mt-0.5 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`}>
                        <CheckCircle2 size={16} className="text-primary" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400 dark:border-border-dark">
              No upcoming or current cycle is available for this team.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4 dark:border-border-dark/70">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!teamId || !selectedCycleId || assignIssuesToCycle.isPending || availableCycles.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {assignIssuesToCycle.isPending && <Loader2 size={14} className="animate-spin" />}
            Add To Cycle
          </button>
        </div>
      </div>
    </div>
  );
};
