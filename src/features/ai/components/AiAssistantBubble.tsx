import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckSquare,
  Compass,
  HelpCircle,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useUIStore } from '@/app/stores/useUIStore';
import { AiMarkdown } from './AiMarkdown';
import { AssistFeedback } from './AssistFeedback';
import { isAxiosError } from 'axios';
import { getApiErrorCode } from '@shared/services';
import { aiService } from '../services/aiService';
import type { AiAssistIntent, AiAssistResponse } from '../types';

type HistoryEntry =
  | { role: 'user'; content: string; createdAt: number }
  | { role: 'assistant'; content: AiAssistResponse; createdAt: number }
  | { role: 'error'; content: string; createdAt: number };

const ROUTE_META: Array<{ match: RegExp; title: string; prompts: string[] }> = [
  { match: /^\/dashboard$/, title: 'Dashboard', prompts: ['Where are my assigned issues?', 'What is my role?', 'How do I create a cycle?'] },
  { match: /^\/issues/, title: 'Issues', prompts: ['Where are my assigned issues?', 'How do issue filters work?', 'Can I create an issue?'] },
  { match: /^\/projects/, title: 'Projects', prompts: ['How do projects work?', 'Who can create projects?', 'Where is project settings?'] },
  { match: /^\/teams/, title: 'Teams', prompts: ['How do teams work?', 'Where are members?', 'What can my role do?'] },
  { match: /^\/cycles/, title: 'Cycles', prompts: ['How is completion calculated?', 'Who can create cycles?', 'Open cycles'] },
  { match: /^\/analytics$/, title: 'Analytics', prompts: ['What does this page show?', 'Who can view analytics?', 'Where is billing?'] },
  { match: /^\/billing$/, title: 'Billing', prompts: ['What happens if I upgrade?', 'Who can manage billing?', 'Where is usage?'] },
  { match: /^\/settings/, title: 'Settings', prompts: ['Who can change settings?', 'Where are API keys?', 'What is my role?'] },
];

const DEFAULT_PROMPTS = ['How do I navigate here?', 'What can I do with my role?', 'Where are my assigned issues?'];
const ASSISTANT_HISTORY_TTL_MS = 24 * 60 * 60 * 1000;
// History used to live in localStorage under this prefix; it is removed on load now that it lives on the server.
const LEGACY_HISTORY_STORAGE_PREFIX = 'trussen:ai-assistance-history';
const ASSIST_INTENTS = ['guidance', 'navigation', 'permission', 'feature', 'status'] as const;
// Pages the assistant may link to. Keep in sync with GUIDE_ROUTES in the backend's ai.assist.ts.
const ALLOWED_NAVIGATION_ROUTES = new Set([
  '/dashboard',
  '/inbox',
  '/issues',
  '/issues/my',
  '/issues/create',
  '/projects',
  '/teams',
  '/departments',
  '/members',
  '/cycles',
  '/roadmap',
  '/activity',
  '/analytics',
  '/integrations',
  '/templates',
  '/settings',
  '/billing',
  '/ai-connections',
  '/ai-usage',
  '/help',
]);

