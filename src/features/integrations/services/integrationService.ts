import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';
import type {
  IntegrationItem,
  GitHubConnectResponse,
  SlackChannel,
  UpdateIntegrationSettingsInput,
} from '../types';
import type { AxiosRequestConfig } from 'axios';

export const integrationService = {
  /** GET /integrations — List all integrations + connection status */
  list: async (): Promise<IntegrationItem[]> => {
    const { data } = await privateApi.get<ApiResponse<IntegrationItem[]>>(
      '/integrations',
    );
    return data.data;
  },

  /** POST /integrations/:provider/connect — Start OAuth (returns redirect URL) */
  connect: async (provider: string): Promise<GitHubConnectResponse> => {
    const { data } = await privateApi.post<
      ApiResponse<GitHubConnectResponse>
    >(
      `/integrations/${provider}/connect`,
      {},
      {
        skipGlobalErrorToast: true,
      } as AxiosRequestConfig & { skipGlobalErrorToast: boolean },
    );
    return data.data;
  },

  /** DELETE /integrations/:provider/disconnect — Disconnect integration */
  disconnect: async (provider: string): Promise<void> => {
    await privateApi.delete(`/integrations/${provider}/disconnect`, {
      skipGlobalErrorToast: true,
    } as AxiosRequestConfig & { skipGlobalErrorToast: boolean });
  },

  /** GET /integrations/:provider/settings — Fetch saved provider settings */
  getSettings: async <T = Record<string, unknown>>(
    provider: string,
  ): Promise<T> => {
    const { data } = await privateApi.get<ApiResponse<T>>(
      `/integrations/${provider}/settings`,
    );
    return data.data;
  },

  /** GET /integrations/slack/channels — List available Slack channels */
  listSlackChannels: async (): Promise<SlackChannel[]> => {
    const { data } = await privateApi.get<ApiResponse<SlackChannel[]>>(
      '/integrations/slack/channels',
    );
    return data.data;
  },

  /** PATCH /integrations/:provider/settings — Update provider settings */
  updateSettings: async <T = Record<string, unknown>>(
    provider: string,
    settings: UpdateIntegrationSettingsInput,
  ): Promise<T> => {
    const { data } = await privateApi.patch<ApiResponse<T>>(
      `/integrations/${provider}/settings`,
      settings,
    );
    return data.data;
  },
};
