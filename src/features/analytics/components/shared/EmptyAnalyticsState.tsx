import React from 'react';
import { BarChart3 } from 'lucide-react';

interface EmptyAnalyticsStateProps {
  title?: string;
  description?: string;
}

export const EmptyAnalyticsState: React.FC<EmptyAnalyticsStateProps> = ({
  title = 'No data available',
  description = 'Analytics data will appear here once there is enough activity in the workspace.',
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 text-gray-300 dark:text-gray-600">
      <BarChart3 size={28} />
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-text-primary-dark">{title}</h3>
    <p className="mt-2 max-w-sm text-sm text-gray-400">{description}</p>
  </div>
);
