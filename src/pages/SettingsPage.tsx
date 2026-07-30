import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Moon, Save, Sun, Globe, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentsPanel } from '@features/documents';
import {
  useDeleteWorkspace,
  useUpdateWorkspace,
  useWorkspaces,
  useWorkspaceDetails,
} from '@features/workspace';
import { workspaceService } from '@features/workspace/services/workspaceService';
import { useThemeStore } from '@/app/stores/useThemeStore';
import { useToastStore } from '@/app/stores/useToastStore';
import { canManageDocuments } from '@shared/permissions';
import { useWorkspaceStatuses } from '@shared/hooks/useWorkspaceStatuses';
import type { WorkspaceStatus } from '@/types';
import type { ApiAxiosError } from '@shared/services/types';
import type { UploadPolicy } from '@/app/stores/useAuthStore';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { Modal } from '@shared/components/ui/Modal';
import { WorkflowStatusesEditor, WorkflowAutomationEditor } from '@shared/components/workflow/WorkflowEditors';
import { ApiKeysPage } from '@/pages/ApiKeysPage';
import { AiConnectionsPage } from '@/pages/AiConnectionsPage';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <div className="space-y-6">
    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

interface SettingsItemProps {
  label: string;
  description: string;
  children: React.ReactNode;
  danger?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ label, description, children, danger }) => (
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl shadow-sm">
    <div className="space-y-1">
      <h4 className={`text-sm font-semibold ${danger ? 'text-red-500' : ''}`}>{label}</h4>
      <p className="text-xs text-gray-400 max-w-md">{description}</p>
    </div>
    <div>{children}</div>
  </div>
);


/** Dedicated upload policy selector — isolated mutation to avoid racing with "Save Changes" */
const UploadPolicySection: React.FC<{ workspaceId: string }> = ({ workspaceId }) => {
  const showToast = useToastStore((s) => s.showToast);
  const activeWorkspace = useAuthStore((s) => s.workspace);
  const setWorkspace = useAuthStore((s) => s.setWorkspace);

  const policyMutation = useMutation({
    mutationFn: (policy: UploadPolicy) =>
      workspaceService.update({ workspaceId, uploadPolicy: policy }),
    onMutate: (policy) => {
      // Optimistic update — instantly reflect in UI
      const prev = useAuthStore.getState().workspace;
      if (prev) setWorkspace({ ...prev, uploadPolicy: policy });
      return { prev };
    },
    onError: (_err, _policy, context) => {
      // Rollback on failure
      if (context?.prev) setWorkspace(context.prev);
      showToast('Failed to update upload policy', 'error');
    },
    onSuccess: () => {
      showToast('Upload policy updated', 'success');
    },
  });

  return (
    <SettingsSection title="File Uploads">
      <SettingsItem
        label="Upload Policy"
        description="Control where workspace members can upload file attachments. Members can always view existing attachments regardless of this setting."
      >
        <select
          value={activeWorkspace?.uploadPolicy ?? 'BOTH'}
          onChange={(e) => policyMutation.mutate(e.target.value as UploadPolicy)}
          disabled={policyMutation.isPending}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-gray-200"
        >
          <option value="BOTH">System Storage + Google Drive</option>
          <option value="SYSTEM_ONLY">System Storage Only</option>
          <option value="DRIVE_ONLY">Google Drive Only</option>
        </select>
      </SettingsItem>
      {activeWorkspace?.uploadPolicy === 'DRIVE_ONLY' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400">
          Members without a connected Google Drive will be unable to upload files. They will see a prompt to connect their Drive on the Integrations page.
        </div>
      )}
    </SettingsSection>
  );
};

