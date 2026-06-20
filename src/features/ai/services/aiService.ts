import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';
import type { AiGenerateIssueResponse, AiModelInfo } from '../types';

export const aiService = {
  /** POST /ai/generate-issue — Generate a structured issue from natural language */
  generateIssue: async (input: {
    prompt: string;
    resolvedAssigneeId?: string;
    resolvedProjectId?: string;
  }): Promise<AiGenerateIssueResponse> => {
    const { data } = await privateApi.post<ApiResponse<AiGenerateIssueResponse>>(
      '/ai/generate-issue',
      input,
      { timeout: 60000 },
    );
    return data.data;
  },

  /** GET /ai/models — List available AI models */
  getModels: async (): Promise<AiModelInfo[]> => {
    const { data } = await privateApi.get<ApiResponse<AiModelInfo[]>>('/ai/models');
    return data.data;
  },
};
