import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  ChevronRight,
  Building2,
  Moon,
  Sun,
  LogOut,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  Key,
  CreditCard,
  FileText,
  CircleDot,
  LayoutGrid,
  FolderKanban,
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '../AppContext';
import { useSidebarData, type SidebarPermissions, type SidebarTeam } from '@features/sidebar';
import { useWorkspaces } from '@features/workspace';

const focusMinimal = 'outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0';

const normalizeRole = (role?: string) => role?.toLowerCase() as 'owner' | 'admin' | 'member' | 'guest' | undefined;

function useNavActive() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  return useCallback(
    (to: string) => {
      const [path, rawQuery] = to.split('?');
      if (location.pathname !== path) return false;
      if (!rawQuery) {
        const teamScoped = ['/issues', '/projects', '/cycles', '/roadmap'];
        if (teamScoped.includes(path)) {
          return searchParams.get('team') == null;
        }
        return true;
      }
      const expected = new URLSearchParams(rawQuery);
      for (const [key, value] of expected.entries()) {
        if (searchParams.get(key) !== value) return false;
      }
      return true;
    },
    [location.pathname, searchParams.toString()]
  );
}

const SidebarNavLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed?: boolean;
  badge?: number;
  indent?: boolean;
}> = ({ to, icon, label, active, collapsed, badge, indent }) => (
  <Link
    to={to}
    title={collapsed ? label : undefined}
    className={`group flex items-center justify-between rounded-md text-[13px] font-medium transition-colors duration-150 ease-out ${focusMinimal} ${
      collapsed
        ? 'justify-center min-h-11 min-w-11 mx-auto rounded-lg py-0 px-0'
        : `min-h-9 px-2 ${indent ? 'ml-5 pl-2' : ''}`
    } ${
      active
        ? 'bg-black/[0.06] dark:bg-white/[0.08] text-gray-900 dark:text-gray-100'
        : 'text-gray-600 dark:text-gray-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-gray-100'
    }`}
  >
    <span className="flex items-center gap-2.5 min-w-0">
      <span
        className={`shrink-0 flex items-center justify-center ${
          active ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
        }`}
      >
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </span>
    {!collapsed && badge !== undefined && (
      <span className="shrink-0 text-[10px] font-medium tabular-nums px-1.5 py-0.5 rounded-md bg-black/[0.05] dark:bg-white/10 text-gray-500 dark:text-gray-400">
        {badge}
      </span>
    )}
  </Link>
);

