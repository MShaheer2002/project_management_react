import React, { useState } from 'react';
import { CheckCircle2, Loader2, HardDrive, Unlink } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useDriveConnection, useConnectDrive, useDisconnectDrive, driveQueryKeys } from '../index';

/**
 * DriveConnectButton — Connect/disconnect Google Drive toggle.
 *
 * Unlike other integrations, Drive is USER-scoped (any member can connect).
 * Shows connection status with Google account email.
 * Disconnect shows a confirmation before proceeding.
 */
export const DriveConnectButton: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: connection, isLoading } = useDriveConnection();
  const connectDrive = useConnectDrive();
  const disconnectDrive = useDisconnectDrive();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConnect = async () => {
    try {
      const result = await connectDrive.mutateAsync();

      // Open OAuth consent in a popup
      const popup = window.open(result.authUrl, 'drive-oauth', 'width=500,height=700,left=200,top=100');

      // Poll for popup close — callback redirects back to frontend, closing the popup
      if (popup) {
        const interval = setInterval(() => {
          if (popup.closed) {
            clearInterval(interval);
            queryClient.invalidateQueries({ queryKey: driveQueryKeys.connection() });
          }
        }, 500);

        // Safety: stop polling after 5 minutes
        setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
      }
    } catch (error) {
      // Error toast shown by mutation onError — log for debugging
      console.error('[DriveConnectButton] Failed to start OAuth flow:', error);
    }
  };

  const handleDisconnect = () => {
    disconnectDrive.mutate();
    setShowConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Loader2 size={14} className="animate-spin" />
        Checking...
      </div>
    );
  }

  if (connection?.connected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Connected as <span className="font-semibold">{connection.email}</span>
          </span>
        </div>

        {!showConfirm ? (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold transition-all hover:border-red-500 hover:bg-red-500 hover:text-white dark:border-border-dark dark:hover:border-red-500"
          >
            <Unlink size={12} />
            Disconnect
          </button>
        ) : (
          <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/10">
            <p className="text-xs text-red-700 dark:text-red-400">
              Existing file links will remain accessible. Only new uploads will be affected.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnectDrive.isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {disconnectDrive.isPending && <Loader2 size={12} className="animate-spin" />}
                Confirm disconnect
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={connectDrive.isPending}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
    >
      {connectDrive.isPending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <HardDrive size={14} />
      )}
      Connect Google Drive
    </button>
  );
};
