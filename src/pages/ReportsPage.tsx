import React from 'react';
import { BarChart3, TrendingUp, Users, Layers, AlertCircle, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MOCK_ISSUES, MOCK_PROJECTS, MOCK_TEAMS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; trend: number }> = ({ label, value, icon, trend }) => (
  <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(trend)}%
      </div>
    </div>
    <div className="space-y-1">
      <h3 className="text-3xl font-bold">{value}</h3>
      <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">{label}</p>
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

const pieData = [
  { name: 'Backlog', value: 15, color: '#9CA3AF' },
  { name: 'Todo', value: 25, color: '#6B7280' },
  { name: 'In Progress', value: 30, color: '#5f72ea' },
  { name: 'Review', value: 10, color: '#8B5CF6' },
  { name: 'Done', value: 20, color: '#10B981' },
];

export const ReportsPage: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Analytics</h1>
          <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-md p-1">
            <button className="px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 rounded shadow-sm">Last 7 days</button>
            <button className="px-3 py-1 text-xs font-medium text-gray-400">Last 30 days</button>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 text-sm transition-colors">
          <span>Export Data</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Tasks Completed" value={42} icon={<CheckCircle2 size={20} />} trend={12} />
          <StatCard label="Avg. Resolution Time" value="1.2d" icon={<Clock size={20} />} trend={-5} />
          <StatCard label="Active Projects" value={MOCK_PROJECTS.length} icon={<Layers size={20} />} trend={0} />
          <StatCard label="Team Workload" value="85%" icon={<Users size={20} />} trend={8} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">Completion Velocity</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1C1F2B', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#5f72ea' }}
                    cursor={false}
                  />
                  <Bar dataKey="completed" fill="#5f72ea" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">Issue Distribution</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1C1F2B', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Team Performance</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-border-dark">
            {MOCK_TEAMS.map(team => (
              <div key={team.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {team.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{team.name}</span>
                    <span className="text-xs text-gray-400">{team.memberIds.length} members</span>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold">12</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Completed</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold">85%</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Efficiency</span>
                  </div>
                  <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '85%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
