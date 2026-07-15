import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToastStore, type ToastType } from '@/app/stores/useToastStore';

/**
 * Toast icon + color config per type.
 * Follows the semantic color rules from rules.md §7.0.1
 */
const toastConfig: Record<ToastType, {
  icon: React.ReactNode;
  containerClass: string;
  iconBgClass: string;
}> = {
  success: {
    icon: <CheckCircle2 size={18} />,
    containerClass: 'bg-white dark:bg-card-dark border-gray-200 dark:border-border-dark',
    iconBgClass: 'bg-green-500/10 text-green-500',
  },
  error: {
    icon: <AlertCircle size={18} />,
    containerClass: 'bg-white dark:bg-card-dark border-red-200 dark:border-red-900/50',
    iconBgClass: 'bg-red-500/10 text-red-500',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    containerClass: 'bg-white dark:bg-card-dark border-orange-200 dark:border-orange-900/50',
    iconBgClass: 'bg-orange-500/10 text-orange-500',
  },
  info: {
    icon: <Info size={18} />,
    containerClass: 'bg-white dark:bg-card-dark border-blue-200 dark:border-blue-900/50',
    iconBgClass: 'bg-blue-500/10 text-blue-500',
  },
};

/**
 * ToastContainer — renders all active toast notifications.
 * Positioned bottom-right, stacked vertically.
 * Each toast has: colored icon, optional title, message, dismiss button.
 */
export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  return (
    <div className="fixed right-5 top-5 z-[200] flex w-full max-w-[420px] flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const config = toastConfig[toast.type];

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              className={`pointer-events-auto relative overflow-hidden rounded-xl border shadow-lg dark:shadow-black/30 ${config.containerClass}`}
            >
              {/* Content row */}
              <div className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${config.iconBgClass}`}>
                  {config.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 pt-0.5">
                  {toast.title && (
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                      {toast.title}
                    </p>
                  )}
                  <p className={`text-sm text-gray-600 dark:text-gray-400 leading-relaxed ${toast.title ? 'mt-0.5' : ''}`}>
                    {toast.message}
                  </p>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
