import React, { useEffect, useState } from 'react';
import { Loader2, Moon, Save, Sun, Globe, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DocumentsPanel } from '@features/documents';
import {
  useDeleteWorkspace,
  useUpdateWorkspace,
  useWorkspaces,
  useWorkspaceDetails,
} from '@features/workspace';
import { canManageDocuments } from '@shared/permissions';
import type { ApiAxiosError } from '@shared/services/types';
import { useApp } from '../AppContext';
import { useAuthStore } from '@/app/stores/useAuthStore';

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

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, showToast } = useApp();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const setWorkspace = useAuthStore((s) => s.setWorkspace);
  const setAuth = useAuthStore((s) => s.setAuth);
  const activeWorkspace = useAuthStore((s) => s.workspace);
  const { data: workspace, isLoading } = useWorkspaceDetails();
  const workspacesQuery = useWorkspaces();
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [confirmName, setConfirmName] = useState('');

  const role = activeWorkspace?.role;
  const canManageSettings = canManageDocuments(role);
  const canDeleteWorkspace = role === 'owner';

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setLogo(workspace.logo ?? '');
    }
  }, [workspace]);

  const tabs = [
    { name: 'General', view: 'settings' },
    { name: 'Members', view: 'members' },
    { name: 'Teams', view: 'teams' },
    { name: 'Billing', view: 'billing' },
    { name: 'Integrations', view: 'integrations' },
    { name: 'API Keys', view: 'api-keys' },
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

      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full space-y-12">
        <div className="flex gap-8 border-b border-gray-200 dark:border-border-dark overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => {
                if (tab.view !== 'settings') navigate('/' + tab.view);
              }}
              className={`pb-4 text-sm font-medium transition-colors relative shrink-0 ${
                tab.view === 'settings' ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              {tab.name}
              {tab.view === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>

        <SettingsSection title="Appearance">
          <SettingsItem
            label="Interface Theme"
            description="Select how Linearis looks to you. Choose a light or dark theme, or mirror your system preferences."
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
                .linearis.app
              </span>
            </div>
          </SettingsItem>
        </SettingsSection>

        {workspace && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Workspace Documents</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Workspace docs keep policies, onboarding, and shared references in one place.
              </p>
            </div>
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
      </div>
    </div>
  );
};
