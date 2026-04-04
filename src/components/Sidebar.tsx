import React from 'react';
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
  Plus,
  Moon,
  Sun,
  LogOut,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Globe,
  UserCircle,
  Key,
  CreditCard,
  FileText
} from 'lucide-react';
import { useApp } from '../AppContext';
import { ViewType } from '../types';

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick: () => void;
  badge?: number;
  collapsed?: boolean;
}> = ({ icon, label, active, onClick, badge, collapsed }) => (
  <button
    onClick={onClick}
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
  </button>
);

export const Sidebar: React.FC = () => {
  const { 
    currentView, 
    setView, 
    organization, 
    currentUser, 
    theme, 
    setTheme, 
    setCommandPaletteOpen,
    isSidebarCollapsed,
    setSidebarCollapsed
  } = useApp();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'co-admin';
  const isLead = isAdmin || currentUser?.role === 'team-lead';

  const navSections: { title: string; items: { id: ViewType; label: string; icon: React.ReactNode; badge?: number; adminOnly?: boolean; leadOnly?: boolean }[] }[] = [
    {
      title: 'Workspace',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { id: 'inbox', label: 'Inbox', icon: <Inbox size={16} />, badge: 3 },
        { id: 'my-tasks', label: 'My Tasks', icon: <CheckSquare size={16} /> },
      ]
    },
    {
      title: 'Planning',
      items: [
        { id: 'issues', label: 'Issues', icon: <UserCircle size={16} /> },
        { id: 'templates', label: 'Templates', icon: <FileText size={16} />, adminOnly: true },
        { id: 'projects', label: 'Projects', icon: <Layers size={16} /> },
        { id: 'roadmap', label: 'Roadmap', icon: <Map size={16} /> },
        { id: 'cycles', label: 'Cycles', icon: <RotateCcw size={16} /> },
      ]
    },
    {
      title: 'Organization',
      items: [
        { id: 'teams', label: 'Teams', icon: <Users size={16} /> },
        { id: 'members', label: 'Members', icon: <Users size={16} /> },
        { id: 'activity', label: 'Activity', icon: <History size={16} /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} />, leadOnly: true },
        { id: 'integrations', label: 'Integrations', icon: <Globe size={16} />, leadOnly: true },
        { id: 'api-keys', label: 'API Keys', icon: <Key size={16} />, adminOnly: true },
        { id: 'billing', label: 'Billing', icon: <CreditCard size={16} />, adminOnly: true },
        { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
      ]
    }
  ];

  return (
    <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} h-full flex flex-col bg-gray-50 dark:bg-sidebar-dark border-r border-gray-200 dark:border-border-dark select-none transition-all duration-300`}>
      {/* Org Switcher */}
      <div className="p-4 flex items-center justify-between">
        {!isSidebarCollapsed && (
          <button className="flex-1 flex items-center justify-between p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/5 transition-colors overflow-hidden">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                {organization?.name.charAt(0)}
              </div>
              <span className="text-sm font-semibold truncate">{organization?.name}</span>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
        )}
        {isSidebarCollapsed && (
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white text-sm font-bold mx-auto">
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
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={currentView === item.id}
                  onClick={() => setView(item.id)}
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
            onClick={() => setView('login')}
            title="Logout"
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-white/5 text-gray-500 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
        
        <button 
          onClick={() => setView('settings')}
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
        </button>
      </div>
    </aside>
  );
};
