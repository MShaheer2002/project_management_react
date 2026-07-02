import React, { useState } from 'react';
import { Modal } from '@/components/modals/Modal';
import { AlertTriangle, Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import type { ApiAxiosError } from '@shared/services/types';
import { useCreateAiConnection } from '../hooks/useAiConnectionMutations';
import { useAiConnectionCatalog } from '../hooks/useAiConnectionData';
import type { AiConnectionCreateResponse, CreateAiConnectionInput } from '../types';

const EXPIRY_OPTIONS = [
  { label: 'Never', days: 0 },
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
];

const CLIENT_OPTIONS = [
  { value: 'codex', label: 'Codex' },
  { value: 'claude_desktop', label: 'Claude Desktop' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'generic_mcp', label: 'Generic MCP' },
] as const;

type SetupGuide = {
  title: string;
  docsLabel: string;
  docsUrl: string;
  notes?: string;
  steps: string[];
  verify: string;
};

function getSetupGuide(
  client: 'codex' | 'claude_desktop' | 'cursor' | 'generic_mcp',
  endpoint: string | undefined,
): SetupGuide {
  switch (client) {
    case 'codex':
      return {
        title: 'Connect in Codex',
        docsLabel: 'OpenAI Codex MCP docs',
        docsUrl: 'https://developers.openai.com/codex/mcp',
        notes: 'Codex stores MCP servers in config.toml. The same config works across the Codex CLI and IDE extension.',
        steps: [
          'Open Codex MCP config. In the IDE extension, open MCP settings and choose "Open config.toml" from the gear menu. In the CLI, edit `~/.codex/config.toml`.',
          'Paste the Trussen TOML block shown below into that file under a new `[mcp_servers.trussen]` entry.',
          'Save the file and reopen Codex or start a new Codex session.',
        ],
        verify: 'In Codex TUI, run `/mcp` to confirm the Trussen server appears, then ask it to list your Trussen projects.',
      };
    case 'claude_desktop':
      return {
        title: 'Connect in Claude Desktop',
        docsLabel: 'MCP local server setup docs',
        docsUrl: 'https://modelcontextprotocol.io/docs/develop/connect-local-servers',
        notes: 'Claude Desktop uses a config file opened from Developer settings. Trussen provides a remote HTTP MCP entry, so paste the generated JSON exactly as shown.',
        steps: [
          'Open Claude Desktop settings from the Claude app menu, then go to the Developer tab.',
          'Click "Edit Config" to open `claude_desktop_config.json`.',
          'Replace or merge the `mcpServers.trussen` entry with the JSON block shown below, then save the file.',
          'Completely quit and restart Claude Desktop.',
        ],
        verify: 'After restart, check that Claude shows the MCP server indicator, then ask it to list your Trussen projects.',
      };
    case 'cursor':
      return {
        title: 'Connect in Cursor',
        docsLabel: 'Cursor MCP docs',
        docsUrl: 'https://cursor.com/docs/mcp',
        notes: 'Cursor’s docs page is the official MCP reference. UI labels can vary slightly by build, but the flow is to open MCP settings, add a server, and paste the generated JSON.',
        steps: [
          'Open Cursor and go to its MCP settings screen.',
          'Add a new MCP server or open the MCP JSON config editor.',
          'Paste the Trussen JSON block shown below and save it.',
          'Reload Cursor or start a new chat so it picks up the Trussen server.',
        ],
        verify: 'Ask Cursor to list your Trussen projects. If it already answers with live project data, the connection is working.',
      };
    case 'generic_mcp':
      return {
        title: 'Connect in another MCP client',
        docsLabel: 'MCP remote server guide',
        docsUrl: 'https://modelcontextprotocol.io/docs/develop/connect-remote-servers',
        notes: endpoint
          ? `Use Trussen as a remote MCP server at ${endpoint}. If your client accepts JSON server definitions, you can use the generated block directly.`
          : 'Use Trussen as a remote MCP server. If your client accepts JSON server definitions, you can use the generated block directly.',
        steps: [
          'Open your client’s MCP, connectors, or tools settings.',
          'Add a remote or HTTP MCP server.',
          'Use the Trussen endpoint and Authorization header shown below, or paste the generated config if the client supports full server JSON.',
          'Save the server and reconnect the client.',
        ],
        verify: 'Test with a simple prompt such as "list my Trussen projects".',
      };
  }
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

interface CreateAiConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAiConnectionModal: React.FC<CreateAiConnectionModalProps> = ({ isOpen, onClose }) => {
  const createAiConnection = useCreateAiConnection();
  const catalogQuery = useAiConnectionCatalog();
  const [name, setName] = useState('');
  const [expiryDays, setExpiryDays] = useState(0);
  const [primaryClient, setPrimaryClient] = useState<'codex' | 'claude_desktop' | 'cursor' | 'generic_mcp'>('codex');
  const [authType, setAuthType] = useState<'pat' | 'oauth'>('pat');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<AiConnectionCreateResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setExpiryDays(0);
    setPrimaryClient('codex');
    setAuthType('pat');
    setError(null);
    setCreated(null);
    setCopiedField(null);
    createAiConnection.reset();
  };

  const handleClose = () => {
    if (created) return;
    reset();
    onClose();
  };

  const handleDone = () => {
    reset();
    onClose();
  };

  const handleCopy = async (id: string, value: string) => {
    await copyText(value);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    try {
      const payload: CreateAiConnectionInput = {
        name: name.trim(),
        primaryClient,
        authType,
        expiresAt: expiryDays > 0 ? addDays(new Date(), expiryDays) : undefined,
      };
      const result = await createAiConnection.mutateAsync(payload);
      setCreated(result);
    } catch (err) {
      const apiError = err as ApiAxiosError;
      const code = apiError.response?.data?.error?.code;

      if (code === 'API_KEY_LIMIT_REACHED') {
        setError("You've reached the maximum AI connection tokens for your plan. Revoke an unused token or upgrade.");
      } else if (code === 'AI_CONNECTION_AUTH_NOT_IMPLEMENTED') {
        setError('OAuth AI connections are planned but not available in this version. Use a personal access token for now.');
      } else {
        setError(apiError.response?.data?.error?.message || 'Could not create AI connection token.');
      }
    }
  };

  const clientCatalog = catalogQuery.data?.clients.find((client) => client.id === primaryClient);
  const patMethod = catalogQuery.data?.authMethods.find((method) => method.type === 'pat');
  const oauthMethod = catalogQuery.data?.authMethods.find((method) => method.type === 'oauth');

  const preferredSetup =
    created?.setup[
      primaryClient === 'claude_desktop'
        ? 'claudeDesktop'
        : primaryClient === 'generic_mcp'
          ? 'genericMcp'
          : primaryClient
    ];
  const setupGuide = created ? getSetupGuide(primaryClient, 'endpoint' in preferredSetup! ? preferredSetup.endpoint : undefined) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={created ? 'Your AI connection token is ready' : 'Generate AI Connection Token'}
      maxWidth={created ? 'max-w-2xl' : 'max-w-md'}
    >
      {!created ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Connection name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Owner Analytics Access"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Primary client</label>
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

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Auth method</label>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setAuthType('pat')}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  authType === 'pat'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-black/20'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Personal Access Token</div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {patMethod?.summary ?? 'Generate a Trussen token and paste the config into your client.'}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    Available
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAuthType('oauth')}
                className="rounded-xl border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-black/20 px-4 py-3 text-left opacity-70 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">OAuth</div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {oauthMethod?.summary ?? 'Planned for hosted clients that support user-authorized remote connections.'}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    Planned
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Expiration</label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            >
              {EXPIRY_OPTIONS.map((opt) => (
                <option key={opt.days} value={opt.days}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-blue-500/10 bg-blue-500/[0.06] px-4 py-3 text-xs text-blue-700 dark:text-blue-300/80 leading-relaxed">
            This creates a Trussen-scoped AI connection token for remote MCP clients. The generated setup points directly at the Trussen MCP endpoint, so normal users only need to paste the config and token into their AI client.
          </div>

          {clientCatalog && (
            <div className="rounded-xl border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-black/20 px-4 py-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              <p className="font-medium text-gray-900 dark:text-white">{clientCatalog.label} capabilities</p>
              <p className="mt-1">
                Available auth: {clientCatalog.availableAuthMethods.map((method) => method.toUpperCase()).join(', ')}. Setup mode: copy ready config.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-border-dark">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAiConnection.isPending || !name.trim()}
              className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
            >
              {createAiConnection.isPending && <Loader2 size={16} className="animate-spin" />}
              {authType === 'pat' ? 'Generate Token' : 'Continue'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.08] px-4 py-3 text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed">
            This token is shown only once. Store it securely. Anyone with this token can act with the same Trussen permissions as the user who created it, within the allowed AI safety boundary.
          </div>

          {setupGuide && (
            <div className="rounded-xl border border-blue-500/10 bg-blue-500/[0.06] px-4 py-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{setupGuide.title}</p>
                  {setupGuide.notes && (
                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-300/80 leading-relaxed">{setupGuide.notes}</p>
                  )}
                </div>
                <a
                  href={setupGuide.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:opacity-80 shrink-0"
                >
                  {setupGuide.docsLabel}
                  <ExternalLink size={12} />
                </a>
              </div>

              <ol className="space-y-2 text-xs text-gray-700 dark:text-gray-300 list-decimal list-inside">
                {setupGuide.steps.map((step) => (
                  <li key={step} className="leading-relaxed">{step}</li>
                ))}
              </ol>

              <div className="rounded-lg border border-blue-500/10 bg-white/40 dark:bg-black/20 px-3 py-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                <span className="font-medium text-gray-900 dark:text-white">Verify:</span> {setupGuide.verify}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1.5">AI connection token</p>
            <button
              type="button"
              onClick={() => handleCopy('token', created.token)}
              className="w-full text-left p-3 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/[0.06] rounded-lg hover:border-gray-300 dark:hover:border-white/[0.12] transition-colors group cursor-copy"
            >
              <div className="flex items-center justify-between gap-3">
                <code className="font-mono text-[12.5px] text-gray-800 dark:text-gray-200 truncate">
                  {created.token}
                </code>
                <span className="shrink-0 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                  {copiedField === 'token' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </span>
              </div>
            </button>
          </div>

          {preferredSetup && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{preferredSetup.title}</p>
                {'config' in preferredSetup && preferredSetup.config ? (
                  <button
                    type="button"
                    onClick={() => handleCopy('setup', preferredSetup.config!)}
                    className="text-xs text-primary hover:opacity-80"
                  >
                    {copiedField === 'setup' ? 'Copied' : 'Copy config'}
                  </button>
                ) : null}
              </div>
              {'config' in preferredSetup && preferredSetup.config ? (
                <pre className="p-3 rounded-xl bg-gray-950 text-[11px] text-gray-200 overflow-x-auto border border-white/[0.06] whitespace-pre-wrap break-all">
                  {preferredSetup.config}
                </pre>
              ) : (
                <div className="rounded-xl border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-black/20 px-4 py-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Point your MCP client at <code className="font-mono">{preferredSetup.endpoint}</code> and send the auth header exactly as shown below.
                  </p>
                  <div className="mt-2 rounded-lg bg-gray-950 text-gray-200 border border-white/[0.06] px-3 py-2 text-[11px] font-mono break-all">
                    {preferredSetup.authHeaderName}: {preferredSetup.authHeaderValue}
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400 list-disc list-inside">
                    {preferredSetup.steps?.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-black/20 px-4 py-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            This setup is generated from the backend base URL. In development it falls back to your local Trussen backend URL; in production it should point at the deployed Trussen MCP endpoint automatically. For Codex, the config block already contains what you need to paste into `config.toml`.
          </div>

          <button
            type="button"
            onClick={handleDone}
            className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            I've copied the token
          </button>
        </div>
      )}
    </Modal>
  );
};
