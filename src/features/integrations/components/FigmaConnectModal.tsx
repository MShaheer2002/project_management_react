import React, { useState } from 'react';
import { AlertCircle, ExternalLink, Key, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useConnectFigma } from '../hooks/useIntegrationMutations';
import { PROVIDER_META } from '../types';
import type { ApiAxiosError } from '@shared/services/types';

interface FigmaConnectModalProps {
  open: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export const FigmaConnectModal: React.FC<FigmaConnectModalProps> = ({
  open,
  onClose,
  onConnected,
}) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const connectFigma = useConnectFigma();

  const handleClose = () => {
    setToken('');
    setError(null);
    setTouched(false);
    onClose();
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!token.trim()) {
      setError('Access token is required');
      return;
    }
    setError(null);

    try {
      await connectFigma.mutateAsync({ accessToken: token.trim() });
      setToken('');
      handleClose();
      onConnected();
    } catch (err) {
      setToken('');
      const apiError = (err as ApiAxiosError).response?.data?.error;
      setError(
        apiError?.message ||
          'Invalid Figma access token. Generate one at figma.com/developers.',
      );
    }
  };

  const displayError = error;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-border-dark dark:bg-bg-dark"
          >
            {/* Header with Figma branding */}
            <div className="border-b border-gray-100 bg-gradient-to-r from-[#A259FF]/5 via-[#F24E1E]/5 to-[#FF7262]/5 px-6 py-5 dark:border-border-dark dark:from-[#A259FF]/10 dark:via-[#F24E1E]/10 dark:to-[#FF7262]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-white/10">
                    <img
                      src={PROVIDER_META.figma.logo}
                      alt="Figma"
                      className="h-6 w-6"
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      Connect Figma
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Design previews for issues
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Instructions */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-border-dark dark:bg-white/[0.03]">
                <p className="mb-3 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  How to get a personal access token
                </p>
                <ol className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#A259FF]/10 text-[9px] font-bold text-[#A259FF]">
                      1
                    </span>
                    <span>
                      Go to{' '}
                      <a
                        href="https://www.figma.com/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-[#A259FF] hover:underline"
                      >
                        Figma Settings
                        <ExternalLink size={9} />
                      </a>
                      {' '}&rarr;{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Security
                      </span>
                      {' '}tab
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#A259FF]/10 text-[9px] font-bold text-[#A259FF]">
                      2
                    </span>
                    <span>
                      Scroll down to{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Personal Access Tokens
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#A259FF]/10 text-[9px] font-bold text-[#A259FF]">
                      3
                    </span>
                    <span>
                      Enable these scopes:{' '}
                      <span className="font-mono text-[10px] font-medium text-gray-700 dark:text-gray-300">
                        current_user:read
                      </span>
                      ,{' '}
                      <span className="font-mono text-[10px] font-medium text-gray-700 dark:text-gray-300">
                        file_content:read
                      </span>
                      ,{' '}
                      <span className="font-mono text-[10px] font-medium text-gray-700 dark:text-gray-300">
                        file_metadata:read
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#A259FF]/10 text-[9px] font-bold text-[#A259FF]">
                      4
                    </span>
                    <span>
                      Click{' '}
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        Generate new token
                      </span>{' '}
                      and copy it
                    </span>
                  </li>
                </ol>
              </div>

              {/* Token input */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  <Key size={12} className="text-gray-400" />
                  Access Token{' '}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    if (error) setError(null);
                  }}
                  onBlur={() => setTouched(true)}
                  placeholder="figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  autoComplete="off"
                  className={`w-full rounded-xl border bg-gray-50 px-4 py-3 font-mono text-sm outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 dark:bg-white/[0.04] dark:focus:bg-white/[0.06] ${
                    displayError
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10 dark:border-red-800'
                      : 'border-gray-200 focus:border-[#A259FF] focus:ring-[#A259FF]/10 dark:border-border-dark'
                  }`}
                />
                {displayError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500">
                    <AlertCircle size={11} />
                    {displayError}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-border-dark dark:bg-white/[0.02]">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={connectFigma.isPending}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#A259FF] to-[#F24E1E] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 disabled:opacity-50"
              >
                {connectFigma.isPending && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Connect Figma
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
