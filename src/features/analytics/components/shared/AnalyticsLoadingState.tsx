import React from 'react';

export const AnalyticsLoadingState: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((key) => (
        <div key={key} className="h-32 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-[360px] rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
      <div className="h-[360px] rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
    </div>
    <div className="h-[300px] rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
  </div>
);
