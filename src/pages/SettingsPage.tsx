import React from 'react';
import { Settings as SettingsIcon, User, Bell, CreditCard, Shield, Globe, Key, Trash2, Save } from 'lucide-react';

import { useApp } from '../AppContext';
import { MOCK_USERS } from '../constants';

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-6">
    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">{title}</h3>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const SettingsItem: React.FC<{ 
  label: string; 
  description: string; 
  children: React.ReactNode;
  danger?: boolean;
}> = ({ label, description, children, danger }) => (
  <div className="flex items-start justify-between p-4 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl shadow-sm">
    <div className="space-y-1">
      <h4 className={`text-sm font-semibold ${danger ? 'text-red-500' : ''}`}>{label}</h4>
      <p className="text-xs text-gray-400 max-w-md">{description}</p>
    </div>
    <div>{children}</div>
  </div>
);

export const SettingsPage: React.FC = () => {
  const { setView, currentUser, setCurrentUser } = useApp();
  const [activeTab, setActiveTab] = React.useState('General');

  const tabs = [
    { name: 'General', view: 'settings' },
    { name: 'Members', view: 'members' },
    { name: 'Teams', view: 'teams' },
    { name: 'Billing', view: 'billing' },
    { name: 'Integrations', view: 'integrations' },
    { name: 'API Keys', view: 'api-keys' }
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="px-8 py-6 border-b border-gray-200 dark:border-border-dark">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full space-y-12">
        {/* Navigation Tabs */}
        <div className="flex gap-8 border-b border-gray-200 dark:border-border-dark">
          {tabs.map((tab) => (
            <button 
              key={tab.name} 
              onClick={() => {
                setActiveTab(tab.name);
                if (tab.view !== 'settings') setView(tab.view as any);
              }}
              className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === tab.name ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
            >
              {tab.name}
              {activeTab === tab.name && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>

        <SettingsSection title="Workspace Profile">
          <SettingsItem 
            label="Demo: Switch Role" 
            description="Quickly switch between mock users to see different UI states."
          >
            <div className="flex flex-wrap gap-2">
              {MOCK_USERS.map(user => (
                <button
                  key={user.id}
                  onClick={() => setCurrentUser(user)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    currentUser?.id === user.id 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  {user.name} ({user.role})
                </button>
              ))}
            </div>
          </SettingsItem>

          <SettingsItem 
            label="Organization Name" 
            description="This is your workspace's visible name. It will be used in notifications and emails."
          >
            <input 
              type="text" 
              defaultValue="Linearis Inc." 
              className="px-3 py-1.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64"
            />
          </SettingsItem>

          <SettingsItem 
            label="Workspace URL" 
            description="The URL used to access your workspace. Changing this will break existing links."
          >
            <div className="flex items-center">
              <input 
                type="text" 
                defaultValue="linearis" 
                className="px-3 py-1.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-l-md text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all w-48"
              />
              <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-l-0 border-gray-200 dark:border-border-dark rounded-r-md text-xs text-gray-400">
                .linearis.app
              </span>
            </div>
          </SettingsItem>
        </SettingsSection>

        <SettingsSection title="Security & Access">
          <SettingsItem 
            label="Two-Factor Authentication" 
            description="Add an extra layer of security to your account by requiring more than just a password to log in."
          >
            <button className="px-4 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
              Enable 2FA
            </button>
          </SettingsItem>

          <SettingsItem 
            label="Single Sign-On (SSO)" 
            description="Allow members to log in using your company's identity provider (Okta, Google, etc.)."
          >
            <button className="px-4 py-1.5 rounded-md border border-gray-200 dark:border-border-dark text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              Configure SSO
            </button>
          </SettingsItem>
        </SettingsSection>

        <SettingsSection title="Danger Zone">
          <SettingsItem 
            label="Delete Workspace" 
            description="Permanently delete this workspace and all its data. This action cannot be undone."
            danger
          >
            <button className="px-4 py-1.5 rounded-md bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500 hover:text-white transition-all">
              Delete Workspace
            </button>
          </SettingsItem>
        </SettingsSection>

        <div className="flex justify-end pt-8">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
