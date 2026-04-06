import React, { useState } from 'react';
import { 
  Link, 
  useLocation, 
  useNavigate 
} from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Inbox, 
  CheckSquare, 
  Layers, 
  Users, 
  Map, 
  RotateCcw, 
  BarChart3, 
  History, 
  Settings,
  ChevronDown,
  Building2,
  Moon,
  Sun,
  LogOut,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  UserCircle,
  Key,
  CreditCard,
  FileText
} from 'lucide-react';
import { useApp } from '../AppContext';

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  to: string;
  badge?: number;
  collapsed?: boolean;
}> = ({ icon, label, active, to, badge, collapsed }) => (
  <Link
    to={to}
    title={collapsed ? label : undefined}
    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors ${
      active 
        ? 'bg-primary/10 text-primary font-medium' 
        : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-white/5'
    } ${collapsed ? 'justify-center' : ''}`}
  >
    <div className="flex items-center gap-2.5">
      <span className={active ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </div>
    {!collapsed && badge !== undefined && (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        {badge}
      </span>
    )}
  </Link>
);

export const Sidebar: React.FC = () => {
  const { 
    organization,
    currentUser, 
    theme, 
    setTheme, 
    setCommandPaletteOpen,
    isSidebarCollapsed,
    setSidebarCollapsed,
    setActiveModal,
    showToast
  } = useApp();

  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  const isLead = isAdmin || currentUser?.role === 'member';

  const location = useLocation();
  const navigate = useNavigate();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  const navSections: { title: string; items: { path: string; label: string; icon: React.ReactNode; badge?: number; adminOnly?: boolean; leadOnly?: boolean }[] }[] = [
    {
      title: 'Workspace',
      items: [
        { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { path: '/inbox', label: 'Inbox', icon: <Inbox size={16} />, badge: 3 },
        { path: '/my-tasks', label: 'My Tasks', icon: <CheckSquare size={16} /> },
      ]
    },
    {
      title: 'Planning',
      items: [
        { path: '/issues', label: 'Issues', icon: <UserCircle size={16} /> },
        { path: '/templates', label: 'Templates', icon: <FileText size={16} />, adminOnly: true },
        { path: '/projects', label: 'Projects', icon: <Layers size={16} /> },
        { path: '/roadmap', label: 'Roadmap', icon: <Map size={16} /> },
        { path: '/cycles', label: 'Cycles', icon: <RotateCcw size={16} /> },
      ]
    },
    {
      title: 'Organization',
      items: [
        { path: '/departments', label: 'Departments', icon: <Building2 size={16} /> },
        { path: '/teams', label: 'Teams', icon: <Users size={16} /> },
        { path: '/members', label: 'Members', icon: <Users size={16} /> },
        { path: '/activity', label: 'Activity', icon: <History size={16} /> },
        { path: '/analytics', label: 'Analytics', icon: <BarChart3 size={16} />, leadOnly: true },
        { path: '/integrations', label: 'Integrations', icon: <Globe size={16} />, leadOnly: true },
        { path: '/api-keys', label: 'API Keys', icon: <Key size={16} />, adminOnly: true },
        { path: '/billing', label: 'Billing', icon: <CreditCard size={16} />, adminOnly: true },
        { path: '/settings', label: 'Settings', icon: <Settings size={16} /> },
      ]
    }
  ];

  const workspaceMenuItems = [
    { 
      label: 'Settings', 
      icon: <Settings size={14} />, 
      onClick: () => { navigate('/settings'); setIsWorkspaceMenuOpen(false); } 
    },
    { 
      label: 'Invite and manage members', 
      icon: <Users size={14} />, 
      onClick: () => { setActiveModal('invite-member'); setIsWorkspaceMenuOpen(false); } 
    },
    { 
      label: 'Download desktop app', 
      icon: <LayoutDashboard size={14} />, 
      badge: 'Coming Soon',
      disabled: true 
    },
    { 
      label: 'Switch workspace', 
      icon: <RotateCcw size={14} />, 
      onClick: () => { showToast('Workspace switching placeholder', 'info'); setIsWorkspaceMenuOpen(false); } 
    },
    { 
      type: 'divider'
    },
    { 
      label: 'Logout', 
      icon: <LogOut size={14} />, 
      onClick: () => { navigate('/login'); setIsWorkspaceMenuOpen(false); },
      variant: 'danger'
    },
  ];

  return (
    <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} h-full flex flex-col bg-gray-50 dark:bg-sidebar-dark border-r border-gray-200 dark:border-border-dark select-none transition-all duration-300 relative z-50`}>
      {/* Org Switcher */}
      <div className="p-4 relative">
        {!isSidebarCollapsed && (
          <div className="relative">
            <button 
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-all ${isWorkspaceMenuOpen ? 'bg-gray-200 dark:bg-white/10' : 'hover:bg-gray-200 dark:hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-primary/20">
                  {organization?.name.charAt(0)}
                </div>
                <span className="text-sm font-bold tracking-tight truncate">{organization?.name}</span>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isWorkspaceMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isWorkspaceMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl shadow-2xl overflow-hidden py-1.5 z-50"
                >
                  {workspaceMenuItems.map((item, idx) => (
                    item.type === 'divider' ? (
                      <div key={idx} className="my-1.5 h-px bg-gray-100 dark:bg-border-dark" />
                    ) : (
                      <button
                        key={idx}
                        onClick={item.onClick}
                        disabled={item.disabled}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors
                          ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-white/5'}
                          ${item.variant === 'danger' ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-700 dark:text-gray-300'}
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={item.variant === 'danger' ? 'text-red-500' : 'text-gray-400'}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {isSidebarCollapsed && (
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white text-sm font-bold mx-auto shadow-lg shadow-primary/20">
            {organization?.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Search / Command Palette Trigger */}
      <div className="px-4 mb-4">
        <button 
          onClick={() => setCommandPaletteOpen(true)}
          className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-1.5 rounded-md border border-gray-200 dark:border-border-dark bg-white dark:bg-black/20 text-xs text-gray-400 hover:border-primary/50 transition-colors`}
        >
          <div className="flex items-center gap-2">
            <Search size={14} />
            {!isSidebarCollapsed && <span>Search...</span>}
          </div>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-1 opacity-50">
              <span className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-border-dark">⌘</span>
              <span className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-border-dark">K</span>
            </div>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto scrollbar-hide">
        {navSections.map(section => {
          const visibleItems = section.items.filter(item => {
            if (item.adminOnly && !isAdmin) return false;
            if (item.leadOnly && !isLead) return false;
            return true;
          });
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {section.title}
                </div>
              )}
              {visibleItems.map(item => (
                <SidebarItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  active={location.pathname === item.path}
                  to={item.path}
                  badge={item.badge}
                  collapsed={isSidebarCollapsed}
                />
              ))}
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200 dark:border-border-dark space-y-2">
        <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-2' : 'justify-between'}`}>
          <button 
            onClick={cycleTheme}
            title={`Current: ${theme} (Click to cycle)`}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-white/5 text-gray-500 transition-colors"
          >
            {theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Globe size={18} />}
          </button>
          <button 
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-white/5 text-gray-500 transition-colors"
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button 
            onClick={() => navigate('/login')}
            title="Logout"
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-white/5 text-gray-500 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
        
        <Link 
          to="/settings"
          className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/5 transition-colors`}
        >
          <img 
            src={currentUser?.avatar} 
            alt={currentUser?.name} 
            className="w-8 h-8 rounded-full object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
          {!isSidebarCollapsed && (
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-sm font-medium truncate w-full">{currentUser?.name}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{currentUser?.role}</span>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
};
