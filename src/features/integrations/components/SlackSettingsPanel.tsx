import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Hash, Loader2, Plus, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useProjectOptions } from '@features/projects';
import { useTeamOptions } from '@features/team';
import { useSlackSettings, useSlackAvailableChannels } from '../hooks/useIntegrationData';
import {
  useUpdateSlackSettings,
  useAddSlackChannel,
  useRemoveSlackChannel,
} from '../hooks/useIntegrationMutations';
import type {
  ChannelScope,
  IntegrationItem,
  SlackAvailableChannel,
  SlackChannelMapping,
  SlackSettings,
} from '../types';

interface SlackSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  integration: IntegrationItem | null;
}

const DEFAULT_SETTINGS: SlackSettings = {
  notifyOnIssueCreatedUrgent: true,
  notifyOnIssueCompleted: true,
  notifyOnIssueAssigned: false,
  notifyOnCycleStarted: true,
  notifyOnCycleCompleted: true,
  dmOnAssignment: true,
  dmOnMention: true,
  dmOnDueDateApproaching: true,
  slashCommandsEnabled: true,
};

const SettingToggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, description, checked, disabled, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
    <div className="min-w-0">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      {description && <p className="mt-0.5 text-[11px] text-gray-400">{description}</p>}
    </div>
    <button
      type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
    </button>
  </label>
);

const ChannelSelect: React.FC<{
  value: string;
  channels: SlackAvailableChannel[];
  disabled?: boolean;
  placeholder?: string;
  onChange: (id: string, name: string) => void;
}> = ({ value, channels, disabled, placeholder = 'Select a channel...', onChange }) => (
  <div className="relative">
    <Hash size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <select
      value={value}
      onChange={(e) => {
        const ch = channels.find((c) => c.id === e.target.value);
        if (ch) onChange(ch.id, `#${ch.name}`);
      }}
      disabled={disabled}
      className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-9 text-sm font-medium outline-none transition-all hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:bg-white/[0.04] dark:hover:border-white/20"
    >
      <option value="">{placeholder}</option>
      {channels.map((ch) => (
        <option key={ch.id} value={ch.id}>#{ch.name} ({ch.memberCount} members)</option>
      ))}
    </select>
    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
  </div>
);

