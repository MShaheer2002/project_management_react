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
  aiModel: string;
  tokensUsed: number;
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
