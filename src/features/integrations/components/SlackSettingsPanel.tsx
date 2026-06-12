import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Hash, Loader2, Plus, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useProjectOptions } from '@features/projects';
import { useTeamOptions } from '@features/team';
import { useIntegrationSettings, useSlackChannels } from '../hooks/useIntegrationData';
import { useUpdateIntegrationSettings } from '../hooks/useIntegrationMutations';
import type {
  IntegrationItem,
  SlackChannel,
  SlackChannelMapping,
  SlackChannelRouting,
  SlackSettings,
} from '../types';

interface SlackSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  integration: IntegrationItem | null;
}

const EMPTY_ROUTING: SlackChannelRouting = {
  projects: {},
  teams: {},
  urgent: null,
};

const DEFAULT_SETTINGS: SlackSettings = {
  notifyOnIssueCreatedUrgent: true,
  notifyOnIssueCompleted: true,
  notifyOnIssueAssigned: true,
  notifyOnStatusChange: false,
  notifyOnCycleStarted: true,
  notifyOnCycleCompleted: true,
  notifyOnProjectCompleted: true,
  dmOnAssigned: true,
  dmOnMentioned: true,
  dmOnPrActivity: true,
  dmOnDueDateReminder: true,
  dmOnAllStatusChanges: false,
  slashCreate: true,
  slashStatus: true,
  slashMyIssues: true,
  slashCycle: true,
  defaultChannelId: null,
  defaultChannelName: null,
  channelRouting: null,
};

// ── Shared UI pieces ────────────────────────────────────────────

