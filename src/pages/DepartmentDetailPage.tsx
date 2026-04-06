import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Layers, 
  LayoutDashboard, 
  History, 
  Settings as SettingsIcon,
  ChevronRight,
  Plus,
  Mail,
  MoreHorizontal,
  MoreVertical,
  Shield,
  Briefcase,
  AlertCircle,
  Clock,
  Trash2,
  Table as TableIcon,
  Grid,
  ChevronDown,
  Save,
  Terminal,
  Palette,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { 
  MOCK_DEPARTMENTS, 
  MOCK_USERS, 
  MOCK_TEAMS, 
  MOCK_PROJECTS, 
  MOCK_ACTIVITIES,
  MOCK_ISSUES 
} from '../constants';
import { useApp } from '../AppContext';
import { Department, User, Team, Project, Activity } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Cell 
} from 'recharts';

const StatCard: React.FC<{ 
  label: string; 
  value: string | number; 
  icon: React.ReactNode; 
  trend?: { value: number; label: string };
  color?: string;
}> = ({ label, value, icon, trend, color = 'primary' }) => (
  <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-gray-200 dark:border-border-dark shadow-sm flex flex-col justify-between h-full">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 rounded-xl bg-${color}/10 text-${color}`} style={color.startsWith('#') ? {backgroundColor: `${color}15`, color: color} : {}}>
        {icon}
      </div>
      {trend && (
        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend.value >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
        </div>
      )}
    </div>
    <div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1 opacity-70">{label}</p>
    </div>
  </div>
);

