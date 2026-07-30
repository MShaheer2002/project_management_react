import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { StatCard } from './shared/StatCard';
import { ChartCard } from './shared/ChartCard';
import { AnalyticsLoadingState } from './shared/AnalyticsLoadingState';
import { AnalyticsErrorState } from './shared/AnalyticsErrorState';
import { EmptyAnalyticsState } from './shared/EmptyAnalyticsState';
import { useProjectAnalytics } from '../hooks/useAnalyticsData';
import type { AnalyticsPeriod, ProjectAnalyticsData } from '../types';

interface ProjectAnalyticsProps {
  projectId: string;
  period: AnalyticsPeriod;
}

const STATUS_COLORS: Record<string, string> = {
  BACKLOG: '#9CA3AF',
  TODO: '#6B7280',
  IN_PROGRESS: '#5f72ea',
  REVIEW: '#8B5CF6',
  DONE: '#10B981',
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#EF4444',
  HIGH: '#F59E0B',
  MEDIUM: '#5f72ea',
  LOW: '#10B981',
  NONE: '#9CA3AF',
};

const TOOLTIP_STYLE = {
  backgroundColor: '#1C1F2B',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
};

const AXIS_TICK = { fontSize: 12, fill: '#888' };

const HEALTH_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  'on-track': { bg: 'bg-green-500/10', text: 'text-green-500', label: 'On Track' },
  'at-risk': { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'At Risk' },
  behind: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Behind' },
  unknown: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Unknown' },
};

const renderPieLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (!percent || percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({
  projectId,
  period,
}) => {
  const { data, isLoading, isError, refetch } = useProjectAnalytics(projectId, { period });

  const analytics = data as ProjectAnalyticsData | undefined;

  const statusData = useMemo(() => {
    if (!analytics) return [];
    return analytics.charts.statusBreakdown.map((item) => {
      const status = (item.status ?? item.name ?? item.label ?? '') as string;
      return {
        name: status.replace(/_/g, ' '),
        value: item.count,
        color: STATUS_COLORS[status.toUpperCase()] ?? '#9CA3AF',
      };
    });
  }, [analytics]);

  const priorityData = useMemo(() => {
    if (!analytics) return [];
    return analytics.charts.priorityBreakdown.map((item) => {
      const priority = (item.priority ?? item.name ?? item.label ?? '') as string;
      return {
        name: priority.replace(/_/g, ' '),
        value: item.count,
        color: PRIORITY_COLORS[priority.toUpperCase()] ?? '#9CA3AF',
      };
    });
  }, [analytics]);

  if (isLoading) return <AnalyticsLoadingState />;
  if (isError) return <AnalyticsErrorState onRetry={() => refetch()} />;
  if (!analytics) return <EmptyAnalyticsState title="No project data" description="Analytics will appear once issues are created in this project." />;

  const { summary, charts, tables } = analytics;
  const health = HEALTH_BADGE[summary.timelineHealth] ?? HEALTH_BADGE.unknown;
  const progressPct = Math.min(Math.max(summary.progress, 0), 100);
  const circumference = 2 * Math.PI * 54;
  const strokeOffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Progress Hero */}
      <div className="flex flex-col items-center gap-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-border-dark dark:bg-card-dark sm:flex-row sm:justify-center">
        <div className="relative flex items-center justify-center">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke="currentColor"
              className="text-gray-200 dark:text-white/10"
              strokeWidth="10"
            />
            <circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke="#5f72ea"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              transform="rotate(-90 64 64)"
              className="transition-all duration-700"
            />
          </svg>
          <span className="absolute text-2xl font-bold text-gray-900 dark:text-white">
            {progressPct}%
          </span>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Progress</p>
          <p className="mt-1 text-sm text-gray-400">
            {summary.completedIssues} of {summary.totalIssues} issues completed
          </p>
          <span
            className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${health.bg} ${health.text}`}
          >
            {health.label}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Issues" value={summary.totalIssues} icon={<Layers size={18} />} />
        <StatCard label="Completed" value={summary.completedIssues} icon={<CheckCircle2 size={18} />} />
        <StatCard label="Open" value={summary.openIssues} icon={<AlertCircle size={18} />} />
        <StatCard label="Scope Changes" value={summary.scopeChanges} icon={<Plus size={18} />} />
      </div>

      {/* Burndown + Velocity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Burndown">
          {charts.burndown.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">No burndown data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={charts.burndown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="remaining"
                  stroke="#5f72ea"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#5f72ea' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Completion Velocity">
          {charts.completionVelocity.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">No velocity data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={charts.completionVelocity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={false} />
                <Legend />
                <Bar dataKey="created" fill="#9CA3AF" radius={[4, 4, 0, 0]} name="Created" barSize={14} />
                <Bar dataKey="completed" fill="#5f72ea" radius={[4, 4, 0, 0]} name="Completed" barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Status + Priority Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Status Breakdown">
          {statusData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">No status data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {statusData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{value.toLowerCase()}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Priority Breakdown">
          {priorityData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">No priority data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {priorityData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{value.toLowerCase()}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Member Workload Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
        <div className="px-6 py-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Member Workload</h3>
        </div>
        {tables.memberWorkload.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-gray-400">No workload data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-gray-50/60 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:bg-black/20">
                  <th className="px-6 py-3 text-left">Member</th>
                  <th className="px-4 py-3 text-right">Assigned</th>
                  <th className="px-4 py-3 text-right">Completed</th>
                  <th className="px-4 py-3 text-right">Open</th>
                  <th className="px-4 py-3 text-right">Overdue</th>
                  <th className="px-4 py-3 text-left" style={{ minWidth: 160 }}>Completion Rate</th>
                  <th className="px-4 py-3 text-right">Avg Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
                {tables.memberWorkload.map((member) => (
                  <tr
                    key={member.userId}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      {member.assigned}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      {member.completed}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      {member.open}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <span className={member.overdue > 0 ? 'font-semibold text-red-500' : 'text-gray-700 dark:text-gray-300'}>
                        {member.overdue}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full max-w-[100px] overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${Math.min(member.completionRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {member.completionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      {member.avgResolutionHours.toFixed(1)}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
