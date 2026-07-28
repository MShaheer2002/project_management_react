import React, { useState } from 'react';
import { Loader2, Sparkles, BarChart3, ShieldCheck, Users } from 'lucide-react';
import { useAiUserUsage, useAiWorkspaceUsage } from '@/features/ai';
import type { AiUsagePeriod, AiWorkspaceDailyUsage } from '@/features/ai';
import { useAuthStore } from '@/app/stores/useAuthStore';

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

const AI_PERIOD_OPTIONS: Array<{ value: AiUsagePeriod; label: string }> = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
];

const AiUsageBars: React.FC<{ data: AiWorkspaceDailyUsage[] }> = ({ data }) => {
  const maxTokens = Math.max(...data.map((entry) => entry.totalTokens), 1);

  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((entry) => {
        const height = Math.max((entry.totalTokens / maxTokens) * 100, entry.totalTokens > 0 ? 10 : 4);
        return (
          <div key={entry.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div
              title={`${entry.date}: ${entry.totalTokens.toLocaleString()} tokens`}
              className="w-full rounded-t-xl bg-gradient-to-t from-primary via-primary/80 to-cyan-400/80 transition-all hover:opacity-85"
              style={{ height: `${height}%` }}
            />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {entry.date.slice(5)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const AiUsagePage: React.FC = () => {
  const role = useAuthStore((s) => s.workspace?.role);
  const [aiPeriod, setAiPeriod] = useState<AiUsagePeriod>('30d');

  const aiWorkspaceUsageQuery = useAiWorkspaceUsage({
    period: aiPeriod,
    limit: 8,
    enabled: role === 'owner' || role === 'admin',
  });
  const aiUserUsageQuery = useAiUserUsage({
    period: aiPeriod,
    limit: 20,
    enabled: role === 'owner' || role === 'admin',
  });

  const aiWorkspaceUsage = aiWorkspaceUsageQuery.data;
  const aiUsers = aiUserUsageQuery.data?.users ?? [];
  const aiPolicy = aiWorkspaceUsage?.policy;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ── */}
      <header className="px-8 py-6 border-b border-gray-200 dark:border-border-dark flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Usage</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track adoption, cost pressure, and who is using AI the most in this workspace.
          </p>
        </div>
        <div className="inline-flex w-fit items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-border-dark dark:bg-card-dark shrink-0">
          {AI_PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAiPeriod(option.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                aiPeriod === option.value
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 max-w-5xl space-y-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BarChart3 size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Usage overview</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {aiWorkspaceUsage
                        ? `${aiWorkspaceUsage.range.from} to ${aiWorkspaceUsage.range.to}`
                        : 'Tracking recent workspace usage'}
                    </p>
                  </div>
                </div>
              </div>

              {aiPolicy && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    aiPolicy.effectiveAccess
                      ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300'
                      : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                  }`}>
                    {aiPolicy.effectiveAccess ? 'AI Available' : 'AI Blocked'}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    aiPolicy.enforcementMode === 'enforced'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                      : 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
                  }`}>
                    {aiPolicy.enforcementMode === 'enforced' ? 'Limits Enforced' : 'Monitor Only'}
                  </span>
                </div>
              )}
            </div>

            {aiWorkspaceUsageQuery.isLoading ? (
              <div className="flex h-56 items-center justify-center">
                <Loader2 size={18} className="animate-spin text-gray-400" />
              </div>
            ) : aiWorkspaceUsageQuery.isError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                Failed to load AI usage for this workspace.
              </div>
            ) : aiWorkspaceUsage ? (
              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-border-dark dark:bg-black/10">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Tokens</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formatCompactNumber(aiWorkspaceUsage.totals.totalTokens)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-border-dark dark:bg-black/10">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Requests</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formatCompactNumber(aiWorkspaceUsage.totals.requestCount)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-border-dark dark:bg-black/10">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Active Users</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{aiWorkspaceUsage.totals.activeUsers}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-border-dark dark:bg-black/10">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Chat / Drafts</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                      {aiWorkspaceUsage.totals.chatTurnCount}
                      <span className="mx-1 text-gray-300">/</span>
                      {aiWorkspaceUsage.totals.issueGenerationCount}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-border-dark dark:bg-black/10">
                  {aiWorkspaceUsage.daily.length > 0 ? (
                    <AiUsageBars data={aiWorkspaceUsage.daily} />
                  ) : (
                    <div className="flex h-40 flex-col items-center justify-center text-center">
                      <Sparkles size={18} className="text-gray-300 dark:text-gray-600" />
                      <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">No AI activity yet</p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        Usage trend will appear once the workspace starts using Trussen AI.
                      </p>
                    </div>
                  )}
                </div>

                {aiPolicy && (
                  <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 dark:border-border-dark dark:bg-card-dark">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                        <ShieldCheck size={15} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {aiPolicy.enforcementMode === 'enforced'
                            ? 'AI limits are currently enforced.'
                            : 'AI limits are in monitor mode while plan caps are being finalized.'}
                        </p>
                        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                          Workspace plan: <strong className="text-gray-700 dark:text-gray-200">{aiPolicy.accessPlan}</strong>.
                          {' '}Daily request limit:{' '}
                          <strong className="text-gray-700 dark:text-gray-200">
                            {aiPolicy.limits.requestLimit ? aiPolicy.limits.requestLimit.toLocaleString() : 'Not configured'}
                          </strong>.
                          {' '}Daily token limit:{' '}
                          <strong className="text-gray-700 dark:text-gray-200">
                            {aiPolicy.limits.tokenLimit ? formatCompactNumber(aiPolicy.limits.tokenLimit) : 'Not configured'}
                          </strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Per-user usage</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">See who is driving most of the AI load.</p>
              </div>
            </div>

            {aiUserUsageQuery.isLoading ? (
              <div className="flex h-56 items-center justify-center">
                <Loader2 size={18} className="animate-spin text-gray-400" />
              </div>
            ) : aiUserUsageQuery.isError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                Failed to load per-user AI usage.
              </div>
            ) : aiUsers.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center text-center">
                <Users size={18} className="text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">No user activity yet</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Per-user usage appears after the first AI request is recorded.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {aiUsers.map((user) => (
                  <div key={user.userId} className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-border-dark dark:bg-black/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="truncate text-xs text-gray-400 dark:text-gray-500">{user.email}</p>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 shadow-sm dark:bg-card-dark dark:text-gray-300">
                        {user.role}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="font-bold uppercase tracking-wider text-gray-400">Tokens</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{formatCompactNumber(user.totalTokens)}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase tracking-wider text-gray-400">Requests</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{user.requestCount}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase tracking-wider text-gray-400">Chat Turns</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{user.chatTurnCount}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase tracking-wider text-gray-400">Issue Drafts</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{user.issueGenerationCount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
