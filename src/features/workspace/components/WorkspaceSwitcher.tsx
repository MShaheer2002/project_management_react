import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useWorkspaces } from '../hooks/useWorkspaceDetails';
import { useWorkspaceSwitch } from '../hooks/useWorkspaceSwitch';
import type { WorkspaceResponse } from '../services/workspaceService';

const focusMinimal = 'outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  guest: 'Guest',
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  admin: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  member: 'bg-gray-500/10 text-gray-500 dark:text-gray-400',
  guest: 'bg-gray-500/10 text-gray-400 dark:text-gray-500',
};

interface WorkspaceLogoProps {
  name: string;
  logo?: string;
  size: 'sm' | 'md';
}

const WorkspaceLogo: React.FC<WorkspaceLogoProps> = ({ name, logo, size }) => {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  if (logo) {
    return <img src={logo} alt={name} className={`${dim} rounded-md object-cover shrink-0`} />;
  }
  return (
    <div className={`${dim} rounded-md bg-primary flex items-center justify-center text-white ${textSize} font-semibold shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

export interface WorkspaceMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: string;
  disabled?: boolean;
  variant?: 'danger';
}

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
  menuItems?: WorkspaceMenuItem[];
  isLoading?: boolean;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  collapsed,
  menuItems,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const activeWorkspace = useAuthStore((s) => s.workspace);
  const { data: workspaces } = useWorkspaces();
  const switchWorkspace = useWorkspaceSwitch();

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = async (ws: WorkspaceResponse) => {
    setIsOpen(false);
    await switchWorkspace(ws);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    navigate('/org-creation?new=true');
  };

  const handleMenuItemClick = (item: WorkspaceMenuItem) => {
    setIsOpen(false);
    item.onClick();
  };

  if (!activeWorkspace) return null;

  // Collapsed mode — just the logo button
  if (collapsed) {
    return (
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-10 h-10 mx-auto flex items-center justify-center rounded-lg bg-primary text-white text-xs font-semibold transition-transform duration-150 active:scale-[0.96] ${focusMinimal}`}
          title={activeWorkspace.name}
        >
          {activeWorkspace.logo ? (
            <img src={activeWorkspace.logo} alt={activeWorkspace.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            activeWorkspace.name.charAt(0).toUpperCase()
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <SwitcherDropdown
              workspaces={workspaces}
              activeId={activeWorkspace.id}
              onSelect={handleSelect}
              onCreateNew={handleCreateNew}
              menuItems={menuItems}
              onMenuItemClick={handleMenuItemClick}
              position="left-full ml-2 top-0"
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading && !activeWorkspace.name) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="w-8 h-8 rounded-md bg-primary/20 animate-pulse shrink-0" />
        <div className="h-3 w-28 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
      </div>
    );
  }

  // Expanded mode — full trigger with name
  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors duration-150 ${focusMinimal} ${
          isOpen
            ? 'bg-black/[0.06] dark:bg-white/[0.08]'
            : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
        }`}
      >
        <WorkspaceLogo name={activeWorkspace.name} logo={activeWorkspace.logo} size="sm" />
        <div className="flex-1 text-left min-w-0">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
            {activeWorkspace.name}
          </div>
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <SwitcherDropdown
            workspaces={workspaces}
            activeId={activeWorkspace.id}
            onSelect={handleSelect}
            onCreateNew={handleCreateNew}
            menuItems={menuItems}
            onMenuItemClick={handleMenuItemClick}
            position="left-0 right-0 top-full mt-1"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface SwitcherDropdownProps {
  workspaces: WorkspaceResponse[] | undefined;
  activeId: string;
  onSelect: (ws: WorkspaceResponse) => void;
  onCreateNew: () => void;
  menuItems?: WorkspaceMenuItem[];
  onMenuItemClick: (item: WorkspaceMenuItem) => void;
  position: string;
}

const SwitcherDropdown: React.FC<SwitcherDropdownProps> = ({
  workspaces,
  activeId,
  onSelect,
  onCreateNew,
  menuItems,
  onMenuItemClick,
  position,
}) => (
  <motion.div
    initial={{ opacity: 0, y: -4, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -4, scale: 0.98 }}
    transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
    className={`absolute ${position} w-72 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl shadow-xl overflow-hidden z-50`}
  >
    {/* Header */}
    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-border-dark">
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 tracking-tight uppercase">
        Workspaces
      </p>
    </div>

    {/* Workspace list */}
    <div className="py-1 max-h-64 overflow-y-auto">
      {workspaces?.map((ws) => {
        const role = ws.role.toLowerCase();
        const isActive = ws.id === activeId;

        return (
          <button
            key={ws.id}
            type="button"
            onClick={() => onSelect(ws)}
            className={`flex items-center gap-3 w-full px-3 py-2 text-left transition-colors duration-100 ${focusMinimal} ${
              isActive
                ? 'bg-black/[0.04] dark:bg-white/[0.06]'
                : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
            }`}
          >
            <WorkspaceLogo name={ws.name} logo={ws.logo} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                  {ws.name}
                </span>
                {isActive && (
                  <Check size={13} className="text-primary shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] font-medium px-1.5 py-px rounded-full ${ROLE_COLORS[role] || ROLE_COLORS.member}`}
                >
                  {ROLE_LABELS[role] || role}
                </span>
                {(ws.unreadNotifications ?? 0) > 0 && !isActive && (
                  <span className="text-[10px] font-medium px-1.5 py-px rounded-full bg-red-500/10 text-red-500 dark:text-red-400">
                    {ws.unreadNotifications}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}

      {(!workspaces || workspaces.length === 0) && (
        <div className="px-3 py-4 text-center text-xs text-gray-400">
          No workspaces found
        </div>
      )}
    </div>

    {/* Create new workspace */}
    <div className="border-t border-gray-100 dark:border-border-dark py-1">
      <button
        type="button"
        onClick={onCreateNew}
        className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors duration-100 ${focusMinimal}`}
      >
        <Plus size={15} className="text-gray-400" />
        Create new workspace
      </button>
    </div>

    {/* Menu items (settings, logout, etc.) */}
    {menuItems && menuItems.length > 0 && (
      <div className="border-t border-gray-100 dark:border-border-dark py-1">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onMenuItemClick(item)}
            disabled={item.disabled}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors duration-100 ${focusMinimal} ${
              item.disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
            } ${
              item.variant === 'danger'
                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                : 'text-gray-600 dark:text-gray-400'
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
        ))}
      </div>
    )}
  </motion.div>
);
