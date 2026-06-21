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
import { aiService } from '../services/aiService';
import type { AiAssistIntent, AiAssistResponse } from '../types';

type HistoryEntry =
  | { role: 'user'; content: string; createdAt: number }
  | { role: 'assistant'; content: AiAssistResponse; createdAt: number }
  | { role: 'error'; content: string; createdAt: number };

type PersistedAssistantHistory = {
  version: 1;
  expiresAt: number;
  history: HistoryEntry[];
};

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
const ASSISTANT_HISTORY_STORAGE_PREFIX = 'trussen:ai-assistance-history';
const ASSIST_INTENTS = ['guidance', 'navigation', 'permission', 'feature', 'status'] as const;
const ALLOWED_NAVIGATION_ROUTES = new Set([
  '/dashboard',
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
  '/api-keys',
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

  const normalized: AiAssistResponse = {
    intent,
    ...(title ? { title } : {}),
    answer: record.answer.slice(0, 8000),
    followUps: asStringArray(record.followUps, 4).map((item) => item.slice(0, 120)),
    ...(navigation ? { navigation } : {}),
    facts,
    usage: {
      inputTokens: typeof usageRecord?.inputTokens === 'number' ? usageRecord.inputTokens : 0,
      outputTokens: typeof usageRecord?.outputTokens === 'number' ? usageRecord.outputTokens : 0,
      totalTokens: typeof usageRecord?.totalTokens === 'number' ? usageRecord.totalTokens : 0,
      model: typeof usageRecord?.model === 'string' ? usageRecord.model : 'unknown',
    },
  };

  return normalized;
};

const restoreHistoryEntry = (entry: unknown): HistoryEntry | null => {
  const record = asRecord(entry);
  if (!record) return null;

  const createdAt = typeof record.createdAt === 'number'
    ? record.createdAt
    : Date.now();

  if (!isFresh({ createdAt })) return null;

  if (record.role === 'user' || record.role === 'error') {
    return typeof record.content === 'string' ? { role: record.role, content: record.content, createdAt } : null;
  }

  if (record.role === 'assistant') {
    const content = normalizeAssistResponse(record.content);
    return content ? { role: 'assistant', content, createdAt } : null;
  }

  return null;
};

const createHistoryEntry = <T extends HistoryEntry['role']>(
  role: T,
  content: Extract<HistoryEntry, { role: T }>['content'],
): Extract<HistoryEntry, { role: T }> => ({ role, content, createdAt: Date.now() } as Extract<HistoryEntry, { role: T }>);

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
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const routeMeta = useMemo(() => ROUTE_META.find((e) => e.match.test(location.pathname)), [location.pathname]);
  const pageTitle = routeMeta?.title ?? normalizePageTitle(location.pathname);
  const quickPrompts = routeMeta?.prompts ?? DEFAULT_PROMPTS;
  const rightOffset = isAiPanelOpen ? 'right-4 lg:right-[25.5rem]' : 'right-5';
  const historyStorageKey = useMemo(
    () => workspaceId && currentUserId ? `${ASSISTANT_HISTORY_STORAGE_PREFIX}:${workspaceId}:${currentUserId}` : null,
    [currentUserId, workspaceId],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  useEffect(() => {
    setHasLoadedHistory(false);

    if (!historyStorageKey) {
      setHistory([]);
      setHasLoadedHistory(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(historyStorageKey);
      if (!raw) {
        setHistory([]);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<PersistedAssistantHistory>;
      if (
        parsed.version !== 1 ||
        typeof parsed.expiresAt !== 'number' ||
        parsed.expiresAt <= Date.now() ||
        !Array.isArray(parsed.history)
      ) {
        window.localStorage.removeItem(historyStorageKey);
        setHistory([]);
        return;
      }

      const restored = parsed.history.map(restoreHistoryEntry).filter((entry): entry is HistoryEntry => Boolean(entry));
      if (restored.length === 0) window.localStorage.removeItem(historyStorageKey);
      setHistory(restored);
    } catch {
      window.localStorage.removeItem(historyStorageKey);
      setHistory([]);
    } finally {
      setHasLoadedHistory(true);
    }
  }, [historyStorageKey]);

  useEffect(() => {
    if (!hasLoadedHistory || !historyStorageKey) return;

    try {
      const freshHistory = history.filter((entry) => isFresh(entry));
      if (freshHistory.length === 0) {
        window.localStorage.removeItem(historyStorageKey);
        return;
      }

      const expiresAt = Math.max(...freshHistory.map((entry) => entry.createdAt + ASSISTANT_HISTORY_TTL_MS));
      const payload: PersistedAssistantHistory = {
        version: 1,
        expiresAt,
        history: freshHistory,
      };
      window.localStorage.setItem(historyStorageKey, JSON.stringify(payload));
    } catch {
      // Local persistence is best-effort; the assistant should still work if storage is unavailable.
    }
  }, [hasLoadedHistory, history, historyStorageKey]);

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

    setHistory((prev) => [...prev, createHistoryEntry('user', prompt)]);
    setMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const result = await aiService.assist({ message: prompt, route: location.pathname, pageTitle });
      const normalized = normalizeAssistResponse(result);
      if (!normalized) throw new Error('Assistant returned an invalid response.');
      setHistory((prev) => [...prev, createHistoryEntry('assistant', normalized)]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Assistant request failed.';
      setHistory((prev) => [...prev, createHistoryEntry('error', msg)]);
      setError(msg);
    } finally {
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
                <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" aria-label="Close AI Assistance">
                  <X size={14} />
                </button>
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

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 dark:bg-white/[0.05]">
                      <Loader2 size={12} className="animate-spin text-primary" />
                      <span className="text-[11px] text-gray-500">Thinking...</span>
                    </div>
                  </div>
                )}

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
