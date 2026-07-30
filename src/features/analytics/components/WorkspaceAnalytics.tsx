import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import {
  CheckCircle2,
  Clock,
  Layers,
  AlertTriangle,
  User,
  PieChart as PieChartIcon,
} from 'lucide-react';

import { useWorkspaceAnalytics } from '../hooks/useAnalyticsData';
import type { AnalyticsPeriod, GroupCountItem } from '../types';

import { StatCard } from './shared/StatCard';
import { ChartCard } from './shared/ChartCard';
import { AnalyticsLoadingState } from './shared/AnalyticsLoadingState';
import { AnalyticsErrorState } from './shared/AnalyticsErrorState';
import { EmptyAnalyticsState } from './shared/EmptyAnalyticsState';

// ── Props ──

interface WorkspaceAnalyticsProps {
  period: AnalyticsPeriod;
}

// ── Color palettes ──

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

const TYPE_COLORS: Record<string, string> = {
  TASK: '#5f72ea',
  BUG: '#EF4444',
  ISSUE: '#F59E0B',
};

// ── Shared chart config ──

const tooltipContentStyle = {
  backgroundColor: '#1C1F2B',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
};

const axisProps = {
  axisLine: false as const,
  tickLine: false as const,
  tick: { fontSize: 12, fill: '#888' },
};

// ── Helpers ──

function getGroupKey(item: GroupCountItem): string {
  const keys = Object.keys(item).filter((k) => k !== 'count');
  if (keys.length === 0) return 'unknown';
  return String(item[keys[0]]);
}

function formatLabel(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Custom pie label ──

const renderCustomLabel = (props: PieLabelRenderProps) => {
  const cx = Number(props.cx ?? 0);
  const cy = Number(props.cy ?? 0);
  const midAngle = Number(props.midAngle ?? 0);
  const innerRadius = Number(props.innerRadius ?? 0);
  const outerRadius = Number(props.outerRadius ?? 0);
  const percent = Number(props.percent ?? 0);
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

// ── Custom legend ──

const renderLegend = (colorMap: Record<string, string>) =>
  function LegendContent({ payload }: { payload?: Array<{ value: string; color: string }> }) {
    if (!payload) return null;
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {payload.map((entry) => (
          <span key={entry.value} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: colorMap[entry.value] || entry.color }}
            />
            {formatLabel(entry.value)}
          </span>
        ))}
      </div>
    );
  };

// ── Status badge ──

const statusBadgeClasses: Record<string, string> = {
  BACKLOG: 'bg-gray-100 text-gray-600 dark:bg-gray-700/40 dark:text-gray-300',
  TODO: 'bg-gray-100 text-gray-700 dark:bg-gray-600/30 dark:text-gray-300',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300',
  REVIEW: 'bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300',
  DONE: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
};

// ── Component ──

