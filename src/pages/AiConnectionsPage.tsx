import React, { useState } from 'react';
import { Bot, Cable, Clock, Plus, RefreshCw, Shield, Trash2, Wrench } from 'lucide-react';
import { useAiConnections } from '@features/ai-connections';
import { CreateAiConnectionModal } from '@features/ai-connections/components/CreateAiConnectionModal';
import { RevokeAiConnectionDialog } from '@features/ai-connections/components/RevokeAiConnectionDialog';
import type { AiConnection } from '@features/ai-connections/types';

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatClientLabel(client: AiConnection['client']): string {
  switch (client) {
    case 'codex':
      return 'Codex';
    case 'claude_desktop':
      return 'Claude Desktop';
    case 'cursor':
      return 'Cursor';
    case 'generic_mcp':
      return 'Generic MCP';
  }
}

const setupCards = [
  { title: 'Codex', description: 'Copy a ready TOML block that points to the Trussen MCP URL.' },
  { title: 'Claude Desktop', description: 'Copy a ready JSON config block for remote Trussen MCP access.' },
  { title: 'Cursor', description: 'Use the same token with a generated Trussen MCP endpoint config.' },
];

export const AiConnectionsPage: React.FC = () => {
  const { data: connections = [], isLoading, error, refetch } = useAiConnections();
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AiConnection | null>(null);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold dark:text-white">AI Connections</h1>
          {!isLoading && (
            <span className="text-[11px] font-medium text-gray-400 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06]">
              {connections.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          Generate Token
        </button>
      </header>

      <div className="p-6 space-y-5 overflow-y-auto flex-1">
        <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 via-primary/[0.06] to-transparent px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Bot size={18} />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">External AI access</h2>
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                Generate one Trussen-scoped connection token, then copy a ready setup block for Codex, Claude Desktop, or Cursor.
                The token resolves workspace and permissions automatically. The generated setup points clients at the Trussen MCP endpoint directly, so the user only needs to paste the config and token.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {setupCards.map((card) => (
            <div key={card.title} className="rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium dark:text-white">
                <Cable size={14} className="text-primary" />
                {card.title}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/10 px-4 py-3.5">
          <Shield size={16} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
            AI connection tokens inherit the permissions of the user who created them and still respect Trussen’s no-delete AI safety boundary.
            Keep them in secure client config only.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 dark:border-border-dark p-5 animate-pulse">
                <div className="h-3.5 bg-gray-200 dark:bg-white/[0.06] rounded w-40 mb-3" />
                <div className="h-2.5 bg-gray-100 dark:bg-white/[0.04] rounded w-64 mb-2" />
                <div className="h-9 bg-gray-100 dark:bg-white/[0.03] rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Failed to load AI connections</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && connections.length > 0 && (
          <div className="space-y-3">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className={`rounded-xl border transition-all group ${
                  connection.isExpired
                    ? 'border-gray-200/60 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.01] opacity-60'
                    : 'border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark hover:border-gray-300 dark:hover:border-white/[0.1]'
                }`}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg shrink-0 bg-gray-100 dark:bg-white/[0.06] text-gray-400 group-hover:text-primary group-hover:bg-primary/10">
                        <Wrench size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {connection.name}
                          </h4>
                          <span className="text-[10px] font-medium px-1.5 py-px rounded-full bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-300">
                            {formatClientLabel(connection.client)}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-px rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase">
                            {connection.authType}
                          </span>
                          {connection.isExpired && (
                            <span className="text-[10px] font-medium px-1.5 py-px rounded-full bg-red-500/10 text-red-500">
                              Expired
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            Created {formatDate(connection.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            Used {formatRelativeTime(connection.lastUsedAt)}
                          </span>
                          <span>
                            {connection.expiresAt
                              ? `${connection.isExpired ? 'Expired' : 'Expires'} ${formatDate(connection.expiresAt)}`
                              : 'Never expires'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setRevokeTarget(connection)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors outline-none shrink-0 opacity-0 group-hover:opacity-100"
                      title="Revoke AI connection"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center bg-gray-50 dark:bg-black/20 border border-gray-200/80 dark:border-white/[0.06] rounded-lg px-3 py-2">
                    <code className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                      {connection.keyPrefix}{'••••••••••••••••'}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && connections.length === 0 && (
          <div className="py-20 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
              <Cable size={24} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No AI connections yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto">
              Generate one token and connect Trussen to external AI tools through the Trussen MCP endpoint.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus size={14} />
              Generate Token
            </button>
          </div>
        )}
      </div>

      <CreateAiConnectionModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <RevokeAiConnectionDialog connection={revokeTarget} onClose={() => setRevokeTarget(null)} />
    </div>
  );
};
