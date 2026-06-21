import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Lightweight markdown renderer for AI chat messages.
 * Handles: **bold**, *italic*, `code`, ```code blocks```, - lists,
 * ## headings, [links](url), | tables |, issue IDs (VAT-42 → clickable).
 * No external dependencies. Matches Trussen design system.
 */

type AiMarkdownProps = {
  content: string;
  className?: string;
};

// Priority color mapping
const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-500 bg-red-500/10',
  high: 'text-orange-500 bg-orange-500/10',
  medium: 'text-blue-500 bg-blue-500/10',
  low: 'text-gray-500 bg-gray-500/10',
};

// Status color mapping
const STATUS_COLORS: Record<string, string> = {
  done: 'text-green-500 bg-green-500/10',
  review: 'text-purple-500 bg-purple-500/10',
  'in progress': 'text-blue-500 bg-blue-500/10',
  'in_progress': 'text-blue-500 bg-blue-500/10',
  todo: 'text-gray-500 bg-gray-500/10',
  backlog: 'text-gray-400 bg-gray-400/10',
};

// Strip emojis — AI models love adding them but they look unprofessional
const stripEmojis = (text: string): string =>
  text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1FA00}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '').replace(/\s{2,}/g, ' ').trim();

// Strip HTML tags from AI content to prevent XSS
const stripHtml = (text: string): string =>
  text.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, '');

