import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';
import type { AiGenerateIssueResponse, AiModelInfo, AiConversation, AiMessage } from '../types';

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

  // ── Phase 20B — Trussen AI Chat ───────────────────────────────

  /** GET /ai/conversations — List user's conversations */
  listConversations: async (): Promise<AiConversation[]> => {
    const { data } = await privateApi.get<ApiResponse<AiConversation[]>>('/ai/conversations');
    return data.data;
  },

  /** GET /ai/conversations/:id/messages — Get conversation messages */
  getConversationMessages: async (conversationId: string): Promise<AiMessage[]> => {
    const { data } = await privateApi.get<ApiResponse<AiMessage[]>>(
      `/ai/conversations/${conversationId}/messages`,
    );
    return data.data;
  },

  /** DELETE /ai/conversations/:id — Delete a conversation */
  deleteConversation: async (conversationId: string): Promise<void> => {
    await privateApi.delete(`/ai/conversations/${conversationId}`);
  },
};
