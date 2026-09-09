import React from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { ShieldAlert } from 'lucide-react';
import { useTenantStore } from '@/app/stores/useTenantStore';
import { Logo, AuthFooter } from './shared';

/**
 * NoWorkspaceAccessPage — /no-access
 *
 * Reached when a signed-in user's account isn't a member of the workspace
 * this subdomain belongs to (e.g. they're signed into their own account but
 * typed a colleague's or a different company's <slug>.trussen.app by
 * mistake). Never silently drops them into a *different* workspace they do
 * belong to — that would be more confusing while sitting on someone else's
 * subdomain, not less.
 */
export const NoWorkspaceAccessPage: React.FC = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const workspace = useTenantStore((s) => s.workspace);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-bg-dark">
      <div className="px-5 sm:px-8 py-4"><Logo /></div>

      <div className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-[420px] text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <ShieldAlert size={22} className="text-red-500" />
          </div>

          <h1 className="mt-5 text-xl font-bold dark:text-white tracking-tight">
            You don't have access to {workspace?.name || 'this workspace'}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {user?.primaryEmailAddress?.emailAddress || 'This account'} isn't a member of{' '}
            {workspace?.name ? `${workspace.name}'s` : "this company's"} workspace. If you think
            this is a mistake, ask a workspace admin to invite you — otherwise, sign in with the
            account that belongs here.
          </p>

          <button
            onClick={() => signOut({ redirectUrl: '/login' })}
            className="mt-6 w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Sign out and try a different account
          </button>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
};
