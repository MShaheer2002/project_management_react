import React, { useMemo, useState } from 'react';
import { Check, Plus, Search, Tag, X } from 'lucide-react';
import { LabelChip } from '@shared/components/ui/LabelChip';
import { useApp } from '@/AppContext';
import { useAttachIssueLabelsAny, useCreateLabel, useIssueLabels, useRemoveIssueLabelAny } from '../hooks/useIssueData';
import type { IssueLabelRow } from '../types';

type IssueLabelsEditorProps = {
  issueId: string;
  selectedLabels: IssueLabelRow[];
};

const DEFAULT_NEW_LABEL_COLOR = '#38bdf8';

export const IssueLabelsEditor: React.FC<IssueLabelsEditorProps> = ({ issueId, selectedLabels }) => {
  const { showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const labelsQuery = useIssueLabels({ q: query.trim() || undefined, sort: 'name:asc', limit: 50 }, { enabled: isOpen });
  const createLabel = useCreateLabel();
  const attachIssueLabelsAny = useAttachIssueLabelsAny();
  const removeIssueLabelAny = useRemoveIssueLabelAny();

  const allLabels = useMemo(
    () => labelsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [labelsQuery.data]
  );
  const selectedIds = useMemo(() => new Set(selectedLabels.map((item) => item.id)), [selectedLabels]);

  const canCreate = query.trim().length > 0 && !allLabels.some((label) => label.name.toLowerCase() === query.trim().toLowerCase());

  const toggleLabel = async (labelId: string) => {
    const isSelected = selectedIds.has(labelId);

    try {
      if (isSelected) {
        await removeIssueLabelAny.mutateAsync({ issueId, labelId });
      } else {
        await attachIssueLabelsAny.mutateAsync({ issueId, input: { labelIds: [labelId] } });
      }
    } catch (error) {
      showToast((error as Error)?.message || 'Failed to update labels.', 'error');
    }
  };

  const handleCreateAndAttach = async () => {
    const name = query.trim();
    if (!name) return;

    try {
      const created = await createLabel.mutateAsync({
        name,
        color: DEFAULT_NEW_LABEL_COLOR,
      });

      await attachIssueLabelsAny.mutateAsync({
        issueId,
        input: { labelIds: [created.id] },
      });
      setQuery('');
    } catch (error) {
      showToast((error as Error)?.message || 'Failed to create label.', 'error');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {selectedLabels.length > 0 ? (
          selectedLabels.map((label) => <LabelChip key={label.id} label={label.name} size="md" />)
        ) : (
          <span className="text-xs text-gray-400">No labels</span>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-500 hover:border-primary/40 hover:text-primary dark:border-border-dark dark:text-gray-300"
        >
          {isOpen ? <X size={12} /> : <Plus size={12} />}
          Labels
        </button>
      </div>

      {isOpen && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5 dark:border-border-dark">
            <Search size={13} className="text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search labels"
              className="w-full bg-transparent text-xs outline-none placeholder:text-gray-400"
            />
          </div>

          <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
            {labelsQuery.isLoading ? (
              <div className="px-2 py-2 text-xs text-gray-400">Loading labels...</div>
            ) : allLabels.length === 0 ? (
              <div className="px-2 py-2 text-xs text-gray-400">No labels found.</div>
            ) : (
              allLabels.map((label) => {
                const isSelected = selectedIds.has(label.id);
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => void toggleLabel(label.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                  >
                    <Tag size={12} className="text-gray-400" />
                    <span className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-200">{label.name}</span>
                    {isSelected && <Check size={13} className="text-primary" />}
                  </button>
                );
              })
            )}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={() => void handleCreateAndAttach()}
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-2 py-1.5 text-xs font-semibold text-primary"
            >
              <Plus size={12} />
              Create "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
};
