import React, { createContext, useContext, useEffect } from 'react';
import { useThemeStore } from '@/app/stores/useThemeStore';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useUIStore } from '@/app/stores/useUIStore';
import { useToastStore } from '@/app/stores/useToastStore';
import { User, Organization, ModalType, Toast } from './types';
import { MOCK_USERS, MOCK_ORGANIZATIONS } from './constants';

/**
 * COMPATIBILITY LAYER — delegates to Zustand stores.
 * Consumers should migrate to importing stores directly:
 *   import { useAuthStore } from '@/app/stores';
 *   import { useToastStore } from '@/app/stores';
 * Once all consumers are migrated, delete this file.
 */

interface AppContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  organization: Organization | null;
  setOrganization: (org: Organization | null) => void;
  selectedIssueId: string | null;
  setSelectedIssueId: (id: string | null) => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize auth with mock data (temporary until real auth exists)
  const { currentUser, setCurrentUser } = useAuthStore();

  useEffect(() => {
    if (!currentUser) {
      useAuthStore.getState().setCurrentUser(MOCK_USERS[0]);
      useAuthStore.getState().setOrganization(MOCK_ORGANIZATIONS[0]);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useUIStore.getState().setCommandPaletteOpen((prev: boolean) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Bridge Zustand stores into the legacy context
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const auth = useAuthStore();
  const ui = useUIStore();
  const toast = useToastStore();

  // activeModal stays as local state for now (will be deleted in Phase 4)
  const [activeModal, setActiveModal] = React.useState<ModalType>(null);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        currentUser: auth.currentUser,
        setCurrentUser: auth.setCurrentUser,
        organization: auth.organization,
        setOrganization: auth.setOrganization,
        selectedIssueId: ui.selectedIssueId,
        setSelectedIssueId: ui.setSelectedIssueId,
        isCommandPaletteOpen: ui.isCommandPaletteOpen,
        setCommandPaletteOpen: ui.setCommandPaletteOpen,
        isSidebarCollapsed: ui.isSidebarCollapsed,
        setSidebarCollapsed: ui.setSidebarCollapsed,
        activeModal,
        setActiveModal,
        toasts: toast.toasts,
        showToast: toast.showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
