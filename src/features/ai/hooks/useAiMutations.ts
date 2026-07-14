import { useMutation } from '@tanstack/react-query';
import { useToastStore } from '@/app/stores/useToastStore';
import { aiService } from '../services/aiService';
import type { ApiAxiosError } from '@shared/services/types';

/** Generate a structured issue from a natural language prompt */
export const useGenerateIssue = () => {
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (input: { prompt: string; resolvedAssigneeId?: string; resolvedProjectId?: string }) =>
      aiService.generateIssue(input),
    onError: (err: ApiAxiosError) => {
      console.error('[AI Generation Error]', err.response?.data || err.message);
      const code = err.response?.data?.error?.code;
      if (code === 'AI_NOT_CONFIGURED') {
        showToast('AI is not configured on this server', 'error');
      } else if (code === 'AI_RATE_LIMITED') {
        showToast('AI rate limit reached. Please wait a moment.', 'error');
      } else if (code === 'AI_BUDGET_EXCEEDED') {
        showToast('Daily AI usage limit reached. Upgrade your plan for more.', 'error');
      } else if (code === 'AI_PLAN_UPGRADE_REQUIRED' || code === 'AI_FEATURE_DISABLED') {
        showToast('This workspace plan does not currently allow AI access.', 'error');
      } else {
        showToast(
          err.response?.data?.error?.message || 'AI generation failed. Please try again.',
          'error',
        );
      }
    },
  });
};

export const useGenerateDraftSuggestions = () => {
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (input: {
      title: string;
      description?: string;
      projectId?: string;
      assigneeId?: string | null;
      currentLabels?: string[];
    }) => aiService.getDraftSuggestions(input),
    onError: (err: ApiAxiosError) => {
      console.error('[AI Draft Suggestions Error]', err.response?.data || err.message);
      showToast(
        err.response?.data?.error?.message || 'AI suggestions could not be loaded.',
        'error',
      );
    },
  });
};
