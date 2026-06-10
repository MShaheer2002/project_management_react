import React, { useMemo } from 'react';
import { ExternalLink, GitBranch, GitCommit, GitPullRequest } from 'lucide-react';
import { useIssueActivity } from '@features/issues';
import { GITHUB_ACTIVITY_TYPES, PROVIDER_META } from '../types';
import type { GitHubActivityMetadata, GitHubActivityType } from '../types';

interface IssueGitHubActivityProps {
  issueId: string;
}

type ActivityEntry = {
  id: string;
  type: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  actor?: { name: string; avatar?: string | null };
};

const isGitHubType = (type: string): type is GitHubActivityType =>
  (GITHUB_ACTIVITY_TYPES as readonly string[]).includes(type);

const asGitHubMeta = (metadata?: Record<string, unknown>): GitHubActivityMetadata | null => {
  if (!metadata || metadata.provider !== 'github') return null;
  return metadata as unknown as GitHubActivityMetadata;
};

const relativeTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (absSec < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
  const diffDay = Math.round(diffHr / 24);
  return rtf.format(diffDay, 'day');
};

const PR_STATUS_INDICATOR: Record<string, { icon: string; classes: string }> = {
  GITHUB_PR_OPENED: { icon: '\u{1F7E1}', classes: 'text-yellow-500' },
  GITHUB_PR_MERGED: { icon: '\u{1F7E2}', classes: 'text-green-500' },
  GITHUB_PR_CLOSED: { icon: '\u26AB', classes: 'text-gray-500' },
};

interface BranchEntry {
  branch: string;
  repo: string;
  createdAt: string;
}

interface PrEntry {
  type: GitHubActivityType;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  repo: string;
  createdAt: string;
  mergedAt?: string;
  reviewCount?: number;
}

interface CommitEntry {
  shortSha: string;
  message: string;
  url: string;
  author: string;
  createdAt: string;
}