export const SettingsPage: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const showToast = useToastStore((s) => s.showToast);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useAuthStore((s) => s.currentUser);
  const setWorkspace = useAuthStore((s) => s.setWorkspace);
  const setAuth = useAuthStore((s) => s.setAuth);
  const activeWorkspace = useAuthStore((s) => s.workspace);
  const { data: workspace, isLoading } = useWorkspaceDetails();
  const workspacesQuery = useWorkspaces();
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const queryClient = useQueryClient();
  const workspaceWorkflowStatuses = useWorkspaceStatuses();

  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [workflowStatusesDirty, setWorkflowStatusesDirty] = useState(false);
  const [workflowAutomationDirty, setWorkflowAutomationDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const suppressPopStateRef = useRef(false);
  const historyGuardArmedRef = useRef(false);
  const historyPointRef = useRef<string | null>(null);

  const role = activeWorkspace?.role;
  const canManageSettings = canManageDocuments(role);
  const canDeleteWorkspace = role === 'owner';

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setLogo(workspace.logo ?? '');
    }
  }, [workspace]);

  const generalDirty = useMemo(() => {
    if (!workspace || !canManageSettings) return false;
    return name.trim() !== workspace.name || (logo.trim() || '') !== (workspace.logo ?? '');
  }, [canManageSettings, logo, name, workspace]);

  const hasUnsavedChanges = generalDirty || workflowStatusesDirty || workflowAutomationDirty;

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (hasUnsavedChanges) {
      if (!historyGuardArmedRef.current && pendingNavigationRef.current === null) {
        const guardPoint = `settings-guard:${Date.now()}`;
        historyPointRef.current = guardPoint;
        window.history.pushState(
          { ...(window.history.state ?? {}), __settingsUnsavedGuard: true, __settingsGuardPoint: guardPoint },
          '',
          window.location.href,
        );
        historyGuardArmedRef.current = true;
      }
      return;
    }
  }, [hasUnsavedChanges]);

  const attemptNavigation = useCallback((action: () => void) => {
    if (!hasUnsavedChanges) {
      action();
      return;
    }

    pendingNavigationRef.current = action;
    setPendingNavigation(() => action);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      const nextUrl = new URL(anchor.href, window.location.origin);
      if (nextUrl.origin !== window.location.origin) return;

      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const next = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      if (current === next) return;

      event.preventDefault();
      event.stopPropagation();
      attemptNavigation(() => navigate(next));
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [attemptNavigation, hasUnsavedChanges, navigate]);

  useEffect(() => {
    const handlePopState = () => {
      if (!hasUnsavedChanges || suppressPopStateRef.current) return;

      const guardPoint = historyPointRef.current ?? `settings-guard:${Date.now()}`;
      historyPointRef.current = guardPoint;
      window.history.pushState(
        { ...(window.history.state ?? {}), __settingsUnsavedGuard: true, __settingsGuardPoint: guardPoint },
        '',
        window.location.href,
      );
      historyGuardArmedRef.current = true;

      const leaveAction = () => {
        suppressPopStateRef.current = true;
        historyGuardArmedRef.current = false;
        historyPointRef.current = null;
        pendingNavigationRef.current = null;
        setPendingNavigation(null);
        window.history.back();
        window.setTimeout(() => {
          suppressPopStateRef.current = false;
        }, 0);
      };
      pendingNavigationRef.current = leaveAction;
      setPendingNavigation(() => leaveAction);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasUnsavedChanges]);

  const SETTINGS_TABS = ['general', 'workspace', 'api-keys', 'ai-connections'] as const;
  type SettingsTab = (typeof SETTINGS_TABS)[number];
  const requestedTab = searchParams.get('tab');
  const settingsTab: SettingsTab = SETTINGS_TABS.includes(requestedTab as SettingsTab)
    ? (requestedTab as SettingsTab)
    : 'general';

  const tabs: { name: string; view: SettingsTab }[] = [
    { name: 'General', view: 'general' },
    { name: 'Workspace', view: 'workspace' },
    { name: 'API Keys', view: 'api-keys' },
    { name: 'AI Connections', view: 'ai-connections' },
  ];

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast('Workspace name is required.', 'error', 'Validation error');
      return;
    }
    try {
      await updateWorkspace.mutateAsync({
        name: trimmedName,
        logo: logo.trim() || null,
      });
      showToast('Workspace updated.', 'success');
    } catch (error) {
      const apiError = error as ApiAxiosError;
      showToast(apiError.response?.data?.error?.message || 'Failed to update workspace.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!workspace || confirmName !== workspace.name) return;
    try {
      await deleteWorkspace.mutateAsync();
      const result = await workspacesQuery.refetch();
      const remaining = result.data ?? [];
      const nextWorkspace = remaining.find((item) => item.id !== workspace.id) ?? remaining[0];

      if (nextWorkspace) {
        setWorkspace({
          id: nextWorkspace.id,
          name: nextWorkspace.name,
          slug: nextWorkspace.slug,
          logo: nextWorkspace.logo ?? undefined,
          role: nextWorkspace.role.toLowerCase() as 'owner' | 'admin' | 'member' | 'guest',
          defaultTeamId: nextWorkspace.defaultTeamId,
          customStatuses: nextWorkspace.customStatuses,
          workflowAutomation: nextWorkspace.workflowAutomation,
          uploadPolicy: nextWorkspace.uploadPolicy,
        });
        showToast('Workspace deleted. Switched to another workspace.', 'success');
        navigate('/dashboard', { replace: true });
        return;
      }

      if (currentUser) {
        setAuth(currentUser, null);
      }
      showToast('Workspace deleted. Create a new workspace to continue.', 'success');
      navigate('/org-creation', { replace: true });
    } catch (error) {
      const apiError = error as ApiAxiosError;
      showToast(apiError.response?.data?.error?.message || 'Failed to delete workspace.', 'error');
    }
  };

  const handleStayOnPage = useCallback(() => {
    pendingNavigationRef.current = null;
    setPendingNavigation(null);
    if (hasUnsavedChanges && !historyGuardArmedRef.current) {
      const guardPoint = historyPointRef.current ?? `settings-guard:${Date.now()}`;
      historyPointRef.current = guardPoint;
      window.history.pushState(
        { ...(window.history.state ?? {}), __settingsUnsavedGuard: true, __settingsGuardPoint: guardPoint },
        '',
        window.location.href,
      );
      historyGuardArmedRef.current = true;
    }
  }, [hasUnsavedChanges]);

  const handleLeavePage = useCallback(() => {
    const nextAction = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setPendingNavigation(null);
    nextAction?.();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="px-8 py-6 border-b border-gray-200 dark:border-border-dark">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <div className="px-8 pt-6 max-w-4xl mx-auto w-full shrink-0">
        <div className="flex gap-8 border-b border-gray-200 dark:border-border-dark overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => {
                attemptNavigation(() => {
                  if (tab.view === 'general') {
                    setSearchParams({}, { replace: true });
                    return;
                  }
                  const next = new URLSearchParams(searchParams);
                  next.set('tab', tab.view);
                  setSearchParams(next, { replace: true });
                });
              }}
              className={`pb-4 text-sm font-medium transition-colors relative shrink-0 ${
                settingsTab === tab.view
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              {tab.name}
              {settingsTab === tab.view && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full space-y-12">
        {settingsTab === 'general' && (
          <>
            <SettingsSection title="Appearance">
              <SettingsItem
                label="Interface Theme"
                description="Select how Trussen looks to you. Choose a light or dark theme, or mirror your system preferences."
              >
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-72">
                  {[
                    { value: 'light' as const, label: 'Light', icon: <Sun size={14} /> },
                    { value: 'dark' as const, label: 'Dark', icon: <Moon size={14} /> },
                    { value: 'system' as const, label: 'System', icon: <Globe size={14} /> },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                        theme === option.value
                          ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </SettingsItem>
            </SettingsSection>

            <SettingsSection title="Workspace Profile">
              <SettingsItem
                label="Organization Name"
                description="This is your workspace's visible name. It will be used in notifications and emails."
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canManageSettings}
                  className="px-3 py-1.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64 disabled:opacity-60"
                />
              </SettingsItem>

              <SettingsItem
                label="Workspace Logo"
                description="Optional image URL used for workspace branding."
              >
                <input
                  type="url"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  disabled={!canManageSettings}
                  placeholder="https://..."
                  className="px-3 py-1.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64 disabled:opacity-60"
                />
              </SettingsItem>

              <SettingsItem
                label="Workspace URL"
                description="The slug cannot be changed after workspace creation."
              >
                <div className="flex items-center">
                  <input
                    type="text"
                    value={workspace?.slug ?? ''}
                    readOnly
                    className="px-3 py-1.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-l-md text-sm outline-none w-48 opacity-70"
                  />
                  <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-l-0 border-gray-200 dark:border-border-dark rounded-r-md text-xs text-gray-400">
                    .trussen.app
                  </span>
                </div>
              </SettingsItem>
            </SettingsSection>

            {workspace && canManageSettings && (
              <UploadPolicySection workspaceId={workspace.id} />
            )}

            {workspace && (
              <div className="-mx-6">
                <DocumentsPanel
                  scope="workspace"
                  workspaceId={workspace.id}
                  entityId={workspace.id}
                  title="Workspace docs"
                  description="Workspace docs keep policies, onboarding, and shared references in one place."
                  emptyTitle="No workspace docs yet"
                  emptyDescription="Add shared references, policies, and onboarding material for everyone in this workspace."
                />
              </div>
            )}

            {canManageSettings && (
              <div className="flex justify-end pt-8">
                <button
                  onClick={handleSave}
                  disabled={updateWorkspace.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {updateWorkspace.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            )}
          </>
        )}

        {settingsTab === 'workspace' && (
          <>
            {workspace && canManageSettings && (
              <WorkflowAutomationEditor
                initialStatuses={workspaceWorkflowStatuses}
                initialAutomation={activeWorkspace?.workflowAutomation ?? null}
                canManage={canManageSettings}
                onDirtyChange={setWorkflowAutomationDirty}
                onSave={(payload) => workspaceService.updateWorkflowAutomation(workspace.id, payload)}
                onSaved={(saved) => {
                  if (activeWorkspace) {
                    setWorkspace({ ...activeWorkspace, workflowAutomation: saved });
                  }
                  queryClient.invalidateQueries({ queryKey: ['workspaces'] });
                }}
              />
            )}

            {workspace && canManageSettings && (
              <WorkflowStatusesEditor
                initialStatuses={workspaceWorkflowStatuses}
                canManage={canManageSettings}
                onDirtyChange={setWorkflowStatusesDirty}
                onSave={(data) => workspaceService.updateStatuses(workspace.id, data)}
                onSaved={(saved) => {
                  if (activeWorkspace) {
                    setWorkspace({ ...activeWorkspace, customStatuses: saved as WorkspaceStatus[] });
                  }
                  queryClient.invalidateQueries({ queryKey: ['workspaces'] });
                }}
                getStatusUsage={(statusKey, limit) => workspaceService.getStatusUsage(workspace.id, statusKey, limit)}
                onMergeStatus={(sourceKey, targetStatusKey) => workspaceService.mergeStatus(workspace.id, sourceKey, targetStatusKey)}
              />
            )}

            {canDeleteWorkspace && (
              <SettingsSection title="Danger Zone">
                <SettingsItem
                  label="Delete Workspace"
                  description="Permanently delete this workspace and all its data. If this is your only workspace, you will be sent back to onboarding."
                  danger
                >
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      placeholder={`Type ${workspace?.name ?? 'workspace name'}`}
                      className="px-3 py-1.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-md text-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all w-64"
                    />
                    <button
                      onClick={handleDelete}
                      disabled={confirmName !== workspace?.name || deleteWorkspace.isPending}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-red-500/10 disabled:hover:text-red-500"
                    >
                      {deleteWorkspace.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Delete Workspace
                    </button>
                  </div>
                </SettingsItem>
              </SettingsSection>
            )}

          </>
        )}

        {settingsTab === 'api-keys' && <ApiKeysPage embedded />}
        {settingsTab === 'ai-connections' && <AiConnectionsPage embedded />}
      </div>

      <Modal
        isOpen={pendingNavigation !== null}
        onClose={handleStayOnPage}
        title="Leave without saving?"
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
            You have unsaved changes on this page. If you leave now, those edits will be lost.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleStayOnPage}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-border-dark dark:text-gray-300 dark:hover:bg-white/5"
            >
              Stay here
            </button>
            <button
              type="button"
              onClick={handleLeavePage}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
            >
              Leave page
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
