import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STATUS_LABELS } from '@/constants';
import type { IssueIntegrationRef } from '@/types';
import type { IssueParentSummary, IssueWatcherRow } from '../types';

type IssueSystemContextSectionProps = {
  parent?: IssueParentSummary | null;
  watchers?: IssueWatcherRow[];
  integrationRefs?: IssueIntegrationRef[];
  onParentClick?: (issueId: string) => void;
};

const statusLabel = (status: string) => STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status;

const providerLabel = (provider: IssueIntegrationRef['provider']) => {
  switch (provider) {
    case 'github':
      return 'GitHub';
    case 'jira':
      return 'Jira';
    case 'slack':
      return 'Slack';
    case 'notion':
      return 'Notion';
    case 'figma':
      return 'Figma';
    case 'discord':
      return 'Discord';
    default:
      return 'Custom';
  }
};

const formatReferenceMeta = (ref: IssueIntegrationRef) => {
  const parts = [ref.externalId, ref.url].filter(Boolean);
  return parts.join(' · ');
};

const AvatarFallback: React.FC<{ name: string; className?: string }> = ({ name, className = 'h-7 w-7' }) => (
  <div className={`flex items-center justify-center rounded-full bg-primary/10 text-primary ${className}`}>
    <span className="text-[11px] font-bold">{name.charAt(0).toUpperCase()}</span>
  </div>
);

export const IssueSystemContextSection: React.FC<IssueSystemContextSectionProps> = ({
  parent,
  watchers = [],
  integrationRefs = [],
  onParentClick,
}) => {
  const navigate = useNavigate();
  const hasParent = Boolean(parent);
  const hasWatchers = watchers.length > 0;
  const hasIntegrationRefs = integrationRefs.length > 0;

  if (!hasParent && !hasWatchers && !hasIntegrationRefs) {
    return null;
  }

  const openParent = (issueId: string) => {
    if (onParentClick) {
      onParentClick(issueId);
      return;
    }

    navigate(`/issues/${issueId}`);
  };

  return (
    <div className="space-y-5 border-t border-gray-100 pt-8 dark:border-border-dark">
      <div className="space-y-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">System Context</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Linked issue structure, subscribers, and external references.
        </p>
      </div>

      {hasParent && parent && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Parent Issue</h4>
          <button
            type="button"
            onClick={() => openParent(parent.id)}
            className="flex w-full items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-primary/25 hover:bg-gray-50 dark:border-border-dark dark:bg-card-dark dark:hover:bg-white/[0.04]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                  {parent.id}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-800 dark:text-gray-100">
                {parent.title}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:bg-white/[0.06] dark:text-gray-300">
              {statusLabel(parent.status)}
            </span>
          </button>
        </div>
      )}

      {hasIntegrationRefs && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Integration References</h4>
          <div className="space-y-2">
            {integrationRefs.map((ref) => (
              <div
                key={ref.id}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-border-dark dark:bg-card-dark"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/8 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                        {providerLabel(ref.provider)}
                      </span>
                      {ref.label && (
                        <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                          {ref.label}
                        </span>
                      )}
                    </div>
                    {formatReferenceMeta(ref) && (
                      <p className="mt-1 break-all text-sm text-gray-500 dark:text-gray-400">
                        {formatReferenceMeta(ref)}
                      </p>
                    )}
                  </div>
                  {ref.url && (
                    <button
                      type="button"
                      onClick={() => window.open(ref.url, '_blank', 'noopener,noreferrer')}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                      title="Open reference"
                    >
                      <ExternalLink size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasWatchers && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Watchers</h4>
          <div className="flex flex-wrap gap-2">
            {watchers.map((watcher) => (
              <div
                key={watcher.id}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm dark:border-border-dark dark:bg-card-dark"
              >
                {watcher.avatar ? (
                  <img src={watcher.avatar} className="h-5 w-5 rounded-full object-cover" alt={watcher.name} />
                ) : (
                  <AvatarFallback name={watcher.name} className="h-5 w-5" />
                )}
                <p className="max-w-[140px] truncate text-[11px] font-medium text-gray-700 dark:text-gray-200">
                  {watcher.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
