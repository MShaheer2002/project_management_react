import React, { useCallback, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUp,
  Building2,
  Check,
  FolderKanban,
  Hash,
  Loader2,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspaceMemberOptions } from '@features/workspace';
import { useProjectOptions } from '@features/projects';
import { useTeamOptions } from '@features/team';
import { useDepartmentOptions } from '@features/department';
import { useIssueOptions } from '@features/issues';
import { useGenerateIssue } from '../hooks/useAiMutations';
import type { AiGeneratedIssue, AiClarificationNeeded } from '../types';

type AiIssueGeneratorProps = {
  onGenerated: (data: AiGeneratedIssue) => void;
};

// All supported @ mention types
type MentionMode = 'idle' | 'selector' | 'person' | 'project' | 'team' | 'department' | 'issue';

// Entity type config for the selector menu
const ENTITY_TYPES = [
  { mode: 'person' as const, label: 'Member', prefix: '', icon: User, hint: '@name', color: 'text-primary bg-primary/10' },
  { mode: 'project' as const, label: 'Project', prefix: 'project:', icon: FolderKanban, hint: '@project:name', color: 'text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-500/15' },
  { mode: 'team' as const, label: 'Team', prefix: 'team:', icon: Users, hint: '@team:name', color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/15' },
  { mode: 'department' as const, label: 'Department', prefix: 'dept:', icon: Building2, hint: '@dept:name', color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/15' },
  { mode: 'issue' as const, label: 'Issue', prefix: 'issue:', icon: Hash, hint: '@issue:ID or title', color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/15' },
];

export const AiIssueGenerator: React.FC<AiIssueGeneratorProps> = ({ onGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [clarification, setClarification] = useState<AiClarificationNeeded | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const generateIssue = useGenerateIssue();

  // Mention state
  const [mentionMode, setMentionMode] = useState<MentionMode>('idle');
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);

  // Resolved IDs from dropdown selections
  const [resolvedAssigneeId, setResolvedAssigneeId] = useState<string | undefined>();
  const [resolvedProjectId, setResolvedProjectId] = useState<string | undefined>();

  // Data queries — only fetch when the relevant dropdown is open
  const memberQuery = useWorkspaceMemberOptions(
    { limit: 8, q: mentionQuery || undefined },
    { enabled: mentionMode === 'person' || mentionMode === 'selector' },
  );
  const members = memberQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const projectQuery = useProjectOptions(
    { limit: 8, sort: 'name:asc', q: mentionQuery || undefined },
    { enabled: mentionMode === 'project' },
  );
  const projects = projectQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const teamQuery = useTeamOptions(
    { limit: 8, sort: 'name:asc', q: mentionQuery || undefined },
    { enabled: mentionMode === 'team' },
  );
  const teams = teamQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const deptQuery = useDepartmentOptions(
    { limit: 8, sort: 'name:asc', q: mentionQuery || undefined },
    { enabled: mentionMode === 'department' },
  );
  const departments = deptQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const issueQuery = useIssueOptions(
    { limit: 8, sort: 'updatedAt:desc', q: mentionQuery || undefined },
    { enabled: mentionMode === 'issue' },
  );
  const issues = issueQuery.data?.pages.flatMap((p) => p.items) ?? [];

  // Detect @ mention type from cursor position
  const updateMentionState = (text: string, cursorPos: number) => {
    const before = text.slice(0, cursorPos);

    // Check for typed prefixes: @project:, @team:, @dept:, @issue:
    for (const et of ENTITY_TYPES) {
      if (!et.prefix) continue; // Skip 'person' — handled below
      const regex = new RegExp(`(^|\\s)@${et.prefix}([\\w-]{0,30})$`, 'i');
      const m = regex.exec(before);
      if (m) {
        setMentionMode(et.mode);
        setMentionQuery(m[2] ?? '');
        setMentionStartIndex(before.length - (m[2] ?? '').length - `@${et.prefix}`.length);
        return;
      }
    }

    // Check for partial prefix typing: @pro → suggest @project:, @tea → suggest @team:, etc.
    const partialPrefixMatch = before.match(/(^|\s)@(pro|proj|proje|projec|project|tea|team|dep|dept|iss|issu|issue)$/i);
    if (partialPrefixMatch) {
      setMentionMode('selector');
      setMentionQuery(partialPrefixMatch[2] ?? '');
      setMentionStartIndex(before.length - partialPrefixMatch[2]!.length - 1);
      return;
    }

    // Plain @query — person mention
    const personMatch = before.match(/(^|\s)@([a-zA-Z0-9._-]{0,30})$/);
    if (personMatch) {
      setMentionMode(personMatch[2] ? 'person' : 'selector');
      setMentionQuery(personMatch[2] ?? '');
      setMentionStartIndex(before.length - (personMatch[2] ?? '').length - 1);
      return;
    }

    setMentionMode('idle');
    setMentionQuery('');
    setMentionStartIndex(null);
  };

  // Insert text at mention position
  const insertMention = (text: string, opts?: { assigneeId?: string; projectId?: string }) => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStartIndex === null) return;

    if (opts?.assigneeId) setResolvedAssigneeId(opts.assigneeId);
    if (opts?.projectId) setResolvedProjectId(opts.projectId);

    const cursorPos = textarea.selectionStart ?? prompt.length;
    const before = prompt.slice(0, mentionStartIndex);
    const after = prompt.slice(cursorPos);
    const inserted = `${text} `;
    setPrompt(`${before}${inserted}${after}`);
    closeMention();

    requestAnimationFrame(() => {
      const next = (before + inserted).length;
      textarea.focus();
      textarea.setSelectionRange(next, next);
    });
  };

  // Switch to a specific entity mode (from the selector)
  const switchToMode = (mode: MentionMode, prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStartIndex === null) return;

    const cursorPos = textarea.selectionStart ?? prompt.length;
    const before = prompt.slice(0, mentionStartIndex);
    const after = prompt.slice(cursorPos);
    const inserted = `@${prefix}`;
    const nextValue = `${before}${inserted}${after}`;
    setPrompt(nextValue);
    setMentionMode(mode);
    setMentionQuery('');

    requestAnimationFrame(() => {
      const next = (before + inserted).length;
      textarea.focus();
      textarea.setSelectionRange(next, next);
    });
  };

  const closeMention = () => {
    setMentionMode('idle');
    setMentionQuery('');
    setMentionStartIndex(null);
  };

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || generateIssue.isPending) return;

    setClarification(null);
    setShowSuccess(false);
    closeMention();

    try {
      const result = await generateIssue.mutateAsync({
        prompt: trimmed,
        resolvedAssigneeId,
        resolvedProjectId,
      });

      if (result.status === 'clarification_needed') {
        setClarification(result);
        return;
      }

      onGenerated(result);
      setShowSuccess(true);
      setPrompt('');
      setResolvedAssigneeId(undefined);
      setResolvedProjectId(undefined);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch {
      // Error handled by mutation onError
    }
  }, [prompt, generateIssue, onGenerated, resolvedAssigneeId, resolvedProjectId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isOpen = mentionMode !== 'idle';

    if (e.key === 'Enter' && isOpen) {
      e.preventDefault();
      // Auto-select first item based on current mode
      if (mentionMode === 'selector') {
        // Find matching entity type by partial prefix
        const q = mentionQuery.toLowerCase();
        const match = ENTITY_TYPES.find((et) => et.prefix && et.prefix.startsWith(q));
        if (match) {
          switchToMode(match.mode, match.prefix);
        } else if (members.length > 0) {
          insertMention(`@${members[0].name}`, { assigneeId: members[0].id });
        }
      } else if (mentionMode === 'person' && members.length > 0) {
        insertMention(`@${members[0].name}`, { assigneeId: members[0].id });
      } else if (mentionMode === 'project' && projects.length > 0) {
        insertMention(`@project:${projects[0].name}`, { projectId: projects[0].id });
      } else if (mentionMode === 'team' && teams.length > 0) {
        insertMention(`@team:${teams[0].name}`);
      } else if (mentionMode === 'department' && departments.length > 0) {
        insertMention(`@dept:${departments[0].name}`);
      } else if (mentionMode === 'issue' && issues.length > 0) {
        insertMention(`@issue:${issues[0].id}`);
      }
      return;
    }

    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closeMention();
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey && !isOpen) {
      e.preventDefault();
      void handleGenerate();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value;
    setPrompt(nextValue);
    setClarification(null);
    setShowSuccess(false);

    const cursorPos = e.target.selectionStart ?? nextValue.length;
    updateMentionState(nextValue, cursorPos);

    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const isDropdownOpen = mentionMode !== 'idle';

  // Render entity list for a specific mode
  const renderEntityList = (
    mode: MentionMode,
    items: Array<{ id: string; name: string; email?: string }>,
    isLoading: boolean,
    config: (typeof ENTITY_TYPES)[number],
    onSelect: (item: { id: string; name: string }) => void,
  ) => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-400">
          <Loader2 size={12} className="animate-spin" /> Loading...
        </div>
      );
    }
    if (items.length === 0) {
      return <div className="px-3 py-2.5 text-xs text-gray-400">No matching {config.label.toLowerCase()}s</div>;
    }
    return items.map((item) => (
      <button
        key={item.id}
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onSelect(item)}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/[0.06]"
      >
        <div className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${config.color}`}>
          {mode === 'person' ? (item.name || 'U').charAt(0).toUpperCase() : <config.icon size={13} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{item.name || item.id}</div>
          {(item as { email?: string }).email && (
            <div className="truncate text-[10px] text-gray-400">{(item as { email?: string }).email}</div>
          )}
        </div>
      </button>
    ));
  };

  return (
    <div className="space-y-2">
      {/* Main AI Input */}
      <div
        className={`relative rounded-2xl border transition-all duration-200 ${
          isFocused || generateIssue.isPending
            ? 'border-primary/30 bg-white shadow-lg shadow-primary/5 dark:border-primary/20 dark:bg-card-dark dark:shadow-primary/5'
            : 'border-gray-200 bg-white dark:border-border-dark dark:bg-card-dark'
        }`}
      >
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <div className="flex items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 dark:bg-primary/12">
            <Sparkles size={11} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Trussen AI</span>
          </div>
          {generateIssue.isPending && (
            <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin text-primary" />
              <span className="text-[11px] font-medium text-primary">Generating issue...</span>
            </motion.div>
          )}
        </div>

        {/* Textarea */}
        <div className="relative px-4 pb-3">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              setIsFocused(true);
              updateMentionState(prompt, e.target.selectionStart ?? prompt.length);
            }}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => closeMention(), 150);
            }}
            placeholder='Describe your issue — use @ to mention people, projects, teams...'
            rows={1}
            disabled={generateIssue.isPending}
            className="w-full resize-none bg-transparent py-2 text-[15px] text-gray-800 outline-none placeholder:text-gray-400 disabled:opacity-60 dark:text-gray-100 dark:placeholder:text-gray-500"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />

          {/* Mention Dropdown */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-[320px] max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-2xl dark:border-border-dark dark:bg-card-dark">

              {/* Selector mode: show entity type chooser + top members */}
              {mentionMode === 'selector' && (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Mention</div>
                  {ENTITY_TYPES.map((et) => {
                    // Filter by what the user has typed so far
                    const q = mentionQuery.toLowerCase();
                    if (q && !et.label.toLowerCase().startsWith(q) && !et.prefix.startsWith(q) && !et.mode.startsWith(q)) return null;

                    return (
                      <button
                        key={et.mode}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (et.prefix) {
                            switchToMode(et.mode, et.prefix);
                          } else {
                            // Person mode — already in it, just clear selector
                            setMentionMode('person');
                          }
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                      >
                        <div className={`flex h-6 w-6 items-center justify-center rounded-md ${et.color}`}>
                          <et.icon size={13} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{et.label}</div>
                          <div className="text-[10px] text-gray-400">{et.hint}</div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Also show matching members inline if query matches someone */}
                  {mentionQuery && members.length > 0 && (
                    <>
                      <div className="my-1 border-t border-gray-100 dark:border-border-dark" />
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Members</div>
                      {members.slice(0, 4).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => insertMention(`@${m.name}`, { assigneeId: m.id })}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {(m.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate text-sm text-gray-700 dark:text-gray-200">{m.name}</div>
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}

              {/* Person mode */}
              {mentionMode === 'person' && renderEntityList('person', members, memberQuery.isLoading, ENTITY_TYPES[0], (m) => insertMention(`@${m.name}`, { assigneeId: m.id }))}

              {/* Project mode */}
              {mentionMode === 'project' && renderEntityList('project', projects, projectQuery.isLoading, ENTITY_TYPES[1], (p) => insertMention(`@project:${p.name}`, { projectId: p.id }))}

              {/* Team mode */}
              {mentionMode === 'team' && renderEntityList('team', teams, teamQuery.isLoading, ENTITY_TYPES[2], (t) => insertMention(`@team:${t.name}`))}

              {/* Department mode */}
              {mentionMode === 'department' && renderEntityList('department', departments, deptQuery.isLoading, ENTITY_TYPES[3], (d) => insertMention(`@dept:${d.name}`))}

              {/* Issue mode — issues have { id, title } not { id, name } */}
              {mentionMode === 'issue' && (
                issueQuery.isLoading ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-400"><Loader2 size={12} className="animate-spin" /> Loading...</div>
                ) : issues.length === 0 ? (
                  <div className="px-3 py-2.5 text-xs text-gray-400">No matching issues</div>
                ) : (
                  issues.map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertMention(`@issue:${issue.id}`)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-md text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/15">
                        <Hash size={13} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{issue.id}</div>
                        <div className="truncate text-[10px] text-gray-400">{issue.title}</div>
                      </div>
                    </button>
                  ))
                )
              )}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 dark:border-border-dark">
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-white/5">@</span>
            <span>to mention people, projects, teams, issues</span>
          </div>

          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={!prompt.trim() || generateIssue.isPending}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              prompt.trim() && !generateIssue.isPending
                ? 'bg-primary text-white hover:bg-primary/90 active:scale-95'
                : 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-600'
            }`}
            title="Generate (Enter)"
          >
            {generateIssue.isPending ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
          </button>
        </div>
      </div>

      {/* Clarification */}
      <AnimatePresence>
        {clarification && !generateIssue.isPending && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200/50 bg-amber-50/40 px-4 py-3 dark:border-amber-900/20 dark:bg-amber-900/10">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
              <div className="space-y-1.5 text-[13px] leading-relaxed">
                <p className="whitespace-pre-line text-amber-800 dark:text-amber-300">{clarification.message}</p>
                {(clarification.detectedSoFar.type || clarification.detectedSoFar.priority) && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-amber-500">Detected:</span>
                    {clarification.detectedSoFar.type && <span className="rounded bg-amber-200/50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{clarification.detectedSoFar.type}</span>}
                    {clarification.detectedSoFar.priority && <span className="rounded bg-amber-200/50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{clarification.detectedSoFar.priority}</span>}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setClarification(null)} className="shrink-0 rounded p-0.5 text-amber-400 hover:text-amber-600 dark:hover:text-amber-300"><X size={12} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-2 rounded-xl border border-green-200/50 bg-green-50/40 px-4 py-2.5 dark:border-green-900/20 dark:bg-green-900/10">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white"><Check size={10} strokeWidth={3} /></div>
              <p className="text-[13px] font-medium text-green-700 dark:text-green-400">Issue generated — review and edit below</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
