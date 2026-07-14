// ── AI Issue Creator Types ──────────────────────────────────────

/** Successful AI generation — form auto-fill data */
export interface AiGeneratedIssue {
  status: 'generated';
  title: string;
  type: 'task' | 'bug' | 'issue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  suggestedLabels: string[];
  suggestedAssigneeId: string | null;
  suggestedProjectId: string | null;
  suggestedProjectName: string | null;
  subtasks: Array<{ title: string }>;
  templateId: string | null;
  suggestedDueDate: string | null;
  suggestedEstimate: number | null;
  figmaUrls: string[];
  stepsToReproduce: string | null;
  expectedBehavior: string | null;
  actualBehavior: string | null;
  severity: 'low' | 'medium' | 'high' | null;
  acceptanceCriteria: string | null;
  notes: string | null;
  previewSuggestions: Array<{
    type: 'LABEL' | 'DUPLICATE' | 'ASSIGNEE';
    title: string;
    message: string;
    confidence: number | null;
    payload: Record<string, unknown>;
  }>;
  aiModel: string;
  tokensUsed: number;
}

export interface AiDraftSuggestion {
  type: 'LABEL' | 'DUPLICATE' | 'ASSIGNEE';
  title: string;
  message: string;
  confidence: number | null;
  payload: Record<string, unknown>;
}

export interface AiDraftSuggestionsResponse {
  suggestions: AiDraftSuggestion[];
}

/** AI needs more context from the user */
export interface AiClarificationNeeded {
  status: 'clarification_needed';
  message: string;
  missingFields: string[];
  detectedSoFar: {
    type: string | null;
    priority: string | null;
    mentions: string[];
  };
  aiModel: string | null;
  tokensUsed: number;
}

/** Union response from POST /ai/generate-issue */
export type AiGenerateIssueResponse = AiGeneratedIssue | AiClarificationNeeded;

/** Available AI model info */
export interface AiModelInfo {
  id: string;
  name: string;
  provider: string;
  free: boolean;
  tier: 'fast' | 'balanced' | 'premium';
}

// ── Phase 20B — Trussen AI Chat ─────────────────────────────────

export interface AiConversation {
  id: string;
  title: string;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  lastModelUsed: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'TOOL_CALL' | 'TOOL_RESULT';
  content: string;
  toolCalls?: unknown;
  toolResults?: unknown;
  tokenCount?: number;
  createdAt: string;
}

/** SSE event types from POST /ai/chat */
export type AiChatEventType = 'message' | 'tool_call' | 'tool_result' | 'done' | 'error' | 'close';

export type AiUsagePeriod = '7d' | '30d' | '90d' | 'custom';

export interface AiUsagePolicy {
  subscriptionPlan: 'FREE' | 'STANDARD' | 'PREMIUM';
  subscriptionStatus: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'INCOMPLETE' | 'UNPAID' | 'NONE';
  accessPlan: 'FREE' | 'STANDARD' | 'PREMIUM';
  enforcementMode: 'monitor' | 'enforced';
  planAllowsAi: boolean;
  effectiveAccess: boolean;
  limits: {
    requestLimit: number | null;
    tokenLimit: number | null;
  };
  today: {
    workspaceRequestCount: number;
    workspaceTotalTokens: number;
  };
}

export interface AiUsageRange {
  from: string;
  to: string;
  period: AiUsagePeriod;
}

export interface AiUsageTotals {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
  issueGenerationCount: number;
  chatTurnCount: number;
}

export interface AiWorkspaceDailyUsage extends AiUsageTotals {
  date: string;
}

export interface AiWorkspaceUsageUser extends AiUsageTotals {
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

export interface AiWorkspaceUsage {
  range: AiUsageRange;
  policy: AiUsagePolicy;
  totals: AiUsageTotals & {
    activeUsers: number;
  };
  daily: AiWorkspaceDailyUsage[];
  topUsers: AiWorkspaceUsageUser[];
}

export interface AiUserUsage {
  range: AiUsageRange;
  users: AiWorkspaceUsageUser[];
}

// ── Phase 20D — Background AI Suggestions ──────────────────────

export type AiSuggestionType =
  | 'ASSIGNEE'
  | 'LABEL'
  | 'PRIORITY'
  | 'DUPLICATE'
  | 'STALE_ISSUE'
  | 'WEEKLY_DIGEST'
  | 'SPRINT_PLANNING'
  | 'PROJECT_HEALTH'
  | 'TEAM_HEALTH'
  | 'CYCLE_HEALTH';

export type AiSuggestionStatus = 'OPEN' | 'ACCEPTED' | 'DISMISSED' | 'SUPERSEDED' | 'EXPIRED';

export interface AiSuggestion {
  id: string;
  type: AiSuggestionType;
  status: AiSuggestionStatus;
  source: string;
  targetType: string;
  targetId: string;
  title: string;
  message: string;
  confidence: number | null;
  reason: string | null;
  payload: Record<string, unknown> | null;
  model: string | null;
  createdByUserId: string | null;
  acceptedById: string | null;
  dismissedById: string | null;
  acceptedAt: string | null;
  dismissedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiSuggestionsListResult {
  items: AiSuggestion[];
  meta: {
    total: number;
    cursor: string | null;
    hasMore: boolean;
  };
}

// ── Phase 20C — Lightweight Assistant ───────────────────────────

export type AiAssistIntent = 'guidance' | 'navigation' | 'permission' | 'feature' | 'status';

export interface AiAssistFact {
  label: string;
  value: string;
}

export interface AiAssistResponse {
  intent: AiAssistIntent;
  title?: string;
  answer: string;
  followUps: string[];
  navigation?: {
    route: string;
    label: string;
  };
  facts: AiAssistFact[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    model: string;
  };
}
