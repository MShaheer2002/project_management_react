import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import { Sidebar } from './components/Sidebar';
import { ContextPanel } from './components/ContextPanel';
import { CommandPalette } from './components/CommandPalette';
import { DashboardPage } from './pages/DashboardPage';
import { IssuesPage } from './features/issues/components/IssuesPage';
import { ProjectsPage } from './features/projects/components/ProjectsPage';
import { TeamsPage } from './pages/TeamsPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { SettingsPage } from './pages/SettingsPage';
import { MembersPage } from './pages/MembersPage';
import { MyIssuesPage } from './pages/MyIssuesPage';
import { ActivityPage } from './pages/ActivityPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { MarketingPage } from './pages/MarketingPage';
import { CyclesPage } from './pages/CyclesPage';
import { BillingPage } from './pages/BillingPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { DepartmentsPage } from '@/src/pages/DepartmentsPage';
import { DepartmentDetailPage } from '@/src/pages/DepartmentDetailPage';
import { CreateIssuePage } from './pages/CreateIssuePage';
import { TemplatesPage } from './pages/TemplatesPage';
import { AuthPage } from './pages/AuthPage';
import { ModalManager } from './components/modals/ModalManager';
import { ToastContainer } from './components/ToastContainer';
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
  Globe
} from 'lucide-react';

import { IssueDetailPage } from './pages/IssueDetailPage';

const TopNavbar: React.FC = () => {
  const { setCommandPaletteOpen, currentUser, theme, setTheme } = useApp();
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

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
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-bg-dark" />
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
                      onClick={() => { navigate('/login'); setUserMenuOpen(false); }}
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

const MainLayout: React.FC = () => {
  const { currentUser } = useApp();

  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  const isLead = isAdmin || currentUser?.role === 'member';

  return (
    <div className="flex h-screen bg-white dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark overflow-hidden transition-colors duration-300">
      <ModalManager />
      <ToastContainer />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inbox" element={<NotificationsPage />} />
            <Route path="/issues/my" element={<MyIssuesPage />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/issues/create" element={<CreateIssuePage />} />
            <Route path="/issues/:issueId" element={<IssueDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:id" element={<TeamDetailPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/departments/:id" element={<DepartmentDetailPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/cycles" element={<CyclesPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Lead/Admin Routes */}
            <Route path="/analytics" element={isLead ? <ReportsPage /> : <Navigate to="/" />} />
            <Route path="/integrations" element={isLead ? <IntegrationsPage /> : <Navigate to="/" />} />
            <Route path="/templates" element={isAdmin ? <TemplatesPage /> : <Navigate to="/" />} />
            <Route path="/api-keys" element={isAdmin ? <ApiKeysPage /> : <Navigate to="/" />} />
            <Route path="/billing" element={isAdmin ? <BillingPage /> : <Navigate to="/" />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      <AnimatePresence>
        <ContextPanel />
      </AnimatePresence>
      <AnimatePresence>
        <CommandPalette />
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/org-creation" element={<AuthPage mode="org" />} />
        <Route path="/forgot-password" element={<AuthPage mode="forgot-password" />} />
        <Route path="/reset-password" element={<AuthPage mode="reset-password" />} />
        <Route path="/email-verification" element={<AuthPage mode="email-verification" />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </AppProvider>
  );
}
