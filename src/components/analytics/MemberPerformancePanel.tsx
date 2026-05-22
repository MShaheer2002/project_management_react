import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle2, Clock, ListTodo, Users } from 'lucide-react';
import type { MemberPerformanceRow } from '@shared/analytics/memberPerformance';

type MemberPerformancePanelProps = {
  title: string;
  subtitle: string;
  rows: MemberPerformanceRow[];
  emptyTitle: string;
  emptyDescription: string;
  unassignedCount?: number;
};

const SummaryCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
    </div>
    <div className="space-y-1">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
    </div>
  </div>
);

export const MemberPerformancePanel: React.FC<MemberPerformancePanelProps> = ({
  title,
  subtitle,
  rows,
  emptyTitle,
  emptyDescription,
  unassignedCount = 0,
}) => {
  const summary = useMemo(() => {
    const totalAssigned = rows.reduce((sum, row) => sum + row.totalAssigned, 0);
    const completedCount = rows.reduce((sum, row) => sum + row.completedCount, 0);
    const activeCount = rows.reduce((sum, row) => sum + row.activeCount, 0);
    const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

    return {
      totalAssigned,
      completedCount,
      activeCount,
      completionRate,
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Assigned" value={summary.totalAssigned} icon={<ListTodo size={18} />} />
        <SummaryCard label="Completed" value={summary.completedCount} icon={<CheckCircle2 size={18} />} />
        <SummaryCard label="Active" value={summary.activeCount} icon={<Clock size={18} />} />
        <SummaryCard label="Completion" value={`${summary.completionRate}%`} icon={<Users size={18} />} />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 dark:border-border-dark md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 dark:bg-gray-800 dark:text-gray-300">
              {rows.length} members
            </span>
            {unassignedCount > 0 && (
              <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-300">
                {unassignedCount} unassigned
              </span>
            )}
          </div>
        </div>

        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50/60 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:bg-black/10">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Assigned</th>
                  <th className="px-6 py-4">Completed</th>
                  <th className="px-6 py-4">Open</th>
                  <th className="px-6 py-4">Overdue</th>
                  <th className="px-6 py-4">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
                {rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {row.avatar ? (
                          <img src={row.avatar} className="h-9 w-9 rounded-full" alt={row.name} />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <span className="text-sm font-bold">{row.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{row.name}</p>
                            {row.roleLabel && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                                {row.roleLabel}
                              </span>
                            )}
                          </div>
                          {row.email && <p className="truncate text-[11px] font-medium text-gray-400">{row.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">{row.totalAssigned}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-300">{row.completedCount}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600 dark:text-blue-300">
                      {row.activeCount + row.queuedCount}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-600 dark:text-red-300">{row.overdueCount}</td>
                    <td className="px-6 py-4">
                      <div className="min-w-[140px]">
                        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-300">
                          <span>{row.completionRate}%</span>
                          <span>{row.completedCount}/{row.totalAssigned || 0}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${row.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5">
              <AlertCircle size={28} />
            </div>
            <h4 className="text-lg font-bold">{emptyTitle}</h4>
            <p className="mt-2 max-w-sm text-sm text-gray-400">{emptyDescription}</p>
          </div>
        )}
      </div>
    </div>
  );
};