export const DepartmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'teams' | 'projects' | 'activity' | 'settings'>('overview');

  const department = useMemo(() => MOCK_DEPARTMENTS.find(d => d.id === id), [id]);
  
  const members = useMemo(() => MOCK_USERS.filter(u => u.departmentId === id), [id]);
  const teams = useMemo(() => MOCK_TEAMS.filter(t => t.departmentId === id), [id]);
  const projects = useMemo(() => MOCK_PROJECTS.filter(p => p.departmentId === id), [id]);
  const activities = useMemo(() => MOCK_ACTIVITIES.filter(a => members.some(m => m.id === a.actorId)), [id, members]);

  // Derived Analytics Data
  const velocityData = [
    { day: 'Mon', tasks: 4, velocity: 65 },
    { day: 'Tue', tasks: 7, velocity: 72 },
    { day: 'Wed', tasks: 5, velocity: 68 },
    { day: 'Thu', tasks: 9, velocity: 85 },
    { day: 'Fri', tasks: 12, velocity: 90 },
  ];

  const workloadData = useMemo(() => {
    return teams.map(t => ({
      name: t.name,
      tasks: MOCK_ISSUES.filter(i => i.teamId === t.id).length,
      completion: Math.floor(Math.random() * 40) + 60
    }));
  }, [teams]);

  if (!department) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-red-500 mb-4 opacity-20" />
        <h2 className="text-xl font-bold mb-2">Department not found</h2>
        <button onClick={() => navigate('/departments')} className="text-primary hover:underline font-medium">Back to Departments</button>
      </div>
    );
  }

  const head = MOCK_USERS.find(u => u.id === department.headId);
  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  const isHead = currentUser?.id === department.headId;
  const canEdit = isAdmin || isHead;

  const renderOverview = () => (
    <div className="p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Resources" value={members.length} icon={<Users size={20} />} trend={{ value: 12, label: 'MoM' }} />
        <StatCard label="Active Projects" value={projects.length} icon={<Briefcase size={20} />} color="#ea5fba" />
        <StatCard label="Avg. Efficiency" value="84%" icon={<TrendingUp size={20} />} trend={{ value: 5.4, label: 'Weekly' }} color="#5fea64" />
        <StatCard label="Resource Load" value="72%" icon={<LayoutDashboard size={20} />} trend={{ value: -2, label: 'Stress Index' }} color="#eab45f" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analytics Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Department Velocity</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">Completed issues across all teams this week</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Output</span>
                </div>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityData}>
                  <defs>
                    <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5f72ea" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#5f72ea" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.05} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888', fontWeight: 700 }} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151821', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                    itemStyle={{ color: '#5f72ea', fontWeight: 800 }}
                  />
                  <Area type="monotone" dataKey="velocity" stroke="#5f72ea" strokeWidth={3} fillOpacity={1} fill="url(#colorVelocity)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-8 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider mb-8">Workload Distribution</h3>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#888" opacity={0.05} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888', fontWeight: 700 }} width={100} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#151821', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                  />
                  <Bar dataKey="tasks" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Info Section */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-8 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <AlertCircle size={12} />
              Key Details
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 opacity-50">About</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  {department.description || 'General organizational segment focusing on department-aligned strategic objectives.'}
                </p>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-border-dark">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 opacity-50">Leadership</p>
                {head ? (
                  <div className="flex items-center gap-4">
                    <img src={head.avatar} className="w-12 h-12 rounded-xl border-2 border-primary/10" alt={head.name} />
                    <div>
                      <div className="font-bold text-sm tracking-tight">{head.name}</div>
                      <div className="text-[11px] text-gray-400 font-medium">{head.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-gray-100 dark:border-border-dark rounded-xl text-center">
                    <p className="text-[11px] text-gray-400 font-bold uppercase">No head assigned</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-border-dark block">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 opacity-50">Visibility</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-border-dark">
                  <Shield size={12} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 pointer-events-none capitalize">
                    {department.visibility}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-primary flex items-center justify-between group cursor-pointer hover:bg-primary transition-all hover:text-white transform hover:-translate-y-1">
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest">Reports</h4>
              <p className="text-[10px] font-bold opacity-70">View detailed analytics</p>
            </div>
            <ArrowUpRight className="opacity-40 group-hover:opacity-100" />
          </div>
        </div>
      </div>
    </div>
  );


  const renderMembers = () => (
    <div className="p-8">
      <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-black/10 text-[10px] uppercase font-bold text-gray-400">
              <th className="px-6 py-4">Member</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Team</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
            {members.map(member => {
              const team = MOCK_TEAMS.find(t => t.id === member.teamId);
              return (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={member.avatar} className="w-8 h-8 rounded-full" alt={member.name} />
                      <div>
                        <div className="text-sm font-bold">{member.name}</div>
                        <div className="text-[11px] text-gray-400 font-medium">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-green-500 font-bold text-[10px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse transition-all" />
                      ONLINE
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                      {team?.name || 'No Team'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs capitalize text-gray-500 font-medium">{member.role.replace('-', ' ')}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeams = () => (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.length > 0 ? teams.map(team => {
        return (
          <div key={team.id} className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl overflow-hidden shadow-sm hover:border-primary/50 transition-all group flex flex-col">
            <div className="p-5 space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <Users size={20} />
                </div>
                <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal size={16} />
                </button>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">{team.name}</h4>
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex -space-x-2">
                    {team.memberIds.slice(0, 4).map(mid => {
                      const m = MOCK_USERS.find(u => u.id === mid);
                      return <img key={mid} src={m?.avatar} className="w-7 h-7 rounded-full border-2 border-white dark:border-card-dark" alt={m?.name} />;
                    })}
                    {team.memberIds.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-card-dark flex items-center justify-center text-[10px] font-bold text-gray-500">
                        +{team.memberIds.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1">{team.projectIds.length} Projects</span>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 bg-gray-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-border-dark transition-colors hover:bg-primary/5 cursor-pointer" onClick={() => navigate(`/teams/${team.id}`)}>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">View Team Details</span>
            </div>
          </div>
        );
      }) : (
        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
          <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4">
            <Users size={32} className="opacity-20" />
          </div>
          <p className="font-medium">No teams linked to this department yet.</p>
        </div>
      )}
    </div>
  );

  const renderProjects = () => (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.length > 0 ? projects.map(project => (
        <div key={project.id} className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl overflow-hidden shadow-sm hover:border-primary/50 transition-all group flex flex-col">
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <Briefcase size={20} />
              </div>
            </div>
            <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{project.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 flex-1 font-medium">{project.description}</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{project.progress}% Done</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 font-bold uppercase">{project.issueCount} Issues</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-1000"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-3 bg-gray-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-border-dark cursor-pointer hover:bg-primary/5 transition-all text-center" onClick={() => navigate(`/projects/${project.id}`)}>
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Go to Project</span>
          </div>
        </div>
      )) : (
        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
          <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4">
            <Briefcase size={32} className="opacity-20" />
          </div>
          <p className="font-medium">No projects linked to this department yet.</p>
        </div>
      )}
    </div>
  );

  const renderActivity = () => (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center gap-2">
          <History size={16} className="text-gray-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Recent Activity</h3>
        </div>
        <div className="p-6 space-y-8">
          {activities.length > 0 ? activities.map((activity, idx) => {
            const actor = MOCK_USERS.find(u => u.id === activity.actorId);
            return (
              <div key={activity.id} className="relative flex gap-4">
                {idx !== activities.length - 1 && (
                  <div className="absolute left-[13px] top-8 bottom-[-32px] w-[1px] bg-gray-100 dark:bg-border-dark" />
                )}
                <div className="w-7 h-7 shrink-0 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center z-10 border border-white dark:border-card-dark overflow-hidden">
                  <img src={actor?.avatar} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="pb-2">
                  <div className="text-sm">
                    <span className="font-bold text-gray-900 dark:text-white">{actor?.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1.5">{activity.description}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 font-medium flex items-center gap-1">
                    <Clock size={10} />
                    {activity.timestamp}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4">
                <History size={32} className="opacity-20" />
              </div>
              <p className="font-medium">No activity recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="p-8 max-w-4xl mx-auto space-y-12 pb-24">
      {/* General Settings */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">General Settings</h2>
            <p className="text-sm text-gray-400 font-medium">Manage department name, description, and leadership.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <Save size={18} />
            <span>Save Changes</span>
          </button>
        </div>
        <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-8 space-y-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Department Name</span>
              <input 
                type="text" 
                defaultValue={department.name} 
                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent dark:border-transparent px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Department Head</span>
              <div className="relative">
                <select className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm outline-none appearance-none font-bold cursor-pointer">
                  {MOCK_USERS.map(u => <option key={u.id} value={u.id} selected={u.id === department.headId}>{u.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Description</span>
            <textarea 
              defaultValue={department.description}
              rows={4}
              className="w-full bg-gray-50 dark:bg-white/5 border-none px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm leading-relaxed font-medium"
              placeholder="e.g. This department focuses on..."
            />
          </label>
        </div>
      </section>

      {/* Visibility & Access */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Visibility & Access</h2>
          <p className="text-sm text-gray-400 font-medium">Control who can see and join this department.</p>
        </div>
        <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-8 shadow-sm">
          <div className="space-y-6">
            <div 
              className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${department.visibility === 'public' ? 'border-primary bg-primary/5' : 'border-transparent bg-gray-50 dark:bg-white/5 hover:border-gray-200 dark:hover:border-white/10'}`}
              onClick={() => showToast('In a real app, this would toggle visibility', 'info')}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${department.visibility === 'public' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                <Grid size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">Public to Organization</h4>
                  {department.visibility === 'public' && <div className="w-4 h-4 rounded-full bg-primary border-4 border-white dark:border-card-dark shadow-sm" />}
                </div>
                <p className="text-xs text-gray-400 mt-1 font-medium leading-relaxed">Anyone in the workspace can see members, teams, and projects in this department.</p>
              </div>
            </div>

            <div 
              className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${department.visibility === 'private' ? 'border-primary bg-primary/5' : 'border-transparent bg-gray-50 dark:bg-white/5 hover:border-gray-200 dark:hover:border-white/10'}`}
              onClick={() => showToast('In a real app, this would toggle visibility', 'info')}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${department.visibility === 'private' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                <Shield size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">Private to Members</h4>
                  {department.visibility === 'private' && <div className="w-4 h-4 rounded-full bg-primary border-4 border-white dark:border-card-dark shadow-sm" />}
                </div>
                <p className="text-xs text-gray-400 mt-1 font-medium leading-relaxed">Only current members and admins can видеть content within this department.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Identity */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Visual Identity</h2>
          <p className="text-sm text-gray-400 font-medium">Customize how the department appears across the app.</p>
        </div>
        <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-8 space-y-8 shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4 block">Primary Color</span>
            <div className="flex flex-wrap gap-3">
              {['#5f72ea', '#ea5fba', '#5fea64', '#eab45f', '#ea5f5f', '#5feae4', '#a45fea', '#3b3b3b'].map(color => (
                <button 
                  key={color}
                  className={`w-10 h-10 rounded-xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center ${department.color === color ? 'ring-4 ring-primary/20 ring-offset-2 dark:ring-offset-card-dark' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => showToast(`Selected color: ${color}`, 'info')}
                >
                  {department.color === color && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                </button>
              ))}
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-border-dark flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <Plus size={16} className="text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4 block">Department Icon</span>
            <div className="flex flex-wrap gap-3">
              {[Building2, Terminal, Palette, Briefcase, Users, LayoutDashboard, History].map((IconComp, idx) => (
                <button 
                  key={idx}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:bg-primary/10 hover:text-primary ${idx === 0 ? 'bg-primary/10 text-primary ring-2 ring-primary/20' : 'bg-gray-50 dark:bg-white/5 text-gray-400'}`}
                >
                  <IconComp size={20} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Options */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Advanced Preferences</h2>
          <p className="text-sm text-gray-400 font-medium">Fine-tune organizational workflows for this department.</p>
        </div>
        <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Mail size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold">Automatic Membership</h4>
                <p className="text-xs text-gray-400 mt-0.5">New workspace members automatically join this department.</p>
              </div>
            </div>
            <div className="w-11 h-6 rounded-full bg-gray-200 dark:bg-gray-800 relative transition-colors group-hover:bg-gray-300 dark:group-hover:bg-gray-700">
              <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <SettingsIcon size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold">Set as Default</h4>
                <p className="text-xs text-gray-400 mt-0.5">Primary department for landing pages and initial filters.</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors ${department.isDefault ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-800'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${department.isDefault ? 'right-1' : 'left-1'}`} />
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-red-500">Danger Zone</h2>
          <p className="text-sm text-gray-400 font-medium">Critical actions that cannot be easily undone.</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold">Archive Department</h4>
              <p className="text-xs text-gray-400 mt-1 font-medium max-w-sm leading-relaxed">Temporarily disable this department. All active projects and teams will be paused.</p>
            </div>
            <button className="px-6 py-2 rounded-lg border border-red-500/20 text-red-500 text-sm font-bold hover:bg-red-500 hover:text-white transition-all">
              Archive
            </button>
          </div>
          <div className="h-[1px] bg-red-500/10" />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold">Delete Permanently</h4>
              <p className="text-xs text-gray-400 mt-1 font-medium max-w-sm leading-relaxed">Destroy all data associated with this department. Members will be unassigned.</p>
            </div>
            <button 
              onClick={() => showToast('In a real app, this would delete the department', 'info')}
              className="px-6 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
            >
              Delete
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Detail Header */}
      <header className="bg-white dark:bg-bg-dark border-b border-gray-200 dark:border-border-dark px-6 pt-6 flex-shrink-0 transition-colors">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 transition-all">
          <span onClick={() => navigate('/departments')} className="hover:text-primary cursor-pointer transition-colors font-medium">Departments</span>
          <ChevronRight size={12} />
          <span className="text-gray-900 dark:text-gray-100 font-bold">{department.name}</span>
        </div>
        
        {/* Title Area */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-xl transition-all shadow-primary/10"
              style={{ backgroundColor: department.color || '#5f72ea' }}
            >
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{department.name}</h1>
                <span className="text-[10px] h-fit px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-black uppercase text-gray-400 tracking-wider">Dept</span>
              </div>
              <p className="text-sm text-gray-400 font-medium mt-0.5 flex items-center gap-2">
                <span>Created {new Date(department.createdAt).toLocaleDateString()}</span>
                {head && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-800" />
                    <span className="flex items-center gap-1">
                      Managed by <span className="text-gray-900 dark:text-white font-bold">{head.name}</span>
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canEdit && (
              <button 
                onClick={() => setActiveTab('settings')}
                className="p-2 rounded-lg border border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 transition-all"
              >
                <SettingsIcon size={18} />
              </button>
            )}
            <button className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
              <Plus size={16} />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-8">
          {[
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
            { id: 'members', label: 'Members', icon: <Users size={14} /> },
            { id: 'teams', label: 'Teams', icon: <TableIcon size={14} /> },
            { id: 'projects', label: 'Projects', icon: <Layers size={14} /> },
            { id: 'activity', label: 'Activity', icon: <History size={14} /> },
            { id: 'settings', label: 'Settings', icon: <SettingsIcon size={14} />, hidden: !canEdit },
          ].filter(t => !t.hidden).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-4 text-sm font-medium transition-all relative ${
                activeTab === tab.id 
                  ? 'text-primary' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(95,114,234,0.5)]" 
                />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-black/10 scrollbar-hide">
        <div className="w-full mx-auto pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'members' && renderMembers()}
              {activeTab === 'teams' && renderTeams()}
              {activeTab === 'projects' && renderProjects()}
              {activeTab === 'activity' && renderActivity()}
              {activeTab === 'settings' && renderSettings()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
