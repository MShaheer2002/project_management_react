import React, { useState } from 'react';
import { History, Filter, Search, MoreHorizontal, User, MessageSquare, Plus, CheckCircle2, Layers, Users } from 'lucide-react';
import { MOCK_ACTIVITIES, MOCK_USERS } from '../constants';
import { Activity } from '../types';

interface ActivityPageProps {
  activities?: Activity[];
  title?: string;
}

export const ActivityPage: React.FC<ActivityPageProps> = ({ activities = MOCK_ACTIVITIES, title = 'Activity' }) => {
  const [search, setSearch] = useState('');

  const filteredActivities = activities.filter(activity => 
    activity.description.toLowerCase().includes(search.toLowerCase())
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'issue_created': return <Plus size={14} className="text-green-500" />;
      case 'issue_completed': return <CheckCircle2 size={14} className="text-blue-500" />;
      case 'comment_added': return <MessageSquare size={14} className="text-orange-500" />;
      case 'member_joined': return <Users size={14} className="text-purple-500" />;
      default: return <History size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">{title}</h1>
          <span className="text-xs text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
            {activities.length} events
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search activity..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm outline-none w-64 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 text-sm transition-colors">
            <Filter size={14} />
            <span>Filter</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {filteredActivities.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-border-dark" />
              
              <div className="space-y-8">
                {filteredActivities.map((activity, idx) => {
                  const actor = MOCK_USERS.find(u => u.id === activity.actorId);
                  return (
                    <div key={activity.id} className="relative flex gap-6 group">
                      {/* Timeline dot */}
                      <div className="absolute left-4 top-2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary border-4 border-white dark:border-bg-dark z-10" />
                      
                      <div className="flex-1 flex gap-4 pl-8">
                        <img src={actor?.avatar} className="w-8 h-8 rounded-full shrink-0" alt={actor?.name} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{actor?.name}</span>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-medium">
                                {getActivityIcon(activity.type)}
                                <span className="capitalize">{activity.type.replace('_', ' ')}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">{activity.timestamp}</span>
                          </div>
                          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <History size={32} />
              </div>
              <h1 className="text-xl font-bold">No activity found</h1>
              <p className="text-sm text-gray-400 mt-2 max-w-xs">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
