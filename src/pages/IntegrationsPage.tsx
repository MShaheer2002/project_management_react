import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ExternalLink,
  Filter,
  Globe,
  Loader2,
  Plus,
  Search,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import { canManageIntegrations } from '@shared/permissions';
import {
  useIntegrations,
  useConnectGitHub,
  useConnectSlack,
  useDisconnectIntegration,
  integrationQueryKeys,
  GitHubSettingsPanel,
  SlackSettingsPanel,
  DiscordSettingsPanel,
  DiscordConnectModal,
  FigmaSettingsPanel,
  FigmaConnectModal,
  PROVIDER_META,
} from '@features/integrations';
import type { IntegrationItem, IntegrationProvider } from '@features/integrations';
import type { ApiAxiosError } from '@shared/services/types';

const relativeTime = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
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

type EnrichedIntegration = {
  id: IntegrationProvider;
  name: string;
  description: string;
  logo: string;
  available: boolean;
  connected: boolean;
  connectedAt: string | null;
  connectedBy: IntegrationItem['connectedBy'];
};

export const IntegrationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  const role = useAuthStore((s) => s.workspace?.role);
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const isManager = canManageIntegrations(role);

  const [search, setSearch] = useState('');
  const [showGitHubSettings, setShowGitHubSettings] = useState(false);
  const [showSlackSettings, setShowSlackSettings] = useState(false);
  const [showDiscordSettings, setShowDiscordSettings] = useState(false);
  const [showDiscordConnect, setShowDiscordConnect] = useState(false);
  const [showFigmaSettings, setShowFigmaSettings] = useState(false);
  const [showFigmaConnect, setShowFigmaConnect] = useState(false);
  const [disconnectingProvider, setDisconnectingProvider] =
    useState<IntegrationProvider | null>(null);

  const { data: integrations = [], isLoading, isError, refetch } = useIntegrations();
  const connectGitHub = useConnectGitHub();
  const connectSlack = useConnectSlack();
  const disconnectIntegration = useDisconnectIntegration();

  // Handle OAuth callback redirect params
  useEffect(() => {
    const provider = searchParams.get('provider');
    const status = searchParams.get('status');
    const message = searchParams.get('message');

    if (!provider || !status) return;

    if (status === 'connected') {
      showToast(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} connected successfully`,
        'success',
        'Integration connected',
      );
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.list(workspaceId),
      });
    } else if (status === 'error') {
      showToast(
        message || `Failed to connect ${provider}`,
        'error',
        'Connection failed',
      );
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, showToast, queryClient, workspaceId]);

  // Merge API data with static provider metadata
  const enrichedIntegrations = useMemo<EnrichedIntegration[]>(() => {
    const list = Object.values(PROVIDER_META).map((meta) => {
      const apiData = integrations.find((i) => i.provider === meta.id);
      return {
        id: meta.id,
        name: meta.name,
        description: meta.description,
        logo: meta.logo,
        available: meta.available,
        connected: apiData?.connected ?? false,
        connectedAt: apiData?.connectedAt ?? null,
        connectedBy: apiData?.connectedBy ?? null,
      };
    });

    if (!search.trim()) return list;
    const term = search.trim().toLowerCase();
    return list.filter(
      (i) =>
        i.name.toLowerCase().includes(term) ||
        i.description.toLowerCase().includes(term),
    );
  }, [integrations, search]);

  const connectedCount = enrichedIntegrations.filter((i) => i.connected).length;

  const handleConnect = useCallback(
    async (provider: IntegrationProvider) => {
      if (!PROVIDER_META[provider]?.available) {
        showToast(`${PROVIDER_META[provider]?.name ?? provider} integration coming soon`, 'info');
        return;
      }

      // Discord uses inline webhook form, not OAuth
      if (provider === 'discord') {
        setShowDiscordConnect(true);
        return;
      }

      // Figma uses inline token form, not OAuth
      if (provider === 'figma') {
        setShowFigmaConnect(true);
        return;
      }

      const providerName = PROVIDER_META[provider]?.name ?? provider;
      try {
        const connectFn = provider === 'github' ? connectGitHub : connectSlack;
        const result = await connectFn.mutateAsync();
        window.location.href = result.authUrl;
      } catch (err) {
        const apiErr = err as ApiAxiosError;
        const code = apiErr.response?.data?.error?.code;
        if (code === 'GITHUB_NOT_CONFIGURED' || code === 'SLACK_NOT_CONFIGURED') {
          showToast(`${providerName} integration is not configured on this server`, 'error');
        } else {
          showToast(apiErr.response?.data?.error?.message || `Failed to connect ${providerName}`, 'error');
        }
      }
    },
    [connectGitHub, connectSlack, showToast],
  );

  const confirmDisconnect = useCallback(() => {
    if (!disconnectingProvider) return;
    disconnectIntegration.mutate(disconnectingProvider);
    setDisconnectingProvider(null);
  }, [disconnectingProvider, disconnectIntegration]);

  // Find integration items for settings panels
  const githubIntegration = useMemo(
    () => integrations.find((i) => i.provider === 'github') ?? null,
    [integrations],
  );
  const slackIntegration = useMemo(
    () => integrations.find((i) => i.provider === 'slack') ?? null,
    [integrations],
  );
  const discordIntegration = useMemo(
    () => integrations.find((i) => i.provider === 'discord') ?? null,
    [integrations],
  );
  const figmaIntegration = useMemo(
    () => integrations.find((i) => i.provider === 'figma') ?? null,
    [integrations],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Loading integrations...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <AlertCircle size={26} className="text-red-500" />
        <div className="space-y-1">
          <h1 className="text-lg font-bold">Failed to load integrations</h1>
          <p className="text-sm text-gray-400">
            Could not retrieve integration data. Please try again.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Integrations</h1>
          <span className="text-xs text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
            {connectedCount} connected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search integrations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm outline-none w-64 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrichedIntegrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-6 shadow-sm hover:border-primary/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 p-2 flex items-center justify-center">
                  <img
                    src={integration.logo}
                    alt={integration.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                {integration.connected ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 size={12} />
                    Connected
                  </div>
                ) : !integration.available ? (
                  <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    Coming Soon
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    Not Connected
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  {integration.name}
                  <ExternalLink
                    size={14}
                    className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {integration.description}
                </p>
              </div>

              {/* Connected-by info */}
              {integration.connected && integration.connectedBy && (
                <div className="text-[11px] text-gray-400 mb-4">
                  Connected by {integration.connectedBy.name}
                  {integration.connectedAt &&
                    ` \u00B7 ${relativeTime(integration.connectedAt)}`}
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                {integration.connected && (integration.id === 'github' || integration.id === 'slack' || integration.id === 'discord' || integration.id === 'figma') && isManager && (
                  <button
                    type="button"
                    onClick={() => {
                      if (integration.id === 'github') setShowGitHubSettings(true);
                      if (integration.id === 'slack') setShowSlackSettings(true);
                      if (integration.id === 'discord') setShowDiscordSettings(true);
                      if (integration.id === 'figma') setShowFigmaSettings(true);
                    }}
                    className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-border-dark text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5"
                  >
                    <Settings size={12} />
                    Settings
                  </button>
                )}
                {integration.connected && isManager ? (
                  <button
                    type="button"
                    onClick={() => setDisconnectingProvider(integration.id)}
                    disabled={disconnectIntegration.isPending}
                    className="px-4 py-1.5 rounded-md border border-gray-200 dark:border-border-dark text-xs font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                ) : !integration.connected && integration.available && isManager ? (
                  <button
                    type="button"
                    onClick={() => handleConnect(integration.id)}
                    disabled={connectGitHub.isPending || connectSlack.isPending}
                    className="px-4 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {(connectGitHub.isPending || connectSlack.isPending) && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    Connect
                  </button>
                ) : !integration.available ? null : (
                  <span className="text-[11px] text-gray-400 italic">
                    Admin access required
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Request Integration card */}
          <div className="bg-gray-50 dark:bg-black/10 border border-dashed border-gray-300 dark:border-border-dark rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-gray-400">
              <Plus size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm">Request Integration</h3>
              <p className="text-xs text-gray-400">
                Don&apos;t see what you need? Let us know.
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-1.5 rounded-md border border-gray-200 dark:border-border-dark text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
              Submit Request
            </button>
          </div>
        </div>
      </div>

      {/* Disconnect confirmation dialog */}
      {disconnectingProvider && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setDisconnectingProvider(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-border-dark dark:bg-bg-dark">
            <h3 className="text-lg font-bold">
              Disconnect{' '}
              {PROVIDER_META[disconnectingProvider]?.name ?? disconnectingProvider}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure? This will:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
              {disconnectingProvider === 'github' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">&bull;</span>
                    Stop tracking branches, commits, and PRs on your issues
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">&bull;</span>
                    Remove auto-status updates on PR merge
                  </li>
                </>
              )}
              {disconnectingProvider === 'slack' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">&bull;</span>
                    Stop sending notifications to your Slack channels
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">&bull;</span>
                    Disable slash commands and direct message alerts
                  </li>
                </>
              )}
              {disconnectingProvider === 'discord' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">&bull;</span>
                    Stop all notifications to Discord channels
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">&bull;</span>
                    Remove all webhook URL configurations
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">&bull;</span>
                    Remove all project/team channel mappings
                  </li>
                </>
              )}
              {disconnectingProvider === 'figma' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">&bull;</span>
                    Remove design previews from all issues
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">&bull;</span>
                    Remove your Figma access token
                  </li>
                </>
              )}
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">&bull;</span>
                Remove all settings for this workspace
              </li>
            </ul>
            <p className="mt-3 text-xs text-gray-400">
              {disconnectingProvider === 'github'
                ? 'Your repositories and data will not be affected.'
                : disconnectingProvider === 'slack'
                  ? 'Your Slack workspace and channels will not be affected.'
                  : disconnectingProvider === 'discord'
                    ? 'Your Discord server and webhooks will not be affected. You can reconnect anytime.'
                    : disconnectingProvider === 'figma'
                      ? 'Your Figma files and designs will not be affected. You can reconnect anytime.'
                      : 'Your external data will not be affected.'}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDisconnectingProvider(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDisconnect}
                disabled={disconnectIntegration.isPending}
                className="px-4 py-2 rounded-lg bg-red-500 text-sm font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {disconnectIntegration.isPending && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}

      {/* GitHub settings slide-over */}
      <GitHubSettingsPanel
        open={showGitHubSettings}
        onClose={() => setShowGitHubSettings(false)}
        integration={githubIntegration}
      />

      {/* Slack settings slide-over */}
      <SlackSettingsPanel
        open={showSlackSettings}
        onClose={() => setShowSlackSettings(false)}
        integration={slackIntegration}
      />

      {/* Discord connect modal */}
      <DiscordConnectModal
        open={showDiscordConnect}
        onClose={() => setShowDiscordConnect(false)}
        onConnected={() =>
          showToast('Discord connected successfully', 'success', 'Integration connected')
        }
      />

      {/* Discord settings slide-over */}
      <DiscordSettingsPanel
        open={showDiscordSettings}
        onClose={() => setShowDiscordSettings(false)}
        integration={discordIntegration}
      />

      {/* Figma connect modal */}
      <FigmaConnectModal
        open={showFigmaConnect}
        onClose={() => setShowFigmaConnect(false)}
        onConnected={() =>
          showToast('Figma connected successfully', 'success', 'Integration connected')
        }
      />

      {/* Figma settings slide-over */}
      <FigmaSettingsPanel
        open={showFigmaSettings}
        onClose={() => setShowFigmaSettings(false)}
        integration={figmaIntegration}
      />
    </div>
  );
};
