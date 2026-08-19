import React, { useEffect, useState } from 'react';
import { Activity, Bot, Cable, Clock, KeyRound, Plus, RefreshCw, Shield, ShieldCheck, Trash2, Wrench } from 'lucide-react';
import {
  useAiConnectionHealthCheck,
  useAiConnectionSessions,
  useAiConnections,
  useRotateAiConnection,
} from '@features/ai-connections';
import { CreateAiConnectionModal } from '@features/ai-connections/components/CreateAiConnectionModal';
import { RevokeAiConnectionDialog } from '@features/ai-connections/components/RevokeAiConnectionDialog';
import { EditScopesDialog } from '@features/ai-connections/components/EditScopesDialog';
import type { AiConnection, AiConnectionCreateResponse, AiConnectionSession } from '@features/ai-connections/types';
import { useToastStore } from '@/app/stores/useToastStore';

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

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatClientLabel(client: AiConnection['client']): string {
  switch (client) {
    case 'codex':
      return 'Codex';
    case 'claude_desktop':
      return 'Claude Desktop';
    case 'claude_code':
      return 'Claude Code';
    case 'chatgpt':
      return 'ChatGPT';
    case 'gemini_cli':
      return 'Gemini CLI';
    case 'windsurf':
      return 'Windsurf';
    case 'vscode':
      return 'VS Code';
    case 'cursor':
      return 'Cursor';
    case 'generic_mcp':
      return 'Generic MCP';
  }
}

function healthBadgeClasses(status: AiConnection['health']['status']) {
  switch (status) {
    case 'ready':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'warning':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'error':
      return 'bg-red-500/10 text-red-600 dark:text-red-400';
  }
}

function healthLabel(status: AiConnection['health']['status']) {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'warning':
      return 'Needs review';
    case 'error':
      return 'Blocked';
  }
}

function sessionStatusLabel(status: AiConnectionSession['status']) {
  switch (status) {
    case 'active':
      return 'Active';
    case 'succeeded':
      return 'Succeeded';
    case 'failed':
      return 'Failed';
    case 'rejected':
      return 'Rejected';
  }
}

function sessionStatusClasses(status: AiConnectionSession['status']) {
  switch (status) {
    case 'active':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'succeeded':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'failed':
    case 'rejected':
      return 'bg-red-500/10 text-red-600 dark:text-red-400';
  }
}

const setupCards = [
  { title: 'Codex', description: 'Copy a ready TOML block that points to the Trussen MCP URL.' },
  { title: 'Claude Desktop', description: 'Copy a ready JSON config block for remote Trussen MCP access.' },
  { title: 'Cursor', description: 'Use the same token with a generated Trussen MCP endpoint config.' },
];

interface AiConnectionsPageProps {
  /** Render as a section within another page (e.g. Settings tabs) instead of a standalone full-height page — drops the bordered header and own scroll/padding. */
  embedded?: boolean;
}

