import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Layers,
  Calendar,
  ArrowRight,
  Plus,
  Inbox,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
// import { MOCK_ISSUES, MOCK_PROJECTS, STATUS_LABELS, PRIORITY_COLORS } from '../constants';
// import { Issue } from '../types';
// import { getStoredIssues } from '../lib/issue-storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

/**
 * DashboardPage — /dashboard
 *
 * Shows workspace overview: stats, charts, assigned issues, activity, projects, deadlines.
 *
 * MOCK DATA REMOVED — this page now shows empty states.
 * TODO: Replace with real API calls:
 *   - GET /dashboard/stats (or compute from GET /issues)
 *   - GET /issues?assignee=me&status!=done (assigned to me)
 *   - GET /projects (active projects)
 *   - GET /activity (recent activity)
 *
 * All UI layout, charts, animations, and styling are preserved.
 * Only the data source changes from MOCK_* to API hooks.
 */

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; trend?: string }> = ({ label, value, icon, trend }) => (
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
const EmptyState: React.FC<{ message: string; icon?: React.ReactNode }> = ({ message, icon }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3 text-gray-300 dark:text-gray-600">
      {icon || <Inbox size={24} />}
    </div>
    <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
  </div>
);

// Chart placeholder data — will come from API (GET /dashboard/velocity or similar)
const chartData = [
  { name: 'Mon', completed: 0, open: 0 },
  { name: 'Tue', completed: 0, open: 0 },
  { name: 'Wed', completed: 0, open: 0 },
  { name: 'Thu', completed: 0, open: 0 },
  { name: 'Fri', completed: 0, open: 0 },
  { name: 'Sat', completed: 0, open: 0 },
  { name: 'Sun', completed: 0, open: 0 },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);

  // TODO: Replace these with real API data via TanStack Query hooks:
  //   const { data: stats } = useDashboardStats();
  //   const { data: myIssues } = useMyIssues();
  //   const { data: projects } = useProjects();
  //   const { data: activity } = useRecentActivity();
  const issues: any[] = [];       // TODO: from useMyIssues()
  const projects: any[] = [];     // TODO: from useProjects()

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
        <StatCard label="Issues Completed" value={0} icon={<CheckCircle2 size={20} />} />
        <StatCard label="Active Projects" value={projects.length} icon={<Layers size={20} />} />
        <StatCard label="Team Members" value={0} icon={<Users size={20} />} />
        <StatCard label="Open Issues" value={0} icon={<AlertCircle size={20} />} />
      </div>

      {/* Charts Section — empty charts ready for real data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">Velocity Overview</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
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
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
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

      {/* Recent Activity & Projects — empty states */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned to me — empty until API connected */}
          <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Assigned to me</h3>
              <button onClick={() => navigate('/issues/my')} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                View all <ArrowRight size={12} />
              </button>
            </div>
            {issues.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-border-dark">
                {/* TODO: Map over real issues here */}
              </div>
            ) : (
              <EmptyState message="No issues assigned to you yet." icon={<CheckCircle2 size={24} />} />
            )}
          </div>

          {/* Team activity — empty until API connected */}
          <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Team Activity</h3>
              <button onClick={() => navigate('/activity')} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                View all <ArrowRight size={12} />
              </button>
            </div>
            <EmptyState message="No recent activity." icon={<Clock size={24} />} />
          </div>
        </div>

        <div className="space-y-6">
          {/* Active projects — empty until API connected */}
          <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Active Projects</h3>
            </div>
            {projects.length > 0 ? (
              <div className="p-4 space-y-4">
                {/* TODO: Map over real projects here */}
              </div>
            ) : (
              <EmptyState message="No active projects." icon={<Layers size={24} />} />
            )}
          </div>

          {/* Upcoming deadlines — empty until API connected */}
          <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Upcoming Deadlines</h3>
              <Calendar size={14} className="text-gray-400" />
            </div>
            <EmptyState message="No upcoming deadlines." icon={<Calendar size={24} />} />
          </div>
        </div>
      </div>
    </div>
  );
};
