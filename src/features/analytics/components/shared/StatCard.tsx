import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { TrendDirection } from '../../types';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  direction?: TrendDirection;
  suffix?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, direction, suffix }) => {
  const trendColor =
    direction === 'up' ? 'text-green-500 bg-green-500/10' :
    direction === 'down' ? 'text-red-500 bg-red-500/10' :
    'text-gray-400 bg-gray-400/10';

  const TrendIcon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;

  return (
    <div className="bg-white dark:bg-card-dark p-5 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        {trend !== undefined && direction && (
          <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${trendColor}`}>
            <TrendIcon size={12} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-text-primary-dark">
          {value}{suffix && <span className="text-sm font-medium text-gray-400 ml-1">{suffix}</span>}
        </h3>
        <p className="text-[10px] text-gray-400 uppercase tracking-[0.16em] font-bold">{label}</p>
      </div>
    </div>
  );
};
