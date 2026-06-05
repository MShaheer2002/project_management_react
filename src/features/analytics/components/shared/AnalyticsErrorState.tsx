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
      <AlertCircle size={32} className="mx-auto text-red-500 mb-3" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-text-primary-dark">{message}</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-text-secondary-dark">
        Check your connection and permissions, then try again.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  </div>
);
