import React from 'react';
import type { AnalyticsPeriod } from '../../types';

interface PeriodSelectorProps {
  value: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
}

const periods: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange }) => (
  <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-lg p-1">
    {periods.map((p) => (
      <button
        key={p.value}
        type="button"
        onClick={() => onChange(p.value)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
          value === p.value
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        {p.label}
      </button>
    ))}
  </div>
);
