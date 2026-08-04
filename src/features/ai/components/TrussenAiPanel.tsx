import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Clock,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/app/stores/useUIStore';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import { aiService } from '../services/aiService';
import { AiMarkdown } from './AiMarkdown';
import { MentionDropdown } from './MentionDropdown';
import { useMentionAutocomplete } from '../hooks/useMentionAutocomplete';
import type { AiMessage, AiSuggestion } from '../types';

const relativeTime = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 360;
const SUGGESTION_ANCHOR_WINDOW_MS = 10 * 60 * 1000;

const formatSuggestionTarget = (suggestion: AiSuggestion) => {
  if (typeof suggestion.payload?.issueId === 'string' && suggestion.payload.issueId.trim()) {
    return suggestion.payload.issueId.trim();
  }
  return suggestion.targetId;
};

const formatSuggestionDetails = (suggestion: AiSuggestion) => {
  if (suggestion.type === 'ASSIGNEE') {
    const candidates = Array.isArray(suggestion.payload?.candidates)
      ? suggestion.payload.candidates as Array<{ name?: string }>
      : [];
    const names = candidates.map((candidate) => candidate.name).filter(Boolean).slice(0, 3);
    return names.length > 0 ? `Top candidates: ${names.join(', ')}` : 'Review the suggested assignee candidates.';
  }

  if (suggestion.type === 'PRIORITY') {
    const priority = typeof suggestion.payload?.suggestedPriority === 'string'
      ? suggestion.payload.suggestedPriority
      : null;
    return priority ? `Suggested priority: ${priority}` : 'Review the suggested priority change.';
  }

  if (suggestion.type === 'LABEL') {
    const labels = Array.isArray(suggestion.payload?.labels)
      ? suggestion.payload.labels as Array<{ name?: string }>
      : [];
    const names = labels.map((label) => label.name).filter(Boolean).slice(0, 4);
    return names.length > 0 ? `Suggested labels: ${names.join(', ')}` : 'Review the suggested labels.';
  }

  if (suggestion.type === 'DUPLICATE') {
    const matches = Array.isArray(suggestion.payload?.matches)
      ? suggestion.payload.matches as Array<{ issueId?: string; title?: string }>
      : [];
    const first = matches[0];
    return first?.issueId ? `Closest match: ${first.issueId}${first.title ? ` · ${first.title}` : ''}` : 'Review similar issues.';
  }

  if (suggestion.type === 'PROJECT_HEALTH' || suggestion.type === 'TEAM_HEALTH' || suggestion.type === 'CYCLE_HEALTH') {
    const signals = Array.isArray(suggestion.payload?.riskSignals)
      ? (suggestion.payload?.riskSignals as Array<string>).filter(Boolean).slice(0, 3)
      : [];
    return signals.length > 0 ? signals.join(' · ') : (suggestion.reason ?? suggestion.message);
  }

  return suggestion.reason ?? suggestion.message;
};

const formatSuggestionActionLabel = (suggestion: AiSuggestion) => {
  if (suggestion.type === 'PRIORITY') {
    const priority = getSuggestedPriority(suggestion);
    return priority ? `Set ${priority.toLowerCase()}` : 'Use suggestion';
  }

  if (suggestion.type === 'ASSIGNEE') return 'Choose assignee';
  if (suggestion.type === 'LABEL') return 'Add labels';
  if (suggestion.type === 'DUPLICATE') return 'Review duplicate';
  return 'Use suggestion';
};

const getSuggestionAnchorHints = (suggestion: AiSuggestion) => {
  const hints = new Set<string>();
  const payload = suggestion.payload ?? {};
  const anchor = typeof payload.anchor === 'object' && payload.anchor ? payload.anchor as Record<string, unknown> : null;

  const addValue = (value: unknown) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (trimmed) hints.add(trimmed.toLowerCase());
  };

  addValue(suggestion.targetId);
  addValue(payload.issueId);
  addValue(payload.projectId);
  addValue(payload.teamId);
  addValue(payload.cycleId);
  addValue(anchor?.targetId);

  return [...hints];
};

const getAssigneeCandidates = (suggestion: AiSuggestion) =>
  Array.isArray(suggestion.payload?.candidates)
    ? suggestion.payload.candidates as Array<{ userId?: string; name?: string }>
    : [];

