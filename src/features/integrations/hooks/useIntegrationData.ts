import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import {
  integrationService,
  githubService,
  slackService,
  discordService,
  figmaService,
} from '../services/integrationService';
import { isFigmaUrl } from '../types';

export const integrationQueryKeys = {
  all: ['integrations'] as const,
  list: (wId: string | undefined) =>
    [...integrationQueryKeys.all, 'list', wId] as const,
  status: (wId: string | undefined) =>
    [...integrationQueryKeys.all, 'status', wId] as const,
  githubSettings: (wId: string | undefined) =>
    [...integrationQueryKeys.all, 'github', 'settings', wId] as const,
  slackSettings: (wId: string | undefined) =>
    [...integrationQueryKeys.all, 'slack', 'settings', wId] as const,
  slackChannels: (wId: string | undefined) =>
    [...integrationQueryKeys.all, 'slack', 'channels', wId] as const,
  discordSettings: (wId: string | undefined) =>
    [...integrationQueryKeys.all, 'discord', 'settings', wId] as const,
  figmaSettings: (wId: string | undefined) =>
    [...integrationQueryKeys.all, 'figma', 'settings', wId] as const,
  figmaPreview: (wId: string | undefined, url: string) =>
    [...integrationQueryKeys.all, 'figma', 'preview', wId, url] as const,
};

export const useIntegrations = (enabled = true) => {
  const wId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: integrationQueryKeys.list(wId),
    queryFn: integrationService.list,
    enabled: enabled && Boolean(wId),
  });
};

// Connection status only (no config/connectedBy) — usable by any workspace
// member, unlike useIntegrations() which requires ADMIN/OWNER.
export const useIntegrationStatus = () => {
  const wId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: integrationQueryKeys.status(wId),
    queryFn: integrationService.status,
    enabled: Boolean(wId),
  });
};

// ── GitHub ───────────────────────────────────────────────────────

export const useGitHubSettings = (options?: { enabled?: boolean }) => {
  const wId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: integrationQueryKeys.githubSettings(wId),
    queryFn: githubService.getSettings,
    enabled: Boolean(wId) && (options?.enabled ?? true),
  });
};

// ── Slack ────────────────────────────────────────────────────────

export const useSlackSettings = (options?: { enabled?: boolean }) => {
  const wId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: integrationQueryKeys.slackSettings(wId),
    queryFn: slackService.getSettings,
    enabled: Boolean(wId) && (options?.enabled ?? true),
  });
};

export const useSlackAvailableChannels = (options?: {
  enabled?: boolean;
}) => {
  const wId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: integrationQueryKeys.slackChannels(wId),
    queryFn: slackService.listChannels,
    enabled: Boolean(wId) && (options?.enabled ?? true),
  });
};

// ── Discord ─────────────────────────────────────────────────────

export const useDiscordSettings = (options?: { enabled?: boolean }) => {
  const wId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: integrationQueryKeys.discordSettings(wId),
    queryFn: discordService.getSettings,
    enabled: Boolean(wId) && (options?.enabled ?? true),
  });
};

// ── Figma ────────────────────────────────────────────────────────

export const useFigmaSettings = (options?: { enabled?: boolean }) => {
  const wId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: integrationQueryKeys.figmaSettings(wId),
    queryFn: figmaService.getSettings,
    enabled: Boolean(wId) && (options?.enabled ?? true),
  });
};

/** Preview cards for the Figma links on one issue (the server only previews links in that issue). */
export const useFigmaBatchPreview = (
  issueId: string | undefined,
  urls: string[],
  options?: { enabled?: boolean },
) => {
  const wId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: [...integrationQueryKeys.all, 'figma', 'batch', wId, issueId, urls],
    queryFn: () => figmaService.batchPreview(issueId!, urls),
    enabled:
      Boolean(wId) && Boolean(issueId) && urls.length > 0 && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
