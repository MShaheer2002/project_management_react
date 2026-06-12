import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useIntegrationSettings } from '../hooks/useIntegrationData';
import { useUpdateIntegrationSettings } from '../hooks/useIntegrationMutations';
import type { GitHubSettings, IntegrationItem } from '../types';

interface GitHubSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  integration: IntegrationItem | null;
}

const DEFAULT_SETTINGS: GitHubSettings = {
  autoCompleteOnMerge: true,
  autoMoveToReviewOnPr: true,
  notifyOnPrOpen: true,
  notifyOnPrReview: true,
  notifyOnPrMerge: true,
  showCommits: true,
  showBranches: true,
};

interface SettingToggleProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  checked,
  disabled,
  onChange,
}) => (
  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  </label>
);

const formatDate = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const GitHubSettingsPanel: React.FC<GitHubSettingsPanelProps> = ({
  open,
  onClose,
  integration,
}) => {
  const [settings, setSettings] = useState<GitHubSettings>(DEFAULT_SETTINGS);
  const updateSettings = useUpdateIntegrationSettings();
  const settingsQuery = useIntegrationSettings<Partial<GitHubSettings>>('github', {
    enabled: open,
  });

  // Load saved settings when panel opens, reset when it closes
  useEffect(() => {
    if (open && settingsQuery.data) {
      setSettings({ ...DEFAULT_SETTINGS, ...settingsQuery.data });
    } else if (!open) {
      setSettings(DEFAULT_SETTINGS);
    }
  }, [open, settingsQuery.data]);

  const handleToggle = useCallback(
    (key: keyof GitHubSettings, value: boolean) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      updateSettings.mutate({
        provider: 'github',
        settings: { [key]: value },
      });
    },
    [updateSettings],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-border-dark dark:bg-bg-dark"
          >
            <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-border-dark">
              <h2 className="text-lg font-semibold">GitHub Settings</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Automation
                </h3>
                <div className="space-y-0.5">
                  <SettingToggle
                    label='Auto-complete issue when PR is merged'
                    checked={settings.autoCompleteOnMerge}
                    disabled={updateSettings.isPending}
                    onChange={(v) => handleToggle('autoCompleteOnMerge', v)}
                  />
                  <SettingToggle
                    label='Move issue to "Review" when PR is opened'
                    checked={settings.autoMoveToReviewOnPr}
                    disabled={updateSettings.isPending}
                    onChange={(v) => handleToggle('autoMoveToReviewOnPr', v)}
                  />
                </div>
              </section>

              <section className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Notifications
                </h3>
                <div className="space-y-0.5">
                  <SettingToggle
                    label="Notify assignee when PR is opened"
                    checked={settings.notifyOnPrOpen}
                    disabled={updateSettings.isPending}
                    onChange={(v) => handleToggle('notifyOnPrOpen', v)}
                  />
                  <SettingToggle
                    label="Notify assignee when PR is reviewed"
                    checked={settings.notifyOnPrReview}
                    disabled={updateSettings.isPending}
                    onChange={(v) => handleToggle('notifyOnPrReview', v)}
                  />
                  <SettingToggle
                    label="Notify assignee when PR is merged"
                    checked={settings.notifyOnPrMerge}
                    disabled={updateSettings.isPending}
                    onChange={(v) => handleToggle('notifyOnPrMerge', v)}
                  />
                </div>
              </section>

              <section className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Display
                </h3>
                <div className="space-y-0.5">
                  <SettingToggle
                    label="Show commits in issue activity feed"
                    checked={settings.showCommits}
                    disabled={updateSettings.isPending}
                    onChange={(v) => handleToggle('showCommits', v)}
                  />
                  <SettingToggle
                    label="Show branches in issue activity feed"
                    checked={settings.showBranches}
                    disabled={updateSettings.isPending}
                    onChange={(v) => handleToggle('showBranches', v)}
                  />
                </div>
              </section>

              {integration?.connectedBy && (
                <section className="space-y-2 border-t border-gray-100 pt-6 dark:border-border-dark">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Connection
                  </h3>
                  <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    <p>
                      Connected by{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {integration.connectedBy.name}
                      </span>
                    </p>
                    {integration.connectedAt && (
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(integration.connectedAt)}
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>

            {updateSettings.isPending && (
              <div className="flex items-center gap-2 border-t border-gray-100 px-6 py-3 text-xs text-gray-400 dark:border-border-dark">
                <Loader2 size={12} className="animate-spin" />
                Saving...
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
