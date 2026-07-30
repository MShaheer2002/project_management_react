import React, { useEffect, useState } from 'react';
import { Download, ExternalLink, Loader2, X } from 'lucide-react';

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

const isPreviewable = (mimeType: string, fileName: string) => {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (
    mimeType === 'text/markdown' ||
    mimeType === 'text/plain' ||
    mimeType === 'text/csv' ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.csv')
  ) return 'text';
  return null;
};

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
  const previewType = isPreviewable(mimeType, fileName);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);

  useEffect(() => {
    if (!url || previewType !== 'text') return;
    setTextLoading(true);
    fetch(url)
      .then((res) => res.text())
      .then((text) => setTextContent(text))
      .catch(() => setTextContent('Failed to load file content.'))
      .finally(() => setTextLoading(false));
  }, [url, previewType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-border-dark dark:bg-card-dark"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-border-dark/40">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold">{name}</h3>
            <p className="text-[11px] text-gray-400">{fileName}</p>
          </div>
          <div className="flex items-center gap-1">
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
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              <Loader2 size={18} className="mr-2 animate-spin" /> Loading preview...
            </div>
          ) : !url ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Could not load preview.
            </div>
          ) : previewType === 'pdf' ? (
            <iframe src={url} className="h-full w-full" title={name} />
          ) : previewType === 'image' ? (
            <div className="flex h-full items-center justify-center p-6">
              <img src={url} alt={name} className="max-h-full max-w-full rounded-lg object-contain" />
            </div>
          ) : previewType === 'text' ? (
            <div className="p-6">
              {textLoading ? (
                <div className="flex items-center text-sm text-gray-400">
                  <Loader2 size={14} className="mr-2 animate-spin" /> Loading...
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">
                  {textContent}
                </pre>
              )}
            </div>
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
