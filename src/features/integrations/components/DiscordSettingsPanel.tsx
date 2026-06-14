import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Plus, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useProjectOptions } from '@features/projects';
import { useTeamOptions } from '@features/team';
import { useDiscordSettings } from '../hooks/useIntegrationData';
import {
  useUpdateDiscordSettings,
  useAddDiscordWebhook,
  useRemoveDiscordWebhook,
} from '../hooks/useIntegrationMutations';
import {
  DISCORD_WEBHOOK_REGEX,
  type ChannelScope,
  type DiscordSettings,
  type DiscordWebhookMapping,
  type IntegrationItem,
} from '../types';

interface DiscordSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  integration: IntegrationItem | null;
}

const DEFAULT_SETTINGS: DiscordSettings = {
  notifyOnIssueCreatedUrgent: true,
  notifyOnIssueCompleted: true,
  notifyOnIssueAssigned: false,
  notifyOnStatusChange: false,
  notifyOnCycleStarted: true,
  notifyOnCycleCompleted: true,
  notifyOnProjectCompleted: true,
};

const SettingToggle: React.FC<{
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, checked, disabled, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    <button
      type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-[#5865F2]' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
    </button>
  </label>
);

/** Inline form for pasting a webhook URL + label */
const WebhookAddForm: React.FC<{
  disabled?: boolean;
  onAdd: (url: string, label: string) => void;
  onCancel: () => void;
}> = ({ disabled, onAdd, onCancel }) => {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!url.trim()) { setError('Webhook URL is required'); return; }
    if (!DISCORD_WEBHOOK_REGEX.test(url.trim())) { setError('Invalid Discord webhook URL'); return; }
    onAdd(url.trim(), label.trim() || url.trim().slice(0, 40));
  };

  return (
    <div className="space-y-2 rounded-lg border border-[#5865F2]/20 bg-[#5865F2]/[0.03] p-3">
      <input type="url" value={url} onChange={(e) => { setUrl(e.target.value); if (error) setError(null); }} placeholder="https://discord.com/api/webhooks/..." disabled={disabled} className={`w-full rounded-lg border px-3 py-2 text-xs outline-none transition-all focus:ring-2 focus:ring-[#5865F2]/20 dark:bg-white/[0.04] ${error ? 'border-red-300 dark:border-red-800' : 'border-gray-200 dark:border-border-dark'}`} />
      {error && <div className="flex items-center gap-1 text-[10px] text-red-500"><AlertCircle size={10} />{error}</div>}
      <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. #mobile-dev)" disabled={disabled} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none transition-all focus:ring-2 focus:ring-[#5865F2]/20 dark:border-border-dark dark:bg-white/[0.04]" />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-gray-500">Cancel</button>
        <button type="button" onClick={handleSubmit} disabled={disabled} className="rounded-md bg-[#5865F2] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#4752C4] disabled:opacity-50">Add Webhook</button>
      </div>
    </div>
  );
};

