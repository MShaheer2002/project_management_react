import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, LayoutDashboard, Inbox, UserCircle, Layers, Users, Map, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/AppContext';

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const actions: { id: string; label: string; icon: React.ReactNode; category: string; action: () => void }[] = [
    { id: 'create-issue', label: 'Create new issue', icon: <Plus size={16} />, category: 'Quick Actions', action: () => navigate('/issues/create') },
    { id: 'go-dashboard', label: 'Go to Dashboard', icon: <LayoutDashboard size={16} />, category: 'Navigation', action: () => navigate('/dashboard') },
    { id: 'go-inbox', label: 'Go to Inbox', icon: <Inbox size={16} />, category: 'Navigation', action: () => navigate('/inbox') },
    { id: 'go-my-issues', label: 'Go to My Issues', icon: <UserCircle size={16} />, category: 'Navigation', action: () => navigate('/issues/my') },
    { id: 'go-projects', label: 'Go to Projects', icon: <Layers size={16} />, category: 'Navigation', action: () => navigate('/projects') },
    { id: 'go-teams', label: 'Go to Teams', icon: <Users size={16} />, category: 'Navigation', action: () => navigate('/teams') },
    { id: 'go-roadmap', label: 'Go to Roadmap', icon: <Map size={16} />, category: 'Navigation', action: () => navigate('/roadmap') },
    { id: 'go-settings', label: 'Go to Settings', icon: <Settings size={16} />, category: 'Navigation', action: () => navigate('/settings') },
  ];

  const filteredActions = actions.filter(a => 
    a.label.toLowerCase().includes(search.toLowerCase()) || 
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!isCommandPaletteOpen) setSearch('');
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setCommandPaletteOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="relative w-full max-w-xl bg-white dark:bg-sidebar-dark rounded-xl shadow-2xl border border-gray-200 dark:border-border-dark overflow-hidden"
      >
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-border-dark">
          <Search size={18} className="text-gray-400 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <span className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-gray-800">ESC</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredActions.length > 0 ? (
            Object.entries(
              filteredActions.reduce((acc, curr) => {
                if (!acc[curr.category]) acc[curr.category] = [];
                acc[curr.category].push(curr);
                return acc;
              }, {} as Record<string, typeof actions>)
            ).map(([category, items]) => (
              <div key={category} className="mb-2 last:mb-0">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {category}
                </div>
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary text-sm text-left transition-colors group"
                  >
                    <span className="text-gray-400 group-hover:text-primary">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                  </button>
                ))}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              No results found for "{search}"
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-border-dark flex items-center justify-between text-[10px] text-gray-400">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <span className="px-1 py-0.5 rounded border border-gray-200 dark:border-border-dark bg-white dark:bg-gray-800">↑↓</span>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1 py-0.5 rounded border border-gray-200 dark:border-border-dark bg-white dark:bg-gray-800">↵</span>
              Select
            </span>
          </div>
          <span>Trussen Command Palette</span>
        </div>
      </motion.div>
    </div>
  );
};
