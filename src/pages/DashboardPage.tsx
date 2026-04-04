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
  Plus
} from 'lucide-react';
import { useApp } from '../AppContext';
import { MOCK_ISSUES, MOCK_PROJECTS, STATUS_LABELS, PRIORITY_COLORS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

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

const chartData = [
  { name: 'Mon', completed: 4, open: 12 },
  { name: 'Tue', completed: 7, open: 10 },
  { name: 'Wed', completed: 5, open: 11 },
  { name: 'Thu', completed: 8, open: 9 },
  { name: 'Fri', completed: 12, open: 5 },
  { name: 'Sat', completed: 3, open: 6 },
  { name: 'Sun', completed: 2, open: 7 },
];

export const DashboardPage: React.FC = () => {
  const { setView, setSelectedIssueId, setActiveModal } = useApp();

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full scrollbar-hide">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Good morning, Alex</h1>
          <p className="text-sm text-gray-400">Here's what's happening in your workspace today.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveModal('create-issue')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            <span>Create Issue</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Issues Completed" value={12} icon={<CheckCircle2 size={20} />} trend="+24%" />
        <StatCard label="Active Projects" value={MOCK_PROJECTS.length} icon={<Layers size={20} />} />
        <StatCard label="Team Members" value={8} icon={<Users size={20} />} />
        <StatCard label="Open Issues" value={MOCK_ISSUES.length} icon={<AlertCircle size={20} />} trend="-12%" />
      </div>

      {/* Charts Section */}
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

      {/* Recent Activity & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Assigned to me</h3>
              <button onClick={() => setView('my-tasks')} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-border-dark">
              {MOCK_ISSUES.slice(0, 5).map(issue => (
                <div 
                  key={issue.id} 
                  onClick={() => setSelectedIssueId(issue.id)}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-2 h-2 rounded-full ${issue.priority === 'urgent' ? 'bg-red-500' : 'bg-primary'}`} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{issue.title}</span>
                      <span className="text-[10px] text-gray-400 font-mono uppercase">{issue.id} • {STATUS_LABELS[issue.status]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Team Activity</h3>
              <button onClick={() => setView('activity')} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                    <Users size={16} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-bold">Sarah Chen</span> moved <span className="font-medium text-primary">LIN-102</span> to <span className="font-medium">Done</span>
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Active Projects</h3>
            </div>
            <div className="p-4 space-y-4">
              {MOCK_PROJECTS.map(project => (
                <div key={project.id} className="space-y-2 cursor-pointer group" onClick={() => setView('project-detail')}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold group-hover:text-primary transition-colors">{project.name}</span>
                    <span className="text-xs text-gray-400">{project.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${project.progress}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Upcoming Deadlines</h3>
              <Calendar size={14} className="text-gray-400" />
            </div>
            <div className="divide-y divide-gray-100 dark:divide-border-dark">
              {MOCK_ISSUES.filter(i => i.dueDate).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()).slice(0, 4).map(issue => {
                const dueDate = new Date(issue.dueDate!);
                const today = new Date('2026-03-09T10:13:55-07:00'); // Using provided current time
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let dateLabel = '';
                let dateColor = 'text-gray-400';
                
                if (diffDays < 0) {
                  dateLabel = 'Overdue';
                  dateColor = 'text-red-500 font-bold';
                } else if (diffDays === 0) {
                  dateLabel = 'Today';
                  dateColor = 'text-orange-500 font-bold';
                } else if (diffDays === 1) {
                  dateLabel = 'Tomorrow';
                  dateColor = 'text-orange-400 font-bold';
                } else {
                  dateLabel = `In ${diffDays} days`;
                }

                const project = MOCK_PROJECTS.find(p => p.id === issue.projectId);

                return (
                  <div 
                    key={issue.id} 
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-gray-400 uppercase">{issue.id}</span>
                          <span className="text-[10px] text-gray-400">•</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase truncate">{project?.name}</span>
                        </div>
                        <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {issue.title}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-[10px] uppercase tracking-wider mb-1 ${dateColor}`}>
                          {dateLabel}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {MOCK_ISSUES.filter(i => i.dueDate).length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-xs text-gray-400">No upcoming deadlines.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
