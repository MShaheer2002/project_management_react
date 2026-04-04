import React from 'react';
import { Users, Plus, Search, Mail, MoreVertical, Shield, User as UserIcon } from 'lucide-react';
import { MOCK_TEAMS, MOCK_USERS } from '../constants';

import { useApp } from '../AppContext';

export const TeamsPage: React.FC = () => {
  const { setView, setActiveModal } = useApp();
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Teams</h1>
          <span className="text-xs text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
            {MOCK_TEAMS.length} teams
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveModal('create-team')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            <span>Create Team</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_TEAMS.map(team => {
            const lead = MOCK_USERS.find(u => u.id === team.leadId);
            return (
              <div 
                key={team.id}
                className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm hover:border-primary/50 transition-all group"
              >
                <div className="p-5 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Users size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold">{team.name}</h3>
                        <p className="text-xs text-gray-400">{team.memberIds.length} members</p>
                      </div>
                    </div>
                    <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Team Lead</div>
                    <div className="flex items-center gap-2">
                      <img src={lead?.avatar} className="w-6 h-6 rounded-full" alt={lead?.name} />
                      <span className="text-sm">{lead?.name}</span>
                      <Shield size={12} className="text-primary" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Members</div>
                    <div className="flex -space-x-2">
                      {team.memberIds.map(id => {
                        const member = MOCK_USERS.find(u => u.id === id);
                        return (
                          <img 
                            key={id} 
                            src={member?.avatar} 
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-card-dark" 
                            alt={member?.name} 
                          />
                        );
                      })}
                      <button className="w-8 h-8 rounded-full border-2 border-white dark:border-card-dark bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div 
                  onClick={() => setView('team-detail')}
                  className="px-5 py-3 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-border-dark flex items-center justify-between cursor-pointer"
                >
                  <span className="text-xs text-gray-400">{team.projectIds.length} active projects</span>
                  <button className="text-xs text-primary font-bold hover:underline">View Team</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
