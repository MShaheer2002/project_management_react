import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { TopNavbar } from '@shared/components/layout/TopNavbar';
import { ContextPanel } from '@/components/ContextPanel';
import { CommandPalette } from '@/components/CommandPalette';
import { ModalManager } from '@/components/modals/ModalManager';
import { ToastContainer } from '@/components/ToastContainer';
import { AiAssistantBubble, TrussenAiPanel } from '@features/ai';
import { useUIStore } from '@/app/stores/useUIStore';
import { AnimatePresence } from 'motion/react';

export const MainLayout: React.FC = () => {
  const isAiPanelOpen = useUIStore((s) => s.isAiPanelOpen);

  return (
    <div className="flex h-screen bg-white dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark overflow-hidden transition-colors duration-300">
      <ModalManager />
      <ToastContainer />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
      {/* Trussen AI Panel — pushes content, part of flex layout */}
      {isAiPanelOpen && <TrussenAiPanel />}
      <AiAssistantBubble />
      <AnimatePresence>
        <ContextPanel />
      </AnimatePresence>
      <AnimatePresence>
        <CommandPalette />
      </AnimatePresence>
    </div>
  );
};
