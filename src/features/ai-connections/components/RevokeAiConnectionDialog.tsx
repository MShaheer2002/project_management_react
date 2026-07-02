import React from 'react';
import { Modal } from '@/components/modals/Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useRevokeAiConnection } from '../hooks/useAiConnectionMutations';
import { useToastStore } from '@/app/stores/useToastStore';
import { aiConnectionQueryKeys } from '../hooks/useAiConnectionData';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import type { ApiAxiosError } from '@shared/services/types';
import type { AiConnection } from '../types';

interface RevokeAiConnectionDialogProps {
  connection: AiConnection | null;
  onClose: () => void;
}

export const RevokeAiConnectionDialog: React.FC<RevokeAiConnectionDialogProps> = ({ connection, onClose }) => {
  const revokeAiConnection = useRevokeAiConnection();
  const showToast = useToastStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  const handleRevoke = () => {
    if (!connection) return;

    revokeAiConnection.mutate(connection.id, {
      onSuccess: () => onClose(),
      onError: (err) => {
        const code = (err as ApiAxiosError).response?.data?.error?.code;
        if (code === 'API_KEY_NOT_FOUND' || code === 'AI_CONNECTION_NOT_FOUND') {
          showToast('This AI connection no longer exists.', 'info');
          queryClient.invalidateQueries({ queryKey: aiConnectionQueryKeys.list(workspaceId) });
          onClose();
        } else {
          showToast('Could not revoke AI connection.', 'error');
        }
      },
    });
  };

  return (
    <Modal isOpen={!!connection} onClose={onClose} title="Revoke AI Connection" maxWidth="max-w-sm">
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl bg-red-500/[0.06] border border-red-500/10 px-4 py-3">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div className="text-xs text-red-600 dark:text-red-400/80 leading-relaxed space-y-1">
            <p>
              Revoke <span className="font-semibold">"{connection?.name}"</span>?
            </p>
            <p className="text-red-500/60 dark:text-red-400/50">
              <code className="text-[10px]">{connection?.keyPrefix}</code>
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          This immediately disconnects any AI client using this token. The token cannot be recovered after revocation.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-border-dark">
          <button
            type="button"
            onClick={onClose}
            disabled={revokeAiConnection.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRevoke}
            disabled={revokeAiConnection.isPending}
            className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {revokeAiConnection.isPending && <Loader2 size={16} className="animate-spin" />}
            Revoke Token
          </button>
        </div>
      </div>
    </Modal>
  );
};
