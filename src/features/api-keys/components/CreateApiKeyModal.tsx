import React, { useState } from 'react';
import { Modal } from '@/components/modals/Modal';
import { ChevronDown, Loader2, Copy, Check, AlertTriangle } from 'lucide-react';
import { useCreateApiKey } from '../hooks/useApiKeyMutations';
import type { ApiAxiosError } from '@shared/services/types';

const EXPIRY_OPTIONS = [
  { label: 'Never', days: 0 },
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
];

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

interface CreateApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateApiKeyModal: React.FC<CreateApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [expiryDays, setExpiryDays] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createApiKey = useCreateApiKey();

  const reset = () => {
    setName('');
    setExpiryDays(0);
    setError(null);
    setCreatedKey(null);
    setCopied(false);
    createApiKey.reset();
  };

  const handleClose = () => {
    if (createdKey) return;
    reset();
    onClose();
  };

  const handleDone = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    try {
      const result = await createApiKey.mutateAsync({
        name: name.trim(),
        expiresAt: expiryDays > 0 ? addDays(new Date(), expiryDays) : undefined,
      });
      setCreatedKey(result.key);
    } catch (err) {
      const apiError = err as ApiAxiosError;
      const code = apiError.response?.data?.error?.code;
      const message = apiError.response?.data?.error?.message;

      if (code === 'API_KEY_LIMIT_REACHED') {
        setError("You've reached the maximum API keys for your plan. Delete unused keys or upgrade.");
      } else if (code === 'VALIDATION_ERROR') {
        setError('Invalid input. Check the name and expiration fields.');
      } else {
        setError('Could not create API key. Please try again.');
      }
    }
  };

  const handleCopy = async () => {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey);
    } catch {
      // Fallback for non-HTTPS (e.g. local network IP)
      const textarea = document.createElement('textarea');
      textarea.value = createdKey;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdKey ? 'Your API key has been created' : 'Generate New API Key'}
      maxWidth={createdKey ? 'max-w-lg' : 'max-w-md'}
    >
      {!createdKey ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Name
            </label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. CI/CD Pipeline"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Expiration <span className="font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <div className="relative">
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt.days} value={opt.days}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-border-dark">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createApiKey.isPending || !name.trim()}
              className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
            >
              {createApiKey.isPending && <Loader2 size={16} className="animate-spin" />}
              Generate Key
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Key — single line, click to copy */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full text-left p-3 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/[0.06] rounded-lg hover:border-gray-300 dark:hover:border-white/[0.12] transition-colors group cursor-copy"
          >
            <div className="flex items-center justify-between gap-3">
              <code className="font-mono text-[12.5px] text-gray-800 dark:text-gray-200 truncate">
                {createdKey}
              </code>
              <span className="shrink-0 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {copied ? 'Copied!' : 'Click to copy'}
            </p>
          </button>

          {/* Example usage */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 px-0.5">Example usage</p>
            <div className="p-2.5 bg-gray-900 dark:bg-black/40 rounded-lg overflow-x-auto">
              <code className="font-mono text-[11px] text-gray-400 whitespace-nowrap">
                curl -H "Authorization: Bearer {createdKey?.slice(0, 20)}..." https://api.linearis.app/issues
              </code>
            </div>
          </div>

          {/* Note */}
          <div className="flex items-center gap-2 px-0.5">
            <AlertTriangle size={11} className="text-amber-500 shrink-0" />
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              This key won't be shown again. Store it somewhere safe.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDone}
            className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            I've copied the key
          </button>
        </div>
      )}
    </Modal>
  );
};
