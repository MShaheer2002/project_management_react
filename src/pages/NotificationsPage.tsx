import React, { useState } from 'react';
import { Inbox, Bell, MessageSquare, UserPlus, CheckCircle2, History, Filter, Search, MoreHorizontal, User } from 'lucide-react';
import { MOCK_NOTIFICATIONS, MOCK_USERS } from '../constants';

export const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'mentions' | 'assignments' | 'updates'>('all');
  const [search, setSearch] = useState('');

  const filteredNotifications = MOCK_NOTIFICATIONS.filter(notification => {
    const matchesSearch = notification.description.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === 'mentions') return notification.type === 'mention' && matchesSearch;
    if (activeTab === 'assignments') return notification.type === 'assignment' && matchesSearch;
    if (activeTab === 'updates') return notification.type === 'update' && matchesSearch;
    return matchesSearch;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention': return <MessageSquare size={14} className="text-orange-500" />;
      case 'assignment': return <UserPlus size={14} className="text-blue-500" />;
      case 'update': return <CheckCircle2 size={14} className="text-green-500" />;
      default: return <Bell size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Inbox</h1>
          <span className="text-xs text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
            {MOCK_NOTIFICATIONS.filter(n => !n.read).length} unread
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search notifications..." 
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

      <div className="flex gap-8 px-6 border-b border-gray-200 dark:border-border-dark bg-gray-50/50 dark:bg-black/10">
        <button 
          onClick={() => setActiveTab('all')}
          className={`py-3 text-sm font-medium transition-colors relative ${activeTab === 'all' ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
          All
          {activeTab === 'all' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button 
          onClick={() => setActiveTab('mentions')}
          className={`py-3 text-sm font-medium transition-colors relative ${activeTab === 'mentions' ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
          Mentions
          {activeTab === 'mentions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button 
          onClick={() => setActiveTab('assignments')}
          className={`py-3 text-sm font-medium transition-colors relative ${activeTab === 'assignments' ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
          Assignments
          {activeTab === 'assignments' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button 
          onClick={() => setActiveTab('updates')}
          className={`py-3 text-sm font-medium transition-colors relative ${activeTab === 'updates' ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
          Updates
          {activeTab === 'updates' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-border-dark">
            {filteredNotifications.map(notification => {
              const actor = MOCK_USERS.find(u => u.id === notification.actorId);
              return (
                <div 
                  key={notification.id}
                  className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors group ${!notification.read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative">
                      <img src={actor?.avatar} className="w-10 h-10 rounded-full shrink-0" alt={actor?.name} />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-bg-dark flex items-center justify-center shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{actor?.name}</span>
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{notification.description}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-mono uppercase">
                        <span>{notification.issueId}</span>
                        <span>•</span>
                        <span>{notification.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {!notification.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400">
                        <CheckCircle2 size={16} />
                      </button>
                      <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <Inbox size={32} />
            </div>
            <h1 className="text-xl font-bold">Your inbox is empty</h1>
            <p className="text-sm text-gray-400 mt-2 max-w-xs">When you're mentioned or assigned to an issue, it will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
