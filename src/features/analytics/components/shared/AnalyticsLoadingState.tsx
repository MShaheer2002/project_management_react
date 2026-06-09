import React from 'react';

const shimmer = 'animate-pulse bg-gray-200 dark:bg-white/[0.06] rounded';

export const AnalyticsLoadingState: React.FC = () => (
  <div className="space-y-6">
    {/* Stat card skeletons */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((key) => (
        <div
          key={key}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`h-9 w-9 rounded-lg ${shimmer}`} />
            <div className={`h-5 w-14 rounded-full ${shimmer}`} />
          </div>
          <div className="space-y-2">
            <div className={`h-7 w-20 ${shimmer}`} />
            <div className={`h-3 w-28 ${shimmer}`} />
          </div>
        </div>
      ))}
    </div>

    {/* Open/closed bar skeleton */}
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
      <div className="flex items-center justify-between mb-3">
        <div className={`h-4 w-28 ${shimmer}`} />
        <div className={`h-4 w-36 ${shimmer}`} />
      </div>
      <div className={`h-3 w-full rounded-full ${shimmer}`} />
    </div>

    {/* Chart card skeletons */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map((key) => (
        <div
          key={key}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark"
        >
          <div className={`h-4 w-36 mb-4 ${shimmer}`} />
          <div className={`h-[240px] w-full rounded-lg ${shimmer}`} />
        </div>
      ))}
    </div>

    {/* Table skeleton */}
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
      {/* Header row */}
      <div className="flex gap-4 px-6 py-4 bg-gray-50/60 dark:bg-black/20">
        {[1, 2, 3, 4].map((key) => (
          <div key={key} className={`h-3 w-24 ${shimmer}`} />
        ))}
      </div>
      {/* Body rows */}
      {[1, 2, 3].map((row) => (
        <div key={row} className="flex gap-4 px-6 py-4 border-t border-gray-100 dark:border-border-dark">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className={`h-4 w-24 ${shimmer}`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);
