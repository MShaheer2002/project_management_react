import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  selectedIssueId: string | null;
  setSelectedIssueId: (id: string | null) => void;
  // Trussen AI Panel (Phase 20B)
  isAiPanelOpen: boolean;
  setAiPanelOpen: (open: boolean) => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
      isCommandPaletteOpen: false,
      setCommandPaletteOpen: (open) =>
        set((state) => ({
          isCommandPaletteOpen: typeof open === 'function' ? open(state.isCommandPaletteOpen) : open,
        })),
      selectedIssueId: null,
      setSelectedIssueId: (id) => set({ selectedIssueId: id }),
      isAiPanelOpen: false,
      setAiPanelOpen: (open) => set({ isAiPanelOpen: open }),
      activeConversationId: null,
      setActiveConversationId: (id) => set({ activeConversationId: id }),
    }),
    {
      name: 'app-ui',
      partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }),
    }
  )
);
