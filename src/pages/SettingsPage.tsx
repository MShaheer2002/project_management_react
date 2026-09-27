import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Moon, Save, Sun, Globe, Trash2, Upload } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentsPanel } from '@features/documents';
import { useUploadFile } from '@features/upload';
import { driveQueryKeys } from '@features/drive';
import {
  useDeleteWorkspace,
  useUpdateWorkspace,
  useWorkspaceDetails,
  InviteDomainPolicyPicker,
} from '@features/workspace';
import type { InviteDomainPolicy } from '@features/workspace';
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
import { AiConnectionsPage } from '@/pages/AiConnectionsPage';
import { workspaceLogoSrc } from '@shared/utils/workspaceLogo';

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


const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const LOGO_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Logo picker. Upload only: the logo is shown on the public sign-in and invite
 * pages, so a pasted URL let an admin point it at a tracking server (F-36).
 * The backend accepts nothing but this workspace's own uploaded logo.
 */
const WorkspaceLogoField: React.FC<{
  name: string;
  value: string;
  disabled: boolean;
  onChange: (url: string) => void;
}> = ({ name, value, disabled, onChange }) => {
  const showToast = useToastStore((s) => s.showToast);
  const uploadFile = useUploadFile();
  const inputRef = useRef<HTMLInputElement>(null);
  // Uploads are private: until saved, the new logo can only be shown from the
  // local file. Once saved, `value` is the served /workspaces/:id/logo address.
  const [localPreview, setLocalPreview] = useState<{ assetUrl: string; objectUrl: string } | null>(null);
  const previewSrc = localPreview && localPreview.assetUrl === value ? localPreview.objectUrl : workspaceLogoSrc(value);

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview.objectUrl);
  }, [localPreview]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      showToast('Use a PNG, JPG, GIF or WebP image.', 'error', 'Unsupported image');
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      showToast('The logo must be 5 MB or smaller.', 'error', 'Image too large');
      return;
    }
    try {
      const uploaded = await uploadFile.mutateAsync({ file, kind: 'workspace-logo' });
      if (!uploaded.assetUrl) {
        showToast("Logo uploads aren't available right now.", 'error');
        return;
      }
      setLocalPreview({ assetUrl: uploaded.assetUrl, objectUrl: URL.createObjectURL(file) });
      onChange(uploaded.assetUrl);
    } catch {
      showToast('The logo could not be uploaded. Please try again.', 'error');
    }
  };

  return (
    <div className="flex items-center gap-3">
      {previewSrc ? (
        <img src={previewSrc} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-border-dark" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-semibold">
          {name.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={LOGO_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploadFile.isPending}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-border-dark text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60"
      >
        {uploadFile.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {value ? 'Replace' : 'Upload'}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          disabled={disabled || uploadFile.isPending}
          className="px-3 py-1.5 rounded-md text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors disabled:opacity-60"
        >
          Remove
        </button>
      )}
    </div>
  );
};

/** Dedicated invite domain policy editor — isolated mutation, same reasoning as UploadPolicySection below */
const InviteDomainPolicySection: React.FC<{ workspaceId: string }> = ({ workspaceId }) => {
  const showToast = useToastStore((s) => s.showToast);
  const activeWorkspace = useAuthStore((s) => s.workspace);
  const setWorkspace = useAuthStore((s) => s.setWorkspace);

  const policyMutation = useMutation({
    mutationFn: (vars: { policy: InviteDomainPolicy; domains: string[] }) =>
      workspaceService.updateInviteDomainPolicy({
        workspaceId,
        inviteDomainPolicy: vars.policy,
        allowedEmailDomains: vars.policy === 'CUSTOM' ? vars.domains : undefined,
      }),
    onSuccess: (updated) => {
      const prev = useAuthStore.getState().workspace;
      if (prev) {
        setWorkspace({
          ...prev,
          inviteDomainPolicy: updated.inviteDomainPolicy,
          allowedEmailDomains: updated.allowedEmailDomains,
        });
      }
      showToast('Invite access updated', 'success');
    },
    onError: (err: ApiAxiosError) => {
      showToast(err.response?.data?.error?.message || 'Failed to update invite access', 'error');
    },
  });

  return (
    <SettingsSection title="Invite Access">
      <InviteDomainPolicyPicker
        policy={activeWorkspace?.inviteDomainPolicy ?? 'ANY'}
        domains={activeWorkspace?.allowedEmailDomains ?? []}
        onChange={(policy, domains) => policyMutation.mutate({ policy, domains })}
      />
    </SettingsSection>
  );
};

/** Dedicated upload policy selector — isolated mutation to avoid racing with "Save Changes" */
const UploadPolicySection: React.FC<{ workspaceId: string }> = ({ workspaceId }) => {
  const showToast = useToastStore((s) => s.showToast);
  const queryClient = useQueryClient();
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

  const publicLinksMutation = useMutation({
    mutationFn: (allow: boolean) => workspaceService.update({ workspaceId, allowPublicDriveLinks: allow }),
    onMutate: (allow) => {
      const prev = useAuthStore.getState().workspace;
      if (prev) setWorkspace({ ...prev, allowPublicDriveLinks: allow });
      return { prev };
    },
    onError: (_err, _allow, context) => {
      if (context?.prev) setWorkspace(context.prev);
      showToast('Failed to update Google Drive sharing', 'error');
    },
    onSuccess: (_data, allow) => {
      // Upload pickers read the allowed levels from the server.
      queryClient.invalidateQueries({ queryKey: driveQueryKeys.all });
      showToast(allow ? 'Public Drive links allowed' : 'Public Drive links turned off', 'success');
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
      <SettingsItem
        label="Public Drive links"
        description="Let members make files in their own Google Drive public. Files already shared stay as they are."
      >
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={activeWorkspace?.allowPublicDriveLinks === true}
            onChange={(e) => publicLinksMutation.mutate(e.target.checked)}
            disabled={publicLinksMutation.isPending}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
          />
          Allow
        </label>
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
  const setWorkspace = useAuthStore((s) => s.setWorkspace);
  const activeWorkspace = useAuthStore((s) => s.workspace);
  const { data: workspace, isLoading } = useWorkspaceDetails();
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

  const SETTINGS_TABS = ['general', 'workspace', 'ai-connections'] as const;
  type SettingsTab = (typeof SETTINGS_TABS)[number];
  const requestedTab = searchParams.get('tab');
  const settingsTab: SettingsTab = SETTINGS_TABS.includes(requestedTab as SettingsTab)
    ? (requestedTab as SettingsTab)
    : 'general';

  const tabs: { name: string; view: SettingsTab }[] = [
    { name: 'General', view: 'general' },
    { name: 'Workspace', view: 'workspace' },
    { name: 'Personal Access Tokens', view: 'ai-connections' },
  ];

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast('Workspace name is required.', 'error', 'Validation error');
      return;
    }
    try {
      const logoChanged = (logo.trim() || '') !== (workspace?.logo ?? '');
      await updateWorkspace.mutateAsync({
        name: trimmedName,
        // Only when changed: the loaded value is the served address, not the upload itself.
        ...(logoChanged && { logo: logo.trim() || null }),
      });
      showToast('Workspace updated.', 'success');
    } catch (error) {
      const apiError = error as ApiAxiosError;
      showToast(apiError.response?.data?.error?.message || 'Failed to update workspace.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!workspace || !activeWorkspace || confirmName.trim() !== workspace.name.trim()) return;
    try {
      const result = await deleteWorkspace.mutateAsync(confirmName);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      // Soft delete: marking the workspace deactivated makes AuthGuard switch
      // this tab to the restore screen with the 30-day countdown.
      setWorkspace({ ...activeWorkspace, deactivatedAt: result.deactivatedAt, purgeAt: result.purgeAt });
    } catch (error) {
      // 403/409/5xx are already toasted by the API interceptor; 422 is ours.
      const apiError = error as ApiAxiosError;
      if (apiError.response?.status === 422) {
        showToast(apiError.response.data?.error?.message || 'Type the workspace name exactly to confirm.', 'error');
      }
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
                description="Shown in the sidebar and on your sign-in and invite pages. PNG, JPG, GIF or WebP, up to 5 MB. Save to apply."
              >
                <WorkspaceLogoField name={name} value={logo} disabled={!canManageSettings} onChange={setLogo} />
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

            {/* Invite domain policy: OWNER only — not admins. Deciding who can be
                invited at all is a step above day-to-day member management. */}
            {workspace && canDeleteWorkspace && (
              <InviteDomainPolicySection workspaceId={workspace.id} />
            )}

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
                  description="Members lose access right away. The workspace and all its data are permanently deleted after 30 days. Until then you can restore it by signing in and clicking Restore."
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
                      disabled={!workspace || confirmName.trim() !== workspace.name.trim() || deleteWorkspace.isPending}
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