export const AiConnectionsPage: React.FC<AiConnectionsPageProps> = ({ embedded = false }) => {
  const { data: connections = [], isLoading, error, refetch } = useAiConnections();
  const healthCheck = useAiConnectionHealthCheck();
  const rotateConnection = useRotateAiConnection();
  const showToast = useToastStore((s) => s.showToast);
  const [createOpen, setCreateOpen] = useState(false);
  const [tokenResult, setTokenResult] = useState<AiConnectionCreateResponse | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<AiConnection | null>(null);
  const [scopesTarget, setScopesTarget] = useState<AiConnection | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const sessionsQuery = useAiConnectionSessions(selectedConnectionId);

  useEffect(() => {
    if (!selectedConnectionId && connections[0]) {
      setSelectedConnectionId(connections[0].id);
      return;
    }

    if (selectedConnectionId && !connections.some((connection) => connection.id === selectedConnectionId)) {
      setSelectedConnectionId(connections[0]?.id ?? null);
    }
  }, [connections, selectedConnectionId]);

  const selectedConnection =
    connections.find((connection) => connection.id === selectedConnectionId) ?? null;

  const handleRunCheck = async (connection: AiConnection) => {
    try {
      const result = await healthCheck.mutateAsync(connection.id);
      const firstProblem = result.diagnostics.checks.find((check) => check.status !== 'pass');

      if (result.diagnostics.status === 'ready') {
        showToast('Connection is ready for external MCP clients.', 'success', 'AI connection check');
      } else if (result.diagnostics.status === 'warning') {
        showToast(firstProblem?.message ?? 'Connection has a warning that should be reviewed.', 'warning', 'AI connection check', 7000);
      } else {
        showToast(firstProblem?.message ?? 'Connection is blocked and needs attention before it can be used.', 'error', 'AI connection check', 7000);
      }
    } catch {
      showToast('Could not run AI connection diagnostics.', 'error');
    }
  };

  const handleRotate = async (connection: AiConnection) => {
    try {
      const result = await rotateConnection.mutateAsync(connection.id);
      setTokenResult(result);
      showToast('AI connection rotated. Copy the replacement token before closing the modal.', 'success', 'AI connection rotated', 7000);
    } catch {
      showToast('Could not rotate AI connection token.', 'error');
    }
  };

  return (
    <div className={embedded ? '' : 'flex flex-col h-full'}>
      <header className={`flex items-center justify-between ${embedded ? 'pb-4' : 'px-6 py-4 border-b border-gray-200 dark:border-border-dark'}`}>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold dark:text-white">Personal Access Tokens</h1>
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

      <div className={embedded ? 'space-y-5' : 'p-6 space-y-5 overflow-y-auto flex-1'}>
        <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 via-primary/[0.06] to-transparent px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Bot size={18} />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">External AI access</h2>
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                Generate one Trussen-scoped connection token, then copy a ready setup block for Codex, Claude Desktop, or Cursor.
                The token resolves workspace and permissions automatically. Verification, rotation, and recent MCP sessions are tracked here for operators.
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
          <>
            <div className="space-y-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  onClick={() => setSelectedConnectionId(connection.id)}
                  className={`cursor-pointer rounded-xl border transition-all group ${
                    connection.isExpired
                      ? 'border-gray-200/60 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.01] opacity-60'
                      : selectedConnectionId === connection.id
                        ? 'border-primary/40 bg-white dark:bg-card-dark'
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
                            <span className={`text-[10px] font-medium px-1.5 py-px rounded-full ${healthBadgeClasses(connection.health.status)}`}>
                              {healthLabel(connection.health.status)}
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
                            <span>{connection.requestCount} sessions</span>
                            <span>{connection.toolCallCount} tool calls</span>
                          </div>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            {connection.health.checks.find((check) => check.status !== 'pass')?.message ?? 'Connection is ready for remote MCP clients.'}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                            Verified {formatDateTime(connection.verification.lastVerifiedAt)}
                            {connection.rotatedAt ? ` • Rotated ${formatDateTime(connection.rotatedAt)}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleRunCheck(connection);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Run connection diagnostics"
                          disabled={healthCheck.isPending}
                        >
                          <Activity size={14} />
                          Check
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setScopesTarget(connection);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit access scopes"
                        >
                          <ShieldCheck size={14} />
                          Scopes
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleRotate(connection);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Rotate AI connection token"
                          disabled={rotateConnection.isPending}
                        >
                          <KeyRound size={14} />
                          Rotate
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setRevokeTarget(connection);
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors outline-none"
                          title="Revoke AI connection"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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

            {selectedConnection && (
              <div className="rounded-2xl border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-border-dark">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent MCP sessions</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Latest remote usage for {selectedConnection.name}. This helps debug failed connections, token rotation, and tool-level activity.
                  </p>
                </div>

                <div className="px-5 py-4 space-y-3">
                  {sessionsQuery.isLoading && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">Loading session activity…</div>
                  )}

                  {!sessionsQuery.isLoading && (sessionsQuery.data?.length ?? 0) === 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">No MCP sessions recorded yet for this connection.</div>
                  )}

                  {sessionsQuery.data?.map((session) => (
                    <div key={session.id} className="rounded-xl border border-gray-200 dark:border-border-dark bg-gray-50/70 dark:bg-black/20 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${sessionStatusClasses(session.status)}`}>
                          {sessionStatusLabel(session.status)}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">{session.transport.toUpperCase()}</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">{session.toolCallCount} tool calls</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">Started {formatDateTime(session.startedAt)}</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                        {session.lastErrorMessage ?? `Run by ${session.user.name} (${session.user.email}).`}
                      </p>
                      {session.steps.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {session.steps.map((step) => (
                            <span
                              key={step.id}
                              className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                                step.status === 'SUCCEEDED'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}
                            >
                              {step.toolName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && !error && connections.length === 0 && (
          <div className="py-20 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
              <Cable size={24} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No personal access tokens yet</p>
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

      <CreateAiConnectionModal
        isOpen={createOpen || Boolean(tokenResult)}
        onClose={() => {
          setCreateOpen(false);
          setTokenResult(null);
        }}
        presetResult={tokenResult}
      />
      <RevokeAiConnectionDialog connection={revokeTarget} onClose={() => setRevokeTarget(null)} />
      <EditScopesDialog connection={scopesTarget} onClose={() => setScopesTarget(null)} />
    </div>
  );
};
