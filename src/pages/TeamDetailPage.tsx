import React, { useState } from 'react';
import { 
  Users, 
  Layers, 
  Filter, 
  Activity, 
  ChevronRight,
  Plus,
  Settings,
  Mail,
  MoreHorizontal
} from 'lucide-react';
import { MOCK_TEAMS, MOCK_USERS, MOCK_PROJECTS, MOCK_ISSUES } from '../constants';
import { IssuesPage } from './IssuesPage';
import { ActivityPage } from './ActivityPage';
import { MembersPage } from './MembersPage';

export const TeamDetailPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'projects' | 'issues' | 'activity'>('members');
  const team = MOCK_TEAMS[0]; // Mocking first team for detail
  const lead = MOCK_USERS.find(u => u.id === team.leadId);

  const tabs = [
    { id: 'members', label: 'Members', icon: <Users size={14} /> },
    { id: 'projects', label: 'Projects', icon: <Layers size={14} /> },
    { id: 'issues', label: 'Issues', icon: <Filter size={14} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={14} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'members': return <MembersPage />;
      case 'projects':
        return (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_PROJECTS.filter(p => p.teamId === team.id).map(project => (
              <div key={project.id} className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-5 shadow-sm hover:border-primary/30 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <Layers size={20} />
                  </div>
                  <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
                <h3 className="font-bold mb-1">{project.name}</h3>
                <p className="text-xs text-gray-400 mb-4 line-clamp-2">{project.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'issues': return <IssuesPage />;
      case 'activity': return <ActivityPage />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 pt-6 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <span className="hover:text-primary cursor-pointer">Teams</span>
          <ChevronRight size={12} />
          <span className="text-gray-900 dark:text-gray-100 font-medium">{team.name}</span>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center text-xl font-bold">
              {team.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Lead by</span>
                <div className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100 font-medium">
                  <img src={lead?.avatar} className="w-4 h-4 rounded-full" alt={lead?.name} />
                  {lead?.name}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg border border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <Settings size={18} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              <Plus size={16} />
              <span>Invite</span>
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
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
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
