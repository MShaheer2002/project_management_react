import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AnalyticsErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const AnalyticsErrorState: React.FC<AnalyticsErrorStateProps> = ({
  message = 'Failed to load analytics data',
  onRetry,
}) => (
  <div className="flex items-center justify-center py-20">
    <div className="max-w-md text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10">
        <AlertCircle size={28} className="text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{message}</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-text-secondary-dark">
        Check your connection and permissions, then try again.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          Retry
        </button>
      )}
    </div>
  </div>
);
