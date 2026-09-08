import React, { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { Columns2, Code2, Download, Eye, ExternalLink, Loader2, X } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useResolvedTheme } from '@shared/hooks/useResolvedTheme';
import { ensureSyntaxLanguagesRegistered, SyntaxHighlighter } from '../syntaxLanguages';
import { parseCsv } from '../utils';

interface DocumentPreviewProps {
  name: string;
  fileName: string;
  mimeType: string;
  url: string | null;
  isLoading: boolean;
  onClose: () => void;
  onOpenExternal: () => void;
  onDownload: () => void;
}

type PreviewKind = 'pdf' | 'image' | 'markdown' | 'csv' | 'docx' | 'spreadsheet' | 'text' | 'unsupported';

const classifyPreview = (mimeType: string, fileName: string): PreviewKind => {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

  if (mimeType === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'text/markdown' || ext === 'md' || ext === 'markdown') return 'markdown';
  if (mimeType === 'text/csv' || ext === 'csv') return 'csv';
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) return 'docx';
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    ext === 'xlsx' ||
    ext === 'xls'
  ) return 'spreadsheet';
  if (mimeType === 'text/plain' || ext === 'txt') return 'text';
  // Legacy binary .doc and .ppt/.pptx have no viable lightweight client-side
  // renderer — no library covers them without a server-side conversion step.
  return 'unsupported';
};

/** Wide, dense content (markdown split view, tables, code) gets more room than a plain image/text file. */
const isWidePreview = (kind: PreviewKind) =>
  kind === 'markdown' || kind === 'csv' || kind === 'docx' || kind === 'spreadsheet';

