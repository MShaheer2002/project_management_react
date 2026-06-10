import React, { useState } from 'react';
import { Key, Plus, Trash2, Shield, Clock, User, RefreshCw } from 'lucide-react';
import { useToastStore } from '@/app/stores/useToastStore';
import { useApiKeys } from '@features/api-keys';
import { CreateApiKeyModal } from '@features/api-keys/components/CreateApiKeyModal';
import { RevokeApiKeyDialog } from '@features/api-keys/components/RevokeApiKeyDialog';
import type { ApiKey } from '@/types';

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

export const ApiKeysPage: React.FC = () => {
  const showToast = useToastStore((s) => s.showToast);
  const { data: apiKeys = [], isLoading, error, refetch } = useApiKeys();

  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  const activeKeys = apiKeys.filter((k) => !k.isExpired);
  const expiredKeys = apiKeys.filter((k) => k.isExpired);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold dark:text-white">API Keys</h1>
          {!isLoading && (
            <span className="text-[11px] font-medium text-gray-400 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06]">
              {apiKeys.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          Generate New Key
        </button>
      </header>

      <div className="p-6 space-y-5 overflow-y-auto flex-1">
        {/* Security notice */}
        <div className="flex items-start gap-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/10 px-4 py-3.5">
          <Shield size={16} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
            Never share your API keys or expose them in client-side code. Use environment variables to store them securely.
            Lost your key? Delete the old one and generate a new one — keys cannot be recovered after creation.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 dark:border-border-dark p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-white/[0.06]" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 bg-gray-200 dark:bg-white/[0.06] rounded w-36" />
                    <div className="h-2.5 bg-gray-100 dark:bg-white/[0.04] rounded w-56" />
                  </div>
                </div>
                <div className="h-9 bg-gray-100 dark:bg-white/[0.03] rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Failed to load API keys</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* Active keys */}
            {activeKeys.length > 0 && (
              <div className="space-y-3">
                {activeKeys.map((apiKey) => (
                  <KeyCard
                    key={apiKey.id}
                    apiKey={apiKey}
                    onDelete={setRevokeTarget}
                  />
                ))}
              </div>
            )}

            {/* Expired keys */}
            {expiredKeys.length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
                  Expired
                </p>
                {expiredKeys.map((apiKey) => (
                  <KeyCard
                    key={apiKey.id}
                    apiKey={apiKey}
                    onDelete={setRevokeTarget}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {apiKeys.length === 0 && (
              <div className="py-20 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
                  <Key size={24} className="text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No API keys yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto">
                  Create one to enable external integrations, CI/CD pipelines, or AI assistants.
                </p>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus size={14} />
                  Generate New Key
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CreateApiKeyModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <RevokeApiKeyDialog apiKey={revokeTarget} onClose={() => setRevokeTarget(null)} />
    </div>
  );
};

interface KeyCardProps {
  apiKey: ApiKey;
  onDelete: (apiKey: ApiKey) => void;
}

const KeyCard: React.FC<KeyCardProps> = ({ apiKey, onDelete }) => (
    <div
      className={`rounded-xl border transition-all group ${
        apiKey.isExpired
          ? 'border-gray-200/60 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.01] opacity-60'
          : 'border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark hover:border-gray-300 dark:hover:border-white/[0.1]'
      }`}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg shrink-0 transition-colors ${
              apiKey.isExpired
                ? 'bg-gray-100 dark:bg-white/[0.04] text-gray-300 dark:text-gray-600'
                : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 group-hover:text-primary group-hover:bg-primary/10'
            }`}>
              <Key size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {apiKey.name}
                </h4>
                {apiKey.isExpired && (
                  <span className="text-[10px] font-medium px-1.5 py-px rounded-full bg-red-500/10 text-red-500">
                    Expired
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  Created {formatDate(apiKey.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  Used {formatRelativeTime(apiKey.lastUsedAt)}
                </span>
                <span>
                  {apiKey.expiresAt
                    ? `${apiKey.isExpired ? 'Expired' : 'Expires'} ${formatDate(apiKey.expiresAt)}`
                    : 'Never expires'}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                <User size={10} />
                {apiKey.createdBy.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onDelete(apiKey)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors outline-none"
              title="Revoke key"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center bg-gray-50 dark:bg-black/20 border border-gray-200/80 dark:border-white/[0.06] rounded-lg px-3 py-2">
            <code className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
              {apiKey.keyPrefix}{'••••••••••••••••'}
            </code>
          </div>
        </div>
      </div>
    </div>
);