const formatDate = (v: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const DiscordSettingsPanel: React.FC<DiscordSettingsPanelProps> = ({ open, onClose, integration }) => {
  const [settings, setSettings] = useState<DiscordSettings>(DEFAULT_SETTINGS);
  const [initialized, setInitialized] = useState(false);
  const [addingFor, setAddingFor] = useState<string | null>(null); // "project:<id>" | "team:<id>" | "urgent" | "default"
  const [addingProject, setAddingProject] = useState(false);
  const [addingTeam, setAddingTeam] = useState(false);

  const settingsQuery = useDiscordSettings({ enabled: open });
  const updateSettings = useUpdateDiscordSettings();
  const addWebhook = useAddDiscordWebhook();
  const removeWebhook = useRemoveDiscordWebhook();

  const projectsQuery = useProjectOptions({ sort: 'name:asc', limit: 100 }, { enabled: open });
  const teamsQuery = useTeamOptions({ sort: 'name:asc', limit: 100 }, { enabled: open });
  const projects = useMemo(() => projectsQuery.data?.pages.flatMap((p) => p.items) ?? [], [projectsQuery.data]);
  const teams = useMemo(() => teamsQuery.data?.pages.flatMap((p) => p.items) ?? [], [teamsQuery.data]);

  const webhooks = settingsQuery.data?.webhooks ?? [];
  const defaultWebhooks = webhooks.filter((w) => w.scope === 'default');
  const urgentWebhooks = webhooks.filter((w) => w.scope === 'urgent');

  const projectWebhookMap = useMemo(() => {
    const map: Record<string, DiscordWebhookMapping[]> = {};
    for (const w of webhooks) {
      if (w.scope === 'project' && w.scopeId) (map[w.scopeId] ??= []).push(w);
    }
    return map;
  }, [webhooks]);

  const teamWebhookMap = useMemo(() => {
    const map: Record<string, DiscordWebhookMapping[]> = {};
    for (const w of webhooks) {
      if (w.scope === 'team' && w.scopeId) (map[w.scopeId] ??= []).push(w);
    }
    return map;
  }, [webhooks]);

  const routedProjectIds = Object.keys(projectWebhookMap);
  const routedTeamIds = Object.keys(teamWebhookMap);

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
      setAddingFor(null);
      setAddingProject(false);
      setAddingTeam(false);
    }
  }, [open]);

  const handleToggle = useCallback((key: keyof DiscordSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    updateSettings.mutate({ [key]: value });
  }, [updateSettings]);

  const handleAddWebhook = useCallback((url: string, label: string, scope: ChannelScope, scopeId?: string) => {
    addWebhook.mutate({ url, label, scope, scopeId });
    setAddingFor(null);
  }, [addWebhook]);

  const handleRemoveWebhook = useCallback((dbId: string) => {
    removeWebhook.mutate(dbId);
  }, [removeWebhook]);

  const isSaving = updateSettings.isPending || addWebhook.isPending || removeWebhook.isPending;

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
              <h2 className="text-lg font-semibold">Discord Settings</h2>
              <button type="button" onClick={onClose} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"><X size={18} /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Default Webhook */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Default Webhook</h3>
                <p className="text-[11px] text-gray-400">All notifications go here unless overridden</p>
                {defaultWebhooks.map((w) => (
                  <div key={w.id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5 dark:border-border-dark dark:bg-white/[0.02]">
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">{w.label}</span>
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">Connected</span>
                  </div>
                ))}
              </section>

              {/* Notification Toggles */}
              <section className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Channel Notifications</h3>
                <div className="space-y-0.5">
                  <SettingToggle label="Urgent/high issue created" checked={settings.notifyOnIssueCreatedUrgent} disabled={isSaving} onChange={(v) => handleToggle('notifyOnIssueCreatedUrgent', v)} />
                  <SettingToggle label="Issue completed" checked={settings.notifyOnIssueCompleted} disabled={isSaving} onChange={(v) => handleToggle('notifyOnIssueCompleted', v)} />
                  <SettingToggle label="Issue assigned" checked={settings.notifyOnIssueAssigned} disabled={isSaving} onChange={(v) => handleToggle('notifyOnIssueAssigned', v)} />
                  <SettingToggle label="Issue status changed" checked={settings.notifyOnStatusChange} disabled={isSaving} onChange={(v) => handleToggle('notifyOnStatusChange', v)} />
                  <SettingToggle label="Cycle started" checked={settings.notifyOnCycleStarted} disabled={isSaving} onChange={(v) => handleToggle('notifyOnCycleStarted', v)} />
                  <SettingToggle label="Cycle completed" checked={settings.notifyOnCycleCompleted} disabled={isSaving} onChange={(v) => handleToggle('notifyOnCycleCompleted', v)} />
                  <SettingToggle label="Project completed" checked={settings.notifyOnProjectCompleted} disabled={isSaving} onChange={(v) => handleToggle('notifyOnProjectCompleted', v)} />
                </div>
              </section>

              {/* Project Webhooks */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Project Webhooks</h3>
                <p className="text-[11px] text-gray-400">Paste webhook URLs for project-specific Discord channels</p>
                <div className="space-y-3">
                  {routedProjectIds.map((projectId) => {
                    const project = projects.find((p) => p.id === projectId);
                    const whs = projectWebhookMap[projectId] ?? [];
                    return (
                      <div key={projectId} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-border-dark dark:bg-white/[0.02]">
                        <p className="mb-2 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">{project?.name ?? projectId}</p>
                        <div className="space-y-1.5">
                          {whs.map((w) => (
                            <div key={w.id} className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 dark:bg-white/[0.04]">
                              <span className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">{w.label}</span>
                              <button type="button" onClick={() => handleRemoveWebhook(w.id)} disabled={isSaving} className="shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500 disabled:opacity-50"><X size={12} /></button>
                            </div>
                          ))}
                          {addingFor === `project:${projectId}` ? (
                            <WebhookAddForm disabled={isSaving} onAdd={(url, label) => handleAddWebhook(url, label, 'project', projectId)} onCancel={() => setAddingFor(null)} />
                          ) : (
                            <button type="button" onClick={() => setAddingFor(`project:${projectId}`)} className="flex items-center gap-1 text-[11px] font-medium text-[#5865F2] hover:underline"><Plus size={11} /> Add webhook</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* Pending project — selected but no webhooks saved yet */}
                  {addingFor?.startsWith('project:') && !routedProjectIds.includes(addingFor.slice(8)) && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-border-dark dark:bg-white/[0.02]">
                      <p className="mb-2 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {projects.find((p) => p.id === addingFor?.split(':')[1])?.name ?? addingFor?.split(':')[1]}
                      </p>
                      <WebhookAddForm disabled={isSaving} onAdd={(url, label) => handleAddWebhook(url, label, 'project', addingFor?.split(':')[1])} onCancel={() => setAddingFor(null)} />
                    </div>
                  )}

                  {addingProject && (
                    <div className="rounded-lg border border-[#5865F2]/20 bg-[#5865F2]/[0.03] p-2.5">
                      <select defaultValue="" onChange={(e) => { if (e.target.value) { setAddingFor(`project:${e.target.value}`); setAddingProject(false); } }} className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm outline-none dark:border-border-dark dark:bg-white/[0.04]">
                        <option value="">Select a project...</option>
                        {projects.filter((p) => !routedProjectIds.includes(p.id)).map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {!addingProject && !addingFor?.startsWith('project:') && (
                    <button type="button" onClick={() => setAddingProject(true)} className="flex items-center gap-1.5 text-xs font-medium text-[#5865F2] hover:underline"><Plus size={12} /> Add project</button>
                  )}
                </div>
              </section>

              {/* Team Webhooks */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Team Webhooks</h3>
                <p className="text-[11px] text-gray-400">Paste webhook URLs for team-specific Discord channels</p>
                <div className="space-y-3">
                  {routedTeamIds.map((teamId) => {
                    const team = teams.find((t) => t.id === teamId);
                    const whs = teamWebhookMap[teamId] ?? [];
                    return (
                      <div key={teamId} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-border-dark dark:bg-white/[0.02]">
                        <p className="mb-2 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">{team?.name ?? teamId}</p>
                        <div className="space-y-1.5">
                          {whs.map((w) => (
                            <div key={w.id} className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 dark:bg-white/[0.04]">
                              <span className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">{w.label}</span>
                              <button type="button" onClick={() => handleRemoveWebhook(w.id)} disabled={isSaving} className="shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500 disabled:opacity-50"><X size={12} /></button>
                            </div>
                          ))}
                          {addingFor === `team:${teamId}` ? (
                            <WebhookAddForm disabled={isSaving} onAdd={(url, label) => handleAddWebhook(url, label, 'team', teamId)} onCancel={() => setAddingFor(null)} />
                          ) : (
                            <button type="button" onClick={() => setAddingFor(`team:${teamId}`)} className="flex items-center gap-1 text-[11px] font-medium text-[#5865F2] hover:underline"><Plus size={11} /> Add webhook</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* Pending team — selected but no webhooks saved yet */}
                  {addingFor?.startsWith('team:') && !routedTeamIds.includes(addingFor.slice(5)) && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-border-dark dark:bg-white/[0.02]">
                      <p className="mb-2 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {teams.find((t) => t.id === addingFor?.split(':')[1])?.name ?? addingFor?.split(':')[1]}
                      </p>
                      <WebhookAddForm disabled={isSaving} onAdd={(url, label) => handleAddWebhook(url, label, 'team', addingFor?.split(':')[1])} onCancel={() => setAddingFor(null)} />
                    </div>
                  )}

                  {addingTeam && (
                    <div className="rounded-lg border border-[#5865F2]/20 bg-[#5865F2]/[0.03] p-2.5">
                      <select defaultValue="" onChange={(e) => { if (e.target.value) { setAddingFor(`team:${e.target.value}`); setAddingTeam(false); } }} className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm outline-none dark:border-border-dark dark:bg-white/[0.04]">
                        <option value="">Select a team...</option>
                        {teams.filter((t) => !routedTeamIds.includes(t.id)).map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {!addingTeam && !addingFor?.startsWith('team:') && (
                    <button type="button" onClick={() => setAddingTeam(true)} className="flex items-center gap-1.5 text-xs font-medium text-[#5865F2] hover:underline"><Plus size={12} /> Add team</button>
                  )}
                </div>
              </section>

              {/* Urgent Webhook */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Urgent Webhook</h3>
                <p className="text-[11px] text-gray-400">Posts here in addition to project/team/default for urgent issues</p>
                {urgentWebhooks.map((w) => (
                  <div key={w.id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5 dark:border-border-dark dark:bg-white/[0.02]">
                    <span className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">{w.label}</span>
                    <button type="button" onClick={() => handleRemoveWebhook(w.id)} disabled={isSaving} className="shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500 disabled:opacity-50"><X size={12} /></button>
                  </div>
                ))}
                {urgentWebhooks.length === 0 && (
                  addingFor === 'urgent' ? (
                    <WebhookAddForm disabled={isSaving} onAdd={(url, label) => handleAddWebhook(url, label, 'urgent')} onCancel={() => setAddingFor(null)} />
                  ) : (
                    <button type="button" onClick={() => setAddingFor('urgent')} className="flex items-center gap-1.5 text-xs font-medium text-[#5865F2] hover:underline"><Plus size={12} /> Set urgent webhook</button>
                  )
                )}
              </section>

              {/* Connection */}
              {integration?.connectedBy && (
                <section className="space-y-2 border-t border-gray-100 pt-6 dark:border-border-dark">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Connection</h3>
                  <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    <p>Connected by <span className="font-medium text-gray-700 dark:text-gray-200">{integration.connectedBy.name}</span></p>
                    {integration.connectedAt && <p className="mt-1 text-xs text-gray-400">{formatDate(integration.connectedAt)}</p>}
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
