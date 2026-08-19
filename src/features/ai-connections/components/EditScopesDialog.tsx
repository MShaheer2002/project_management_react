import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/modals/Modal';
import { Loader2 } from 'lucide-react';
import { useUpdateAiConnectionScopes } from '../hooks/useAiConnectionMutations';
import { useToastStore } from '@/app/stores/useToastStore';
import { ScopesField } from './ScopesField';
import { ADMIN_SCOPE } from '../scopes';
import type { AiConnection } from '../types';

interface EditScopesDialogProps {
  connection: AiConnection | null;
  onClose: () => void;
}

export const EditScopesDialog: React.FC<EditScopesDialogProps> = ({ connection, onClose }) => {
  const updateScopes = useUpdateAiConnectionScopes();
  const showToast = useToastStore((s) => s.showToast);
  const [scopes, setScopes] = useState<string[]>([]);

  useEffect(() => {
    if (connection) {
      // Legacy/placeholder scopes (empty, or the old "mcp:v1" value) were treated as
      // unrestricted before real scopes existed — pre-fill as admin rather than an
      // invalid value the update schema would reject unchanged.
      const isLegacy = connection.scopes.length === 0 || connection.scopes.includes('mcp:v1');
      setScopes(isLegacy ? [ADMIN_SCOPE] : connection.scopes);
    }
  }, [connection]);

  const handleSave = () => {
    if (!connection || scopes.length === 0) return;

    updateScopes.mutate(
      { id: connection.id, scopes },
      {
        onSuccess: () => {
          showToast('Scopes updated', 'success');
          onClose();
        },
        onError: () => showToast('Could not update scopes.', 'error'),
      },
    );
  };

  return (
    <Modal isOpen={!!connection} onClose={onClose} title="Edit Access Scopes" maxWidth="max-w-md">
      <div className="space-y-5">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Change what <span className="font-semibold">"{connection?.name}"</span> is allowed to do. Takes effect immediately — no need to rotate the token.
        </p>

        <ScopesField value={scopes} onChange={setScopes} />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-border-dark">
          <button
            type="button"
            onClick={onClose}
            disabled={updateScopes.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateScopes.isPending || scopes.length === 0}
            className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {updateScopes.isPending && <Loader2 size={16} className="animate-spin" />}
            Save Scopes
          </button>
        </div>
      </div>
    </Modal>
  );
};
