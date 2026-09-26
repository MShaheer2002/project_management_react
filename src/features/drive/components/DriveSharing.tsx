import React, { useState } from 'react';
import { Building2, Globe, Loader2, Lock } from 'lucide-react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { Modal } from '@shared/components/ui/Modal';
import { useDriveConnection } from '../hooks/useDriveData';
import {
  useConnectDrive,
  useDisconnectDrive,
  useDisconnectWorkspaceDrive,
  useUpdateDriveSettings,
  useUpdateWorkspaceDrive,
} from '../hooks/useDriveMutations';
import type { DriveSharing, DriveTarget } from '../types';

export const DRIVE_SHARING_LABELS: Record<DriveSharing, string> = {
  PUBLIC: 'Public',
  COMPANY: 'Company emails only',
  PRIVATE: 'Private',
};

const DESCRIPTIONS: Record<DriveSharing, string> = {
  PUBLIC: 'Anyone with the link can open it',
  COMPANY: 'Only people signed in with a company email',
  PRIVATE: 'Only the Drive owner. Others can ask for access',
};

/** Small badge for a Drive attachment's sharing level. */
export const DriveSharingBadge: React.FC<{ sharing: DriveSharing }> = ({ sharing }) => {
  const style = sharing === 'PUBLIC'
    ? 'bg-red-500/10 text-red-500'
    : sharing === 'COMPANY'
      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
      : 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400';
  const Icon = sharing === 'PUBLIC' ? Globe : sharing === 'COMPANY' ? Building2 : Lock;
  return (
    <span title={DESCRIPTIONS[sharing]} className={`inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-medium ${style}`}>
      <Icon size={10} /> {sharing === 'PRIVATE' ? 'Private' : sharing === 'COMPANY' ? 'Company' : 'Public'}
    </span>
  );
};

/** Sharing picker. Offers only what the server allows. */
export const DriveSharingSelect: React.FC<{
  value: DriveSharing;
  onChange: (sharing: DriveSharing) => void;
  options: DriveSharing[];
  disabled?: boolean;
  label?: string;
}> = ({ value, onChange, options, disabled, label = 'Who can open files' }) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value as DriveSharing)}
    disabled={disabled}
    aria-label={label}
    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 outline-none focus:border-primary dark:border-border-dark dark:bg-card-dark dark:text-gray-200"
  >
    {options.map((option) => (
      <option key={option} value={option}>{DRIVE_SHARING_LABELS[option]}</option>
    ))}
  </select>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    {children}
  </div>
);

const buttonClass = 'px-3 py-1.5 rounded-md border border-gray-200 dark:border-border-dark text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center gap-1.5';

/**
 * Google Drive settings for the Integrations page: the user's own Drive, the
 * company (Workspace) Drive, who can open uploaded files, and where uploads go.
 * Only what this user may change is shown.
 */
