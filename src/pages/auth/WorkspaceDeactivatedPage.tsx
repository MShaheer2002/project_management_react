import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import { ArchiveRestore, Loader2, ShieldOff } from 'lucide-react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import { useRestoreWorkspace, useWorkspaces } from '@features/workspace';
import { buildLandingUrl } from '@shared/utils/tenant';
import { Logo, AuthFooter } from './shared';

const DAY_MS = 24 * 60 * 60 * 1000;
const GRACE_DAYS = 30;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * WorkspaceDeactivatedPage — /workspace-deactivated
 *
 * The owner deleted this workspace (soft delete): it's closed to everyone
 * until it is restored or permanently deleted at purgeAt. The owner gets the
 * restore screen; everyone else, admins included, only learns that it was
 * "Deactivated by Owner". AuthGuard, the API error interceptor and the
 * realtime socket all send users here.
 */
export const WorkspaceDeactivatedPage: React.FC = () => {
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const workspace = useAuthStore((s) => s.workspace);
  const setWorkspace = useAuthStore((s) => s.setWorkspace);
  const authSyncStatus = useAuthStore((s) => s.authSyncStatus);
  const showToast = useToastStore((s) => s.showToast);
  const restore = useRestoreWorkspace();
  const { data: workspaces } = useWorkspaces();

  if (!isLoaded || (isSignedIn && authSyncStatus !== 'ready')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-bg-dark">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }
  if (!isSignedIn) return <Navigate to="/login" replace />;
  if (!workspace) return <Navigate to="/" replace />;
  if (!workspace.deactivatedAt) return <Navigate to="/dashboard" replace />;

  const isOwner = workspace.role === 'owner';
  const purgeAt = workspace.purgeAt ?? null;
  const daysLeft = purgeAt ? Math.max(0, Math.ceil((new Date(purgeAt).getTime() - Date.now()) / DAY_MS)) : null;
  const hasOtherWorkspaces = (workspaces ?? []).some((ws) => ws.id !== workspace.id && !ws.deactivatedAt);

  const handleRestore = async () => {
    try {
      await restore.mutateAsync();
      setWorkspace({ ...workspace, deactivatedAt: null, purgeAt: null });
      showToast(`${workspace.name} has been restored.`, 'success', 'Workspace restored');
      // Full reload: every query, the socket and the sidebar start fresh.
      window.location.href = '/dashboard';
    } catch {
      // The API interceptor already shows the reason (e.g. deletion in progress).
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ redirectUrl: '/login' });
    } catch (error) {
      console.error('[WorkspaceDeactivatedPage] Sign out failed:', error);
      showToast('Failed to sign out. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-bg-dark">
      <div className="px-5 sm:px-8 py-4"><Logo /></div>

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[440px] text-center"
        >
          {isOwner ? (
            <>
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <ArchiveRestore size={22} className="text-amber-500" />
              </div>
              <h1 className="mt-5 text-xl font-bold dark:text-white tracking-tight">
                {workspace.name} is scheduled for deletion
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You deleted this workspace. Members can't sign in, and its subscription won't renew.
                Restore it to bring everything back exactly as it was.
              </p>

              {daysLeft !== null && purgeAt && (
                <div className="mt-6 rounded-2xl border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-white/[0.02] px-5 py-5">
                  <div className={`text-3xl font-bold tracking-tight ${daysLeft <= 5 ? 'text-red-500' : 'text-amber-500'}`}>
                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                  </div>
                  <div
                    className="mt-3 h-1.5 rounded-full bg-gray-200 dark:bg-white/[0.06] overflow-hidden"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={GRACE_DAYS}
                    aria-valuenow={GRACE_DAYS - daysLeft}
                    aria-label="Time until permanent deletion"
                  >
                    <div
                      className={`h-full rounded-full ${daysLeft <= 5 ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, ((GRACE_DAYS - daysLeft) / GRACE_DAYS) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Permanently deleted on {formatDate(purgeAt)}, with all issues, projects, documents and files.
                  </p>
                </div>
              )}

              <button
                onClick={handleRestore}
                disabled={restore.isPending}
                className="mt-6 w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {restore.isPending && <Loader2 size={16} className="animate-spin" />}
                Restore workspace
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <ShieldOff size={22} className="text-red-500" />
              </div>
              <h1 className="mt-5 text-xl font-bold dark:text-white tracking-tight">Deactivated by Owner</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {workspace.name} has been deactivated by its owner, so it can't be used right now. If you
                think this is a mistake, contact the workspace owner.
              </p>
            </>
          )}

          <div className="mt-3 flex flex-col gap-2">
            {hasOtherWorkspaces && (
              <button
                onClick={() => { window.location.href = buildLandingUrl('/select-workspace'); }}
                className="w-full h-11 rounded-xl border border-gray-200 dark:border-border-dark text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Switch to another workspace
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="w-full h-10 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        </motion.div>
      </div>

      <AuthFooter />
    </div>
  );
};