const DataTable: React.FC<{ rows: string[][] }> = ({ rows }) => {
  if (rows.length === 0) {
    return <p className="p-6 text-sm text-gray-400">This file has no rows.</p>;
  }
  const [header, ...body] = rows;
  return (
    <div className="overflow-auto p-4">
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-gray-50 dark:bg-white/5">
          <tr>
            {header.map((cell, i) => (
              <th key={i} className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 dark:border-border-dark dark:text-gray-200">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="odd:bg-white even:bg-gray-50/50 dark:odd:bg-transparent dark:even:bg-white/[0.02]">
              {row.map((cell, ci) => (
                <td key={ci} className="border-b border-gray-100 px-3 py-1.5 text-gray-700 dark:border-border-dark/50 dark:text-gray-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CodeBlock: React.FC<{ language: string; children: string; isDark: boolean }> = ({ language, children, isDark }) => {
  ensureSyntaxLanguagesRegistered();
  return (
    <SyntaxHighlighter
      language={language}
      style={isDark ? oneDark : oneLight}
      PreTag="div"
      customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '12.5px' }}
    >
      {children}
    </SyntaxHighlighter>
  );
};

const MarkdownRendered: React.FC<{ content: string; isDark: boolean }> = ({ content, isDark }) => (
  <div className="prose-preview p-6 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        code(props) {
          const { children, className } = props;
          const match = /language-(\w+)/.exec(className || '');
          const text = String(children).replace(/\n$/, '');
          return match ? (
            <CodeBlock language={match[1]} isDark={isDark}>{text}</CodeBlock>
          ) : (
            <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[13px] dark:bg-white/10">{children}</code>
          );
        },
        a({ href, children }) {
          const safe = href && /^(https?:|mailto:|\/)/.test(href) ? href : undefined;
          return safe ? (
            <a href={safe} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {children}
            </a>
          ) : (
            <span>{children}</span>
          );
        },
      }}
    >
      {content}
    </Markdown>
  </div>
);

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  name,
  fileName,
  mimeType,
  url,
  isLoading,
  onClose,
  onOpenExternal,
  onDownload,
}) => {
  const previewType = useMemo(() => classifyPreview(mimeType, fileName), [mimeType, fileName]);
  const isDark = useResolvedTheme() === 'dark';

  const [textContent, setTextContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [sheets, setSheets] = useState<{ name: string; rows: string[][] }[] | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [markdownMode, setMarkdownMode] = useState<'split' | 'preview' | 'raw'>('split');

  useEffect(() => {
    setTextContent(null);
    setDocxHtml(null);
    setSheets(null);
    setContentError(null);
    setActiveSheet(0);

    if (!url) return;

    const isTextKind = previewType === 'markdown' || previewType === 'csv' || previewType === 'text';
    const isBinaryKind = previewType === 'docx' || previewType === 'spreadsheet';
    if (!isTextKind && !isBinaryKind) return;

    let cancelled = false;
    setContentLoading(true);

    if (isTextKind) {
      fetch(url)
        .then((res) => res.text())
        .then((text) => { if (!cancelled) setTextContent(text); })
        .catch(() => { if (!cancelled) setContentError('Failed to load file content.'); })
        .finally(() => { if (!cancelled) setContentLoading(false); });
      return () => { cancelled = true; };
    }

    fetch(url)
      .then((res) => res.arrayBuffer())
      .then(async (buffer) => {
        if (cancelled) return;
        if (previewType === 'docx') {
          // mammoth's browser bundle is a CJS/UMD build — depending on the
          // bundler's interop, its API lands on the module namespace itself
          // or on `.default`.
          const mod = (await import('mammoth/mammoth.browser')) as unknown as Record<string, unknown>;
          const mammoth = (typeof mod.convertToHtml === 'function' ? mod : mod.default) as {
            convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
          };
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
          if (!cancelled) setDocxHtml(DOMPurify.sanitize(result.value));
        } else {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(buffer, { type: 'array' });
          const parsedSheets = workbook.SheetNames.map((sheetName) => ({
            name: sheetName,
            rows: (XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, blankrows: false }) as unknown[][])
              .map((row) => row.map((cell) => (cell == null ? '' : String(cell)))),
          }));
          if (!cancelled) setSheets(parsedSheets);
        }
      })
      .catch(() => { if (!cancelled) setContentError('Failed to open this file.'); })
      .finally(() => { if (!cancelled) setContentLoading(false); });

    return () => { cancelled = true; };
  }, [url, previewType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const showLoadingBody = isLoading || contentLoading;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`relative flex h-[85vh] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-border-dark dark:bg-card-dark ${
          isWidePreview(previewType) ? 'max-w-6xl' : 'max-w-4xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-border-dark/40">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold">{name}</h3>
            <p className="text-[11px] text-gray-400">{fileName}</p>
          </div>
          <div className="flex items-center gap-1">
            {previewType === 'markdown' && !showLoadingBody && textContent !== null && (
              <div className="mr-2 flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-white/5">
                <button
                  onClick={() => setMarkdownMode('raw')}
                  title="Raw source"
                  className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${markdownMode === 'raw' ? 'bg-white text-primary shadow-sm dark:bg-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Code2 size={13} />
                </button>
                <button
                  onClick={() => setMarkdownMode('split')}
                  title="Split view"
                  className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${markdownMode === 'split' ? 'bg-white text-primary shadow-sm dark:bg-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Columns2 size={13} />
                </button>
                <button
                  onClick={() => setMarkdownMode('preview')}
                  title="Preview"
                  className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${markdownMode === 'preview' ? 'bg-white text-primary shadow-sm dark:bg-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Eye size={13} />
                </button>
              </div>
            )}
            {sheets && sheets.length > 1 && (
              <div className="mr-2 flex items-center gap-1 overflow-x-auto">
                {sheets.map((sheet, i) => (
                  <button
                    key={sheet.name}
                    onClick={() => setActiveSheet(i)}
                    className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                      activeSheet === i ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {sheet.name}
                  </button>
                ))}
              </div>
            )}
            <button onClick={onOpenExternal} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-primary" title="Open in new tab">
              <ExternalLink size={15} />
            </button>
            <button onClick={onDownload} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-primary" title="Download">
              <Download size={15} />
            </button>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200" title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {showLoadingBody ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              <Loader2 size={18} className="mr-2 animate-spin" /> Loading preview...
            </div>
          ) : !url ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Could not load preview.
            </div>
          ) : contentError ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">{contentError}</div>
          ) : previewType === 'pdf' ? (
            <iframe src={url} className="h-full w-full" title={name} />
          ) : previewType === 'image' ? (
            <div className="flex h-full items-center justify-center p-6">
              <img src={url} alt={name} className="max-h-full max-w-full rounded-lg object-contain" />
            </div>
          ) : previewType === 'markdown' && textContent !== null ? (
            markdownMode === 'raw' ? (
              <pre className="whitespace-pre-wrap p-6 font-mono text-[13px] leading-6 text-gray-700 dark:text-gray-300">{textContent}</pre>
            ) : markdownMode === 'preview' ? (
              <MarkdownRendered content={textContent} isDark={isDark} />
            ) : (
              <div className="grid h-full grid-cols-2 divide-x divide-gray-100 dark:divide-border-dark">
                <pre className="overflow-auto whitespace-pre-wrap p-6 font-mono text-[13px] leading-6 text-gray-700 dark:text-gray-300">{textContent}</pre>
                <div className="overflow-auto"><MarkdownRendered content={textContent} isDark={isDark} /></div>
              </div>
            )
          ) : previewType === 'csv' && textContent !== null ? (
            <DataTable rows={parseCsv(textContent)} />
          ) : previewType === 'docx' && docxHtml !== null ? (
            <div
              className="docx-preview p-6 text-sm leading-relaxed text-gray-800 dark:text-gray-200"
              dangerouslySetInnerHTML={{ __html: docxHtml }}
            />
          ) : previewType === 'spreadsheet' && sheets !== null ? (
            <DataTable rows={sheets[activeSheet]?.rows ?? []} />
          ) : previewType === 'text' && textContent !== null ? (
            <pre className="whitespace-pre-wrap p-6 font-mono text-[13px] leading-6 text-gray-700 dark:text-gray-300">{textContent}</pre>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-gray-400">Preview not available for this file type.</p>
              <button onClick={onOpenExternal} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white">
                <ExternalLink size={13} /> Open in new tab
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