export const WorkspaceAnalytics: React.FC<WorkspaceAnalyticsProps> = ({ period }) => {
  const { data, isLoading, error, refetch } = useWorkspaceAnalytics({ period });

  const pieStatusData = useMemo(
    () =>
      data?.charts.issuesByStatus.map((item) => ({
        name: getGroupKey(item),
        value: item.count,
      })) ?? [],
    [data],
  );

  const piePriorityData = useMemo(
    () =>
      data?.charts.issuesByPriority.map((item) => ({
        name: getGroupKey(item),
        value: item.count,
      })) ?? [],
    [data],
  );

  const pieTypeData = useMemo(
    () =>
      data?.charts.issuesByType.map((item) => ({
        name: getGroupKey(item),
        value: item.count,
      })) ?? [],
    [data],
  );

  // ── Loading / Error / Empty ──

  if (isLoading) return <AnalyticsLoadingState />;
  if (error) return <AnalyticsErrorState message="Failed to load workspace analytics" onRetry={refetch} />;
  if (!data) return <EmptyAnalyticsState />;

  const { summary, charts, tables } = data;
  const openClosedTotal = summary.openVsClosed.open + summary.openVsClosed.closed;
  const openPercent = openClosedTotal > 0 ? (summary.openVsClosed.open / openClosedTotal) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Progress"
          value={summary.progress}
          suffix="%"
          icon={<PieChartIcon size={20} />}
        />
        <StatCard
          label="Tasks Completed"
          value={summary.tasksCompleted.value}
          icon={<CheckCircle2 size={20} />}
          trend={summary.tasksCompleted.trend}
          direction={summary.tasksCompleted.direction}
        />
        <StatCard
          label="Avg Resolution Time"
          value={summary.avgResolutionTime.value}
          suffix={summary.avgResolutionTime.unit}
          icon={<Clock size={20} />}
          trend={summary.avgResolutionTime.trend}
          direction={summary.avgResolutionTime.direction}
        />
        <StatCard
          label="Active Projects"
          value={summary.activeProjects.value}
          icon={<Layers size={20} />}
          trend={summary.activeProjects.trend}
          direction={summary.activeProjects.direction}
        />
        <StatCard
          label="Overdue Issues"
          value={summary.overdueIssues.value}
          icon={<AlertTriangle size={20} />}
          trend={summary.overdueIssues.trend}
          direction={summary.overdueIssues.direction}
        />
      </div>

      {/* ── Open vs Closed bar ── */}
      <div className="bg-white dark:bg-card-dark p-5 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Open vs Closed</h3>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#5f72ea]" />
              <span className="text-gray-500 dark:text-gray-400">Open {summary.openVsClosed.open}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="text-gray-500 dark:text-gray-400">Closed {summary.openVsClosed.closed}</span>
            </span>
          </div>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden flex">
          <div
            className="h-full rounded-l-full bg-[#5f72ea] transition-all duration-500"
            style={{ width: `${openPercent}%` }}
          />
          <div
            className="h-full rounded-r-full bg-[#10B981] transition-all duration-500"
            style={{ width: `${100 - openPercent}%` }}
          />
        </div>
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Velocity */}
        <ChartCard title="Completion Velocity">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.completionVelocity} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="date" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip contentStyle={tooltipContentStyle} cursor={false} />
              <Bar dataKey="created" name="Created" fill="#9CA3AF" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar dataKey="completed" name="Completed" fill="#5f72ea" radius={[4, 4, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Issues by Status */}
        <ChartCard title="Issues by Status">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                labelLine={false}
                label={renderCustomLabel}
              >
                {pieStatusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#9CA3AF'} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipContentStyle} />
              <Legend content={renderLegend(STATUS_COLORS) as unknown as React.ReactElement} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Priority - horizontal bar */}
        <ChartCard title="Issues by Priority">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={piePriorityData} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis type="number" {...axisProps} />
              <YAxis
                type="category"
                dataKey="name"
                {...axisProps}
                width={80}
                tickFormatter={formatLabel}
              />
              <Tooltip contentStyle={tooltipContentStyle} cursor={false} />
              <Bar dataKey="value" name="Issues" radius={[0, 4, 4, 0]}>
                {piePriorityData.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#9CA3AF'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Issues by Type - donut */}
        <ChartCard title="Issues by Type">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieTypeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                labelLine={false}
                label={renderCustomLabel}
              >
                {pieTypeData.map((entry) => (
                  <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#9CA3AF'} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipContentStyle} />
              <Legend content={renderLegend(TYPE_COLORS) as unknown as React.ReactElement} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Team Performance Table ── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/60 dark:bg-black/20">
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Team</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Members</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Completed</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Efficiency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
            {tables.teamPerformance.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">
                  No team performance data available.
                </td>
              </tr>
            ) : (
              tables.teamPerformance.map((team) => (
                <tr key={team.teamId} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-text-primary-dark">
                    {team.teamName}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {team.memberCount}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-text-primary-dark">
                    {team.completed}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#5f72ea] transition-all duration-500"
                          style={{ width: `${Math.min(team.efficiency, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-10 text-right">
                        {team.efficiency}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Top Contributors Table ── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/60 dark:bg-black/20">
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Contributor</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Assigned</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Completed</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Open</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Overdue</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Completion Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
            {tables.topContributors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                  No contributor data available.
                </td>
              </tr>
            ) : (
              tables.topContributors.map((c) => (
                <tr key={c.userId} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {c.avatar ? (
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <User size={14} />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-gray-900 dark:text-text-primary-dark">
                        {c.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">{c.assigned}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-text-primary-dark">{c.completed}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">{c.open}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-red-500">{c.overdue}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#10B981] transition-all duration-500"
                          style={{ width: `${Math.min(c.completionRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-10 text-right">
                        {c.completionRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Bottleneck Issues Table ── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/60 dark:bg-black/20">
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">ID</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Title</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Stuck Days</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Assignee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
            {tables.bottlenecks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  No bottleneck issues found.
                </td>
              </tr>
            ) : (
              tables.bottlenecks.map((b) => (
                <tr key={b.issueId} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-6 py-4 text-sm font-semibold text-primary">{b.publicId}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-text-primary-dark max-w-xs truncate">
                    {b.title}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        statusBadgeClasses[b.status] || 'bg-gray-100 text-gray-600 dark:bg-gray-700/40 dark:text-gray-300'
                      }`}
                    >
                      {formatLabel(b.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-red-500">{b.stuckDays}d</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {b.assignee?.name ?? <span className="text-gray-300 dark:text-gray-600">Unassigned</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
