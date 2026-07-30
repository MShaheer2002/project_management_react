import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Clock } from 'lucide-react';
import { StatCard } from './shared/StatCard';
import { ChartCard } from './shared/ChartCard';
import { AnalyticsLoadingState } from './shared/AnalyticsLoadingState';
import { AnalyticsErrorState } from './shared/AnalyticsErrorState';
import { EmptyAnalyticsState } from './shared/EmptyAnalyticsState';
import { useTeamAnalytics } from '../hooks/useAnalyticsData';
import type { AnalyticsPeriod, TeamAnalyticsData } from '../types';

interface TeamAnalyticsProps {
  teamId: string;
  period: AnalyticsPeriod;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#1C1F2B',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
};

const AXIS_TICK = { fontSize: 12, fill: '#888' };
const PRIMARY = '#5f72ea';

export const TeamAnalytics: React.FC<TeamAnalyticsProps> = ({
  teamId,
  period,
}) => {
  const { data, isLoading, isError, refetch } = useTeamAnalytics(teamId, { period });

  const analytics = data as TeamAnalyticsData | undefined;

  if (isLoading) return <AnalyticsLoadingState />;
  if (isError) return <AnalyticsErrorState onRetry={() => refetch()} />;
  if (!analytics) return <EmptyAnalyticsState title="No team data" description="Analytics will appear once the team has activity." />;

  const { summary, charts, tables } = analytics;
  const progressPct = Math.min(100, Math.max(0, summary.progress));

  return (
    <div className="space-y-6">
      {/* ── Progress Bar Hero ── */}
      <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Team Progress</h3>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {progressPct}%
          </span>
        </div>
        <div className="w-full h-4 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: PRIMARY }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>{summary.completedIssues} completed</span>
          <span>{summary.totalIssues} total</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Velocity"
          value={summary.velocity.value}
          icon={<TrendingUp size={18} />}
          trend={summary.velocity.trend}
          direction={summary.velocity.direction}
          suffix="issues/period"
        />
        <StatCard
          label="Avg Resolution Time"
          value={summary.avgResolutionTime.value}
          icon={<Clock size={18} />}
          trend={summary.avgResolutionTime.trend}
          direction={summary.avgResolutionTime.direction}
          suffix={summary.avgResolutionTime.unit}
        />
      </div>

      {/* Completion Velocity - full width */}
      <ChartCard title="Completion Velocity">
        {charts.completionVelocity.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-400">No velocity data</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
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

      {/* Workload Distribution + Completion Rate per Member */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Workload Distribution">
          {charts.workloadDistribution.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">No workload data</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, charts.workloadDistribution.length * 44)}>
              <BarChart data={charts.workloadDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} opacity={0.1} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={AXIS_TICK}
                  width={100}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={false} />
                <Legend />
                <Bar dataKey="assigned" fill="#5f72ea" radius={[0, 4, 4, 0]} name="Assigned" barSize={16} />
                <Bar dataKey="open" fill="#9CA3AF" radius={[0, 4, 4, 0]} name="Open" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Completion Rate per Member">
          {charts.completionRatePerMember.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">No completion data</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, charts.completionRatePerMember.length * 44)}>
              <BarChart data={charts.completionRatePerMember} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} opacity={0.1} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={AXIS_TICK}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={AXIS_TICK}
                  width={100}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={false}
                  formatter={(value: number) => [`${value}%`, 'Completion Rate']}
                />
                <Bar dataKey="completionRate" fill="#10B981" radius={[0, 4, 4, 0]} name="Completion Rate" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Cycle Comparison */}
      <ChartCard title="Cycle Comparison">
        {charts.cycleComparison.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-400">No cycle data</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.cycleComparison}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="cycleName" axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={false}
                formatter={(value: number, name: string) => [value, name]}
                labelFormatter={(label: string) => label}
              />
              <Legend />
              <Bar dataKey="total" fill="#9CA3AF" radius={[4, 4, 0, 0]} name="Total" barSize={14} />
              <Bar dataKey="completed" fill="#5f72ea" radius={[4, 4, 0, 0]} name="Completed" barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Member Performance Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
        <div className="px-6 py-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Member Performance</h3>
        </div>
        {tables.memberPerformance.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-gray-400">No performance data</div>
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
                {tables.memberPerformance.map((member) => (
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
