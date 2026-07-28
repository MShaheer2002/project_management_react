import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { TopNavbar } from '@shared/components/layout/TopNavbar';
import { ContextPanel } from '@/components/ContextPanel';
import { CommandPalette } from '@/components/CommandPalette';
import { ModalManager } from '@/components/modals/ModalManager';
import { AiAssistantBubble, TrussenAiPanel } from '@features/ai';
import { useUIStore } from '@/app/stores/useUIStore';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { AnimatePresence } from 'motion/react';

export const MainLayout: React.FC = () => {
  const isAiPanelOpen = useUIStore((s) => s.isAiPanelOpen);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-white dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark overflow-hidden transition-colors duration-300">
      <ModalManager />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-hidden relative">
          {/* resetKey=pathname: if a page crashes, the sidebar/nav stays usable and
              clicking to a different page automatically clears the error instead of
              leaving this page looking permanently stuck. */}
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
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
