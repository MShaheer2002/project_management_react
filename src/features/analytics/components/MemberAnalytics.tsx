import React, { useMemo, useState } from 'react';
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
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Timer,

} from 'lucide-react';
import { StatCard } from './shared/StatCard';
import { ChartCard } from './shared/ChartCard';
import { AnalyticsLoadingState } from './shared/AnalyticsLoadingState';
import { AnalyticsErrorState } from './shared/AnalyticsErrorState';
import { EmptyAnalyticsState } from './shared/EmptyAnalyticsState';
import { ExportButton } from './shared/ExportButton';
import { PeriodSelector } from './shared/PeriodSelector';
import { useMemberAnalytics } from '../hooks/useAnalyticsData';
import type { AnalyticsPeriod, HeatmapPoint, ActivityItem } from '../types';

interface MemberAnalyticsProps {
  memberId: string;
  period: AnalyticsPeriod;
  onPeriodChange: (p: AnalyticsPeriod) => void;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#1C1F2B',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
};

const PRIMARY = '#5f72ea';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${Math.floor(diffMonth / 12)}y ago`;
}

function getActivityBadgeColor(type: string): string {
  switch (type) {
    case 'created':
      return 'bg-green-500/10 text-green-500';
    case 'completed':
      return 'bg-blue-500/10 text-blue-500';
    case 'commented':
      return 'bg-yellow-500/10 text-yellow-500';
    case 'assigned':
      return 'bg-purple-500/10 text-purple-500';
    default:
      return 'bg-gray-500/10 text-gray-400';
  }
}

// ── Heatmap Component ──

interface ActivityHeatmapProps {
  data: HeatmapPoint[];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  const countMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((p) => map.set(p.date, p.count));
    return map;
  }, [data]);

  const weeks = useMemo(() => {
    if (data.length === 0) return [];

    const sortedDates = data.map((d) => d.date).sort();
    const startDate = new Date(sortedDates[0]);
    const endDate = new Date(sortedDates[sortedDates.length - 1]);

    // Adjust start to nearest Sunday before
    const adjustedStart = new Date(startDate);
    adjustedStart.setDate(adjustedStart.getDate() - adjustedStart.getDay());

    const allWeeks: string[][] = [];
    let currentWeek: string[] = [];
    const cursor = new Date(adjustedStart);

    while (cursor <= endDate) {
      const dateStr = cursor.toISOString().split('T')[0];
      currentWeek.push(dateStr);
      if (currentWeek.length === 7) {
        allWeeks.push(currentWeek);
        currentWeek = [];
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (currentWeek.length > 0) {
      allWeeks.push(currentWeek);
    }

    return allWeeks;
  }, [data]);

  function getCellColor(count: number): string {
    if (count === 0) return 'bg-gray-100 dark:bg-white/5';
    if (count <= 2) return 'bg-[#5f72ea]/20';
    if (count <= 5) return 'bg-[#5f72ea]/40';
    if (count <= 9) return 'bg-[#5f72ea]/60';
    return 'bg-[#5f72ea]/80';
  }

  return (
    <div className="relative">
      <div className="flex gap-[3px] overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((dateStr) => {
              const count = countMap.get(dateStr) ?? 0;
              return (
                <div
                  key={dateStr}
                  className={`w-3 h-3 rounded-sm ${getCellColor(count)} cursor-pointer transition-transform hover:scale-125`}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredCell({ date: dateStr, count, x: rect.left, y: rect.top });
                  }}
                  onMouseLeave={() => setHoveredCell(null)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {hoveredCell && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg text-xs text-white pointer-events-none"
          style={{
            backgroundColor: '#1C1F2B',
            left: hoveredCell.x + 16,
            top: hoveredCell.y - 8,
          }}
        >
          <div className="font-semibold">{hoveredCell.date}</div>
          <div className="text-gray-300">{hoveredCell.count} contribution{hoveredCell.count !== 1 ? 's' : ''}</div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-white/5" />
        <div className="w-3 h-3 rounded-sm bg-[#5f72ea]/20" />
        <div className="w-3 h-3 rounded-sm bg-[#5f72ea]/40" />
        <div className="w-3 h-3 rounded-sm bg-[#5f72ea]/60" />
        <div className="w-3 h-3 rounded-sm bg-[#5f72ea]/80" />
        <span>More</span>
      </div>
    </div>
  );
};

// ── Recent Activity Timeline ──

interface RecentActivityListProps {
  activities: ActivityItem[];
}

const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities }) => {
  if (activities.length === 0) {
    return <p className="text-sm text-gray-400 py-6 text-center">No recent activity</p>;
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200 dark:bg-white/10" />
      {activities.map((activity) => (
        <div key={activity.id} className="relative flex gap-4 py-3">
          {/* Dot */}
          <div className="relative z-10 flex-shrink-0 mt-1">
            <div className={`w-[10px] h-[10px] rounded-full border-2 border-white dark:border-card-dark ${
              activity.type === 'completed' ? 'bg-green-500' :
              activity.type === 'created' ? 'bg-blue-500' :
              'bg-gray-400'
            }`}
              style={{ marginLeft: '10px' }}
            />
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getActivityBadgeColor(activity.type)}`}>
                {activity.type}
              </span>
              <span className="text-[11px] text-gray-400">{formatRelativeTime(activity.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{activity.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ──

export const MemberAnalytics: React.FC<MemberAnalyticsProps> = ({
  memberId,
  period,
  onPeriodChange,
}) => {
  const { data, isLoading, isError, refetch } = useMemberAnalytics(memberId, { period });

  if (isLoading) return <AnalyticsLoadingState />;
  if (isError) return <AnalyticsErrorState onRetry={() => refetch()} />;
  if (!data) return <EmptyAnalyticsState />;

  const { summary, charts, tables } = data;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-end gap-3">
        <PeriodSelector value={period} onChange={onPeriodChange} />
        <ExportButton scope="member" scopeId={memberId} params={{ period }} />
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Assigned" value={summary.assigned} icon={<ListTodo size={20} />} />
        <StatCard label="Completed" value={summary.completed} icon={<CheckCircle2 size={20} />} />
        <StatCard label="In Progress" value={summary.inProgress} icon={<Clock size={20} />} />
        <StatCard label="Overdue" value={summary.overdue} icon={<AlertTriangle size={20} />} />
      </div>

      {/* ── Completion Rate + Avg Resolution Time ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Completion Rate"
          value={summary.completionRate.value}
          suffix="%"
          icon={<TrendingUp size={20} />}
          trend={summary.completionRate.trend}
          direction={summary.completionRate.direction}
        />
        <StatCard
          label="Avg Resolution Time"
          value={summary.avgResolutionTime.value}
          suffix={summary.avgResolutionTime.unit}
          icon={<Timer size={20} />}
          trend={summary.avgResolutionTime.trend}
          direction={summary.avgResolutionTime.direction}
        />
      </div>

      {/* ── Activity Heatmap ── */}
      <ChartCard title="Activity Heatmap">
        {charts.activityHeatmap.length > 0 ? (
          <ActivityHeatmap data={charts.activityHeatmap} />
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No activity data available</p>
        )}
      </ChartCard>

      {/* ── Breakdown Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown by Project */}
        <ChartCard title="Breakdown by Project">
          {charts.breakdownByProject.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, charts.breakdownByProject.length * 48)}>
              <BarChart
                data={charts.breakdownByProject}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis
                  type="category"
                  dataKey="projectName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#888' }}
                  width={120}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar dataKey="assigned" name="Assigned" fill={PRIMARY} radius={[0, 4, 4, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No project data available</p>
          )}
        </ChartCard>

        {/* Breakdown by Team */}
        <ChartCard title="Breakdown by Team">
          {charts.breakdownByTeam.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, charts.breakdownByTeam.length * 48)}>
              <BarChart
                data={charts.breakdownByTeam}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis
                  type="category"
                  dataKey="teamName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#888' }}
                  width={120}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar dataKey="assigned" name="Assigned" fill={PRIMARY} radius={[0, 4, 4, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No team data available</p>
          )}
        </ChartCard>
      </div>

      {/* ── Recent Activity ── */}
      <ChartCard title="Recent Activity">
        <RecentActivityList activities={tables.recentActivity} />
      </ChartCard>
    </div>
  );
};
