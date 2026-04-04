import React from 'react';
import { Globe, Plus, Search, Filter, MoreHorizontal, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { MOCK_INTEGRATIONS } from '../constants';

export const IntegrationsPage: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Integrations</h1>
          <span className="text-xs text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
            {MOCK_INTEGRATIONS.filter(i => i.connected).length} connected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search integrations..." 
              className="pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm outline-none w-64 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 text-sm transition-colors">
            <Filter size={14} />
            <span>Filter</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_INTEGRATIONS.map(integration => (
            <div 
              key={integration.id}
              className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-6 shadow-sm hover:border-primary/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 p-2 flex items-center justify-center">
                  <img src={integration.logo} alt={integration.name} className="w-full h-full object-contain" />
                </div>
                {integration.connected ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 size={12} />
                    Connected
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    Not Connected
                  </div>
                )}
              </div>
              
              <div className="space-y-2 mb-8">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  {integration.name}
                  <ExternalLink size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{integration.description}</p>
              </div>

              <div className="flex items-center justify-between">
                <button className="text-xs text-gray-400 font-semibold hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  View Documentation
                </button>
                {integration.connected ? (
                  <button className="px-4 py-1.5 rounded-md border border-gray-200 dark:border-border-dark text-xs font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                    Disconnect
                  </button>
                ) : (
                  <button className="px-4 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="bg-gray-50 dark:bg-black/10 border border-dashed border-gray-300 dark:border-border-dark rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-gray-400">
              <Plus size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm">Request Integration</h3>
              <p className="text-xs text-gray-400">Don't see what you need? Let us know.</p>
            </div>
            <button className="px-4 py-1.5 rounded-md border border-gray-200 dark:border-border-dark text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
              Submit Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
