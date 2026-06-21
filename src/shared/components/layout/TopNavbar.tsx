import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useThemeStore } from '@/app/stores/useThemeStore';
import { useUIStore } from '@/app/stores/useUIStore';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  Plus,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useUnreadNotificationsCount } from '@features/notifications';

export const TopNavbar: React.FC = () => {
  const { signOut } = useAuth();
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const currentUser = useAuthStore((s) => s.currentUser);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const unreadNotifications = useUnreadNotificationsCount({ enabled: true, refetchInterval: 30_000 });
  const unreadCount = unreadNotifications.data?.unread ?? 0;

  /** Logout — clear store + Clerk sign-out */
  const handleLogout = async () => {
    console.log('[TopNavbar] Logging out...');
    setUserMenuOpen(false);
    useAuthStore.getState().clear();
    await signOut({ redirectUrl: '/login' });
  };

  return (
    <header className="h-14 border-b border-gray-200 dark:border-border-dark bg-white/80 dark:bg-bg-dark/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm text-left text-gray-400 outline-none hover:ring-2 hover:ring-primary/20 transition-all"
          >
            Search or jump to...
          </button>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50 pointer-events-none">
            <span className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-border-dark text-[10px]">⌘</span>
            <span className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-border-dark text-[10px]">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/issues/create')}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
          title="Create new issue (Ctrl+Enter)"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={() => navigate('/inbox')}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors relative"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-bg-dark" />
          )}
        </button>

        <button
          onClick={() => useUIStore.getState().setAiPanelOpen(!useUIStore.getState().isAiPanelOpen)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
            useUIStore.getState().isAiPanelOpen
              ? 'bg-primary/10 text-primary'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-300'
          }`}
          title="Open Trussen AI"
        >
          <Sparkles size={13} />
          <span className="hidden sm:inline">Ask Trussen</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <img
              src={currentUser?.avatar}
              className="w-7 h-7 rounded-full object-cover"
              alt={currentUser?.name}
              referrerPolicy="no-referrer"
            />
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-sidebar-dark border border-gray-200 dark:border-border-dark rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-gray-200 dark:border-border-dark">
                    <div className="text-sm font-bold">{currentUser?.name}</div>
                    <div className="text-xs text-gray-400 truncate">{currentUser?.email}</div>
                  </div>
                  <div className="p-1">
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-sm text-left transition-colors"
                    >
                      <User size={16} className="text-gray-400" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-sm text-left transition-colors"
                    >
                      <Settings size={16} className="text-gray-400" />
                      Account Settings
                    </Link>
                    <div className="h-[1px] bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Theme</div>
                    <div className="grid grid-cols-3 gap-1 p-1">
                      <button
                        onClick={() => setTheme('light')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${theme === 'light' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500'}`}
                      >
                        <Sun size={14} />
                        <span className="text-[10px]">Light</span>
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500'}`}
                      >
                        <Moon size={14} />
                        <span className="text-[10px]">Dark</span>
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${theme === 'system' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500'}`}
                      >
                        <Globe size={14} />
                        <span className="text-[10px]">System</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-1 border-t border-gray-200 dark:border-border-dark">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-500 text-sm text-left transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
