import React from 'react';
import { SearchX } from 'lucide-react';
import { useTenantStore } from '@/app/stores/useTenantStore';
import { buildLandingUrl } from '@shared/utils/tenant';
import { Logo, AuthFooter } from './shared';

/**
 * WorkspaceNotFoundPage — rendered by TenantResolver when the subdomain in
 * the URL doesn't match any real workspace (e.g. a mistyped or made-up
 * "notreal.trussen.app"). Deliberately an explicit error state, not a
 * silent redirect to the landing page — a visitor who typed a slightly
 * wrong URL should be told clearly what happened, the same way a real
 * product would (e.g. a nonexistent Slack team shows its own "this
 * workspace doesn't exist" page, not a quiet bounce to slack.com).
 */
export const WorkspaceNotFoundPage: React.FC = () => {
  const slug = useTenantStore((s) => s.slug);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-bg-dark">
      <div className="px-5 sm:px-8 py-4"><Logo /></div>

      <div className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-[420px] text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center">
            <SearchX size={22} className="text-gray-400" />
          </div>

          <h1 className="mt-5 text-xl font-bold dark:text-white tracking-tight">
            Workspace not found
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {slug ? (
              <>There's no Trussen workspace at <span className="font-medium text-gray-700 dark:text-gray-300">{slug}</span>. Double-check the link, or the company may not have signed up yet.</>
            ) : (
              "There's no Trussen workspace at this address."
            )}
          </p>

          <a
            href={buildLandingUrl('/')}
            className="mt-6 inline-flex w-full h-11 items-center justify-center rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Go to trussen.app
          </a>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
};
