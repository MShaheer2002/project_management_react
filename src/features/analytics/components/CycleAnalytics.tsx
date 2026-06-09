import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,

} from 'lucide-react';
import { StatCard } from './shared/StatCard';
import { ChartCard } from './shared/ChartCard';
import { AnalyticsLoadingState } from './shared/AnalyticsLoadingState';
import { AnalyticsErrorState } from './shared/AnalyticsErrorState';
import { EmptyAnalyticsState } from './shared/EmptyAnalyticsState';
import { ExportButton } from './shared/ExportButton';
import { PeriodSelector } from './shared/PeriodSelector';
import { useCycleAnalytics } from '../hooks/useAnalyticsData';
import type { AnalyticsPeriod, GroupCountItem } from '../types';

interface CycleAnalyticsProps {
  cycleId: string;
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

const TYPE_COLORS = ['#5f72ea', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'];

// ── Donut Chart ──

interface DonutChartProps {
  data: GroupCountItem[];
  colorMap?: Record<string, string>;
  fallbackColors?: string[];
}

const RADIAN = Math.PI / 180;

const renderDonutLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (!percent || percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const DonutChart: React.FC<DonutChartProps> = ({ data, colorMap, fallbackColors = TYPE_COLORS }) => {
  const chartData = useMemo(() => {
    return data.map((item) => {
      const nameKey = Object.keys(item).find((k) => k !== 'count') ?? 'name';
      const name = String(item[nameKey] ?? 'Unknown');
      return { name, value: item.count };
    });
  }, [data]);

  const getColor = (name: string, index: number): string => {
    if (colorMap) {
      const upper = name.toUpperCase().replace(/\s+/g, '_');
      if (colorMap[upper]) return colorMap[upper];
      if (colorMap[name]) return colorMap[name];
    }
    return fallbackColors[index % fallbackColors.length];
  };

  if (chartData.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No data</p>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={renderDonutLabel}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={getColor(entry.name, index)} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
        {chartData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(entry.name, index) }} />
            <span>{entry.name}</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Component ──

export const CycleAnalytics: React.FC<CycleAnalyticsProps> = ({
  cycleId,
  period,
  onPeriodChange,
}) => {
  const { data, isLoading, isError, refetch } = useCycleAnalytics(cycleId, { period });

  if (isLoading) return <AnalyticsLoadingState />;
  if (isError) return <AnalyticsErrorState onRetry={() => refetch()} />;
  if (!data) return <EmptyAnalyticsState />;

  const { summary, charts } = data;
  const progressPct = Math.min(100, Math.max(0, summary.progress));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-end gap-3">
        <PeriodSelector value={period} onChange={onPeriodChange} />
        <ExportButton scope="cycle" scopeId={cycleId} params={{ period }} />
      </div>

      {/* ── Progress Bar Hero ── */}
      <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Cycle Progress</h3>
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

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Issues" value={summary.totalIssues} icon={<Layers size={20} />} />
        <StatCard label="Completed" value={summary.completedIssues} icon={<CheckCircle2 size={20} />} />
        <StatCard label="Open" value={summary.openIssues} icon={<AlertCircle size={20} />} />
        <StatCard
          label="Avg Resolution"
          value={summary.avgResolutionTime.value}
          suffix={summary.avgResolutionTime.unit}
          icon={<Clock size={20} />}
          trend={summary.avgResolutionTime.trend}
          direction={summary.avgResolutionTime.direction}
        />
      </div>

      {/* ── Burndown + Daily Velocity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Burndown */}
        <ChartCard title="Burndown">
          {charts.burndown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.burndown} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="remaining"
                  stroke={PRIMARY}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: PRIMARY }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No burndown data available</p>
          )}
        </ChartCard>

        {/* Daily Velocity */}
        <ChartCard title="Daily Velocity">
          {charts.dailyVelocity.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.dailyVelocity} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar dataKey="created" name="Created" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No velocity data available</p>
          )}
        </ChartCard>
      </div>

      {/* ── Status / Priority / Type Breakdown ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard title="Status Breakdown">
          <DonutChart data={charts.statusBreakdown} colorMap={STATUS_COLORS} />
        </ChartCard>
        <ChartCard title="Priority Breakdown">
          <DonutChart data={charts.priorityBreakdown} colorMap={PRIORITY_COLORS} />
        </ChartCard>
        <ChartCard title="Type Breakdown">
          <DonutChart data={charts.typeBreakdown} />
        </ChartCard>
      </div>
    </div>
  );
};
