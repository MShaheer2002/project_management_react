import { privateApi } from '@shared/services/privateApi';
import { getAuthToken } from '@shared/services';
import type { ApiResponse } from '@shared/services/types';
import type {
  AiAssistResponse,
  AiChatEventType,
  AiConversation,
  AiDraftSuggestionsResponse,
  AiGenerateIssueResponse,
  AiMessage,
  AiModelInfo,
  AiSuggestion,
  AiSuggestionsListResult,
  AiUsagePeriod,
  AiUserUsage,
  AiWorkspaceUsage,
} from '../types';
import type { ApiPaginatedResponse } from '@shared/services/types';

type ChatStreamEvent = Record<string, unknown>;

const buildUsageQuery = (input?: {
  period?: AiUsagePeriod;
  from?: string;
  to?: string;
  limit?: number;
}) => ({
  period: input?.period ?? '30d',
  ...(input?.from ? { from: input.from } : {}),
  ...(input?.to ? { to: input.to } : {}),
  ...(typeof input?.limit === 'number' ? { limit: input.limit } : {}),
});

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

  getDraftSuggestions: async (input: {
    title: string;
    description?: string;
    projectId?: string;
    assigneeId?: string | null;
    currentLabels?: string[];
  }): Promise<AiDraftSuggestionsResponse> => {
    const { data } = await privateApi.post<ApiResponse<AiDraftSuggestionsResponse>>(
      '/ai/draft-suggestions',
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

  /** POST /ai/assist — Lightweight ephemeral assistant */
  assist: async (input: {
    message: string;
    route?: string;
    pageTitle?: string;
  }): Promise<AiAssistResponse> => {
    const { data } = await privateApi.post<ApiResponse<AiAssistResponse>>(
      '/ai/assist',
      input,
      { timeout: 60000 },
    );
    return data.data;
  },

  // ── Phase 20B — Trussen AI Chat ───────────────────────────────

  /** GET /ai/conversations — List user's conversations */
  listConversations: async (): Promise<AiConversation[]> => {
    const { data } = await privateApi.get<ApiResponse<AiConversation[]>>('/ai/conversations');
    return data.data;
  },

  /** GET /ai/suggestions — List background AI suggestions */
  listSuggestions: async (input?: {
    status?: string;
    targetType?: string;
    targetId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<AiSuggestionsListResult> => {
    const { data } = await privateApi.get<ApiPaginatedResponse<AiSuggestion>>('/ai/suggestions', {
      params: input,
    });

    return {
      items: data.data,
      meta: data.meta,
    };
  },

  /** POST /ai/suggestions/:id/accept — Accept a background suggestion */
  acceptSuggestion: async (suggestionId: string, input?: { selectedIds?: string[] }): Promise<AiSuggestion> => {
    const { data } = await privateApi.post<ApiResponse<AiSuggestion>>(
      `/ai/suggestions/${suggestionId}/accept`,
      input ?? {},
    );
    return data.data;
  },

  /** POST /ai/suggestions/:id/dismiss — Dismiss a background suggestion */
  dismissSuggestion: async (suggestionId: string, input?: { reason?: string }): Promise<AiSuggestion> => {
    const { data } = await privateApi.post<ApiResponse<AiSuggestion>>(
      `/ai/suggestions/${suggestionId}/dismiss`,
      input ?? {},
    );
    return data.data;
  },

  /** GET /ai/usage/workspace — Admin/owner AI usage overview */
  getWorkspaceUsage: async (input?: {
    period?: AiUsagePeriod;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<AiWorkspaceUsage> => {
    const { data } = await privateApi.get<ApiResponse<AiWorkspaceUsage>>('/ai/usage/workspace', {
      params: buildUsageQuery(input),
    });
    return data.data;
  },

  /** GET /ai/usage/users — Admin/owner per-user AI usage */
  getUserUsage: async (input?: {
    period?: AiUsagePeriod;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<AiUserUsage> => {
    const { data } = await privateApi.get<ApiResponse<AiUserUsage>>('/ai/usage/users', {
      params: buildUsageQuery(input),
    });
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

  /** POST /ai/chat — Stream AI chat events via SSE-like fetch stream */
  streamChat: async (input: {
    conversationId?: string | null;
    message: string;
    workspaceId: string;
    onEvent: (eventType: AiChatEventType, data: ChatStreamEvent) => void;
  }): Promise<void> => {
    if (!input.workspaceId) {
      throw new Error('Workspace not selected');
    }

    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const baseUrl = (privateApi.defaults.baseURL || '').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': input.workspaceId,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        conversationId: input.conversationId ?? undefined,
        message: input.message,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({})) as { error?: { code?: string; message?: string } };
      const error = new Error(errData.error?.message || `Error ${response.status}`) as Error & { code?: string };
      error.code = errData.error?.code;
      throw error;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response stream');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      while (buffer.includes('\n\n')) {
        const eventEnd = buffer.indexOf('\n\n');
        const eventBlock = buffer.slice(0, eventEnd);
        buffer = buffer.slice(eventEnd + 2);

        let eventType = '';
        let eventData = '';

        for (const line of eventBlock.split('\n')) {
          if (line.startsWith('event: ')) eventType = line.slice(7).trim();
          if (line.startsWith('data: ')) eventData = line.slice(6);
        }

        if (!eventType || !eventData) continue;

        try {
          input.onEvent(eventType as AiChatEventType, JSON.parse(eventData) as ChatStreamEvent);
        } catch {
          // Ignore malformed stream events so one bad chunk does not kill the session.
        }
      }
    }
  },
};
