import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, children, className = '', action }) => (
  <div className={`bg-white dark:bg-card-dark p-6 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm ${className}`}>
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);
