import { create } from 'zustand';
import { Toast } from '@/types';

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  showToast: (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
}));