export const IssueGitHubActivity: React.FC<IssueGitHubActivityProps> = ({
  issueId,
}) => {
  const activityQuery = useIssueActivity(
    issueId,
    { limit: 100 },
    { enabled: Boolean(issueId) },
  );

  const items = useMemo(
    () => activityQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [activityQuery.data],
  );

  const githubItems = useMemo(
    () => items.filter((item: ActivityEntry) => isGitHubType(item.type)),
    [items],
  );

  const { branches, pullRequests, commits } = useMemo(() => {
    const branchMap = new Map<string, BranchEntry>();
    const prMap = new Map<number, PrEntry>();
    const commitList: CommitEntry[] = [];

    for (const item of githubItems) {
      const meta = asGitHubMeta(item.metadata);
      if (!meta) continue;

      if (item.type === 'GITHUB_BRANCH_LINKED' && meta.branch) {
        if (!branchMap.has(meta.branch)) {
          branchMap.set(meta.branch, {
            branch: meta.branch,
            repo: meta.repo,
            createdAt: item.createdAt,
          });
        }
      }

      if (
        (item.type === 'GITHUB_PR_OPENED' ||
          item.type === 'GITHUB_PR_MERGED' ||
          item.type === 'GITHUB_PR_CLOSED') &&
        meta.prNumber
      ) {
        const existing = prMap.get(meta.prNumber);
        // Keep the most recent state of each PR
        if (
          !existing ||
          new Date(item.createdAt) > new Date(existing.createdAt)
        ) {
          prMap.set(meta.prNumber, {
            type: item.type as GitHubActivityType,
            prNumber: meta.prNumber,
            prTitle: meta.prTitle || `PR #${meta.prNumber}`,
            prUrl: meta.prUrl || '',
            repo: meta.repo,
            createdAt: item.createdAt,
            mergedAt: meta.mergedAt,
          });
        }
      }

      if (item.type === 'GITHUB_COMMIT_LINKED' && meta.shortSha) {
        commitList.push({
          shortSha: meta.shortSha,
          message: meta.message || '',
          url: meta.url || '',
          author: meta.author || item.actor?.name || 'Unknown',
          createdAt: item.createdAt,
        });
      }
    }

    return {
      branches: Array.from(branchMap.values()),
      pullRequests: Array.from(prMap.values()),
      commits: commitList,
    };
  }, [githubItems]);

  // Don't render if no GitHub activity
  if (
    activityQuery.isLoading ||
    (branches.length === 0 && pullRequests.length === 0 && commits.length === 0)
  ) {
    return null;
  }

  return (
    <div className="space-y-4 border-t border-gray-100 pt-8 dark:border-border-dark">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.04]">
          <img
            src={PROVIDER_META.github.logo}
            alt="GitHub"
            className="h-4 w-4 dark:invert"
          />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Development
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {pullRequests.length} PR{pullRequests.length !== 1 ? 's' : ''}
            {commits.length > 0 && ` \u00B7 ${commits.length} commit${commits.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-border-dark dark:bg-card-dark">
        {/* Branches */}
        {branches.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
              Branches
            </h4>
            <div className="space-y-1.5">
              {branches.map((b) => (
                <div
                  key={b.branch}
                  className="flex items-center gap-2 text-sm"
                >
                  <GitBranch
                    size={14}
                    className="shrink-0 text-green-500"
                  />
                  <span className="truncate font-mono text-xs text-gray-700 dark:text-gray-300">
                    {b.branch}
                  </span>
                  <span className="shrink-0 text-[11px] text-gray-400">
                    {b.repo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pull Requests */}
        {pullRequests.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
              Pull Requests
            </h4>
            <div className="space-y-2">
              {pullRequests.map((pr) => {
                const indicator =
                  PR_STATUS_INDICATOR[pr.type] ??
                  PR_STATUS_INDICATOR.GITHUB_PR_OPENED;
                const statusLabel =
                  pr.type === 'GITHUB_PR_MERGED'
                    ? 'Merged'
                    : pr.type === 'GITHUB_PR_CLOSED'
                      ? 'Closed'
                      : 'Open';

                return (
                  <div key={pr.prNumber} className="space-y-1">
                    <div className="flex items-start gap-2">
                      <GitPullRequest
                        size={14}
                        className={`mt-0.5 shrink-0 ${indicator.classes}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {pr.prUrl ? (
                            <a
                              href={pr.prUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate text-sm font-medium text-gray-800 transition-colors hover:text-primary dark:text-gray-200"
                            >
                              #{pr.prNumber} {pr.prTitle}
                            </a>
                          ) : (
                            <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                              #{pr.prNumber} {pr.prTitle}
                            </span>
                          )}
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              pr.type === 'GITHUB_PR_MERGED'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : pr.type === 'GITHUB_PR_CLOSED'
                                  ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {pr.repo}{' '}
                          {pr.mergedAt
                            ? `\u00B7 merged ${relativeTime(pr.mergedAt)}`
                            : `\u00B7 ${relativeTime(pr.createdAt)}`}
                        </p>
                      </div>
                      {pr.prUrl && (
                        <a
                          href={pr.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Commits */}
        {commits.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
              Commits ({commits.length})
            </h4>
            <div className="space-y-1.5">
              {commits.map((c) => (
                <div
                  key={c.shortSha}
                  className="flex items-center gap-2 text-sm"
                >
                  <GitCommit
                    size={14}
                    className="shrink-0 text-gray-400"
                  />
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 font-mono text-xs text-primary hover:underline"
                    >
                      {c.shortSha}
                    </a>
                  ) : (
                    <span className="shrink-0 font-mono text-xs text-gray-500">
                      {c.shortSha}
                    </span>
                  )}
                  <span className="min-w-0 truncate text-xs text-gray-600 dark:text-gray-400">
                    &quot;{c.message}&quot;
                  </span>
                  <span className="ml-auto shrink-0 text-[11px] text-gray-400">
                    {c.author} &middot; {relativeTime(c.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
