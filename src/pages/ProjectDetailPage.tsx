import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layers, 
  Settings, 
  Users, 
  Activity, 
  LayoutDashboard, 
  Kanban, 
  Map, 
  ChevronRight,
  Plus,
  Filter,
  Search,
  Trash2,
  Save,
  Edit3,
  Globe,
  Lock,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  ChevronDown,
  Upload
} from 'lucide-react';
import { MOCK_PROJECTS, MOCK_ISSUES, MOCK_USERS, STATUS_LABELS, PRIORITY_COLORS } from '../constants';
import { Issue } from '../types';
import { getStoredIssues } from '../lib/issue-storage';
import { IssuesPage } from '@/features/issues/components/IssuesPage';
import { RoadmapPage } from './RoadmapPage';
import { ActivityPage } from './ActivityPage';
import { MembersPage } from './MembersPage';
import { useApp } from '../AppContext';
import { AnimatePresence, motion } from 'motion/react';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast, setSelectedIssueId } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'board' | 'roadmap' | 'members' | 'activity' | 'settings'>('overview');
  const [storedIssues, setStoredIssues] = useState<Issue[]>([]);
  
  const project = useMemo(() => 
    MOCK_PROJECTS.find(p => p.id === id) || MOCK_PROJECTS[0], 
  [id]);

  useEffect(() => {
    setStoredIssues(getStoredIssues());
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'created_issues') {
        setStoredIssues(getStoredIssues());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const projectIssues = useMemo(() => {
    const all = [...MOCK_ISSUES, ...storedIssues];
    return all.filter(i => i.projectId === project.id);
  }, [storedIssues, project.id]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
    { id: 'issues', label: 'Issues', icon: <Filter size={14} /> },
    { id: 'board', label: 'Board', icon: <Kanban size={14} /> },
    { id: 'roadmap', label: 'Roadmap', icon: <Map size={14} /> },
    { id: 'members', label: 'Members', icon: <Users size={14} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={14} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="p-8 space-y-8 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{project.description}</p>
                </div>

                <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Recent Issues</h3>
                  <div className="divide-y divide-gray-100 dark:divide-border-dark">
                    {projectIssues.slice(0, 3).map(issue => (
                      <div 
                        key={issue.id} 
                        onClick={() => setSelectedIssueId(issue.id)}
                        className="py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer rounded-lg px-2 -mx-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-gray-400">{issue.id}</span>
                          <span className="text-sm font-medium">{issue.title}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400">{issue.status}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab('issues')} className="w-full mt-4 py-2 text-xs font-bold text-primary hover:underline">View all issues</button>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Progress</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{project.progress}%</span>
                      <span className="text-xs text-gray-400">{projectIssues.length} issues</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Team</h3>
                  <div className="flex -space-x-2">
                    {MOCK_USERS.map(user => (
                      <img key={user.id} src={user.avatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-card-dark" alt={user.name} />
                    ))}
                    <button className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-card-dark flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'issues': return <IssuesPage projectId={project.id} />;
      case 'board': return <IssuesPage projectId={project.id} initialViewMode="kanban" />;
      case 'roadmap': return <RoadmapPage />;
      case 'members': return <MembersPage />;
      case 'activity': return <ActivityPage />;
      case 'settings': return <ProjectSettings project={project} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 pt-6 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <span onClick={() => navigate('/projects')} className="hover:text-primary cursor-pointer">Projects</span>
          <ChevronRight size={12} />
          <span className="text-gray-900 dark:text-gray-100 font-medium">{project.name}</span>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Layers size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-sm text-gray-400">Updated {new Date(project.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg border border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <Plus size={18} />
            </button>
            <button 
              onClick={() => navigate('/issues/create')}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              New Issue
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all relative ${
                activeTab === tab.id 
                  ? 'text-primary' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-black/10">
        {renderTabContent()}
      </div>
    </div>
  );
};

const ProjectSettings: React.FC<{ project: any }> = ({ project }) => {
  const { showToast } = useApp();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Project settings updated');
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      {/* General Settings */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">General Settings</h2>
            <p className="text-sm text-gray-400">Manage your project's basic information and identity.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            <span>Save Changes</span>
          </button>
        </div>

        <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <Layers size={32} />
              </div>
              <button className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Upload size={20} />
              </button>
            </div>
            <div className="flex-1 space-y-4">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Project Name</span>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </label>
            </div>
          </div>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Project Description</span>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-32 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-6">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Project Lead</span>
              <div className="relative">
                <select className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 text-sm outline-none appearance-none">
                  {MOCK_USERS.map(u => <option key={u.id}>{u.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Visibility</span>
              <div className="relative">
                <select className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 text-sm outline-none appearance-none">
                  <option>Public to Workspace</option>
                  <option>Private to Members</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Workflow Settings */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Workflow Settings</h2>
          <p className="text-sm text-gray-400">Manage issue statuses and workflow for this project.</p>
        </div>
        <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-100 dark:divide-border-dark">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400"><Edit3 size={14} /></button>
                  <button className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            <button className="w-full p-4 text-sm font-bold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
              <Plus size={16} />
              Add Custom Status
            </button>
          </div>
        </div>
      </section>

      {/* Permissions */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Permissions</h2>
          <p className="text-sm text-gray-400">Control who can perform specific actions within this project.</p>
        </div>
        <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-2xl p-6 space-y-6 shadow-sm">
          {[
            { label: 'Create Issues', desc: 'Who can create new issues in this project', role: 'Any Member' },
            { label: 'Edit Issues', desc: 'Who can edit existing issues', role: 'Assignee or Lead' },
            { label: 'Manage Settings', desc: 'Who can change project settings', role: 'Project Lead' }
          ].map((perm, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">{perm.label}</h4>
                <p className="text-xs text-gray-400">{perm.desc}</p>
              </div>
              <div className="relative">
                <select className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark rounded-lg px-3 py-1.5 text-xs outline-none appearance-none pr-8">
                  <option>{perm.role}</option>
                  <option>Admins Only</option>
                  <option>Everyone</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-red-500">Danger Zone</h2>
          <p className="text-sm text-gray-400">Irreversible actions for this project.</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold">Archive Project</h4>
              <p className="text-xs text-gray-400">Mark this project as inactive. It will be hidden from the main view.</p>
            </div>
            <button className="px-4 py-2 rounded-lg border border-red-500/20 text-red-500 text-sm font-bold hover:bg-red-500 hover:text-white transition-all">
              Archive
            </button>
          </div>
          <div className="h-[1px] bg-red-500/10" />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold">Delete Project</h4>
              <p className="text-xs text-gray-400">Permanently remove this project and all its data. This cannot be undone.</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
              Delete Permanently
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
