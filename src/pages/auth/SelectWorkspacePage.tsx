import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import { Building2, Check, Loader2, Plus } from 'lucide-react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useWorkspaces, useWorkspaceSwitch } from '@features/workspace';
import type { WorkspaceResponse } from '@features/workspace';
import { Logo } from './shared';

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400',
  admin: 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400',
  member: 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-500',
  guest: 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-500',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  guest: 'Guest',
};

export const SelectWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();
  const activeWorkspace = useAuthStore((s) => s.workspace);
  const { data: workspaces, isLoading } = useWorkspaces();
  const switchWorkspace = useWorkspaceSwitch();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-bg-dark">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  const handleSelect = async (ws: WorkspaceResponse) => {
    if (ws.id === activeWorkspace?.id) {
      navigate('/dashboard', { replace: true });
      return;
    }
    await switchWorkspace(ws);
  };

  const handleCreateNew = () => {
    navigate('/org-creation?new=true');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-bg-dark selection:bg-primary/30">
      {/* Top bar */}
      <div className="px-5 sm:px-8 py-5">
        <Logo />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Building2 size={28} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight dark:text-white">
              Select a workspace
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Choose which workspace to open.
            </p>
          </div>

          {/* Workspace list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-2">
              {workspaces?.map((ws, i) => {
                const role = ws.role.toLowerCase();
                const isActive = ws.id === activeWorkspace?.id;

                return (
                  <motion.button
                    key={ws.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    onClick={() => handleSelect(ws)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-150 text-left group ${
                      isActive
                        ? 'border-primary/20 bg-primary/[0.03] dark:bg-primary/[0.05]'
                        : 'border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/[0.12] hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Logo */}
                    {ws.logo ? (
                      <img
                        src={ws.logo}
                        alt={ws.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-semibold shrink-0">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {ws.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">Current</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-px rounded-full ${ROLE_COLORS[role] || ROLE_COLORS.member}`}>
                          {ROLE_LABELS[role] || role}
                        </span>
                        {ws.slug && (
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                            {ws.slug}.linearis.app
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow / Check */}
                    <div className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                      isActive
                        ? 'text-primary'
                        : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-400'
                    }`}>
                      {isActive ? (
                        <Check size={15} strokeWidth={2.5} />
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-0.5">
                          <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </motion.button>
                );
              })}

              {/* Create new workspace */}
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: (workspaces?.length ?? 0) * 0.05 }}
                onClick={handleCreateNew}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] text-left transition-all duration-150 hover:border-gray-300 dark:hover:border-white/[0.15] hover:bg-gray-50 dark:hover:bg-white/[0.03] group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                  <Plus size={18} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    Create new workspace
                  </span>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    Start a new team or organization
                  </p>
                </div>
              </motion.button>
            </div>
          )}

          {/* Back link if user has an active workspace */}
          {activeWorkspace && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/dashboard', { replace: true })}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Back to {activeWorkspace.name}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
