import React, { useState } from 'react';
import { AlertCircle, Hash, Link2, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useConnectDiscord } from '../hooks/useIntegrationMutations';
import { DISCORD_WEBHOOK_REGEX, PROVIDER_META } from '../types';
import type { ApiAxiosError } from '@shared/services/types';

interface DiscordConnectModalProps {
  open: boolean;
  onClose: () => void;
  onConnected: () => void;
}

const isDiscordChannelLink = (url: string) =>
  /^https:\/\/discord\.com\/channels\//.test(url);

const getValidationError = (url: string): string | null => {
  if (!url.trim()) return 'Webhook URL is required';
  if (isDiscordChannelLink(url))
    return 'This is a channel link, not a webhook URL. See instructions above.';
  if (!DISCORD_WEBHOOK_REGEX.test(url))
    return 'Must be a Discord webhook URL (https://discord.com/api/webhooks/...)';
  return null;
};

export const DiscordConnectModal: React.FC<DiscordConnectModalProps> = ({
  open,
  onClose,
  onConnected,
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const connectDiscord = useConnectDiscord();

  const handleClose = () => {
    setWebhookUrl('');
    setLabel('');
    setError(null);
    setTouched(false);
    onClose();
  };

  const handleSubmit = async () => {
    setTouched(true);
    const validationError = getValidationError(webhookUrl);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    try {
      await connectDiscord.mutateAsync({
        webhookUrl: webhookUrl.trim(),
        label: label.trim() || undefined,
      });
      handleClose();
      onConnected();
    } catch (err) {
      const apiError = (err as ApiAxiosError).response?.data?.error;
      setError(apiError?.message || 'Failed to connect Discord');
    }
  };

  const clientError = touched ? getValidationError(webhookUrl) : null;
  const displayError = error || clientError;

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
            {/* Header with Discord branding */}
            <div className="border-b border-gray-100 bg-gradient-to-r from-[#5865F2]/5 to-[#5865F2]/10 px-6 py-5 dark:border-border-dark dark:from-[#5865F2]/10 dark:to-[#5865F2]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-white/10">
                    <img
                      src={PROVIDER_META.discord.logo}
                      alt="Discord"
                      className="h-6 w-6"
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      Connect Discord
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Webhook notifications
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
                  How to create a webhook
                </p>
                <ol className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#5865F2]/10 text-[9px] font-bold text-[#5865F2]">
                      1
                    </span>
                    <span>Open Discord and right-click a channel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#5865F2]/10 text-[9px] font-bold text-[#5865F2]">
                      2
                    </span>
                    <span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Edit Channel
                      </span>{' '}
                      &rarr;{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Integrations
                      </span>{' '}
                      &rarr;{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Webhooks
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#5865F2]/10 text-[9px] font-bold text-[#5865F2]">
                      3
                    </span>
                    <span>
                      Click{' '}
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        New Webhook
                      </span>
                      , then{' '}
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        Copy URL
                      </span>
                    </span>
                  </li>
                </ol>
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  <Link2 size={12} className="text-gray-400" />
                  Webhook URL{' '}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => {
                    setWebhookUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  onBlur={() => setTouched(true)}
                  placeholder="https://discord.com/api/webhooks/..."
                  autoComplete="off"
                  className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 dark:bg-white/[0.04] dark:focus:bg-white/[0.06] ${
                    displayError
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10 dark:border-red-800'
                      : 'border-gray-200 focus:border-[#5865F2] focus:ring-[#5865F2]/10 dark:border-border-dark'
                  }`}
                />
                {displayError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500">
                    <AlertCircle size={11} />
                    {displayError}
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  <Hash size={12} className="text-gray-400" />
                  Channel Label{' '}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="#dev-updates"
                  autoComplete="off"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#5865F2] focus:bg-white focus:ring-2 focus:ring-[#5865F2]/10 dark:border-border-dark dark:bg-white/[0.04] dark:focus:bg-white/[0.06]"
                />
                <p className="text-[11px] text-gray-400">
                  Helps you identify this channel in settings later
                </p>
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
                disabled={connectDiscord.isPending}
                className="flex items-center gap-2 rounded-lg bg-[#5865F2] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#4752C4] hover:shadow-md disabled:opacity-50"
              >
                {connectDiscord.isPending && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Connect Discord
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