const formatDate = (v: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const SlackSettingsPanel: React.FC<SlackSettingsPanelProps> = ({ open, onClose, integration }) => {
  const [settings, setSettings] = useState<SlackSettings>(DEFAULT_SETTINGS);
  const [initialized, setInitialized] = useState(false);
  const [addingScope, setAddingScope] = useState<{ scope: ChannelScope; scopeId?: string } | null>(null);

  const settingsQuery = useSlackSettings({ enabled: open });
  const channelsQuery = useSlackAvailableChannels({ enabled: open });
  const updateSettings = useUpdateSlackSettings();
  const addChannel = useAddSlackChannel();
  const removeChannel = useRemoveSlackChannel();

  const projectsQuery = useProjectOptions({ sort: 'name:asc', limit: 100 }, { enabled: open });
  const teamsQuery = useTeamOptions({ sort: 'name:asc', limit: 100 }, { enabled: open });

  const projects = useMemo(() => projectsQuery.data?.pages.flatMap((p) => p.items) ?? [], [projectsQuery.data]);
  const teams = useMemo(() => teamsQuery.data?.pages.flatMap((p) => p.items) ?? [], [teamsQuery.data]);
  const availableChannels = channelsQuery.data ?? [];

  // Channels from settings response (already mapped)
  const mappedChannels = settingsQuery.data?.channels ?? [];
  const defaultChannels = mappedChannels.filter((c) => c.scope === 'default');
  const urgentChannels = mappedChannels.filter((c) => c.scope === 'urgent');

  // Group project/team channels by scopeId
  const projectChannelMap = useMemo(() => {
    const map: Record<string, SlackChannelMapping[]> = {};
    for (const ch of mappedChannels) {
      if (ch.scope === 'project' && ch.scopeId) {
        (map[ch.scopeId] ??= []).push(ch);
      }
    }
    return map;
  }, [mappedChannels]);

  const teamChannelMap = useMemo(() => {
    const map: Record<string, SlackChannelMapping[]> = {};
    for (const ch of mappedChannels) {
      if (ch.scope === 'team' && ch.scopeId) {
        (map[ch.scopeId] ??= []).push(ch);
      }
    }
    return map;
  }, [mappedChannels]);

  const routedProjectIds = Object.keys(projectChannelMap);
  const routedTeamIds = Object.keys(teamChannelMap);

  useEffect(() => {
    if (!open || initialized) return;
    if (settingsQuery.data) {
      setSettings({ ...DEFAULT_SETTINGS, ...settingsQuery.data.settings });
      setInitialized(true);
    } else if (settingsQuery.isError || (settingsQuery.isFetched && !settingsQuery.data)) {
      setInitialized(true);
    }
  }, [open, settingsQuery.data, settingsQuery.isError, settingsQuery.isFetched, initialized]);

  useEffect(() => {
    if (!open) {
      setSettings(DEFAULT_SETTINGS);
      setInitialized(false);
      setAddingScope(null);
    }
  }, [open]);

  const handleToggle = useCallback((key: keyof SlackSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    updateSettings.mutate({ [key]: value });
  }, [updateSettings]);

  const handleAddChannel = useCallback((channelId: string, channelName: string, scope: ChannelScope, scopeId?: string) => {
    addChannel.mutate({ channelId, channelName, scope, scopeId });
    setAddingScope(null);
  }, [addChannel]);

  const handleRemoveChannel = useCallback((dbId: string) => {
    removeChannel.mutate(dbId);
  }, [removeChannel]);

  const isSaving = updateSettings.isPending || addChannel.isPending || removeChannel.isPending;
  const isLoadingChannels = channelsQuery.isLoading;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-border-dark dark:bg-bg-dark"
          >
            <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-border-dark">
              <h2 className="text-lg font-semibold">Slack Settings</h2>
              <button type="button" onClick={onClose} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"><X size={18} /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Default Channel */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Default Channel</h3>
                <p className="text-[11px] text-gray-400">All notifications go here unless overridden below</p>
                {defaultChannels.map((ch) => (
                  <div key={ch.id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2 dark:border-border-dark dark:bg-white/[0.02]">
                    <Hash size={12} className="shrink-0 text-gray-400" />
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">{ch.channelName}</span>
                    <button type="button" onClick={() => handleRemoveChannel(ch.id)} disabled={isSaving} className="shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500 disabled:opacity-50"><X size={12} /></button>
                  </div>
                ))}
                {defaultChannels.length === 0 && !isLoadingChannels && (
                  <ChannelSelect value="" channels={availableChannels} disabled={isSaving} onChange={(id, name) => handleAddChannel(id, name, 'default')} />
                )}
                {isLoadingChannels && (
                  <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Loading channels...</div>
                )}
              </section>

              {/* Project Channels */}
              {!isLoadingChannels && availableChannels.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Project Channels</h3>
                  <p className="text-[11px] text-gray-400">Route project notifications to specific channels</p>
                  <div className="space-y-3">
                    {routedProjectIds.map((projectId) => {
                      const project = projects.find((p) => p.id === projectId);
                      const channels = projectChannelMap[projectId] ?? [];
                      return (
                        <div key={projectId} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-border-dark dark:bg-white/[0.02]">
                          <p className="mb-2 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">{project?.name ?? projectId}</p>
                          <div className="space-y-1.5">
                            {channels.map((ch) => (
                              <div key={ch.id} className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 dark:bg-white/[0.04]">
                                <Hash size={12} className="shrink-0 text-gray-400" />
                                <span className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">{ch.channelName}</span>
                                <button type="button" onClick={() => handleRemoveChannel(ch.id)} disabled={isSaving} className="shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500 disabled:opacity-50"><X size={12} /></button>
                              </div>
                            ))}
                            {addingScope?.scope === 'project' && addingScope.scopeId === projectId ? (
                              <ChannelSelect value="" channels={availableChannels} disabled={isSaving} placeholder="+ Add channel..." onChange={(id, name) => handleAddChannel(id, name, 'project', projectId)} />
                            ) : (
                              <button type="button" onClick={() => setAddingScope({ scope: 'project', scopeId: projectId })} className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"><Plus size={11} /> Add channel</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {/* Pending project — selected but no channels saved yet */}
                    {addingScope?.scope === 'project' && addingScope.scopeId && !routedProjectIds.includes(addingScope.scopeId) && (
                      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-border-dark dark:bg-white/[0.02]">
                        <p className="mb-2 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {projects.find((p) => p.id === addingScope.scopeId)?.name ?? addingScope.scopeId}
                        </p>
                        <ChannelSelect value="" channels={availableChannels} disabled={isSaving} placeholder="Select a channel..." onChange={(id, name) => handleAddChannel(id, name, 'project', addingScope.scopeId)} />
                      </div>
                    )}

                    {addingScope?.scope === 'project' && !addingScope.scopeId && (
                      <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-2.5">
                        <div className="relative">
                          <select defaultValue="" onChange={(e) => { if (e.target.value) setAddingScope({ scope: 'project', scopeId: e.target.value }); }} className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm outline-none dark:border-border-dark dark:bg-white/[0.04]">
                            <option value="">Select a project...</option>
                            {projects.filter((p) => !routedProjectIds.includes(p.id)).map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    {!addingScope?.scopeId && <button type="button" onClick={() => setAddingScope({ scope: 'project' })} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"><Plus size={12} /> Add project</button>}
                  </div>
                </section>
              )}

              {/* Team Channels */}
              {!isLoadingChannels && availableChannels.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Team Channels</h3>
                  <p className="text-[11px] text-gray-400">Route team cycle/sprint notifications to specific channels</p>
                  <div className="space-y-3">
                    {routedTeamIds.map((teamId) => {
                      const team = teams.find((t) => t.id === teamId);
                      const channels = teamChannelMap[teamId] ?? [];
                      return (
                        <div key={teamId} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-border-dark dark:bg-white/[0.02]">
                          <p className="mb-2 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">{team?.name ?? teamId}</p>
                          <div className="space-y-1.5">
                            {channels.map((ch) => (
                              <div key={ch.id} className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 dark:bg-white/[0.04]">
                                <Hash size={12} className="shrink-0 text-gray-400" />
                                <span className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">{ch.channelName}</span>
                                <button type="button" onClick={() => handleRemoveChannel(ch.id)} disabled={isSaving} className="shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500 disabled:opacity-50"><X size={12} /></button>
                              </div>
                            ))}
                            {addingScope?.scope === 'team' && addingScope.scopeId === teamId ? (
                              <ChannelSelect value="" channels={availableChannels} disabled={isSaving} placeholder="+ Add channel..." onChange={(id, name) => handleAddChannel(id, name, 'team', teamId)} />
                            ) : (
                              <button type="button" onClick={() => setAddingScope({ scope: 'team', scopeId: teamId })} className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"><Plus size={11} /> Add channel</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {/* Pending team — selected but no channels saved yet */}
                    {addingScope?.scope === 'team' && addingScope.scopeId && !routedTeamIds.includes(addingScope.scopeId) && (
                      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-border-dark dark:bg-white/[0.02]">
                        <p className="mb-2 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {teams.find((t) => t.id === addingScope.scopeId)?.name ?? addingScope.scopeId}
                        </p>
                        <ChannelSelect value="" channels={availableChannels} disabled={isSaving} placeholder="Select a channel..." onChange={(id, name) => handleAddChannel(id, name, 'team', addingScope.scopeId)} />
                      </div>
                    )}

                    {addingScope?.scope === 'team' && !addingScope.scopeId && (
                      <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-2.5">
                        <div className="relative">
                          <select defaultValue="" onChange={(e) => { if (e.target.value) setAddingScope({ scope: 'team', scopeId: e.target.value }); }} className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm outline-none dark:border-border-dark dark:bg-white/[0.04]">
                            <option value="">Select a team...</option>
                            {teams.filter((t) => !routedTeamIds.includes(t.id)).map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    {!addingScope?.scopeId && <button type="button" onClick={() => setAddingScope({ scope: 'team' })} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"><Plus size={12} /> Add team</button>}
                  </div>
                </section>
              )}

              {/* Urgent Channel */}
              {!isLoadingChannels && availableChannels.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Urgent / High Priority</h3>
                  <p className="text-[11px] text-gray-400">Posts here in addition to the resolved channel</p>
                  {urgentChannels.map((ch) => (
                    <div key={ch.id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2 dark:border-border-dark dark:bg-white/[0.02]">
                      <Hash size={12} className="shrink-0 text-gray-400" />
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-600 dark:text-gray-300">{ch.channelName}</span>
                      <button type="button" onClick={() => handleRemoveChannel(ch.id)} disabled={isSaving} className="shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500 disabled:opacity-50"><X size={12} /></button>
                    </div>
                  ))}
                  {urgentChannels.length === 0 && (
                    <ChannelSelect value="" channels={availableChannels} disabled={isSaving} placeholder="No urgent channel" onChange={(id, name) => handleAddChannel(id, name, 'urgent')} />
                  )}
                </section>
              )}

              {/* Channel Notifications */}
              <section className="space-y-1 border-t border-gray-100 pt-6 dark:border-border-dark">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Channel Notifications</h3>
                <div className="space-y-0.5">
                  <SettingToggle label="Issue created (high/urgent only)" checked={settings.notifyOnIssueCreatedUrgent} disabled={isSaving} onChange={(v) => handleToggle('notifyOnIssueCreatedUrgent', v)} />
                  <SettingToggle label="Issue completed" checked={settings.notifyOnIssueCompleted} disabled={isSaving} onChange={(v) => handleToggle('notifyOnIssueCompleted', v)} />
                  <SettingToggle label="Issue assigned" checked={settings.notifyOnIssueAssigned} disabled={isSaving} onChange={(v) => handleToggle('notifyOnIssueAssigned', v)} />
                  <SettingToggle label="Cycle started" checked={settings.notifyOnCycleStarted} disabled={isSaving} onChange={(v) => handleToggle('notifyOnCycleStarted', v)} />
                  <SettingToggle label="Cycle completed" checked={settings.notifyOnCycleCompleted} disabled={isSaving} onChange={(v) => handleToggle('notifyOnCycleCompleted', v)} />
                </div>
              </section>

              {/* Direct Messages */}
              <section className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Direct Messages</h3>
                <div className="space-y-0.5">
                  <SettingToggle label="Issue assigned to you" checked={settings.dmOnAssignment} disabled={isSaving} onChange={(v) => handleToggle('dmOnAssignment', v)} />
                  <SettingToggle label="Mentioned in comment" checked={settings.dmOnMention} disabled={isSaving} onChange={(v) => handleToggle('dmOnMention', v)} />
                  <SettingToggle label="Due date reminders (1 day before)" checked={settings.dmOnDueDateApproaching} disabled={isSaving} onChange={(v) => handleToggle('dmOnDueDateApproaching', v)} />
                </div>
              </section>

              {/* Slash Commands */}
              <section className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Slash Commands</h3>
                <div className="space-y-0.5">
                  <SettingToggle label="Enable /linearis commands" description="Create issues, check status, view sprint from Slack" checked={settings.slashCommandsEnabled} disabled={isSaving} onChange={(v) => handleToggle('slashCommandsEnabled', v)} />
                </div>
              </section>

              {/* Connection */}
              {integration?.connectedBy && (
                <section className="space-y-2 border-t border-gray-100 pt-6 dark:border-border-dark">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Connection</h3>
                  <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    <p>Connected by <span className="font-medium text-gray-700 dark:text-gray-200">{integration.connectedBy.name}</span></p>
                    {integration.connectedAt && <p className="mt-1 text-xs text-gray-400">{formatDate(integration.connectedAt)}</p>}
                    {settingsQuery.data?.team && <p className="mt-1 text-xs text-gray-400">Workspace: {settingsQuery.data.team.name}</p>}
                  </div>
                </section>
              )}
            </div>

            {isSaving && (
              <div className="flex items-center gap-2 border-t border-gray-100 px-6 py-3 text-xs text-gray-400 dark:border-border-dark">
                <Loader2 size={12} className="animate-spin" /> Saving...
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