interface SettingToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  description,
  checked,
  disabled,
  onChange,
}) => (
  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
    <div className="min-w-0">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      {description && (
        <p className="mt-0.5 text-[11px] text-gray-400">{description}</p>
      )}
    </div>
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

interface ChannelSelectProps {
  value: string;
  channels: SlackChannel[];
  disabled?: boolean;
  placeholder?: string;
  onChange: (channelId: string) => void;
}

const ChannelSelect: React.FC<ChannelSelectProps> = ({
  value,
  channels,
  disabled,
  placeholder = 'Select a channel...',
  onChange,
}) => (
  <div className="relative">
    <Hash
      size={14}
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
    />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-9 text-sm font-medium outline-none transition-all hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:bg-white/[0.04] dark:hover:border-white/20"
    >
      <option value="">{placeholder}</option>
      {channels.map((ch) => (
        <option key={ch.id} value={ch.id}>
          #{ch.name} ({ch.memberCount} members)
        </option>
      ))}
    </select>
    <ChevronDown
      size={14}
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
    />
  </div>
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

// ── Main panel ──────────────────────────────────────────────────

export const SlackSettingsPanel: React.FC<SlackSettingsPanelProps> = ({
  open,
  onClose,
  integration,
}) => {
  const [settings, setSettings] = useState<SlackSettings>(DEFAULT_SETTINGS);
  const updateSettings = useUpdateIntegrationSettings();
  const settingsQuery = useIntegrationSettings<Partial<SlackSettings>>('slack', {
    enabled: open,
  });
  const channelsQuery = useSlackChannels({ enabled: open });

  const projectsQuery = useProjectOptions(
    { sort: 'name:asc', limit: 100 },
    { enabled: open },
  );
  const teamsQuery = useTeamOptions(
    { sort: 'name:asc', limit: 100 },
    { enabled: open },
  );

  const projects = useMemo(
    () => projectsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [projectsQuery.data],
  );
  const teams = useMemo(
    () => teamsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [teamsQuery.data],
  );
  const channels = channelsQuery.data ?? [];

  const routing = settings.channelRouting ?? EMPTY_ROUTING;

  // Load saved settings when panel opens, reset when it closes
  useEffect(() => {
    if (open && settingsQuery.data) {
      setSettings({ ...DEFAULT_SETTINGS, ...settingsQuery.data });
    } else if (!open) {
      setSettings(DEFAULT_SETTINGS);
    }
  }, [open, settingsQuery.data]);

  // ── Helpers ──

  const findChannel = useCallback(
    (channelId: string): SlackChannelMapping | null => {
      const ch = channels.find((c) => c.id === channelId);
      if (!ch) return null;
      return { channelId: ch.id, channelName: `#${ch.name}` };
    },
    [channels],
  );

  const handleToggle = useCallback(
    (key: keyof SlackSettings, value: boolean) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      updateSettings.mutate({
        provider: 'slack',
        settings: { [key]: value },
      });
    },
    [updateSettings],
  );

  const handleDefaultChannelChange = useCallback(
    (channelId: string) => {
      const mapping = findChannel(channelId);
      setSettings((prev) => ({
        ...prev,
        defaultChannelId: mapping?.channelId ?? null,
        defaultChannelName: mapping?.channelName ?? null,
      }));
      updateSettings.mutate({
        provider: 'slack',
        settings: {
          defaultChannelId: mapping?.channelId ?? null,
          defaultChannelName: mapping?.channelName ?? null,
        },
      });
    },
    [updateSettings, findChannel],
  );

  const [addingProjectRoute, setAddingProjectRoute] = useState(false);
  const [addingTeamRoute, setAddingTeamRoute] = useState(false);

  useEffect(() => {
    if (open) {
      setAddingProjectRoute(false);
      setAddingTeamRoute(false);
    }
  }, [open]);

  // Helper to persist routing change
  const persistRouting = useCallback(
    (nextRouting: SlackChannelRouting) => {
      setSettings((prev) => ({
        ...prev,
        channelRouting: nextRouting,
      }));
      updateSettings.mutate({
        provider: 'slack',
        settings: { channelRouting: nextRouting },
      });
    },
    [updateSettings],
  );

  // Add a channel to an entity (project/team). Creates the entity entry if it doesn't exist.
  const handleAddChannelToEntity = useCallback(
    (scope: 'projects' | 'teams', entityId: string, channelId: string) => {
      const mapping = findChannel(channelId);
      if (!mapping) return;

      const prevRouting = settings.channelRouting ?? EMPTY_ROUTING;
      const existing = prevRouting[scope][entityId] ?? [];
      // Prevent duplicate channels
      if (existing.some((m) => m.channelId === channelId)) return;

      const scopeMap = {
        ...prevRouting[scope],
        [entityId]: [...existing, mapping],
      };
      persistRouting({ ...prevRouting, [scope]: scopeMap });
    },
    [findChannel, settings.channelRouting, persistRouting],
  );

  // Remove a specific channel from an entity
  const handleRemoveChannelFromEntity = useCallback(
    (scope: 'projects' | 'teams', entityId: string, channelId: string) => {
      const prevRouting = settings.channelRouting ?? EMPTY_ROUTING;
      const existing = prevRouting[scope][entityId] ?? [];
      const filtered = existing.filter((m) => m.channelId !== channelId);

      const scopeMap = { ...prevRouting[scope] };
      if (filtered.length > 0) {
        scopeMap[entityId] = filtered;
      } else {
        delete scopeMap[entityId];
      }
      persistRouting({ ...prevRouting, [scope]: scopeMap });
    },
    [settings.channelRouting, persistRouting],
  );

  // Remove entity from routing entirely
  const handleRemoveEntity = useCallback(
    (scope: 'projects' | 'teams', entityId: string) => {
      const prevRouting = settings.channelRouting ?? EMPTY_ROUTING;
      const scopeMap = { ...prevRouting[scope] };
      delete scopeMap[entityId];
      persistRouting({ ...prevRouting, [scope]: scopeMap });
    },
    [settings.channelRouting, persistRouting],
  );

  const handleUrgentChannelChange = useCallback(
    (channelId: string) => {
      const mapping = findChannel(channelId);
      const prevRouting = settings.channelRouting ?? EMPTY_ROUTING;
      persistRouting({ ...prevRouting, urgent: mapping });
    },
    [findChannel, settings.channelRouting, persistRouting],
  );

  const routedProjectIds = Object.keys(routing.projects);
  const routedTeamIds = Object.keys(routing.teams);

  const isSaving = updateSettings.isPending;
  const isLoadingChannels = channelsQuery.isLoading;

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
              <h2 className="text-lg font-semibold">Slack Settings</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* ── Default Channel ── */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Default Channel
                </h3>
                <p className="text-[11px] text-gray-400">
                  All notifications go here unless overridden below
                </p>
                {isLoadingChannels ? (
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400 dark:border-border-dark dark:bg-white/[0.04]">
                    <Loader2 size={14} className="animate-spin" />
                    Loading channels...
                  </div>
                ) : channelsQuery.isError ? (
                  <div className="space-y-2">
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
                      Failed to load channels
                    </div>
                    <button
                      type="button"
                      onClick={() => channelsQuery.refetch()}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <ChannelSelect
                    value={settings.defaultChannelId ?? ''}
                    channels={channels}
                    disabled={isSaving}
                    onChange={handleDefaultChannelChange}
                  />
                )}
                {settings.defaultChannelName && (
                  <p className="text-[11px] text-green-600 dark:text-green-400">
                    Notifications will be sent to {settings.defaultChannelName}
                  </p>
                )}
              </section>

              {/* ── Project Channel Routing ── */}
              {!isLoadingChannels && channels.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Project Channels
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Route project notifications to specific channels
                  </p>

                  <div className="space-y-3">
                    {routedProjectIds.map((projectId) => {
                      const project = projects.find(
                        (p) => p.id === projectId,
                      );
                      const mappings = routing.projects[projectId] ?? [];
                      const usedChannelIds = mappings.map((m) => m.channelId);
                      const availableForThis = channels.filter(
                        (ch) => !usedChannelIds.includes(ch.id),
                      );

                      return (
                        <div
                          key={projectId}
                          className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-border-dark dark:bg-white/[0.02]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="truncate text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {project?.name ?? projectId}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveEntity('projects', projectId)
                              }
                              disabled={isSaving}
                              className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-900/20"
                              title="Remove all channels for this project"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {mappings.map((m) => (
                              <div
                                key={m.channelId}
                                className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 text-sm dark:bg-white/[0.04]"
                              >
                                <Hash size={12} className="shrink-0 text-gray-400" />
                                <span className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">
                                  {m.channelName}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveChannelFromEntity(
                                      'projects',
                                      projectId,
                                      m.channelId,
                                    )
                                  }
                                  disabled={isSaving}
                                  className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:text-red-500 disabled:opacity-50"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}

                            {availableForThis.length > 0 && (
                              <ChannelSelect
                                value=""
                                channels={availableForThis}
                                disabled={isSaving}
                                placeholder="+ Add channel..."
                                onChange={(chId) =>
                                  handleAddChannelToEntity(
                                    'projects',
                                    projectId,
                                    chId,
                                  )
                                }
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {addingProjectRoute && (
                      <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-2.5">
                        <div className="relative">
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                // Add the project with no channels yet — it shows immediately
                                const prevRouting =
                                  settings.channelRouting ?? EMPTY_ROUTING;
                                persistRouting({
                                  ...prevRouting,
                                  projects: {
                                    ...prevRouting.projects,
                                    [e.target.value]: [],
                                  },
                                });
                                setAddingProjectRoute(false);
                              }
                            }}
                            className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm outline-none dark:border-border-dark dark:bg-white/[0.04]"
                          >
                            <option value="">Select a project...</option>
                            {projects
                              .filter(
                                (p) => !routedProjectIds.includes(p.id),
                              )
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                          </select>
                          <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                        </div>
                      </div>
                    )}

                    {!addingProjectRoute && (
                      <button
                        type="button"
                        onClick={() => setAddingProjectRoute(true)}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <Plus size={12} />
                        Add project
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* ── Team Channel Routing ── */}
              {!isLoadingChannels && channels.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Team Channels
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Route team cycle/sprint notifications to specific channels
                  </p>

                  <div className="space-y-3">
                    {routedTeamIds.map((teamId) => {
                      const team = teams.find((t) => t.id === teamId);
                      const mappings = routing.teams[teamId] ?? [];
                      const usedChannelIds = mappings.map((m) => m.channelId);
                      const availableForThis = channels.filter(
                        (ch) => !usedChannelIds.includes(ch.id),
                      );

                      return (
                        <div
                          key={teamId}
                          className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-border-dark dark:bg-white/[0.02]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="truncate text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {team?.name ?? teamId}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveEntity('teams', teamId)
                              }
                              disabled={isSaving}
                              className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-900/20"
                              title="Remove all channels for this team"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {mappings.map((m) => (
                              <div
                                key={m.channelId}
                                className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 text-sm dark:bg-white/[0.04]"
                              >
                                <Hash size={12} className="shrink-0 text-gray-400" />
                                <span className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">
                                  {m.channelName}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveChannelFromEntity(
                                      'teams',
                                      teamId,
                                      m.channelId,
                                    )
                                  }
                                  disabled={isSaving}
                                  className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:text-red-500 disabled:opacity-50"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}

                            {availableForThis.length > 0 && (
                              <ChannelSelect
                                value=""
                                channels={availableForThis}
                                disabled={isSaving}
                                placeholder="+ Add channel..."
                                onChange={(chId) =>
                                  handleAddChannelToEntity(
                                    'teams',
                                    teamId,
                                    chId,
                                  )
                                }
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {addingTeamRoute && (
                      <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-2.5">
                        <div className="relative">
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                const prevRouting =
                                  settings.channelRouting ?? EMPTY_ROUTING;
                                persistRouting({
                                  ...prevRouting,
                                  teams: {
                                    ...prevRouting.teams,
                                    [e.target.value]: [],
                                  },
                                });
                                setAddingTeamRoute(false);
                              }
                            }}
                            className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm outline-none dark:border-border-dark dark:bg-white/[0.04]"
                          >
                            <option value="">Select a team...</option>
                            {teams
                              .filter(
                                (t) => !routedTeamIds.includes(t.id),
                              )
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                          </select>
                          <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                        </div>
                      </div>
                    )}

                    {!addingTeamRoute && (
                      <button
                        type="button"
                        onClick={() => setAddingTeamRoute(true)}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <Plus size={12} />
                        Add team
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* ── Urgent / High Priority Channel ── */}
              {!isLoadingChannels && channels.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Urgent / High Priority
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Urgent and high priority issues always post here (in addition
                    to the resolved channel)
                  </p>
                  <ChannelSelect
                    value={routing.urgent?.channelId ?? ''}
                    channels={channels}
                    disabled={isSaving}
                    placeholder="No urgent channel"
                    onChange={handleUrgentChannelChange}
                  />
                </section>
              )}

              {/* ── Channel Notifications ── */}
              <section className="space-y-1 border-t border-gray-100 pt-6 dark:border-border-dark">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Channel Notifications
                </h3>
                <p className="text-[11px] text-gray-400 pb-1">
                  Events posted to your configured Slack channel
                </p>
                <div className="space-y-0.5">
                  <SettingToggle
                    label="Issue created (high/urgent only)"
                    checked={settings.notifyOnIssueCreatedUrgent}
                    disabled={isSaving}
                    onChange={(v) =>
                      handleToggle('notifyOnIssueCreatedUrgent', v)
                    }
                  />
                  <SettingToggle
                    label="Issue completed"
                    checked={settings.notifyOnIssueCompleted}
                    disabled={isSaving}
                    onChange={(v) =>
                      handleToggle('notifyOnIssueCompleted', v)
                    }
                  />
                  <SettingToggle
                    label="Issue assigned"
                    checked={settings.notifyOnIssueAssigned}
                    disabled={isSaving}
                    onChange={(v) =>
                      handleToggle('notifyOnIssueAssigned', v)
                    }
                  />
                  <SettingToggle
                    label="Issue status changed (all statuses)"
                    checked={settings.notifyOnStatusChange}
                    disabled={isSaving}
                    onChange={(v) =>
                      handleToggle('notifyOnStatusChange', v)
                    }
                  />
                  <SettingToggle
                    label="Cycle started"
                    checked={settings.notifyOnCycleStarted}
                    disabled={isSaving}
                    onChange={(v) =>
                      handleToggle('notifyOnCycleStarted', v)
                    }
                  />
                  <SettingToggle
                    label="Cycle completed"
                    checked={settings.notifyOnCycleCompleted}
                    disabled={isSaving}
                    onChange={(v) =>
                      handleToggle('notifyOnCycleCompleted', v)
                    }
                  />
                  <SettingToggle
                    label="Project completed"
                    checked={settings.notifyOnProjectCompleted}
                    disabled={isSaving}
                    onChange={(v) =>
                      handleToggle('notifyOnProjectCompleted', v)
                    }
                  />
                </div>
              </section>

              {/* ── Direct Messages ── */}
              <section className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Direct Messages
                </h3>
                <p className="text-[11px] text-gray-400 pb-1">
                  Personal Slack DMs sent to individual team members
                </p>
                <div className="space-y-0.5">
                  <SettingToggle
                    label="Issue assigned to you"
                    checked={settings.dmOnAssigned}
                    disabled={isSaving}
                    onChange={(v) => handleToggle('dmOnAssigned', v)}
                  />
                  <SettingToggle
                    label="Mentioned in comment"
                    checked={settings.dmOnMentioned}
                    disabled={isSaving}
                    onChange={(v) => handleToggle('dmOnMentioned', v)}
                  />
                  <SettingToggle
                    label="PR activity on your issues"
                    description="Requires GitHub integration to be connected"
                    checked={settings.dmOnPrActivity}
                    disabled={isSaving}
                    onChange={(v) => handleToggle('dmOnPrActivity', v)}
                  />
                  <SettingToggle
                    label="Due date reminders (1 day before)"
                    checked={settings.dmOnDueDateReminder}
                    disabled={isSaving}
                    onChange={(v) =>
                      handleToggle('dmOnDueDateReminder', v)
                    }
                  />
                  <SettingToggle
                    label="All status changes on your issues"
                    checked={settings.dmOnAllStatusChanges}
                    disabled={isSaving}
                    onChange={(v) =>
                      handleToggle('dmOnAllStatusChanges', v)
                    }
                  />
                </div>
              </section>

              {/* ── Slash Commands ── */}
              <section className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Slash Commands
                </h3>
                <p className="text-[11px] text-gray-400 pb-1">
                  Commands available to your team in Slack
                </p>
                <div className="space-y-0.5">
                  <SettingToggle
                    label="/linearis create"
                    description="Create issues directly from Slack"
                    checked={settings.slashCreate}
                    disabled={isSaving}
                    onChange={(v) => handleToggle('slashCreate', v)}
                  />
                  <SettingToggle
                    label="/linearis status"
                    description="Check issue status from Slack"
                    checked={settings.slashStatus}
                    disabled={isSaving}
                    onChange={(v) => handleToggle('slashStatus', v)}
                  />
                  <SettingToggle
                    label="/linearis my-issues"
                    description="View your assigned issues"
                    checked={settings.slashMyIssues}
                    disabled={isSaving}
                    onChange={(v) => handleToggle('slashMyIssues', v)}
                  />
                  <SettingToggle
                    label="/linearis cycle"
                    description="View current sprint progress"
                    checked={settings.slashCycle}
                    disabled={isSaving}
                    onChange={(v) => handleToggle('slashCycle', v)}
                  />
                </div>
              </section>

              {/* ── Connection info ── */}
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

            {isSaving && (
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
