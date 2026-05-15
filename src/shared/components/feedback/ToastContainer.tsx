import React from 'react';
import { useApp } from '@/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${
              toast.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