const intentMeta: Record<AiAssistIntent, { icon: React.ReactNode; label: string; color: string }> = {
  guidance: { icon: <Compass size={11} />, label: 'Guide', color: 'text-gray-500 bg-gray-100 dark:bg-white/5' },
  navigation: { icon: <ArrowRight size={11} />, label: 'Navigation', color: 'text-primary bg-primary/10' },
  permission: { icon: <ShieldCheck size={11} />, label: 'Permission', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400' },
  feature: { icon: <BookOpen size={11} />, label: 'Feature', color: 'text-blue-600 bg-blue-100 dark:bg-blue-500/15 dark:text-blue-400' },
  status: { icon: <CheckSquare size={11} />, label: 'Status', color: 'text-green-600 bg-green-100 dark:bg-green-500/15 dark:text-green-400' },
};

const normalizePageTitle = (pathname: string) => {
  const matched = ROUTE_META.find((e) => e.match.test(pathname));
  if (matched) return matched.title;
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'Workspace';
  return (segments[segments.length - 1] ?? '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const isFresh = (entry: { createdAt: number }, now = Date.now()) => entry.createdAt + ASSISTANT_HISTORY_TTL_MS > now;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;

const asStringArray = (value: unknown, max: number): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, max) : [];

const normalizeAssistResponse = (value: unknown): AiAssistResponse | null => {
  const record = asRecord(value);
  if (!record || typeof record.answer !== 'string' || !record.answer.trim()) return null;

  const intent = ASSIST_INTENTS.includes(record.intent as AiAssistIntent) ? record.intent as AiAssistIntent : 'guidance';
  const title = typeof record.title === 'string' && record.title.trim() ? record.title.slice(0, 120) : undefined;
  const navigationRecord = asRecord(record.navigation);
  const navigationRoute = typeof navigationRecord?.route === 'string' ? navigationRecord.route : '';
  const navigationLabel = typeof navigationRecord?.label === 'string' ? navigationRecord.label : '';
  const navigation = ALLOWED_NAVIGATION_ROUTES.has(navigationRoute) && navigationLabel
    ? { route: navigationRoute, label: navigationLabel.slice(0, 80) }
    : undefined;

  const facts = Array.isArray(record.facts)
    ? record.facts
        .map((fact) => {
          const item = asRecord(fact);
          const label = typeof item?.label === 'string' ? item.label.trim().slice(0, 80) : '';
          const factValue = typeof item?.value === 'string' ? item.value.trim().slice(0, 200) : '';
          return label && factValue ? { label, value: factValue } : null;
        })
        .filter((fact): fact is { label: string; value: string } => Boolean(fact))
        .slice(0, 6)
    : [];
  const usageRecord = asRecord(record.usage);
  const sources = Array.isArray(record.sources)
    ? record.sources
        .map((source) => {
          const item = asRecord(source);
          const articleId = typeof item?.articleId === 'string' && /^[a-z0-9-]+$/.test(item.articleId) ? item.articleId : '';
          const sourceTitle = typeof item?.title === 'string' ? item.title.trim().slice(0, 120) : '';
          return articleId && sourceTitle ? { articleId, title: sourceTitle } : null;
        })
        .filter((source): source is { articleId: string; title: string } => Boolean(source))
        .slice(0, 3)
    : [];
  const answerId = typeof record.answerId === 'string' && /^[0-9a-f-]{36}$/i.test(record.answerId) ? record.answerId : null;
  const supportRecord = asRecord(record.support);
  const supportEmail = typeof supportRecord?.email === 'string' && /^[^\s@<>]+@[^\s@<>]+$/.test(supportRecord.email) ? supportRecord.email : null;

  const normalized: AiAssistResponse = {
    intent,
    ...(title ? { title } : {}),
    answer: record.answer.slice(0, 8000),
    followUps: asStringArray(record.followUps, 4).map((item) => item.slice(0, 120)),
    ...(navigation ? { navigation } : {}),
    facts,
    ...(sources.length ? { sources } : {}),
    ...(record.grounded === false ? { grounded: false } : {}),
    ...(supportEmail ? { support: { email: supportEmail } } : {}),
    ...(answerId ? { answerId } : {}),
    usage: {
      inputTokens: typeof usageRecord?.inputTokens === 'number' ? usageRecord.inputTokens : 0,
      outputTokens: typeof usageRecord?.outputTokens === 'number' ? usageRecord.outputTokens : 0,
      totalTokens: typeof usageRecord?.totalTokens === 'number' ? usageRecord.totalTokens : 0,
      model: typeof usageRecord?.model === 'string' ? usageRecord.model : 'unknown',
    },
  };

  return normalized;
};

const fromServerMessage = (message: { role: 'user' | 'assistant'; content: unknown; createdAt: string }): HistoryEntry | null => {
  const createdAt = Date.parse(message.createdAt) || Date.now();
  if (message.role === 'user') return typeof message.content === 'string' ? { role: 'user', content: message.content, createdAt } : null;
  const content = normalizeAssistResponse(message.content);
  return content ? { role: 'assistant', content, createdAt } : null;
};

const createHistoryEntry = <T extends HistoryEntry['role']>(
  role: T,
  content: Extract<HistoryEntry, { role: T }>['content'],
): Extract<HistoryEntry, { role: T }> => ({ role, content, createdAt: Date.now() } as Extract<HistoryEntry, { role: T }>);

// Plain words instead of "Request failed with status code 403".
const assistErrorText = (err: unknown) => {
  const streamError = err as { code?: string; status?: number } | null;
  const code = getApiErrorCode(err) ?? streamError?.code;
  if (streamError?.status === 429 || code === 'RATE_LIMITED') return 'Too many questions at once. Wait a moment and try again.';
  if (code === 'AI_BUDGET_EXCEEDED') return "Your workspace reached today's AI limit. Try again tomorrow.";
  if (code === 'AI_PLAN_UPGRADE_REQUIRED') return 'AI Assistance is not included in this plan.';
  if (isAxiosError(err) && err.response?.status === 429) return 'Too many questions at once. Wait a moment and try again.';
  return 'AI Assistance is not available right now. Try again in a moment.';
};

export const AiAssistantBubble: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const currentUserId = useAuthStore((s) => s.currentUser?.id);
  const isAiPanelOpen = useUIStore((s) => s.isAiPanelOpen);
  const isOpen = useUIStore((s) => s.isAiAssistantOpen);
  const setOpen = useUIStore((s) => s.setAiAssistantOpen);

  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // The answer being streamed right now, before its final `done` arrives.
  const [live, setLive] = useState<{
    stage: 'searching' | 'writing' | null;
    title?: string;
    sources: Array<{ articleId: string; title: string }>;
    text: string;
  } | null>(null);
  const streamAbortRef = React.useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const routeMeta = useMemo(() => ROUTE_META.find((e) => e.match.test(location.pathname)), [location.pathname]);
  const pageTitle = routeMeta?.title ?? normalizePageTitle(location.pathname);
  const quickPrompts = routeMeta?.prompts ?? DEFAULT_PROMPTS;
  const rightOffset = isAiPanelOpen ? 'right-4 lg:right-[25.5rem]' : 'right-5';
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading, live?.text]);

  // Closing the bubble (or leaving the page) stops an answer in progress;
  // the server stops the model too.
  useEffect(() => {
    if (!isOpen) streamAbortRef.current?.abort();
  }, [isOpen]);
  useEffect(() => () => streamAbortRef.current?.abort(), []);

  // History lives on the server (24 hours), so it follows the person across devices.
  // Refreshed each time the bubble opens; only cleared first when the workspace or person changed.
  const historyOwnerRef = React.useRef<string | null>(null);
  // Bumped on every send: a history load that started before a send must not overwrite it.
  const sendCountRef = React.useRef(0);
  useEffect(() => {
    if (!isOpen || !workspaceId || !currentUserId) return;
    const key = `${workspaceId}:${currentUserId}`;
    let cancelled = false;

    if (historyOwnerRef.current !== key) {
      historyOwnerRef.current = key;
      setHistory([]);
      try {
        window.localStorage.removeItem(`${LEGACY_HISTORY_STORAGE_PREFIX}:${key}`);
      } catch {
        // Storage may be blocked; nothing to clean up then.
      }
    }

    const sendCountAtStart = sendCountRef.current;
    void aiService
      .getAssistHistory()
      .then((messages) => {
        if (cancelled || sendCountRef.current !== sendCountAtStart) return;
        // Keep local-only error notes; the server has the real conversation.
        setHistory((current) => [
          ...messages.map(fromServerMessage).filter((entry): entry is HistoryEntry => Boolean(entry)),
          ...current.filter((entry) => entry.role === 'error'),
        ]);
      })
      .catch(() => {
        // A missing history is not worth an error; new questions still work.
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, workspaceId, currentUserId]);

  const handleClear = async () => {
    try {
      await aiService.clearAssistHistory();
      setHistory([]);
      setError(null);
    } catch {
      setError('Could not clear the chat. Try again.');
    }
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHistory((prev) => prev.filter((entry) => isFresh(entry)));
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, setOpen]);

  const submitPrompt = async (nextMessage?: string) => {
    const prompt = (nextMessage ?? message).trim();
    if (!prompt || isLoading || !workspaceId) return;

    sendCountRef.current += 1;
    setHistory((prev) => [...prev, createHistoryEntry('user', prompt)]);
    setMessage('');
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    streamAbortRef.current = controller;
    setLive({ stage: null, sources: [], text: '' });
    let finished = false;
    // Errors from inside the event handler are recorded, not thrown: the stream
    // reader deliberately swallows handler errors so one bad event can't kill it.
    let streamFailure: (Error & { code?: string }) | null = null;

    const finishWith = (result: unknown) => {
      const normalized = normalizeAssistResponse(result);
      if (!normalized) {
        streamFailure = new Error('Assistant returned an invalid response.');
        return;
      }
      finished = true;
      setHistory((prev) => [...prev, createHistoryEntry('assistant', normalized)]);
    };

    try {
      try {
        await aiService.streamAssist({
          message: prompt,
          route: location.pathname,
          pageTitle,
          workspaceId,
          signal: controller.signal,
          onEvent: (type, data) => {
            const record = asRecord(data);
            if (type === 'status' && (record?.stage === 'searching' || record?.stage === 'writing')) {
              const stage = record.stage;
              setLive((current) => (current ? { ...current, stage } : current));
            } else if (type === 'meta') {
              const meta = normalizeAssistResponse({ answer: ' ', ...record });
              setLive((current) => (current ? { ...current, title: meta?.title, sources: meta?.sources ?? [] } : current));
            } else if (type === 'delta' && typeof record?.text === 'string') {
              const text = record.text;
              setLive((current) => (current ? { ...current, text: current.text + text } : current));
            } else if (type === 'done') {
              finishWith(data);
            } else if (type === 'error') {
              streamFailure = Object.assign(new Error(typeof record?.message === 'string' ? record.message : 'AI Assistance failed'), {
                code: typeof record?.code === 'string' ? record.code : undefined,
              });
            }
          },
        });
      } catch (err) {
        // A backend without the streaming endpoint (mid-deploy): ask the plain way.
        if ((err as { status?: number })?.status === 404 && !finished) {
          finishWith(await aiService.assist({ message: prompt, route: location.pathname, pageTitle }));
        } else {
          throw err;
        }
      }
      if (streamFailure) throw streamFailure;
      if (!finished && !controller.signal.aborted) throw new Error('The answer was cut off.');
    } catch (err) {
      if (!controller.signal.aborted) {
        const msg = assistErrorText(err);
        setHistory((prev) => [...prev, createHistoryEntry('error', msg)]);
        setError(msg);
      }
    } finally {
      if (streamAbortRef.current === controller) streamAbortRef.current = null;
      setLive(null);
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && !isAiPanelOpen && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`fixed bottom-5 z-30 flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 shadow-lg transition-all hover:border-primary/30 hover:shadow-xl dark:border-border-dark dark:bg-card-dark dark:hover:border-primary/30 ${rightOffset}`}
          aria-label="Open AI Assistance"
        >
          <HelpCircle size={15} className="text-primary" />
          <span className="text-[12px] font-medium text-gray-600 dark:text-gray-300">Help</span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={`fixed bottom-16 z-50 flex max-h-[72vh] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-border-dark dark:bg-bg-dark ${rightOffset}`}
              role="dialog"
              aria-label="AI Assistance"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-border-dark">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-primary" />
                  <div>
                    <span className="block text-[13px] font-semibold text-gray-800 dark:text-gray-200">AI Assistance</span>
                    <span className="block text-[9px] text-gray-400">Product guide</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => void handleClear()}
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-300"
                    >
                      Clear chat
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { navigate('/help'); setOpen(false); }}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-300"
                  >
                    <BookOpen size={12} /> Help articles
                  </button>
                  <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" aria-label="Close AI Assistance">
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {history.length === 0 && !isLoading && (
                  <div className="space-y-3">
                    <div className="flex flex-col items-center py-6 text-center">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles size={14} className="text-primary" />
                      </div>
                      <p className="text-[12px] font-medium text-gray-700 dark:text-gray-300">How can I help?</p>
                      <p className="mt-1 text-[10px] text-gray-400">Context: {pageTitle}</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {quickPrompts.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => void submitPrompt(p)}
                          className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-500 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-border-dark dark:hover:border-primary/30"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {history.map((entry) => {
                  if (entry.role === 'user') {
                    return (
                      <div key={`${entry.createdAt}-${entry.content}`} className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-[12px] leading-[1.6] text-white">
                          {entry.content}
                        </div>
                      </div>
                    );
                  }

                  if (entry.role === 'error') {
                    return (
                      <div key={`${entry.createdAt}-${entry.content}`} className="rounded-lg border border-red-200 bg-red-50/50 px-3 py-2 text-[11px] text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                        {entry.content}
                      </div>
                    );
                  }

                  const res = entry.content;
                  const intent = intentMeta[res.intent] ?? intentMeta.guidance;
                  return (
                    <div key={`${entry.createdAt}-${res.answer.slice(0, 20)}`} className="space-y-2">
                      <div className="flex justify-start">
                        <div className="max-w-[90%] space-y-2 rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 dark:bg-white/[0.05]">
                          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium ${intent.color}`}>
                            {intent.icon}
                            {intent.label}
                          </span>
                          {res.title && <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">{res.title}</p>}
                          <div className="text-[12px] leading-[1.7] text-gray-700 dark:text-gray-300">
                            <AiMarkdown content={res.answer} />
                          </div>
                        </div>
                      </div>

                      {res.facts.length > 0 && (
                        <div className="grid grid-cols-2 gap-1">
                          {res.facts.map((fact) => (
                            <div key={`${fact.label}-${fact.value}`} className="rounded-lg bg-gray-50 px-2 py-1.5 dark:bg-white/[0.03]">
                              <p className="text-[9px] text-gray-500">{fact.label}</p>
                              <p className="truncate text-[12px] font-semibold text-gray-800 dark:text-gray-100">{fact.value}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {res.navigation && (
                        <button
                          type="button"
                          onClick={() => { navigate(res.navigation!.route); setOpen(false); }}
                          className="flex w-full items-center justify-between rounded-lg border border-primary/20 bg-primary/[0.04] px-3 py-2 text-left transition-all hover:bg-primary/[0.08] focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <div>
                            <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100">{res.navigation.label}</p>
                            <p className="text-[9px] text-gray-400">{res.navigation.route}</p>
                          </div>
                          <ArrowRight size={12} className="text-primary" />
                        </button>
                      )}

                      {(res.sources?.length || res.support) && (
                        <div className="space-y-1">
                          {res.sources && res.sources.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[9px] font-medium text-gray-400">{res.grounded === false ? 'Closest articles:' : 'Learn more:'}</span>
                              {res.sources.map((source) => (
                                <button
                                  key={source.articleId}
                                  type="button"
                                  onClick={() => { navigate(`/help/${source.articleId}`); setOpen(false); }}
                                  className="inline-flex items-center gap-1 rounded-md bg-primary/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/[0.12]"
                                >
                                  <BookOpen size={10} /> {source.title}
                                </button>
                              ))}
                            </div>
                          )}
                          {res.support && (
                            <a
                              href={`mailto:${res.support.email}`}
                              className="inline-block text-[10px] font-medium text-gray-500 underline-offset-2 hover:text-primary hover:underline"
                            >
                              Contact support ({res.support.email})
                            </a>
                          )}
                        </div>
                      )}

                      {res.answerId && <AssistFeedback answerId={res.answerId} />}

                      {res.followUps.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {res.followUps.map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => void submitPrompt(f)}
                              className="rounded-full border border-gray-200 px-2 py-0.5 text-[9px] text-gray-500 hover:border-primary/30 hover:text-primary dark:border-border-dark"
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && live?.text ? (
                  <div className="space-y-2" aria-live="polite">
                    <div className="flex justify-start">
                      <div className="max-w-[90%] space-y-2 rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 dark:bg-white/[0.05]">
                        {live.title && <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">{live.title}</p>}
                        <div className="text-[12px] leading-[1.7] text-gray-700 dark:text-gray-300">
                          <AiMarkdown content={live.text} />
                        </div>
                      </div>
                    </div>
                    {live.sources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[9px] font-medium text-gray-400">Learn more:</span>
                        {live.sources.map((source) => (
                          <span key={source.articleId} className="inline-flex items-center gap-1 rounded-md bg-primary/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            <BookOpen size={10} /> {source.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : isLoading ? (
                  <div className="flex justify-start" aria-live="polite">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 dark:bg-white/[0.05]">
                      <Loader2 size={12} className="animate-spin text-primary" />
                      <span className="text-[11px] text-gray-500">
                        {live?.stage === 'searching' ? 'Searching help…' : live?.stage === 'writing' ? 'Writing…' : 'Thinking…'}
                      </span>
                    </div>
                  </div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-100 p-3 dark:border-border-dark">
                <div className="flex items-end gap-2">
                  <textarea
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); if (error) setError(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submitPrompt(); } }}
                    rows={1}
                    placeholder={`Ask about ${pageTitle.toLowerCase()}...`}
                    className="flex-1 resize-none rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-[12px] outline-none transition-all placeholder:text-gray-400 focus:border-primary/40 dark:border-border-dark"
                    style={{ minHeight: '34px', maxHeight: '80px' }}
                    aria-label="Ask AI Assistance"
                  />
                  <button
                    type="button"
                    onClick={() => void submitPrompt()}
                    disabled={!message.trim() || isLoading || !workspaceId}
                    className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg transition-all ${
                      message.trim() && !isLoading ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-100 text-gray-400 dark:bg-white/5'
                    }`}
                    aria-label="Send message"
                  >
                    {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
