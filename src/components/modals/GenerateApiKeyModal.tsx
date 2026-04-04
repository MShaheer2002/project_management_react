import React, { useState } from 'react';
import { Modal } from './Modal';
import { useApp } from '../../AppContext';
import { ChevronDown, Loader2, Key, Copy, Check, AlertTriangle } from 'lucide-react';

export const GenerateApiKeyModal: React.FC = () => {
  const { activeModal, setActiveModal, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [scope, setScope] = useState('full');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setGeneratedKey(`lin_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`);
      showToast('API Key generated');
    }, 1000);
  };

  const copyToClipboard = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied to clipboard');
  };

  const handleClose = () => {
    setActiveModal(null);
    setGeneratedKey(null);
    setName('');
  };

  return (
    <Modal
      isOpen={activeModal === 'generate-api-key'}
      onClose={handleClose}
      title={generatedKey ? "API Key Generated" : "Generate API Key"}
      maxWidth="max-w-md"
    >
      {!generatedKey ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Key Name</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Production Server"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Permission Scope</label>
              <div className="relative">
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
                >
                  <option value="full">Full Access</option>
                  <option value="read">Read Only</option>
                  <option value="project">Project Specific</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

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
              disabled={loading || !name.trim()}
              className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Generate Key
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 flex gap-3">
            <AlertTriangle size={20} className="text-orange-500 shrink-0" />
            <p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed">
              Make sure to copy your API key now. You won't be able to see it again!
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Your API Key</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-border-dark rounded-lg font-mono text-xs break-all">
                {generatedKey}
              </div>
              <button
                onClick={copyToClipboard}
                className="p-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-full py-2.5 bg-gray-100 dark:bg-white/5 text-sm font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
};
