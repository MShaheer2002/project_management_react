import type { AxiosRequestConfig } from 'axios';
import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';
import type {
  AiConnection,
  AiConnectionCatalog,
  AiConnectionHealthResponse,
  AiConnectionSession,
  AiConnectionCreateResponse,
  CreateAiConnectionInput,
} from '../types';

export const aiConnectionService = {
  list: async (): Promise<AiConnection[]> => {
    const { data } = await privateApi.get<ApiResponse<AiConnection[]>>('/ai-connections');
    return data.data;
  },

  catalog: async (): Promise<AiConnectionCatalog> => {
    const { data } = await privateApi.get<ApiResponse<AiConnectionCatalog>>('/ai-connections/catalog');
    return data.data;
  },

  getHealth: async (id: string): Promise<AiConnectionHealthResponse> => {
    const { data } = await privateApi.get<ApiResponse<AiConnectionHealthResponse>>(`/ai-connections/${id}/health`);
    return data.data;
  },

  listSessions: async (id: string): Promise<AiConnectionSession[]> => {
    const { data } = await privateApi.get<ApiResponse<AiConnectionSession[]>>(`/ai-connections/${id}/sessions`);
    return data.data;
  },

  create: async (input: CreateAiConnectionInput): Promise<AiConnectionCreateResponse> => {
    const { data } = await privateApi.post<ApiResponse<AiConnectionCreateResponse>>(
      '/ai-connections',
      input,
      { skipGlobalErrorToast: true } as AxiosRequestConfig & { skipGlobalErrorToast: boolean },
    );
    return data.data;
  },

  revoke: async (id: string): Promise<void> => {
    await privateApi.delete(`/ai-connections/${id}`, {
      skipGlobalErrorToast: true,
    } as AxiosRequestConfig & { skipGlobalErrorToast: boolean });
  },

  rotate: async (id: string): Promise<AiConnectionCreateResponse> => {
    const { data } = await privateApi.post<ApiResponse<AiConnectionCreateResponse>>(
      `/ai-connections/${id}/rotate`,
      undefined,
      { skipGlobalErrorToast: true } as AxiosRequestConfig & { skipGlobalErrorToast: boolean },
    );
    return data.data;
  },
};
