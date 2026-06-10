import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';
import type { ApiKey } from '@/types';
import type { ApiKeyCreateResponse, CreateApiKeyInput } from '../types';
import type { AxiosRequestConfig } from 'axios';

export const apiKeyService = {
  list: async (): Promise<ApiKey[]> => {
    const { data } = await privateApi.get<ApiResponse<ApiKey[]>>('/api-keys');
    return data.data;
  },

  getById: async (id: string): Promise<ApiKey> => {
    const { data } = await privateApi.get<ApiResponse<ApiKey>>(`/api-keys/${id}`);
    return data.data;
  },

  create: async (input: CreateApiKeyInput): Promise<ApiKeyCreateResponse> => {
    const { data } = await privateApi.post<ApiResponse<ApiKeyCreateResponse>>(
      '/api-keys',
      input,
      { skipGlobalErrorToast: true } as AxiosRequestConfig & { skipGlobalErrorToast: boolean },
    );
    return data.data;
  },

  revoke: async (id: string): Promise<void> => {
    await privateApi.delete(`/api-keys/${id}`, {
      skipGlobalErrorToast: true,
    } as AxiosRequestConfig & { skipGlobalErrorToast: boolean });
  },
};