const getSuggestedPriority = (suggestion: AiSuggestion) =>
  typeof suggestion.payload?.suggestedPriority === 'string'
    ? suggestion.payload.suggestedPriority
    : null;

const getSuggestedLabels = (suggestion: AiSuggestion) =>
  Array.isArray(suggestion.payload?.labels)
    ? suggestion.payload.labels as Array<{ labelId?: string; name?: string }>
    : [];

const getSprintPlanningCandidates = (suggestion: AiSuggestion) =>
  Array.isArray(suggestion.payload?.candidates)
    ? suggestion.payload.candidates as Array<{ issueId?: string; title?: string }>
    : [];

const isSuggestionActionable = (suggestion: AiSuggestion) =>
  ['ASSIGNEE', 'PRIORITY', 'LABEL', 'SPRINT_PLANNING'].includes(suggestion.type);

const getSuggestionScopeBadge = (suggestion: AiSuggestion) => {
  const scope = typeof suggestion.payload?.scope === 'string' ? suggestion.payload.scope : null;
  if (!scope) return null;
  return scope.toUpperCase();
};

const findSuggestionAnchorMessageId = (messages: AiMessage[], suggestion: AiSuggestion) => {
  const targets = getSuggestionAnchorHints(suggestion);
  if (targets.length === 0) return null;

  const suggestionTime = new Date(suggestion.createdAt).getTime();
  if (!Number.isFinite(suggestionTime)) return null;

  const matches = messages
    .filter((message) => (
      message.role === 'ASSISTANT'
      && targets.some((target) => message.content.toLowerCase().includes(target))
    ))
    .map((message) => ({
      message,
      distanceMs: Math.abs(new Date(message.createdAt).getTime() - suggestionTime),
    }))
    .filter(({ distanceMs }) => Number.isFinite(distanceMs) && distanceMs <= SUGGESTION_ANCHOR_WINDOW_MS)
    .sort((a, b) => a.distanceMs - b.distanceMs);

  return matches[0]?.message.id ?? null;
};