const SectionLabel: React.FC<{ children: React.ReactNode; collapsed?: boolean }> = ({ children, collapsed }) => {
  if (collapsed) return null;
  return (
    <div className="px-2 py-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-500 tracking-tight">
      {children}
    </div>
  );
};

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
    showToast,
  } = useApp();
  const {
    data: sidebarData,
    isLoading: isSidebarLoading,
    error: sidebarError,
    refetch: refetchSidebar,
  } = useSidebarData();
  const isInitialSidebarLoading = isSidebarLoading && !sidebarData;

  const activeWorkspace = sidebarData?.activeWorkspace;
  const displayOrganization = activeWorkspace
    ? {
        id: activeWorkspace.id,
        name: activeWorkspace.name,
        slug: activeWorkspace.slug,
        logo: activeWorkspace.logo ?? undefined,
      }
    : organization;
  const displayUser = sidebarData?.user
    ? {
        id: sidebarData.user.id,
        name: sidebarData.user.name,
        email: sidebarData.user.email,
        avatar: sidebarData.user.avatar ?? undefined,
        role: normalizeRole(sidebarData.user.role) ?? 'member',
      }
    : currentUser;
  const sidebarTeams = useMemo(() => sidebarData?.teams ?? [], [sidebarData?.teams]);
  const badges = sidebarData?.badges;
  const permissions = sidebarData?.permissions;

  // Clerk auth — for real sign-out
  const { signOut } = useAuth();

  /**
   * Logout handler — clears Zustand store + Clerk session, then redirects.
   */
  const handleLogout = async () => {
    console.log('[Sidebar] Logging out...');
    useAuthStore.getState().clear();          // Clear Zustand auth state
    await signOut({ redirectUrl: '/login' }); // Clerk sign-out + redirect
  };

  const isAdmin = displayUser?.role === 'owner' || displayUser?.role === 'admin';
  const isLead = isAdmin || displayUser?.role === 'member';

  const navigate = useNavigate();
  const location = useLocation();
  const isNavActive = useNavActive();

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [orgOpen, setOrgOpen] = useState(false);
  const [expandedTeamIds, setExpandedTeamIds] = useState<Set<string>>(
    () => new Set()
  );
  const [teamsFlyoutOpen, setTeamsFlyoutOpen] = useState(false);
  const [orgFlyoutOpen, setOrgFlyoutOpen] = useState(false);
  const teamsFlyoutButtonRef = useRef<HTMLButtonElement>(null);
  const orgFlyoutButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setExpandedTeamIds(new Set(sidebarTeams.map((team) => team.id)));
  }, [sidebarTeams]);

  const toggleTeamExpanded = (id: string) => {
    setExpandedTeamIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (isSidebarCollapsed) {
      setTeamsFlyoutOpen(false);
      setOrgFlyoutOpen(false);
    }
  }, [isSidebarCollapsed]);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const { data: allWorkspaces } = useWorkspaces();

  const handleSwitchWorkspace = () => {
    setIsWorkspaceMenuOpen(false);
    if (allWorkspaces && allWorkspaces.length > 1) {
      navigate('/select-workspace');
    } else {
      navigate('/org-creation?new=true');
    }
  };

  const workspaceMenuItems: Array<{
    label?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    badge?: string;
    disabled?: boolean;
    variant?: 'danger';
    type?: 'divider';
  }> = [
    ...(sidebarError
      ? [{
          label: 'Retry sidebar data',
          icon: <RotateCcw size={14} />,
          onClick: () => {
            refetchSidebar();
            setIsWorkspaceMenuOpen(false);
          },
        }]
      : []),
    {
      label: 'Settings',
      icon: <Settings size={14} />,
      onClick: () => {
        navigate('/settings');
        setIsWorkspaceMenuOpen(false);
      },
    },
    {
      label: 'Download desktop app',
      icon: <LayoutDashboard size={14} />,
      badge: 'Soon',
      disabled: true,
    },
    {
      label: 'Switch workspace',
      icon: <RotateCcw size={14} />,
      onClick: handleSwitchWorkspace,
    },
    { type: 'divider' },
    {
      label: 'Logout',
      icon: <LogOut size={14} />,
      onClick: () => {
        setIsWorkspaceMenuOpen(false);
        handleLogout();
      },
      variant: 'danger',
    },
  ];

  const canUsePermission = (permission: keyof SidebarPermissions | undefined) => {
    if (!permission) return true;
    if (permissions) return permissions[permission];
    if (permission === 'canManageSettings') return isAdmin;
    if (permission === 'canManageBilling') return isAdmin;
    if (permission === 'canManageApiKeys') return isAdmin;
    if (permission === 'canManageTemplates') return isAdmin;
    return true;
  };

  const orgItems: { path: string; label: string; icon: React.ReactNode; adminOnly?: boolean; leadOnly?: boolean; permission?: keyof SidebarPermissions }[] =
    [
      { path: '/departments', label: 'Departments', icon: <Building2 size={16} /> },
      { path: '/teams', label: 'Team directory', icon: <Users size={16} /> },
      { path: '/members', label: 'Members', icon: <Users size={16} /> },
      { path: '/activity', label: 'Activity', icon: <History size={16} /> },
      { path: '/analytics', label: 'Analytics', icon: <BarChart3 size={16} />, leadOnly: true },
      { path: '/integrations', label: 'Integrations', icon: <Globe size={16} />, leadOnly: true },
      { path: '/templates', label: 'Templates', icon: <FileText size={16} />, permission: 'canManageTemplates' },
      { path: '/api-keys', label: 'API Keys', icon: <Key size={16} />, permission: 'canManageApiKeys' },
      { path: '/billing', label: 'Billing', icon: <CreditCard size={16} />, permission: 'canManageBilling' },
      { path: '/settings', label: 'Settings', icon: <Settings size={16} />, permission: 'canManageSettings' },
    ];

  const widthClass = isSidebarCollapsed ? 'w-14' : 'w-60';

  return (
    <motion.aside
      layout
      transition={{ layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
      className={`${widthClass} h-full flex flex-col bg-gray-50 dark:bg-sidebar-dark select-none relative z-50 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
    >
      {/* Workspace */}
      <div className="px-2 pt-2 pb-1">
        {!isSidebarCollapsed ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors duration-150 ${focusMinimal} ${
                isWorkspaceMenuOpen
                  ? 'bg-black/[0.06] dark:bg-white/[0.08]'
                  : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
              }`}
            >
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {isInitialSidebarLoading && !displayOrganization ? (
                  <span className="w-3.5 h-3.5 rounded bg-white/35 animate-pulse" />
                ) : (
                  displayOrganization?.name.charAt(0)
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                {isInitialSidebarLoading && !activeWorkspace ? (
                  <ShimmerLine className="h-3 w-28" />
                ) : (
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                    {displayOrganization?.name}
                  </div>
                )}
              </div>
              <ChevronDown
                size={14}
                className={`shrink-0 text-gray-400 transition-transform duration-200 ease-out ${isWorkspaceMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {isWorkspaceMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-card-dark rounded-lg shadow-xl overflow-hidden py-1 z-50"
                >
                  {workspaceMenuItems.map((item, idx) =>
                    item.type === 'divider' ? (
                      <div key={idx} className="my-1 h-px bg-gray-100 dark:bg-border-dark" />
                    ) : (
                      <button
                        key={idx}
                        type="button"
                        onClick={item.onClick}
                        disabled={item.disabled}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors duration-100 ${focusMinimal} ${
                          item.disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-50 dark:hover:bg-white/5'
                        } ${
                          item.variant === 'danger'
                            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className={item.variant === 'danger' ? 'text-red-500' : 'text-gray-400'}>
                            {item.icon}
                          </span>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 font-medium">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className={`w-10 h-10 mx-auto flex items-center justify-center rounded-lg bg-primary text-white text-xs font-semibold transition-transform duration-150 active:scale-[0.96] ${focusMinimal}`}
            title={displayOrganization?.name ?? 'Workspace'}
          >
            {displayOrganization?.name.charAt(0)}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className={`w-full flex items-center gap-2 rounded-md bg-black/[0.03] dark:bg-white/[0.04] px-2 py-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors duration-150 ${focusMinimal} ${
            isSidebarCollapsed ? 'justify-center min-h-11 px-0' : ''
          }`}
        >
          <Search size={16} className="shrink-0 opacity-70" />
          {!isSidebarCollapsed && (
            <>
              <span className="flex-1 text-left font-medium">Search…</span>
              <span className="hidden sm:flex items-center gap-0.5 opacity-50 text-[10px] tabular-nums">⌘K</span>
            </>
          )}
        </button>
      </div>

      <motion.nav
        layout
        transition={{ layout: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
        className="flex-1 px-2 pb-2 overflow-y-auto scrollbar-hide flex flex-col gap-3 min-h-0"
      >
        <motion.div
          layout
          transition={{ layout: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
          className="flex flex-col gap-0.5"
        >
          <SectionLabel collapsed={isSidebarCollapsed}>Your work</SectionLabel>
          <SidebarNavLink
            to="/dashboard"
            icon={<LayoutDashboard size={16} />}
            label="Dashboard"
            active={isNavActive('/dashboard')}
            collapsed={isSidebarCollapsed}
          />
          <SidebarNavLink
            to="/inbox"
            icon={<Inbox size={16} />}
            label="Inbox"
            active={isNavActive('/inbox')}
            collapsed={isSidebarCollapsed}
            badge={badges?.inbox}
          />
          <SidebarNavLink
            to="/issues/my"
            icon={<CheckSquare size={16} />}
            label="My issues"
            active={isNavActive('/issues/my')}
            collapsed={isSidebarCollapsed}
            badge={badges?.myIssues}
          />
          {isInitialSidebarLoading && !isSidebarCollapsed && (
            <div className="px-2 pt-1 space-y-2">
              <ShimmerLine className="h-3 w-20" />
              <ShimmerLine className="h-3 w-24" />
            </div>
          )}
        </motion.div>

        <motion.div
          layout
          transition={{ layout: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
          className="flex flex-col gap-0.5"
        >
          <SectionLabel collapsed={isSidebarCollapsed}>Browse</SectionLabel>
          <SidebarNavLink
            to="/issues"
            icon={<CircleDot size={16} />}
            label="All issues"
            active={isNavActive('/issues')}
            collapsed={isSidebarCollapsed}
          />
          <SidebarNavLink
            to="/projects"
            icon={<FolderKanban size={16} />}
            label="All projects"
            active={isNavActive('/projects')}
            collapsed={isSidebarCollapsed}
          />
        </motion.div>

        {/* Teams */}
        <motion.div
          layout
          transition={{ layout: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
          className="flex flex-col gap-0.5"
        >
          {!isSidebarCollapsed ? (
            <>
              <button
                type="button"
                onClick={() => setTeamsOpen(!teamsOpen)}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md text-[11px] font-medium text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-150 ${focusMinimal}`}
              >
                <span>Your teams</span>
                <motion.span
                  animate={{ rotate: teamsOpen ? 0 : -90 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ChevronDown size={14} className="opacity-70" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {teamsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden flex flex-col gap-0.5"
                  >
                    {isInitialSidebarLoading && sidebarTeams.length === 0 ? (
                      <SidebarTeamsShimmer />
                    ) : sidebarTeams.map(team => {
                      const expanded = expandedTeamIds.has(team.id);

                      return (
                        <motion.div
                          key={team.id}
                          layout
                          transition={{ layout: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
                          className="rounded-md overflow-hidden"
                        >
                          <div className="flex items-stretch gap-0 min-h-9">
                            <Link
                              to={`/teams/${team.id}`}
                              className={`flex-1 flex items-center px-2 py-1.5 min-w-0 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors duration-150 ${focusMinimal}`}
                            >
                              <motion.span
                                layout="position"
                                className="text-[13px] font-medium text-gray-800 dark:text-gray-100 truncate"
                              >
                                {team.name}
                              </motion.span>
                            </Link>
                            <button
                              type="button"
                              aria-expanded={expanded}
                              aria-label={expanded ? 'Collapse team' : 'Expand team'}
                              onClick={e => {
                                e.preventDefault();
                                toggleTeamExpanded(team.id);
                              }}
                              className={`shrink-0 px-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors duration-150 ${focusMinimal}`}
                            >
                              <motion.span
                                animate={{ rotate: expanded ? 90 : 0 }}
                                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                className="flex"
                              >
                                <ChevronRight size={16} />
                              </motion.span>
                            </button>
                          </div>

                          <AnimatePresence initial={false}>
                            {expanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden flex flex-col gap-0.5 pt-0.5 pb-1"
                              >
                                <SidebarNavLink
                                  to={`/issues?team=${team.id}`}
                                  icon={<LayoutGrid size={15} />}
                                  label="Issues"
                                  active={isNavActive(`/issues?team=${team.id}`)}
                                  indent
                                />
                                <SidebarNavLink
                                  to={`/projects?team=${team.id}`}
                                  icon={<Layers size={15} />}
                                  label="Projects"
                                  active={isNavActive(`/projects?team=${team.id}`)}
                                  indent
                                />
                                <SidebarNavLink
                                  to={`/teams/${team.id}`}
                                  icon={<Users size={15} />}
                                  label="Team"
                                  active={location.pathname === `/teams/${team.id}`}
                                  indent
                                />
                                <SidebarNavLink
                                  to={`/cycles?team=${team.id}`}
                                  icon={<RotateCcw size={15} />}
                                  label="Cycles"
                                  active={isNavActive(`/cycles?team=${team.id}`)}
                                  indent
                                />
                                <SidebarNavLink
                                  to={`/roadmap?teamId=${team.id}`}
                                  icon={<Map size={15} />}
                                  label="Roadmap"
                                  active={isNavActive(`/roadmap?teamId=${team.id}`)}
                                  indent
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="flex justify-center py-0.5">
              <button
                ref={teamsFlyoutButtonRef}
                type="button"
                onClick={() => setTeamsFlyoutOpen(o => !o)}
                aria-haspopup="dialog"
                aria-expanded={teamsFlyoutOpen}
                title="Teams"
                className={`min-h-11 min-w-11 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 transition-all duration-150 ease-out active:scale-[0.96] ${focusMinimal} ${
                  teamsFlyoutOpen
                    ? 'bg-black/[0.08] dark:bg-white/10 text-gray-900 dark:text-gray-100'
                    : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
                }`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {isSidebarCollapsed && teamsFlyoutOpen && (
            <TeamsFlyoutPanel
              key="teams-flyout"
              anchorRef={teamsFlyoutButtonRef}
              onClose={() => setTeamsFlyoutOpen(false)}
              isNavActive={isNavActive}
              locationPathname={location.pathname}
              teams={sidebarTeams}
            />
          )}
        </AnimatePresence>

        {/* Organization — tight gap from teams */}
        {!isSidebarCollapsed ? (
          <motion.div
            layout
            transition={{ layout: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
            className="flex flex-col gap-0.5 -mt-0.5"
          >
            <button
              type="button"
              onClick={() => setOrgOpen(!orgOpen)}
              className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md text-[11px] font-medium text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-150 ${focusMinimal}`}
            >
              <span>Organization</span>
              <motion.span
                animate={{ rotate: orgOpen ? 0 : -90 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <ChevronDown size={14} className="opacity-70" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {orgOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden flex flex-col gap-0.5"
                >
                  {orgItems.map(item => {
                    if (!canUsePermission(item.permission)) return null;
                    if (item.adminOnly && !isAdmin) return null;
                    if (item.leadOnly && !isLead) return null;
                    return (
                      <SidebarNavLink
                        key={item.path}
                        to={item.path}
                        icon={item.icon}
                        label={item.label}
                        active={isNavActive(item.path)}
                      />
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex justify-center py-0.5">
            <button
              ref={orgFlyoutButtonRef}
              type="button"
              onClick={() => setOrgFlyoutOpen(o => !o)}
              aria-haspopup="dialog"
              aria-expanded={orgFlyoutOpen}
              title="Organization"
              className={`min-h-11 min-w-11 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 transition-all duration-150 ease-out active:scale-[0.96] ${focusMinimal} ${
                orgFlyoutOpen
                  ? 'bg-black/[0.08] dark:bg-white/10 text-gray-900 dark:text-gray-100'
                  : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
              }`}
            >
              <Building2 size={18} />
            </button>
          </div>
        )}
      </motion.nav>

      <AnimatePresence>
        {isSidebarCollapsed && orgFlyoutOpen && (
          <OrgFlyoutPanel
            key="org-flyout"
            anchorRef={orgFlyoutButtonRef}
            onClose={() => setOrgFlyoutOpen(false)}
            isNavActive={isNavActive}
            orgItems={orgItems}
            isAdmin={isAdmin}
            isLead={isLead}
            permissions={permissions}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="p-2 mt-auto">
        <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-1' : 'justify-between gap-0.5'}`}>
          <button
            type="button"
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
            className={`rounded-md text-gray-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors duration-150 ${focusMinimal} ${isSidebarCollapsed ? 'min-h-11 min-w-11 flex items-center justify-center' : 'p-2'}`}
          >
            {theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Globe size={18} />}
          </button>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`rounded-md text-gray-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors duration-150 ${focusMinimal} ${isSidebarCollapsed ? 'min-h-11 min-w-11 flex items-center justify-center' : 'p-2'}`}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className={`rounded-md text-gray-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors duration-150 ${focusMinimal} ${isSidebarCollapsed ? 'min-h-11 min-w-11 flex items-center justify-center' : 'p-2'}`}
          >
            <LogOut size={18} />
          </button>
        </div>

        <Link
          to="/settings"
          className={`mt-2 flex items-center gap-2.5 p-1.5 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors duration-150 ${focusMinimal} ${
            isSidebarCollapsed ? 'justify-center min-h-11' : ''
          }`}
        >
          <img
            src={displayUser?.avatar}
            alt={displayUser?.name}
            className="w-8 h-8 rounded-full object-cover shrink-0 bg-gray-200 dark:bg-white/10"
            referrerPolicy="no-referrer"
          />
          {!isSidebarCollapsed && (
            <div className="flex flex-col items-start overflow-hidden min-w-0">
              {isInitialSidebarLoading && !displayUser ? (
                <>
                  <ShimmerLine className="h-3 w-24 mb-1.5" />
                  <ShimmerLine className="h-2.5 w-12" />
                </>
              ) : (
                <>
                  <span className="text-[13px] font-medium truncate w-full text-gray-900 dark:text-gray-100">
                    {displayUser?.name}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium capitalize">
                    {displayUser?.role}
                  </span>
                </>
              )}
            </div>
          )}
        </Link>
      </div>
    </motion.aside>
  );
};

const ShimmerLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded bg-gray-200/80 dark:bg-white/10 animate-pulse ${className}`} />
);

const SidebarTeamsShimmer: React.FC = () => (
  <div className="space-y-3 px-2 py-1">
    {[0, 1].map((item) => (
      <div key={item} className="space-y-2">
        <ShimmerLine className="h-3.5 w-28" />
        <div className="pl-5 space-y-2">
          <ShimmerLine className="h-3 w-20" />
          <ShimmerLine className="h-3 w-24" />
        </div>
      </div>
    ))}
  </div>
);

/** Collapsed rail: flyout for Organization items */
const OrgFlyoutPanel: React.FC<{
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  isNavActive: (to: string) => boolean;
  orgItems: { path: string; label: string; icon: React.ReactNode; adminOnly?: boolean; leadOnly?: boolean; permission?: keyof SidebarPermissions }[];
  isAdmin: boolean;
  isLead: boolean;
  permissions?: SidebarPermissions;
}> = ({ anchorRef, onClose, isNavActive, orgItems, isAdmin, isLead, permissions }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxH = Math.min(window.innerHeight - 24, 480);
    let top = rect.top - 8;
    if (top + maxH > window.innerHeight - 12) top = window.innerHeight - maxH - 12;
    if (top < 12) top = 12;
    setStyle({
      position: 'fixed',
      left: rect.right + 8,
      top,
      width: 200,
      maxHeight: maxH,
      zIndex: 60,
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, anchorRef]);

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      style={style}
      className="overflow-y-auto rounded-lg bg-white dark:bg-card-dark shadow-2xl py-2 flex flex-col gap-0.5"
    >
      <div className="px-3 py-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Organization</div>
      {orgItems.map(item => {
        if (item.permission && permissions && !permissions[item.permission]) return null;
        if (item.permission && !permissions && !isAdmin) return null;
        if (item.adminOnly && !isAdmin) return null;
        if (item.leadOnly && !isLead) return null;
        const active = isNavActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`flex items-center gap-2.5 px-3 py-2 mx-1 rounded-md text-[13px] font-medium transition-colors duration-100 ${focusMinimal} ${
              active
                ? 'bg-black/[0.06] dark:bg-white/[0.08] text-gray-900 dark:text-gray-100'
                : 'text-gray-600 dark:text-gray-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
            }`}
          >
            <span className={active ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </motion.div>
  );
};

/** Collapsed rail: flyout with full team names + large tap targets */
const TeamsFlyoutPanel: React.FC<{
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  isNavActive: (to: string) => boolean;
  locationPathname: string;
  teams: SidebarTeam[];
}> = ({ anchorRef, onClose, isNavActive, locationPathname, teams }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxH = Math.min(window.innerHeight - 24, 480);
    let top = rect.top - 8;
    if (top + maxH > window.innerHeight - 12) top = window.innerHeight - maxH - 12;
    if (top < 12) top = 12;
    setStyle({
      position: 'fixed',
      left: rect.right + 8,
      top,
      width: 236,
      maxHeight: maxH,
      zIndex: 60,
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, anchorRef]);

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      style={style}
      className="overflow-y-auto rounded-lg bg-white dark:bg-card-dark shadow-2xl py-2"
    >
        <div className="px-3 py-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">Teams</div>
        {teams.map(team => {
          return (
            <div key={team.id} className="px-2 pb-3 last:pb-1">
              <Link
                to={`/teams/${team.id}`}
                onClick={onClose}
                className={`flex items-center px-2 py-2.5 min-h-11 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors ${focusMinimal}`}
              >
                <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">{team.name}</span>
              </Link>
              <div className="grid grid-cols-1 gap-0.5 pl-1">
                {[
                  { to: `/issues?team=${team.id}`, label: 'Issues', active: isNavActive(`/issues?team=${team.id}`) },
                  { to: `/projects?team=${team.id}`, label: 'Projects', active: isNavActive(`/projects?team=${team.id}`) },
                  { to: `/teams/${team.id}`, label: 'Team', active: locationPathname === `/teams/${team.id}` },
                  { to: `/cycles?team=${team.id}`, label: 'Cycles', active: isNavActive(`/cycles?team=${team.id}`) },
                  { to: `/roadmap?teamId=${team.id}`, label: 'Roadmap', active: isNavActive(`/roadmap?teamId=${team.id}`) },
                ].map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
                    className={`block px-3 py-2 rounded-md text-[12px] font-medium min-h-9 flex items-center transition-colors duration-100 ${focusMinimal} ${
                      link.active
                        ? 'bg-black/[0.06] dark:bg-white/[0.08] text-gray-900 dark:text-gray-100'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
    </motion.div>
  );
};
