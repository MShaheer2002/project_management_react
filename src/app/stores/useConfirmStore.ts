import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
}

interface ConfirmRequest extends ConfirmOptions {
  id: string;
  resolve: (confirmed: boolean) => void;
}

interface ConfirmState {
  request: ConfirmRequest | null;
  ask: (options: ConfirmOptions) => Promise<boolean>;
  resolveActive: (confirmed: boolean) => void;
}

/**
 * Global confirmation-dialog store — one instance, mounted once as
 * <ConfirmDialogHost /> at the app root (see App.tsx), so any component can
 * show the app's own styled confirm modal instead of the native
 * window.confirm() browser dialog (which can't be styled, blocks the whole
 * tab including automated/embedded contexts, and looks out of place).
 */
export const useConfirmStore = create<ConfirmState>()((set, get) => ({
  request: null,

  ask: (options) =>
    new Promise<boolean>((resolve) => {
      set({
        request: {
          id: Math.random().toString(36).slice(2, 9),
          confirmLabel: 'Confirm',
          cancelLabel: 'Cancel',
          tone: 'primary',
          ...options,
          resolve,
        },
      });
    }),

  resolveActive: (confirmed) => {
    const { request } = get();
    if (!request) return;
    request.resolve(confirmed);
    set({ request: null });
  },
}));

/**
 * Drop-in replacement for `window.confirm(message)`:
 *
 *   const ok = await confirmDialog({ title: 'Delete this issue?' });
 *   if (!ok) return;
 *
 * Resolves `true` on Confirm, `false` on Cancel, backdrop click, or Escape.
 */
export const confirmDialog = (options: ConfirmOptions): Promise<boolean> =>
  useConfirmStore.getState().ask(options);
