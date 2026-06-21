/**
 * Shared @ mention autocomplete hook — used by AiIssueGenerator AND TrussenAiPanel.
 * Supports: @name (member), @project:name, @team:name, @dept:name, @issue:ID
 */

import { useState, useCallback, useRef } from 'react';
import { useWorkspaceMemberOptions } from '@features/workspace';
import { useProjectOptions } from '@features/projects';
import { useTeamOptions } from '@features/team';
import { useDepartmentOptions } from '@features/department';
import { useIssueOptions } from '@features/issues';

export type MentionMode = 'idle' | 'selector' | 'person' | 'project' | 'team' | 'department' | 'issue';

export function useMentionAutocomplete() {
  const [mentionMode, setMentionMode] = useState<MentionMode>('idle');
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Data queries
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

  const ENTITY_PREFIXES = [
    { mode: 'project' as const, prefix: 'project:' },
    { mode: 'team' as const, prefix: 'team:' },
    { mode: 'department' as const, prefix: 'dept:' },
    { mode: 'issue' as const, prefix: 'issue:' },
  ];

  const updateMentionState = useCallback((text: string, cursorPos: number) => {
    const before = text.slice(0, cursorPos);

    // Check typed prefixes: @project:, @team:, @dept:, @issue:
    for (const ep of ENTITY_PREFIXES) {
      const regex = new RegExp(`(^|\\s)@${ep.prefix}([\\w-]{0,30})$`, 'i');
      const m = regex.exec(before);
      if (m) {
        setMentionMode(ep.mode);
        setMentionQuery(m[2] ?? '');
        setMentionStartIndex(before.length - (m[2] ?? '').length - `@${ep.prefix}`.length);
        return;
      }
    }

    // Partial prefix: @pro → suggest @project:
    const partialMatch = before.match(/(^|\s)@(pro|proj|proje|projec|project|tea|team|dep|dept|iss|issu|issue)$/i);
    if (partialMatch) {
      setMentionMode('selector');
      setMentionQuery(partialMatch[2] ?? '');
      setMentionStartIndex(before.length - partialMatch[2]!.length - 1);
      return;
    }

    // Plain @query → person
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
  }, []);

  const insertMention = useCallback((
    prompt: string,
    setPrompt: (v: string) => void,
    text: string,
  ) => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStartIndex === null) return;

    const cursorPos = textarea.selectionStart ?? prompt.length;
    const before = prompt.slice(0, mentionStartIndex);
    const after = prompt.slice(cursorPos);
    const inserted = `${text} `;
    setPrompt(`${before}${inserted}${after}`);
    closeMention();

    requestAnimationFrame(() => {
      if (!textarea.isConnected) return;
      const next = (before + inserted).length;
      textarea.focus();
      textarea.setSelectionRange(next, next);
    });
  }, [mentionStartIndex]);

  const switchToMode = useCallback((
    prompt: string,
    setPrompt: (v: string) => void,
    mode: MentionMode,
    prefix: string,
  ) => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStartIndex === null) return;

    const cursorPos = textarea.selectionStart ?? prompt.length;
    const before = prompt.slice(0, mentionStartIndex);
    const after = prompt.slice(cursorPos);
    const inserted = `@${prefix}`;
    setPrompt(`${before}${inserted}${after}`);
    setMentionMode(mode);
    setMentionQuery('');

    requestAnimationFrame(() => {
      if (!textarea.isConnected) return;
      const next = (before + inserted).length;
      textarea.focus();
      textarea.setSelectionRange(next, next);
    });
  }, [mentionStartIndex]);

  const closeMention = useCallback(() => {
    setMentionMode('idle');
    setMentionQuery('');
    setMentionStartIndex(null);
  }, []);

  return {
    textareaRef,
    mentionMode,
    mentionQuery,
    isDropdownOpen: mentionMode !== 'idle',
    members,
    projects,
    teams,
    departments,
    issues,
    memberQuery,
    projectQuery,
    teamQuery,
    deptQuery,
    issueQuery,
    updateMentionState,
    insertMention,
    switchToMode,
    closeMention,
    ENTITY_PREFIXES,
  };
}
