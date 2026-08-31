import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertTriangle, Check, Link2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useWorkspaces } from '@features/workspace';
import type { WorkspaceResponse } from '@features/workspace';
import { useCompleteOAuthSetup } from '@features/ai-connections';
import { ScopesField } from '@features/ai-connections/components/ScopesField';
import { ADMIN_SCOPE } from '@features/ai-connections/scopes';
import { CLIENT_OPTIONS } from '@features/ai-connections/clients';
import type { ApiAxiosError } from '@shared/services/types';
import { Logo } from './auth/shared';

export const ConnectAiPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');

  const activeWorkspace = useAuthStore((s) => s.workspace);
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
  const completeSetup = useCompleteOAuthSetup();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(activeWorkspace?.id ?? null);
  const [name, setName] = useState('');
  const [primaryClient, setPrimaryClient] = useState<(typeof CLIENT_OPTIONS)[number]['value']>('generic_mcp');
  const [scopes, setScopes] = useState<string[]>([ADMIN_SCOPE]);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  if (!clientId) {
    return (
      <PageShell>
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold tracking-tight dark:text-white">Missing connection details</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            This page needs to be opened from your AI client's connection prompt — it's missing the client ID that
            identifies which app is connecting. Try connecting again from Claude, Codex, or whichever client you're
            using.
          </p>
        </div>
      </PageShell>
    );
  }

  if (connected) {
    return (
      <PageShell>
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5">
            <Check size={24} className="text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold tracking-tight dark:text-white">Connected</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Go back to your AI client and try your request again — it can now access Trussen.
          </p>
        </div>
      </PageShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId || !name.trim() || scopes.length === 0) return;
    setError(null);

    try {
      await completeSetup.mutateAsync({
        workspaceId: selectedWorkspaceId,
        clientId,
        name: name.trim(),
        primaryClient,
        scopes,
      });
      setConnected(true);
    } catch (err) {
      const apiError = err as ApiAxiosError;
      setError(apiError.response?.data?.error?.message || 'Could not finish connecting. Try again.');
    }
  };

  return (
    <PageShell>
      <div className="text-center mb-7">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Link2 size={24} className="text-primary" />
        </div>
        <h1 className="text-xl font-bold tracking-tight dark:text-white">Connect your AI client</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Pick a workspace and what this connection can access. This only happens once for this client.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Workspace</label>
          {workspacesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={18} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-1.5">
              {workspaces?.map((ws: WorkspaceResponse) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => setSelectedWorkspaceId(ws.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-colors ${
                    selectedWorkspaceId === ws.id
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-black/20 hover:border-gray-300 dark:hover:border-white/[0.12]'
                  }`}
                >
                  {ws.logo ? (
                    <img src={ws.logo} alt={ws.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                      {ws.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">{ws.name}</span>
                  {selectedWorkspaceId === ws.id && <Check size={15} className="text-primary shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Connection name</label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. My Claude Desktop"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Which client is this?</label>
          <select
            value={primaryClient}
            onChange={(e) => setPrimaryClient(e.target.value as typeof primaryClient)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          >
            {CLIENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <ScopesField value={scopes} onChange={setScopes} />

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={completeSetup.isPending || !selectedWorkspaceId || !name.trim() || scopes.length === 0}
          className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {completeSetup.isPending && <Loader2 size={16} className="animate-spin" />}
          Connect
        </button>
      </form>
    </PageShell>
  );
};

const PageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-white dark:bg-bg-dark selection:bg-primary/30">
    <div className="px-5 sm:px-8 py-5">
      <Logo />
    </div>
    <div className="flex-1 flex items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {children}
      </motion.div>
    </div>
  </div>
);