export const AiMarkdown: React.FC<AiMarkdownProps> = ({ content, className = '' }) => {
  const lines = content.split('\n').map((l) => stripHtml(stripEmojis(l)));
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(
        <pre key={`code-${i}`} className="my-1.5 overflow-x-auto rounded-lg bg-gray-900 p-2.5 text-[10px] leading-relaxed text-gray-200 dark:bg-black/50">
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    // Table — detect by | at start and end → render as cards (tables look bad in narrow panels)
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableRows: string[][] = [];
      let headers: string[] = [];

      while (i < lines.length && lines[i].includes('|')) {
        const row = lines[i].trim();
        if (/^\|[\s-:|]+\|$/.test(row)) { i++; continue; } // Skip separator
        const cells = row.split('|').filter((c) => c.trim() !== '').map((c) => c.trim());
        if (cells.length > 0) {
          if (headers.length === 0) { headers = cells; }
          else { tableRows.push(cells); }
        }
        i++;
      }

      if (tableRows.length > 0) {
        elements.push(
          <div key={`cards-${i}`} className="my-1.5 space-y-1.5">
            {tableRows.map((row, ri) => {
              // Find issue ID in the row
              const issueId = row.find((c) => /^[A-Z]{2,10}-\d{1,6}$/.test(c.trim()));
              // Find title — usually the longest cell or the one after ID
              const idIdx = row.findIndex((c) => /^[A-Z]{2,10}-\d{1,6}$/.test(c.trim()));
              const title = idIdx >= 0 && row[idIdx + 1] ? row[idIdx + 1] : row.find((c) => c.length > 15) ?? row[1] ?? '';

              // Extract badges from remaining cells
              const badges = row.filter((c, ci) => ci !== idIdx && c !== title && c.trim().length > 0);

              return (
                <div key={ri} className="rounded-lg border border-gray-200 bg-white p-2.5 transition-all hover:border-gray-300 dark:border-border-dark dark:bg-white/[0.02] dark:hover:border-gray-600">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {issueId && <IssueLink issueId={issueId} label={issueId} />}
                      <p className="mt-0.5 text-[11px] text-gray-700 dark:text-gray-300 leading-snug">{title}</p>
                    </div>
                  </div>
                  {badges.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {badges.map((badge, bi) => (
                        <CellBadge key={bi} value={badge} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>,
        );
      }
      continue;
    }

    // Heading
    if (line.startsWith('### ')) {
      elements.push(<p key={`h3-${i}`} className="mt-2.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{renderInline(line.slice(4))}</p>);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<p key={`h2-${i}`} className="mt-2.5 mb-1 text-[12px] font-bold text-gray-700 dark:text-gray-200">{renderInline(line.slice(3))}</p>);
      i++; continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<p key={`h1-${i}`} className="mt-2 mb-1 text-[13px] font-bold text-gray-800 dark:text-gray-100">{renderInline(line.slice(2))}</p>);
      i++; continue;
    }

    // List item
    if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && (/^[-*] /.test(lines[i]) || /^\d+\. /.test(lines[i]))) {
        const itemText = lines[i].replace(/^[-*] /, '').replace(/^\d+\. /, '');
        listItems.push(
          <li key={`li-${i}`} className="flex items-start gap-1.5 py-0.5">
            <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-gray-400 dark:bg-gray-500" />
            <span>{renderInline(itemText)}</span>
          </li>,
        );
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="my-1">{listItems}</ul>);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={`br-${i}`} className="h-1" />);
      i++; continue;
    }

    // Regular paragraph
    elements.push(<p key={`p-${i}`} className="py-0.5">{renderInline(line)}</p>);
    i++;
  }

  return <div className={className}>{elements}</div>;
};

/** Render a badge for status/priority/type values */
const CellBadge: React.FC<{ value: string }> = ({ value }) => {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  const TYPE_COLORS: Record<string, string> = { bug: 'text-red-500 bg-red-500/10', task: 'text-gray-600 bg-gray-500/10 dark:text-gray-400', issue: 'text-purple-500 bg-purple-500/10', feature: 'text-purple-500 bg-purple-500/10' };

  const colorClass = PRIORITY_COLORS[lower] ?? STATUS_COLORS[lower] ?? TYPE_COLORS[lower];

  if (lower === 'you') return <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-primary bg-primary/10">{trimmed}</span>;
  if (lower === 'unassigned') return <span className="rounded px-1.5 py-0.5 text-[9px] text-gray-400 bg-gray-400/10 italic">{trimmed}</span>;

  if (colorClass) {
    return <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${colorClass}`}>{trimmed}</span>;
  }

  // Generic badge for unknown values
  return <span className="rounded px-1.5 py-0.5 text-[9px] text-gray-500 bg-gray-100 dark:bg-white/5 dark:text-gray-400">{trimmed}</span>;
};

/** Clickable issue ID link — validates ID format before navigation */
const IssueLink: React.FC<{ issueId: string; label: string }> = ({ issueId, label }) => {
  const navigate = useNavigate();

  // Only navigate if ID matches safe pattern (e.g., FIS-5, VAT-42)
  const isSafe = /^[A-Z]{2,10}-\d{1,6}$/.test(issueId);

  if (!isSafe) return <span className="font-semibold">{label}</span>;

  return (
    <button
      type="button"
      onClick={() => navigate(`/issues/${issueId}`)}
      className="font-semibold text-primary hover:underline decoration-primary/30 cursor-pointer text-left"
    >
      {label}
    </button>
  );
};

/** Render inline markdown: **bold**, *italic*, `code`, [links](url), issue IDs */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Issue ID pattern inline (e.g., FIS-42, VAT-10)
    const issueInlineMatch = remaining.match(/^([A-Z]{2,10}-\d{1,6})/);
    if (issueInlineMatch) {
      parts.push(<IssueLinkInline key={key++} issueId={issueInlineMatch[1]} />);
      remaining = remaining.slice(issueInlineMatch[0].length);
      continue;
    }

    // Inline code
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code key={key++} className="rounded bg-gray-200/60 px-1 py-0.5 text-[10px] font-mono text-gray-700 dark:bg-white/10 dark:text-gray-300">
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Link [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline decoration-primary/30">
          {linkMatch[1]}
        </a>,
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Regular character — collect until next special char
    const nextSpecial = remaining.search(/[`*\[A-Z]{2}/);
    if (nextSpecial === -1 || nextSpecial > 100) {
      parts.push(remaining);
      break;
    }
    if (nextSpecial === 0) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

/** Inline clickable issue ID */
const IssueLinkInline: React.FC<{ issueId: string }> = ({ issueId }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/issues/${issueId}`)}
      className="font-semibold text-primary hover:underline decoration-primary/30 cursor-pointer"
    >
      {issueId}
    </button>
  );
};
