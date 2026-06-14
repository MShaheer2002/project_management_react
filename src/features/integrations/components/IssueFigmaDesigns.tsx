import React, { useMemo } from 'react';
import { ExternalLink, Image, Loader2 } from 'lucide-react';
import { useFigmaBatchPreview, useIntegrations } from '../hooks/useIntegrationData';
import { FIGMA_URL_REGEX, PROVIDER_META } from '../types';
import type { FigmaPreview } from '../types';

interface IssueFigmaDesignsProps {
  /** Issue description HTML — scanned for Figma URLs */
  description?: string;
  /** Explicit Figma URLs from integrationRefs */
  figmaUrls?: string[];
}

const relativeTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (absSec < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
  const diffDay = Math.round(diffHr / 24);
  return rtf.format(diffDay, 'day');
};

const FigmaPreviewCard: React.FC<{ preview: FigmaPreview }> = ({
  preview,
}) => (
  <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-[#A259FF]/30 dark:border-border-dark dark:bg-card-dark">
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-white/[0.06]">
      {preview.thumbnailUrl ? (
        <img
          src={preview.thumbnailUrl}
          alt={preview.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <Image size={24} className="text-gray-300" />
      )}
    </div>
    <div className="min-w-0 flex-1 space-y-1">
      <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
        {preview.name}
      </p>
      <p className="text-[11px] text-gray-400">
        Last modified {relativeTime(preview.lastModified)}
      </p>
      <a
        href={preview.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-[#A259FF] transition-colors hover:text-[#8B3FE0] hover:underline"
      >
        Open in Figma
        <ExternalLink size={10} />
      </a>
    </div>
  </div>
);

export const IssueFigmaDesigns: React.FC<IssueFigmaDesignsProps> = ({
  description,
  figmaUrls: explicitUrls,
}) => {
  const integrationsQuery = useIntegrations();
  const isFigmaConnected = useMemo(
    () =>
      integrationsQuery.data?.some(
        (i) => i.provider === 'figma' && i.connected,
      ) ?? false,
    [integrationsQuery.data],
  );

  // Extract Figma URLs from description + explicit URLs
  const allUrls = useMemo(() => {
    const urls = new Set<string>(explicitUrls ?? []);
    if (description) {
      const matches = description.match(FIGMA_URL_REGEX);
      if (matches) matches.forEach((m) => urls.add(m));
    }
    return Array.from(urls).slice(0, 20); // Max 20 per batch
  }, [description, explicitUrls]);

  const batchQuery = useFigmaBatchPreview(allUrls, {
    enabled: isFigmaConnected && allUrls.length > 0,
  });

  // Nothing to show
  if (allUrls.length === 0) return null;

  // Figma not connected — show hint
  if (!isFigmaConnected) {
    return (
      <div className="space-y-2 border-t border-gray-100 pt-8 dark:border-border-dark">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.04]">
            <img
              src={PROVIDER_META.figma.logo}
              alt="Figma"
              className="h-4 w-4"
            />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Design
          </h3>
        </div>
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 p-4 text-sm text-gray-500 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-400">
          Connect Figma to see design previews for{' '}
          {allUrls.length} linked file{allUrls.length !== 1 ? 's' : ''}.
        </p>
      </div>
    );
  }

  // Loading
  if (batchQuery.isLoading) {
    return (
      <div className="space-y-2 border-t border-gray-100 pt-8 dark:border-border-dark">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.04]">
            <img
              src={PROVIDER_META.figma.logo}
              alt="Figma"
              className="h-4 w-4"
            />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Design
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 size={14} className="animate-spin" />
          Loading design previews...
        </div>
      </div>
    );
  }

  const previews = batchQuery.data ?? [];

  // Previews failed or empty — show plain links as fallback
  if (previews.length === 0 && (batchQuery.isError || batchQuery.isFetched)) {
    return (
      <div className="space-y-4 border-t border-gray-100 pt-8 dark:border-border-dark">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.04]">
            <img src={PROVIDER_META.figma.logo} alt="Figma" className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Design</h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {allUrls.length} file{allUrls.length !== 1 ? 's' : ''} linked
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {allUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-600 transition-all hover:border-[#A259FF]/30 hover:text-[#A259FF] dark:border-border-dark dark:bg-card-dark dark:text-gray-400"
            >
              <Image size={16} className="shrink-0 text-gray-300" />
              <span className="min-w-0 flex-1 truncate">{url}</span>
              <ExternalLink size={12} className="shrink-0 text-gray-400" />
            </a>
          ))}
          {batchQuery.isError && (
            <p className="text-[11px] text-gray-400">Preview unavailable — click to open in Figma</p>
          )}
        </div>
      </div>
    );
  }

  if (previews.length === 0) return null;

  return (
    <div className="space-y-4 border-t border-gray-100 pt-8 dark:border-border-dark">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.04]">
          <img
            src={PROVIDER_META.figma.logo}
            alt="Figma"
            className="h-4 w-4"
          />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Design
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {previews.length} file{previews.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {previews.map((preview) => (
          <FigmaPreviewCard key={preview.url} preview={preview} />
        ))}
      </div>
    </div>
  );
};
