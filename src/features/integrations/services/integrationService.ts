import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';
import type { AxiosRequestConfig } from 'axios';
import type {
  IntegrationItem,
  // GitHub
  GitHubConnectResponse,
  GitHubSettings,
  GitHubSettingsResponse,
  // Slack
  SlackSettings,
  SlackSettingsResponse,
  SlackAvailableChannel,
  SlackChannelMapping,
  AddSlackChannelInput,
  // Discord
  ConnectDiscordInput,
  ConnectDiscordResponse,
  DiscordSettings,
  DiscordSettingsResponse,
  DiscordWebhookMapping,
  AddDiscordWebhookInput,
  // Figma
  ConnectFigmaInput,
  ConnectFigmaResponse,
  FigmaSettings,
  FigmaSettingsResponse,
  FigmaPreview,
} from '../types';

const skipToast = {
  skipGlobalErrorToast: true,
} as AxiosRequestConfig & { skipGlobalErrorToast: boolean };

// ── Shared ──────────────────────────────────────────────────────

export const integrationService = {
  list: async (): Promise<IntegrationItem[]> => {
    const { data } = await privateApi.get<ApiResponse<IntegrationItem[]>>(
      '/integrations',
    );
    return data.data;
  },

  disconnect: async (provider: string): Promise<void> => {
    await privateApi.delete(
      `/integrations/${provider}/disconnect`,
      skipToast,
    );
  },
};

// ── GitHub ───────────────────────────────────────────────────────

export const githubService = {
  connect: async (): Promise<GitHubConnectResponse> => {
    const { data } = await privateApi.post<
      ApiResponse<GitHubConnectResponse>
    >('/integrations/github/connect', {}, skipToast);
    return data.data;
  },

  getSettings: async (): Promise<GitHubSettingsResponse> => {
    const { data } = await privateApi.get<
      ApiResponse<GitHubSettingsResponse>
    >('/integrations/github/settings');
    return data.data;
  },

  updateSettings: async (
    settings: Partial<GitHubSettings>,
  ): Promise<GitHubSettingsResponse> => {
    const { data } = await privateApi.patch<
      ApiResponse<GitHubSettingsResponse>
    >('/integrations/github/settings', settings);
    return data.data;
  },
};

// ── Slack ────────────────────────────────────────────────────────

export const slackService = {
  connect: async (): Promise<{ authUrl: string }> => {
    const { data } = await privateApi.post<
      ApiResponse<{ authUrl: string }>
    >('/integrations/slack/connect', {}, skipToast);
    return data.data;
  },

  getSettings: async (): Promise<SlackSettingsResponse> => {
    const { data } = await privateApi.get<
      ApiResponse<SlackSettingsResponse>
    >('/integrations/slack/settings');
    return data.data;
  },

  updateSettings: async (
    settings: Partial<SlackSettings>,
  ): Promise<SlackSettingsResponse> => {
    const { data } = await privateApi.patch<
      ApiResponse<SlackSettingsResponse>
    >('/integrations/slack/settings', settings);
    return data.data;
  },

  /** List available Slack channels from the Slack API (for picker) */
  listChannels: async (): Promise<SlackAvailableChannel[]> => {
    const { data } = await privateApi.get<
      ApiResponse<SlackAvailableChannel[]>
    >('/integrations/slack/channels');
    return data.data;
  },

  addChannel: async (
    input: AddSlackChannelInput,
  ): Promise<SlackChannelMapping> => {
    const { data } = await privateApi.post<
      ApiResponse<SlackChannelMapping>
    >('/integrations/slack/channels', input);
    return data.data;
  },

  removeChannel: async (channelDbId: string): Promise<void> => {
    await privateApi.delete(
      `/integrations/slack/channels/${channelDbId}`,
    );
  },
};

// ── Discord ─────────────────────────────────────────────────────

export const discordService = {
  connect: async (
    input: ConnectDiscordInput,
  ): Promise<ConnectDiscordResponse> => {
    const { data } = await privateApi.post<
      ApiResponse<ConnectDiscordResponse>
    >('/integrations/discord/connect', input, skipToast);
    return data.data;
  },

  getSettings: async (): Promise<DiscordSettingsResponse> => {
    const { data } = await privateApi.get<
      ApiResponse<DiscordSettingsResponse>
    >('/integrations/discord/settings');
    return data.data;
  },

  updateSettings: async (
    settings: Partial<DiscordSettings>,
  ): Promise<DiscordSettingsResponse> => {
    const { data } = await privateApi.patch<
      ApiResponse<DiscordSettingsResponse>
    >('/integrations/discord/settings', settings);
    return data.data;
  },

  addWebhook: async (
    input: AddDiscordWebhookInput,
  ): Promise<DiscordWebhookMapping> => {
    const { data } = await privateApi.post<
      ApiResponse<DiscordWebhookMapping>
    >('/integrations/discord/webhooks', input);
    return data.data;
  },

  removeWebhook: async (webhookDbId: string): Promise<void> => {
    await privateApi.delete(
      `/integrations/discord/webhooks/${webhookDbId}`,
    );
  },
};

// ── Figma ────────────────────────────────────────────────────────

export const figmaService = {
  connect: async (
    input: ConnectFigmaInput,
  ): Promise<ConnectFigmaResponse> => {
    const { data } = await privateApi.post<
      ApiResponse<ConnectFigmaResponse>
    >('/integrations/figma/connect', input, skipToast);
    return data.data;
  },

  getSettings: async (): Promise<FigmaSettingsResponse> => {
    const { data } = await privateApi.get<
      ApiResponse<FigmaSettingsResponse>
    >('/integrations/figma/settings');
    return data.data;
  },

  updateSettings: async (
    settings: Partial<FigmaSettings>,
  ): Promise<FigmaSettingsResponse> => {
    const { data } = await privateApi.patch<
      ApiResponse<FigmaSettingsResponse>
    >('/integrations/figma/settings', settings);
    return data.data;
  },

  preview: async (url: string): Promise<FigmaPreview> => {
    const { data } = await privateApi.get<ApiResponse<FigmaPreview>>(
      '/integrations/figma/preview',
      { params: { url } },
    );
    return data.data;
  },

  batchPreview: async (urls: string[]): Promise<FigmaPreview[]> => {
    const { data } = await privateApi.post<ApiResponse<FigmaPreview[]>>(
      '/integrations/figma/batch-preview',
      { urls },
    );
    return data.data;
  },
};