export const DriveConnectionPanel: React.FC = () => {
  const role = useAuthStore((s) => s.workspace?.role);
  const isAdmin = role === 'owner' || role === 'admin';
  const { data: status, isLoading } = useDriveConnection();
  const connect = useConnectDrive();
  const disconnect = useDisconnectDrive();
  const disconnectWorkspace = useDisconnectWorkspaceDrive();
  const updateSettings = useUpdateDriveSettings();
  const updateWorkspace = useUpdateWorkspaceDrive();
  const [choosingMode, setChoosingMode] = useState(false);
  const [confirm, setConfirm] = useState<DriveTarget | null>(null);

  if (isLoading || !status) {
    return <div className="flex justify-center py-3"><Loader2 size={14} className="animate-spin text-gray-400" /></div>;
  }

  const startConnect = async (mode: DriveTarget) => {
    setChoosingMode(false);
    try {
      const { authUrl } = await connect.mutateAsync(mode);
      window.location.href = authUrl;
    } catch {
      // The hook shows the reason.
    }
  };

  // Owners and admins choose where to connect; everyone else connects their own Drive.
  const onConnect = () => (status.canConnectWorkspace ? setChoosingMode(true) : void startConnect('PERSONAL'));

  const { personal, workspace } = status;
  const bothDrives = personal.connected && workspace.connected;
  const manageWorkspace = workspace.connected && workspace.canManage ? workspace : null;
  const danger = 'hover:bg-red-500 hover:text-white hover:border-red-500';
  const primary = 'px-4 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5';

  return (
    <>
      {/* Same layout as the other integration cards: grey status lines, then buttons. */}
      {(workspace.connected || personal.connected) && (
        <div className="mb-4 space-y-1 text-[11px] text-gray-400">
          {/* Members don't see which company account it is, only that it exists. */}
          {workspace.connected && (manageWorkspace
            ? <div>Company Drive: {manageWorkspace.email}, by {manageWorkspace.connectedBy.name}</div>
            : <div>{personal.connected ? 'Company Drive is connected.' : 'Company Drive is connected. Want to connect your own Drive too?'}</div>)}
          {personal.connected && <div>My Drive: {personal.email}</div>}
        </div>
      )}

      {(manageWorkspace || personal.connected || bothDrives) && (
        <div className="mb-4 space-y-2">
          {manageWorkspace && (
            <Row label="Company files open for">
              <DriveSharingSelect
                value={manageWorkspace.sharing}
                options={manageWorkspace.sharingOptions}
                onChange={(sharing) => updateWorkspace.mutate(sharing)}
                disabled={updateWorkspace.isPending}
              />
            </Row>
          )}
          {personal.connected && (
            <Row label="My files open for">
              <DriveSharingSelect
                value={personal.sharing}
                options={personal.sharingOptions}
                onChange={(sharing) => updateSettings.mutate({ sharing })}
                disabled={updateSettings.isPending}
              />
            </Row>
          )}
          {bothDrives && (
            <Row label="Upload my files to">
              <select
                value={status.preferredTarget}
                onChange={(event) => updateSettings.mutate({ uploadTarget: event.target.value as DriveTarget })}
                disabled={updateSettings.isPending}
                aria-label="Upload my files to"
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 outline-none focus:border-primary dark:border-border-dark dark:bg-card-dark dark:text-gray-200"
              >
                <option value="WORKSPACE">Company Drive</option>
                <option value="PERSONAL">My Drive</option>
              </select>
            </Row>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {workspace.connected && workspace.canManage && (
          <button type="button" className={`${buttonClass} ${danger}`} onClick={() => setConfirm('WORKSPACE')}>
            Disconnect company Drive
          </button>
        )}
        {personal.connected ? (
          <>
            {status.canConnectWorkspace && (
              <button type="button" className={buttonClass} onClick={() => void startConnect('WORKSPACE')} disabled={connect.isPending}>
                Connect company Drive
              </button>
            )}
            <button type="button" className={buttonClass} onClick={() => void startConnect('PERSONAL')} disabled={connect.isPending}>
              Switch account
            </button>
            <button type="button" className={`${buttonClass} ${danger}`} onClick={() => setConfirm('PERSONAL')}>
              Disconnect
            </button>
          </>
        ) : (
          <button type="button" onClick={onConnect} disabled={connect.isPending} className={primary}>
            {connect.isPending && <Loader2 size={12} className="animate-spin" />}
            {workspace.connected ? 'Connect my Drive' : 'Connect'}
          </button>
        )}
      </div>

      <Modal isOpen={choosingMode} onClose={() => setChoosingMode(false)} title="Connect Google Drive" maxWidth="max-w-sm">
        <div className="space-y-2">
          <button type="button" onClick={() => void startConnect('WORKSPACE')} className="w-full rounded-xl border border-gray-200 p-3 text-left hover:border-primary dark:border-border-dark">
            <div className="text-sm font-semibold">For the whole company</div>
            <div className="text-xs text-gray-400">Everyone can upload files to it</div>
          </button>
          <button type="button" onClick={() => void startConnect('PERSONAL')} className="w-full rounded-xl border border-gray-200 p-3 text-left hover:border-primary dark:border-border-dark">
            <div className="text-sm font-semibold">Just for me</div>
            <div className="text-xs text-gray-400">Only you upload to it</div>
          </button>
        </div>
      </Modal>

      <Modal isOpen={confirm !== null} onClose={() => setConfirm(null)} title="Disconnect Google Drive?" maxWidth="max-w-sm">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {confirm === 'WORKSPACE'
            ? 'Nobody can upload to the company Drive until an admin connects one again. Files already there stay.'
            : 'You can no longer upload to your Drive. Files already there stay.'}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={buttonClass} onClick={() => setConfirm(null)}>Cancel</button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-md bg-red-500 text-white text-xs font-semibold hover:bg-red-600"
            onClick={() => {
              if (confirm === 'WORKSPACE') disconnectWorkspace.mutate();
              else disconnect.mutate();
              setConfirm(null);
            }}
          >
            Disconnect
          </button>
        </div>
      </Modal>
    </>
  );
};
