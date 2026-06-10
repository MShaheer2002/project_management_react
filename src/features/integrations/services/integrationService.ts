import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';
import type {
  IntegrationItem,
  GitHubConnectResponse,
  GitHubSettings,
  UpdateGitHubSettingsInput,
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

  /** PATCH /integrations/:provider/settings — Update provider settings */
  updateSettings: async (
    provider: string,
    settings: UpdateGitHubSettingsInput,
  ): Promise<GitHubSettings> => {
    const { data } = await privateApi.patch<ApiResponse<GitHubSettings>>(
      `/integrations/${provider}/settings`,
      settings,
    );
    return data.data;
  },
};
