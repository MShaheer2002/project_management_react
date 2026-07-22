import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;        // Optional bold title line
  message: string;       // Main message text
  duration?: number;     // Auto-dismiss in ms (default 5000, 0 = manual dismiss only)
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  /**
   * Show a toast notification.
   * @param message  - Main message text
   * @param type     - 'success' | 'error' | 'info' | 'warning' (default: 'success')
   * @param title    - Optional bold title (e.g., "Sign-up failed")
   * @param duration - Auto-dismiss in ms (default: 5000, use 0 for persistent)
   */
  showToast: (message, type = 'success', title, duration) => {
    // Skip if an identical toast (same type/title/message) is already showing —
    // prevents duplicate-looking stacks from repeated retries of the same failure.
    const alreadyShowing = get().toasts.some(
      (t) => t.type === type && t.title === title && t.message === message
    );
    if (alreadyShowing) return;

    const id = Math.random().toString(36).substring(2, 9);
    const autoDismiss = duration ?? (type === 'error' ? 6000 : 5000);

    set((state) => ({
      toasts: [...state.toasts, { id, type, title, message, duration: autoDismiss }],
    }));

    // Auto-dismiss after duration (unless duration is 0)
    if (autoDismiss > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, autoDismiss);
    }
  },

  /** Manually dismiss a toast by ID */
  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
