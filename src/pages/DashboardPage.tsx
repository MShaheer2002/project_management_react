import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Layers,
  Calendar,
  ArrowRight,
  Plus,
  Inbox,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useDashboardData, type DashboardChartPoint } from '@features/dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

/**
 * DashboardPage — /dashboard
 *
 * Shows workspace overview: stats, charts, assigned issues, activity, projects, deadlines.
 *
 * Fetches one aggregate payload from GET /dashboard through the dashboard
 * feature hook. Auth and X-Workspace-Id are attached by privateApi interceptors.
 */

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend }) => (
  <div className="bg-white dark:bg-card-dark p-5 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      {trend && (
        <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <div className="space-y-1">
      <h3 className="text-2xl font-bold">{value}</h3>
      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
    </div>
  </div>
);

/**
 * Empty state component — shown when no data is available for a section.
 * Will be replaced by real data once API hooks are connected.
 */
interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, icon }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3 text-gray-300 dark:text-gray-600">
      {icon || <Inbox size={24} />}
    </div>
    <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
  </div>
);

const emptyChartData = [
  { name: 'Mon', completed: 0, open: 0 },
  { name: 'Tue', completed: 0, open: 0 },
  { name: 'Wed', completed: 0, open: 0 },
  { name: 'Thu', completed: 0, open: 0 },
  { name: 'Fri', completed: 0, open: 0 },
  { name: 'Sat', completed: 0, open: 0 },
  { name: 'Sun', completed: 0, open: 0 },
];

const normalizeChartData = (points: DashboardChartPoint[]) =>
  points.map((point) => ({
    name: point.name ?? point.date ?? '',
    completed: point.completed ?? 0,
    open: point.open ?? point.opened ?? 0,
  }));

const formatDate = (value?: string | null) => {
  if (!value) return 'No due date';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const { data, isLoading, error, refetch } = useDashboardData();

  const stats = data?.stats;
  const assignedToMe = data?.assignedToMe ?? [];
  const projects = data?.activeProjects ?? [];
  const upcomingDeadlines = data?.upcomingDeadlines ?? [];
  const teamActivity = data?.teamActivity ?? [];
  const velocityData = data?.charts.velocity.length ? normalizeChartData(data.charts.velocity) : emptyChartData;
  const sprintProgressData = data?.charts.sprintProgress.length ? normalizeChartData(data.charts.sprintProgress) : emptyChartData;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto h-full scrollbar-hide">
        <div className="h-16 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((key) => (
            <div key={key} className="h-32 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[360px] rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          <div className="h-[360px] rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <AlertCircle size={32} className="mx-auto text-red-500 mb-3" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-text-primary-dark">Failed to load dashboard</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-text-secondary-dark">
            The dashboard request did not complete. Check that the active workspace is available.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto h-full scrollbar-hide">
      {/* Header — uses real user name from Clerk */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Good morning{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-gray-400">Here's what's happening in your workspace today.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/issues/create')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Issue</span>
          </button>
        </div>
      </header>

      {/* Stats Grid — zeros until API is connected */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard label="Issues Completed" value={stats?.issuesCompleted ?? 0} icon={<CheckCircle2 size={20} />} />
        <StatCard label="Active Projects" value={stats?.activeProjects ?? projects.length} icon={<Layers size={20} />} />
        <StatCard label="Team Members" value={stats?.teamMembers ?? 0} icon={<Users size={20} />} />
        <StatCard label="Open Issues" value={stats?.openIssues ?? 0} icon={<AlertCircle size={20} />} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">Velocity Overview</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1C1F2B', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#5f72ea' }}
                />
                <Bar dataKey="completed" fill="#5f72ea" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">Sprint Progress</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sprintProgressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1C1F2B', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="open" stroke="#5f72ea" strokeWidth={3} dot={{ r: 4, fill: '#5f72ea' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Assigned to me</h3>
              <button onClick={() => navigate('/issues/my')} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                View all <ArrowRight size={12} />
              </button>
            </div>
            {assignedToMe.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-border-dark">
                {assignedToMe.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => navigate(`/issues/${issue.id}`)}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-text-primary-dark truncate">{issue.title}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-text-secondary-dark">
                          {[issue.key, issue.status, issue.priority].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{formatDate(issue.dueDate)}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState message="No issues assigned to you yet." icon={<CheckCircle2 size={24} />} />
            )}
          </div>

          <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Team Activity</h3>
              <button onClick={() => navigate('/activity')} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                View all <ArrowRight size={12} />
              </button>
            </div>
            {teamActivity.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-border-dark">
                {teamActivity.map((activity) => (
                  <div key={activity.id} className="px-6 py-4">
                    <p className="text-sm text-gray-900 dark:text-text-primary-dark">{activity.description}</p>
                    {activity.timestamp && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-text-secondary-dark">{formatDate(activity.timestamp)}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No recent activity." icon={<Clock size={24} />} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Active Projects</h3>
            </div>
            {projects.length > 0 ? (
              <div className="p-4 space-y-4">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="w-full text-left rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-text-primary-dark truncate">{project.name}</p>
                      <span className="text-xs text-gray-500 dark:text-text-secondary-dark">{project.progress ?? 0}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${project.progress ?? 0}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-text-secondary-dark">{project.issueCount ?? 0} issues</p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState message="No active projects." icon={<Layers size={24} />} />
            )}
          </div>

          <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Upcoming Deadlines</h3>
              <Calendar size={14} className="text-gray-400" />
            </div>
            {upcomingDeadlines.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-border-dark">
                {upcomingDeadlines.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => navigate(`/issues/${issue.id}`)}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-text-primary-dark truncate">{issue.title}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-text-secondary-dark">{formatDate(issue.dueDate)}</p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState message="No upcoming deadlines." icon={<Calendar size={24} />} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