export const TrussenAiPanel: React.FC = () => {
  const setOpen = useUIStore((s) => s.setAiPanelOpen);
  const activeConvId = useUIStore((s) => s.activeConversationId);
  const setActiveConvId = useUIStore((s) => s.setActiveConversationId);
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const currentUserId = useAuthStore((s) => s.currentUser?.id);
  const showToast = useToastStore((s) => s.showToast);
  const queryClient = useQueryClient();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [lastResponseMeta, setLastResponseMeta] = useState<{ model?: string; tokensUsed?: number } | null>(null);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [actionSuggestionId, setActionSuggestionId] = useState<string | null>(null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<Record<string, string[]>>({});
  const [selectedSprintIssueIds, setSelectedSprintIssueIds] = useState<Record<string, string[]>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // @ mention autocomplete
  const mention = useMentionAutocomplete();
  const inputRef = mention.textareaRef;

  // Resizable panel
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(DEFAULT_WIDTH);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = dragStartX.current - ev.clientX; // Dragging left increases width
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, dragStartWidth.current + delta));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [panelWidth]);

  const conversationsQuery = useQuery({
    queryKey: ['ai', 'conversations', workspaceId],
    queryFn: aiService.listConversations,
    enabled: Boolean(workspaceId),
    staleTime: 30_000,
  });
  const conversations = conversationsQuery.data ?? [];
  const activeConversation = conversations.find((conversation) => conversation.id === activeConvId) ?? null;
  const suggestionsQuery = useQuery({
    queryKey: ['ai', 'suggestions', workspaceId],
    queryFn: () => aiService.listSuggestions({ status: 'OPEN', limit: 5 }),
    enabled: Boolean(workspaceId) && view === 'chat',
    staleTime: 5_000,
    refetchInterval: view === 'chat' ? 8_000 : false,
  });
  const suggestions = (suggestionsQuery.data?.items ?? []).filter((suggestion) => {
    if (!currentUserId) return true;
    return !suggestion.createdByUserId || suggestion.createdByUserId === currentUserId;
  });
  const suggestionsByMessageId = suggestions.reduce<Record<string, AiSuggestion[]>>((acc, suggestion) => {
    const messageId = findSuggestionAnchorMessageId(messages, suggestion);
    if (!messageId) return acc;
    acc[messageId] = [...(acc[messageId] ?? []), suggestion];
    return acc;
  }, {});

  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);
    setPanelError(null);

    aiService.getConversationMessages(activeConvId)
      .then(setMessages)
      .catch((err) => {
        console.error('[TrussenAI] Failed to load messages:', err);
        setPanelError('Failed to load this conversation. Try selecting it again.');
        setMessages([]);
      })
      .finally(() => setIsLoadingMessages(false));
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Focus input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  const sendMessage = useCallback(async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: AiMessage = {
      id: crypto.randomUUID(),
      role: 'USER',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    setToolActivity(null);
    setPanelError(null);
    setLastResponseMeta(null);

    // Reset textarea height properly
    requestAnimationFrame(() => {
      if (inputRef.current && inputRef.current.isConnected) {
        inputRef.current.style.height = 'auto';
      }
    });

    try {
      let convId = activeConvId;
      await aiService.streamChat({
        conversationId: activeConvId,
        message: trimmed,
        workspaceId: workspaceId ?? '',
        onEvent: (eventType, data) => {
          if (eventType === 'tool_call') {
            setToolActivity('Trussen AI is working...');
          } else if (eventType === 'tool_result') {
            setToolActivity(null);
          } else if (eventType === 'message' && typeof data.content === 'string') {
            setStreamingContent(data.content);
            setLastResponseMeta({
              model: typeof data.model === 'string' ? data.model : undefined,
              tokensUsed: typeof data.tokensUsed === 'number' ? data.tokensUsed : undefined,
            });
          } else if (eventType === 'done' && typeof data.conversationId === 'string') {
            convId = data.conversationId;
          } else if (eventType === 'error' && typeof data.message === 'string') {
            setPanelError(data.message);
            setStreamingContent(`Error: ${data.message}`);
          }
        },
      });

      if (convId && !activeConvId) {
        setActiveConvId(convId);
      }

      if (convId) {
        const updated = await aiService.getConversationMessages(convId);
        setMessages(updated);
      }

      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
    } catch (error) {
      const err = error as Error & { code?: string };
      const errMsg = err.code === 'AI_PLAN_UPGRADE_REQUIRED' || err.code === 'AI_FEATURE_DISABLED'
        ? 'This workspace plan does not currently allow AI access.'
        : err.code === 'AI_BUDGET_EXCEEDED'
        ? 'Daily AI usage limit reached for this workspace.'
        : err.message || 'Chat failed';
      setPanelError(errMsg);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'ASSISTANT', content: errMsg, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setToolActivity(null);
    }
  }, [isStreaming, activeConvId, workspaceId, queryClient, setActiveConvId, inputRef]);

  const handleSend = useCallback(async () => {
    await sendMessage(input);
  }, [input, sendMessage]);

  const handleQuickReply = useCallback((value: string) => {
    void sendMessage(value);
  }, [sendMessage]);

  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    setPanelError(null);
    setLastResponseMeta(null);
    setView('chat');
    inputRef.current?.focus();
  };

  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId);
    setView('chat');
  };

  const handleDeleteConversation = async (convId: string) => {
    await aiService.deleteConversation(convId);
    if (activeConvId === convId) { setActiveConvId(null); setMessages([]); }
    queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
  };

  const handleAcceptSuggestion = useCallback(async (suggestionId: string, selectedIds?: string[]) => {
    setActionSuggestionId(suggestionId);
    try {
      await aiService.acceptSuggestion(suggestionId, selectedIds ? { selectedIds } : undefined);
      await suggestionsQuery.refetch();
      showToast('Suggestion applied.', 'success', 'Background AI');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply suggestion.';
      showToast(message, 'error', 'Background AI');
    } finally {
      setActionSuggestionId(null);
    }
  }, [showToast, suggestionsQuery]);

  const toggleSelectedValue = useCallback((
    stateSetter: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
    suggestionId: string,
    value: string,
  ) => {
    stateSetter((prev) => {
      const current = new Set(prev[suggestionId] ?? []);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...prev, [suggestionId]: [...current] };
    });
  }, []);

  const handleDismissSuggestion = useCallback(async (suggestionId: string) => {
    setActionSuggestionId(suggestionId);
    try {
      await aiService.dismissSuggestion(suggestionId);
      await suggestionsQuery.refetch();
      showToast('Suggestion dismissed.', 'info', 'Background AI');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to dismiss suggestion.';
      showToast(message, 'error', 'Background AI');
    } finally {
      setActionSuggestionId(null);
    }
  }, [showToast, suggestionsQuery]);

  const renderSuggestionRow = useCallback((suggestion: AiSuggestion) => {
    const isActing = actionSuggestionId === suggestion.id;
    const confidence = typeof suggestion.confidence === 'number'
      ? Math.max(0, Math.min(100, Math.round(suggestion.confidence * 100)))
      : null;
    const assigneeCandidates = getAssigneeCandidates(suggestion);
    const suggestedPriority = getSuggestedPriority(suggestion);
    const suggestedLabels = getSuggestedLabels(suggestion);
    const sprintCandidates = getSprintPlanningCandidates(suggestion);
    const actionLabel = formatSuggestionActionLabel(suggestion);
    const scopeBadge = getSuggestionScopeBadge(suggestion);
    const riskSignals = Array.isArray(suggestion.payload?.riskSignals)
      ? (suggestion.payload?.riskSignals as Array<string>).filter(Boolean).slice(0, 4)
      : [];
    const report = typeof suggestion.payload?.report === 'string' ? suggestion.payload.report.trim() : null;
    const chosenLabelIds = selectedLabelIds[suggestion.id] ?? [];
    const chosenSprintIssueIds = selectedSprintIssueIds[suggestion.id] ?? [];
    const actionable = isSuggestionActionable(suggestion);

    return (
      <div
        key={suggestion.id}
        className="rounded-xl border border-gray-200/80 bg-white/90 px-3 py-2.5 shadow-sm shadow-black/[0.02] dark:border-border-dark dark:bg-white/[0.025]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-200">{suggestion.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              {formatSuggestionDetails(suggestion)}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
              <span>{formatSuggestionTarget(suggestion)}</span>
              <span>•</span>
              <span>{relativeTime(suggestion.createdAt)}</span>
              {confidence !== null && (
                <>
                  <span>•</span>
                  <span>{confidence}%</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-white/[0.05] dark:text-gray-400">
              {suggestion.type}
            </span>
            {scopeBadge && (
              <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-gray-400 dark:border-border-dark">
                {scopeBadge}
              </span>
            )}
          </div>
        </div>

        {riskSignals.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {riskSignals.map((signal) => (
              <span
                key={signal}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-500 dark:bg-white/[0.05] dark:text-gray-400"
              >
                {signal}
              </span>
            ))}
          </div>
        )}

        {report && (
          <p className="mt-2 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-4">
            {report}
          </p>
        )}

        {suggestion.type === 'ASSIGNEE' && assigneeCandidates.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="self-center text-[10px] text-gray-400">{actionLabel}</span>
            <div className="flex flex-wrap gap-1.5">
              {assigneeCandidates.map((candidate) => {
                const userId = candidate.userId?.trim();
                const name = candidate.name?.trim();
                if (!userId || !name) return null;
                return (
                  <button
                    key={userId}
                    type="button"
                    disabled={isActing}
                    onClick={() => void handleAcceptSuggestion(suggestion.id, [userId])}
                    className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-600 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:text-gray-300"
                  >
                    {isActing ? 'Applying...' : name}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={isActing}
              onClick={() => void handleDismissSuggestion(suggestion.id)}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-400 transition-all hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark"
            >
              Dismiss
            </button>
          </div>
        ) : suggestion.type === 'LABEL' && suggestedLabels.length > 0 ? (
          <div className="mt-2.5 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {suggestedLabels.map((label) => {
                const labelId = label.labelId?.trim();
                const name = label.name?.trim();
                if (!labelId || !name) return null;
                const selected = chosenLabelIds.includes(labelId);
                return (
                  <button
                    key={labelId}
                    type="button"
                    disabled={isActing}
                    onClick={() => toggleSelectedValue(setSelectedLabelIds, suggestion.id, labelId)}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                      selected
                        ? 'border-primary/30 bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:border-primary/30 hover:text-primary dark:border-border-dark dark:text-gray-300'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={isActing}
                onClick={() => void handleAcceptSuggestion(suggestion.id, chosenLabelIds.length > 0 ? chosenLabelIds : undefined)}
                className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-600 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:text-gray-300"
              >
                {isActing ? 'Applying...' : actionLabel}
              </button>
              <button
                type="button"
                disabled={isActing}
                onClick={() => void handleDismissSuggestion(suggestion.id)}
                className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-400 transition-all hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : suggestion.type === 'SPRINT_PLANNING' && sprintCandidates.length > 0 ? (
          <div className="mt-2.5 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {sprintCandidates.slice(0, 6).map((candidate) => {
                const issueId = candidate.issueId?.trim();
                const title = candidate.title?.trim();
                if (!issueId) return null;
                const selected = chosenSprintIssueIds.includes(issueId);
                return (
                  <button
                    key={issueId}
                    type="button"
                    disabled={isActing}
                    onClick={() => toggleSelectedValue(setSelectedSprintIssueIds, suggestion.id, issueId)}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                      selected
                        ? 'border-primary/30 bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:border-primary/30 hover:text-primary dark:border-border-dark dark:text-gray-300'
                    }`}
                    title={title || issueId}
                  >
                    {issueId}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={isActing}
                onClick={() => void handleAcceptSuggestion(suggestion.id, chosenSprintIssueIds.length > 0 ? chosenSprintIssueIds : undefined)}
                className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-600 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:text-gray-300"
              >
                {isActing ? 'Applying...' : actionLabel}
              </button>
              <button
                type="button"
                disabled={isActing}
                onClick={() => void handleDismissSuggestion(suggestion.id)}
                className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-400 transition-all hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : suggestion.type === 'PRIORITY' && suggestedPriority ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={isActing}
              onClick={() => void handleAcceptSuggestion(suggestion.id)}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-600 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:text-gray-300"
            >
              {isActing ? 'Applying...' : actionLabel}
            </button>
            <button
              type="button"
              disabled={isActing}
              onClick={() => void handleDismissSuggestion(suggestion.id)}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-400 transition-all hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark"
            >
              Dismiss
            </button>
          </div>
        ) : actionable ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={isActing}
              onClick={() => void handleAcceptSuggestion(suggestion.id)}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-600 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:text-gray-300"
            >
              {isActing ? 'Applying...' : actionLabel}
            </button>
            <button
              type="button"
              disabled={isActing}
              onClick={() => void handleDismissSuggestion(suggestion.id)}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-400 transition-all hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={isActing}
              onClick={() => void handleDismissSuggestion(suggestion.id)}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-400 transition-all hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  }, [
    actionSuggestionId,
    handleAcceptSuggestion,
    handleDismissSuggestion,
    selectedLabelIds,
    selectedSprintIssueIds,
    toggleSelectedValue,
  ]);

  return (
    <div className="relative flex h-full shrink-0 flex-col border-l border-gray-200 bg-white dark:border-border-dark dark:bg-bg-dark" style={{ width: `${panelWidth}px` }}>
      {/* Drag handle — left edge */}
      <div
        onMouseDown={handleDragStart}
        className="absolute left-0 top-0 z-10 h-full w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors"
      />
      {/* Header */}
          <div className="flex min-h-16 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-border-dark">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">Trussen AI</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-semibold uppercase tracking-wider dark:bg-white/[0.05]">
              <ShieldCheck size={10} />
              Workspace-scoped
            </span>
            {activeConversation && (
              <span className="truncate">
                {activeConversation.requestCount} requests · {formatCompactNumber(activeConversation.totalTokens)} tokens
              </span>
            )}
            {!activeConversation && typeof lastResponseMeta?.tokensUsed === 'number' && (
              <span>
                {formatCompactNumber(lastResponseMeta.tokensUsed)} tokens
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setView(view === 'history' ? 'chat' : 'history')}
            className={`rounded-md p-1.5 transition-colors ${view === 'history' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
            title="History"
            aria-label="Toggle conversation history"
          >
            <Clock size={13} />
          </button>
          <button type="button" onClick={handleNewConversation} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5" title="New chat" aria-label="Start a new conversation">
            <Plus size={13} />
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5" aria-label="Close AI panel">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* History View */}
      {view === 'history' ? (
        <div className="flex-1 overflow-y-auto p-2">
          {conversationsQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={16} className="animate-spin text-gray-400" />
            </div>
          ) : conversationsQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle size={18} className="mb-2 text-red-400" />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Failed to load conversation history</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare size={20} className="mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-[11px] text-gray-400">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-all ${
                    activeConvId === conv.id ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                  }`}
                  onClick={() => handleSelectConversation(conv.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSelectConversation(conv.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-gray-700 dark:text-gray-300">{conv.title}</p>
                    <p className="text-[10px] text-gray-400">
                      {relativeTime(conv.updatedAt)} · {conv.requestCount} req · {formatCompactNumber(conv.totalTokens)} tokens
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void handleDeleteConversation(conv.id); }}
                    className="shrink-0 rounded p-1 text-gray-300 opacity-0 transition-all group-hover:opacity-100 hover:text-red-500"
                    aria-label={`Delete conversation ${conv.title}`}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
            {messages.length === 0 && !isStreaming && !isLoadingMessages && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 dark:bg-primary/12">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300">How can I help?</p>
                <p className="mt-1.5 max-w-[220px] text-[11px] leading-relaxed text-gray-400">
                  Create issues, check status, assign tasks, or ask about your workspace.
                </p>
                <div className="mt-4 max-w-[250px] rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-left dark:border-border-dark dark:bg-white/[0.03]">
                  <div className="flex items-start gap-2">
                    <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">Safe by default</p>
                      <p className="text-[10px] leading-relaxed text-gray-400">
                        Actions respect your workspace role, private scope access, and duplicate mutation retries are blocked automatically.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {['Show my issues', 'Sprint progress', 'Who is overloaded?'].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-500 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-border-dark dark:hover:border-primary/30"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoadingMessages && (
              <div className="flex justify-center py-12">
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[12px] text-gray-500 shadow-sm dark:border-border-dark dark:bg-card-dark dark:text-gray-300">
                  <Loader2 size={13} className="animate-spin" />
                  Loading conversation...
                </div>
              </div>
            )}

            {panelError && (
              <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-[11px] text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">AI needs attention</p>
                  <p className="mt-0.5 leading-relaxed">{panelError}</p>
                </div>
              </div>
            )}

            {messages
              .filter((m) => (
                // ASSISTANT rows with empty content are tool_calls-only bookkeeping saved
                // per intermediate round of a multi-step tool-calling turn (see ai.chat.ts's
                // tool loop) — not meant for display. Rendering them as bubbles produced one
                // empty rounded pill per tool round above the real answer. Live progress for
                // an in-flight turn is already shown separately via the toolActivity indicator
                // below, gated on isStreaming.
                (m.role === 'USER' || m.role === 'ASSISTANT') && m.content.trim().length > 0
              ))
              .map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                  <div className={msg.role === 'USER' ? 'max-w-[88%]' : 'max-w-[88%] space-y-1.5'}>
                    <div
                      className={`rounded-2xl px-3 py-2 text-[12px] leading-[1.6] ${
                        msg.role === 'USER'
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 dark:bg-white/[0.05] dark:text-gray-200 rounded-bl-sm'
                      }`}
                    >
                      {msg.role === 'USER' ? (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      ) : (
                        <AiMarkdown
                          content={msg.content}
                          onQuickReply={handleQuickReply}
                          quickReplyDisabled={isStreaming}
                        />
                      )}
                    </div>
                    {msg.role === 'ASSISTANT' && (suggestionsByMessageId[msg.id]?.length ?? 0) > 0 && (
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex items-center gap-2 px-1 text-[10px] text-gray-400">
                          <span className="font-semibold uppercase tracking-[0.14em]">Suggestions</span>
                          <span className="h-px flex-1 bg-gray-200 dark:bg-border-dark" />
                        </div>
                        {suggestionsByMessageId[msg.id]!.map(renderSuggestionRow)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {isStreaming && (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 dark:bg-white/[0.05]">
                  {toolActivity ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-primary">
                      <Wrench size={11} className="animate-pulse" />
                      <span>{toolActivity}</span>
                    </div>
                  ) : streamingContent ? (
                    <AiMarkdown
                      content={streamingContent}
                      className="text-[12px] leading-[1.6] text-gray-800 dark:text-gray-200"
                      onQuickReply={handleQuickReply}
                      quickReplyDisabled={isStreaming}
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Loader2 size={11} className="animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 dark:border-border-dark">
            <div className="relative flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInput(val);
                    mention.updateMentionState(val, e.target.selectionStart ?? val.length);
                    const el = e.target;
                    el.style.height = 'auto';
                    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && mention.isDropdownOpen) {
                      e.preventDefault();
                      if (mention.mentionMode === 'selector') {
                        const q = mention.mentionQuery.toLowerCase();
                        const match = mention.ENTITY_PREFIXES.find((ep) => ep.prefix.startsWith(q));
                        if (match) mention.switchToMode(input, setInput, match.mode, match.prefix);
                        else if (mention.members.length > 0) mention.insertMention(input, setInput, `@${mention.members[0].name}`);
                      } else if (mention.mentionMode === 'person' && mention.members.length > 0) {
                        mention.insertMention(input, setInput, `@${mention.members[0].name}`);
                      } else if (mention.mentionMode === 'project' && mention.projects.length > 0) {
                        mention.insertMention(input, setInput, `@project:${mention.projects[0].name}`);
                      } else if (mention.mentionMode === 'team' && mention.teams.length > 0) {
                        mention.insertMention(input, setInput, `@team:${mention.teams[0].name}`);
                      } else if (mention.mentionMode === 'department' && mention.departments.length > 0) {
                        mention.insertMention(input, setInput, `@dept:${mention.departments[0].name}`);
                      } else if (mention.mentionMode === 'issue' && mention.issues.length > 0) {
                        mention.insertMention(input, setInput, `@issue:${mention.issues[0].id}`);
                      }
                      return;
                    }
                    if (e.key === 'Escape' && mention.isDropdownOpen) {
                      e.preventDefault(); mention.closeMention(); return;
                    }
                    if (e.key === 'Enter' && !e.shiftKey && !mention.isDropdownOpen) {
                      e.preventDefault(); void handleSend();
                    }
                  }}
                  onFocus={(e) => mention.updateMentionState(input, e.target.selectionStart ?? input.length)}
                  onBlur={() => setTimeout(() => mention.closeMention(), 150)}
                  placeholder="Ask anything... use @ to mention"
                  rows={1}
                  disabled={isStreaming || !workspaceId}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-[12px] outline-none transition-all placeholder:text-gray-400 focus:border-primary/40 focus:ring-1 focus:ring-primary/10 disabled:opacity-50 dark:border-border-dark dark:focus:border-primary/40"
                  style={{ minHeight: '34px', maxHeight: '96px' }}
                />

                {/* @ Mention Dropdown */}
                {mention.isDropdownOpen && (
                  <MentionDropdown
                    mode={mention.mentionMode}
                    query={mention.mentionQuery}
                    members={mention.members}
                    projects={mention.projects}
                    teams={mention.teams}
                    departments={mention.departments}
                    issues={mention.issues}
                    isLoadingMembers={mention.memberQuery.isLoading}
                    isLoadingProjects={mention.projectQuery.isLoading}
                    isLoadingTeams={mention.teamQuery.isLoading}
                    isLoadingDepts={mention.deptQuery.isLoading}
                    isLoadingIssues={mention.issueQuery.isLoading}
                    onSelectPerson={(name) => mention.insertMention(input, setInput, `@${name}`)}
                    onSelectProject={(name) => mention.insertMention(input, setInput, `@project:${name}`)}
                    onSelectTeam={(name) => mention.insertMention(input, setInput, `@team:${name}`)}
                    onSelectDepartment={(name) => mention.insertMention(input, setInput, `@dept:${name}`)}
                    onSelectIssue={(id) => mention.insertMention(input, setInput, `@issue:${id}`)}
                    onSwitchMode={(mode, prefix) => mention.switchToMode(input, setInput, mode, prefix)}
                    position="above"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!input.trim() || isStreaming || !workspaceId}
                className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl transition-all ${
                  input.trim() && !isStreaming && workspaceId
                    ? 'bg-primary text-white hover:bg-primary/90 active:scale-95'
                    : 'bg-gray-100 text-gray-400 dark:bg-white/5'
                }`}
                aria-label="Send AI message"
              >
                {isStreaming ? <Loader2 size={13} className="animate-spin" /> : <ArrowUp size={13} />}
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[10px] text-gray-400">
              <span>{workspaceId ? 'Enter to send, Shift+Enter for a new line.' : 'Select a workspace to use Trussen AI.'}</span>
              {Boolean(suggestions.length) && (
                <button
                  type="button"
                  onClick={() => void suggestionsQuery.refetch()}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-500 transition-all hover:border-primary/30 hover:text-primary dark:border-border-dark dark:text-gray-400"
                >
                  <RefreshCcw size={10} />
                  Refresh
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
