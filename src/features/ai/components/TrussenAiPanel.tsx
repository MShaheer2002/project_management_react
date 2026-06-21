import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Check,
  Clock,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/app/stores/useUIStore';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { privateApi } from '@shared/services/privateApi';
import { getAuthToken } from '@shared/services';
import { aiService } from '../services/aiService';
import { AiMarkdown } from './AiMarkdown';
import { MentionDropdown } from './MentionDropdown';
import { useMentionAutocomplete } from '../hooks/useMentionAutocomplete';
import type { AiMessage } from '../types';

/** Extract tool names from toolCalls JSON safely */
const formatToolNames = (toolCalls: unknown): string => {
  if (!Array.isArray(toolCalls)) return 'tools';
  const names = toolCalls
    .map((tc) => {
      if (typeof tc === 'object' && tc !== null && 'function' in tc) {
        const fn = (tc as { function?: { name?: string } }).function;
        return fn?.name ?? '';
      }
      return '';
    })
    .filter(Boolean);
  return names.length > 0 ? names.join(', ') : 'tools';
};

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

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 360;

export const TrussenAiPanel: React.FC = () => {
  const setOpen = useUIStore((s) => s.setAiPanelOpen);
  const activeConvId = useUIStore((s) => s.activeConversationId);
  const setActiveConvId = useUIStore((s) => s.setActiveConversationId);
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const queryClient = useQueryClient();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const [view, setView] = useState<'chat' | 'history'>('chat');
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

  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    aiService.getConversationMessages(activeConvId)
      .then(setMessages)
      .catch((err) => {
        console.error('[TrussenAI] Failed to load messages:', err);
        setMessages([]);
      });
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Focus input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
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

    // Reset textarea height properly
    requestAnimationFrame(() => {
      if (inputRef.current && inputRef.current.isConnected) {
        inputRef.current.style.height = 'auto';
      }
    });

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');
      const baseUrl = (privateApi.defaults.baseURL || '').replace(/\/$/, '');

      const response = await fetch(`${baseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Workspace-Id': workspaceId ?? '',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ conversationId: activeConvId, message: trimmed }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(errData.error?.message || `Error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let convId = activeConvId;
      let lastContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
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
            const data = JSON.parse(eventData) as Record<string, unknown>;

            if (eventType === 'tool_call' && typeof data.tool === 'string') {
              setToolActivity(`Using ${data.tool}...`);
            } else if (eventType === 'tool_result') {
              setToolActivity(null);
            } else if (eventType === 'message' && typeof data.content === 'string') {
              lastContent = data.content;
              setStreamingContent(lastContent);
            } else if (eventType === 'done' && typeof data.conversationId === 'string') {
              convId = data.conversationId;
            } else if (eventType === 'error' && typeof data.message === 'string') {
              setStreamingContent(`Error: ${data.message}`);
            }
          } catch {
            // Skip malformed JSON — don't crash the stream
          }
        }
      }

      if (convId && !activeConvId) {
        setActiveConvId(convId);
      }

      if (convId) {
        const updated = await aiService.getConversationMessages(convId);
        setMessages(updated);
      }

      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Chat failed';
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'ASSISTANT', content: errMsg, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setToolActivity(null);
    }
  }, [input, isStreaming, activeConvId, workspaceId, queryClient, setActiveConvId]);

  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
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

  return (
    <div className="relative flex h-full shrink-0 flex-col border-l border-gray-200 bg-white dark:border-border-dark dark:bg-bg-dark" style={{ width: `${panelWidth}px` }}>
      {/* Drag handle — left edge */}
      <div
        onMouseDown={handleDragStart}
        className="absolute left-0 top-0 z-10 h-full w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors"
      />
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-border-dark">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">Trussen AI</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setView(view === 'history' ? 'chat' : 'history')}
            className={`rounded-md p-1.5 transition-colors ${view === 'history' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
            title="History"
          >
            <Clock size={13} />
          </button>
          <button type="button" onClick={handleNewConversation} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5" title="New chat">
            <Plus size={13} />
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5">
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
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-gray-700 dark:text-gray-300">{conv.title}</p>
                    <p className="text-[10px] text-gray-400">{relativeTime(conv.updatedAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void handleDeleteConversation(conv.id); }}
                    className="shrink-0 rounded p-1 text-gray-300 opacity-0 transition-all group-hover:opacity-100 hover:text-red-500"
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
            {messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 dark:bg-primary/12">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300">How can I help?</p>
                <p className="mt-1.5 max-w-[220px] text-[11px] leading-relaxed text-gray-400">
                  Create issues, check status, assign tasks, or ask about your workspace.
                </p>
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

            {messages
              .filter((m) => m.role === 'USER' || m.role === 'ASSISTANT')
              .map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                  <div className={msg.role === 'USER' ? 'max-w-[88%]' : 'max-w-[88%] space-y-1'}>
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
                        <AiMarkdown content={msg.content} />
                      )}
                    </div>
                    {msg.role === 'ASSISTANT' && Boolean(msg.toolCalls) && (
                      <div className="flex items-center gap-1.5 px-1 text-[9px] text-gray-400">
                        <Wrench size={8} />
                        <span>Used {formatToolNames(msg.toolCalls)}</span>
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
                    <AiMarkdown content={streamingContent} className="text-[12px] leading-[1.6] text-gray-800 dark:text-gray-200" />
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
                  disabled={isStreaming}
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
                disabled={!input.trim() || isStreaming}
                className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl transition-all ${
                  input.trim() && !isStreaming
                    ? 'bg-primary text-white hover:bg-primary/90 active:scale-95'
                    : 'bg-gray-100 text-gray-400 dark:bg-white/5'
                }`}
              >
                {isStreaming ? <Loader2 size={13} className="animate-spin" /> : <ArrowUp size={13} />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
