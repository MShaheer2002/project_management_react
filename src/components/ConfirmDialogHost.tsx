import React, { useEffect } from 'react';
import { useConfirmStore } from '@/app/stores/useConfirmStore';

/**
 * ConfirmDialogHost — renders the app's single global confirmation dialog.
 * Mounted once at the app root (see App.tsx) so it works from any page;
 * components trigger it via `confirmDialog(...)` from useConfirmStore
 * instead of the native window.confirm().
 */
export const ConfirmDialogHost: React.FC = () => {
  const request = useConfirmStore((s) => s.request);
  const resolveActive = useConfirmStore((s) => s.resolveActive);

  useEffect(() => {
    if (!request) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resolveActive(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [request, resolveActive]);

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close confirmation"
        onClick={() => resolveActive(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-border-dark dark:bg-card-dark">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{request.title}</h2>
        {request.message && (
          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{request.message}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => resolveActive(false)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {request.cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => resolveActive(true)}
            autoFocus
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors ${
              request.tone === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
