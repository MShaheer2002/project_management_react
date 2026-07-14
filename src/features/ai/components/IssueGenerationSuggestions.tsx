import React from 'react';
import { AlertCircle, Sparkles, Tags, UserRound } from 'lucide-react';
import type { AiDraftSuggestion, AiGeneratedIssue } from '../types';

type PreviewSuggestion = AiGeneratedIssue['previewSuggestions'][number] | AiDraftSuggestion;

const confidenceLabel = (confidence: number | null) => {
  if (typeof confidence !== 'number') return null;
  return `${Math.max(0, Math.min(100, Math.round(confidence * 100)))}%`;
};

const labelsFromPayload = (payload: Record<string, unknown>) =>
  Array.isArray(payload.labels)
    ? (payload.labels as Array<{ name?: string }>).map((label) => label.name).filter(Boolean) as string[]
    : [];

const duplicatesFromPayload = (payload: Record<string, unknown>) =>
  Array.isArray(payload.matches)
    ? payload.matches as Array<{ issueId?: string; title?: string; similarity?: number }>
    : [];

const candidatesFromPayload = (payload: Record<string, unknown>) =>
  Array.isArray(payload.candidates)
    ? payload.candidates as Array<{ userId?: string; name?: string; score?: number }>
    : [];

const iconForType = (type: PreviewSuggestion['type']) => {
  switch (type) {
    case 'LABEL':
      return <Tags size={15} className="text-primary" />;
    case 'ASSIGNEE':
      return <UserRound size={15} className="text-primary" />;
    case 'DUPLICATE':
    default:
      return <AlertCircle size={15} className="text-primary" />;
  }
};

const suggestionMeta = (suggestion: PreviewSuggestion) => {
  const confidence = confidenceLabel(suggestion.confidence);

  switch (suggestion.type) {
    case 'ASSIGNEE':
      return [confidence ? `${confidence} match` : null, 'project fit and workload'].filter(Boolean).join(' · ');
    case 'LABEL':
      return [confidence ? `${confidence} match` : null, 'title and description'].filter(Boolean).join(' · ');
    case 'DUPLICATE':
    default:
      return [confidence ? `${confidence} similar` : null, 'related issue found'].filter(Boolean).join(' · ');
  }
};

export const IssueGenerationSuggestions: React.FC<{
  suggestions: Array<PreviewSuggestion>;
  isLoading?: boolean;
  onApplyLabel?: (labelName: string) => void;
  onApplyAssignee?: (userId: string) => void;
  selectedLabelNames?: string[];
  selectedAssigneeId?: string;
}> = ({
  suggestions,
  isLoading = false,
  onApplyLabel,
  onApplyAssignee,
  selectedLabelNames = [],
  selectedAssigneeId,
}) => {
  if (!isLoading && !suggestions.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-primary" />
        <p className="text-sm font-semibold text-gray-900 dark:text-white">AI suggestions</p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
            <span>Analyzing draft</span>
            <span>Preparing suggestions</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
          </div>
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <div className="divide-y divide-gray-200 border-y border-gray-200 dark:divide-white/10 dark:border-white/10">
          {suggestions.map((suggestion, index) => {
            const labels = labelsFromPayload(suggestion.payload);
            const duplicates = duplicatesFromPayload(suggestion.payload);
            const candidates = candidatesFromPayload(suggestion.payload);

            return (
              <div key={`${suggestion.type}-${index}`} className="py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10">
                    {iconForType(suggestion.type)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{suggestion.title}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{suggestionMeta(suggestion)}</p>
                    </div>

                    {labels.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {labels.map((label) => {
                          const isApplied = selectedLabelNames.some((name) => name.toLowerCase() === label.toLowerCase());

                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => onApplyLabel?.(label)}
                              disabled={isApplied}
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                isApplied
                                  ? 'border-primary/20 text-primary'
                                  : 'border-gray-200 text-gray-700 hover:border-primary/30 hover:text-primary dark:border-white/10 dark:text-gray-300'
                              }`}
                            >
                              {isApplied ? `${label} added` : `Add ${label}`}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {candidates.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {candidates.map((candidate) => {
                          const isApplied = candidate.userId && candidate.userId === selectedAssigneeId;

                          return (
                            <button
                              key={candidate.userId ?? candidate.name}
                              type="button"
                              onClick={() => candidate.userId && onApplyAssignee?.(candidate.userId)}
                              disabled={!candidate.userId || isApplied}
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                isApplied
                                  ? 'border-primary/20 text-primary'
                                  : 'border-gray-200 text-gray-700 hover:border-primary/30 hover:text-primary dark:border-white/10 dark:text-gray-300'
                              }`}
                            >
                              {isApplied ? `${candidate.name} assigned` : `Assign ${candidate.name}`}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {duplicates.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {duplicates.map((match) => (
                          <a
                            key={`${match.issueId}-${match.title}`}
                            href={match.issueId ? `/issues/${match.issueId}` : undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-primary/30 hover:text-primary dark:border-white/10 dark:text-gray-300"
                          >
                            {match.issueId}
                            {typeof match.similarity === 'number' ? ` · ${Math.round(match.similarity * 100)}%` : ''}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
