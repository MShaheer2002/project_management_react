import React from 'react';
import { Key, Plus, Copy, Trash2, Shield, Clock } from 'lucide-react';
import { MOCK_API_KEYS } from '../constants';

import { useApp } from '../AppContext';

export const ApiKeysPage: React.FC = () => {
  const { setActiveModal } = useApp();
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">API Keys</h1>
          <span className="text-xs text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
            {MOCK_API_KEYS.length} keys
          </span>
        </div>
        <button 
          onClick={() => setActiveModal('generate-api-key')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          <span>Generate New Key</span>
        </button>
      </header>

      <div className="p-6 space-y-6 overflow-y-auto">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-4">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500">
            <Shield size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-blue-500">Security Best Practices</h3>
            <p className="text-xs text-blue-500/70 leading-relaxed">
              Never share your API keys or expose them in client-side code. Use environment variables to store them securely on your server.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {MOCK_API_KEYS.map(apiKey => (
            <div key={apiKey.id} className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-5 shadow-sm hover:border-primary/30 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <Key size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold">{apiKey.name}</h4>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      <span className="flex items-center gap-1"><Clock size={10} /> Created {apiKey.createdAt}</span>
                      {apiKey.lastUsedAt && <span className="flex items-center gap-1"><Clock size={10} /> Last used {apiKey.lastUsedAt}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-primary transition-colors">
                    <Copy size={16} />
                  </button>
                  <button className="p-2 rounded-md hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg px-3 py-2">
                <code className="text-xs font-mono text-gray-500 flex-1 truncate">{apiKey.key}</code>
                <button className="text-[10px] font-bold uppercase text-primary hover:underline">Reveal</button>
              </div>
            </div>
          ))}
        </div>

        {MOCK_API_KEYS.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-gray-200 dark:border-border-dark rounded-2xl text-gray-400">
            <Key size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">No API keys found.</p>
            <p className="text-xs mt-1">Generate a key to start using the Linearis API.</p>
          </div>
        )}
      </div>
    </div>
  );
};
