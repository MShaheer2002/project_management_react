import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { STATUS_LABELS } from '@/constants';
import type { IssueDependencyRow } from '../types';

type IssueRelationsSectionProps = {
  dependencies?: IssueDependencyRow[];
  onIssueClick?: (issueId: string) => void;
};

const relationGroups = [
  {
    key: 'blocked-by',
    title: 'Blocked by',
    dot: 'bg-red-500',
    tone: 'text-red-500',
  },
  {
    key: 'blocks',
    title: 'Blocks',
    dot: 'bg-orange-500',
    tone: 'text-orange-500',
  },
  {
    key: 'related',
    title: 'Related',
    dot: 'bg-blue-500',
    tone: 'text-blue-500',
  },
] as const;

const statusLabel = (status: string) => STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status;

export const IssueRelationsSection: React.FC<IssueRelationsSectionProps> = ({
  dependencies = [],
  onIssueClick,
}) => {
  const navigate = useNavigate();

  const grouped = useMemo(() => {
    return relationGroups.map((group) => ({
      ...group,
      items: dependencies.filter((dependency) => dependency.relation === group.key),
    })).filter((group) => group.items.length > 0);
  }, [dependencies]);

  const total = dependencies.length;

  if (total === 0 || grouped.length === 0) {
    return null;
  }

  const handleOpenIssue = (issueId: string) => {
    if (onIssueClick) {
      onIssueClick(issueId);
      return;
    }

    navigate(`/issues/${issueId}`);
  };

  return (
    <div className="space-y-5 border-t border-gray-100 pt-8 dark:border-border-dark">
      <div className="space-y-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Relations</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {total} linked issue{total > 1 ? 's' : ''} connected to this work.
        </p>
      </div>

      <div className="space-y-5">
        {grouped.map((group) => {
          return (
            <div key={group.key} className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${group.dot}`} />
                <h4 className={`text-[11px] font-bold uppercase tracking-[0.18em] ${group.tone}`}>
                  {group.title}
                </h4>
                <span className="text-xs text-gray-400">{group.items.length}</span>
              </div>

              <div className="space-y-2">
                {group.items.map((dependency) => (
                  <button
                    key={`${group.key}-${dependency.issueId}`}
                    type="button"
                    onClick={() => handleOpenIssue(dependency.issueId)}
                    className="group flex w-full items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-primary/25 hover:bg-gray-50 dark:border-border-dark dark:bg-card-dark dark:hover:bg-white/[0.04]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                          {dependency.issueId}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <span className="text-[11px] text-gray-400">{group.title}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-800 dark:text-gray-100">
                        {dependency.title}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:bg-white/[0.06] dark:text-gray-300">
                      {statusLabel(dependency.status)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
