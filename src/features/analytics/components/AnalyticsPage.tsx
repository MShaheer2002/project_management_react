import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  FolderKanban,
  Users,
  User,
  RotateCcw,
} from 'lucide-react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { privateApi } from '@shared/services/privateApi';
import type { AnalyticsPeriod } from '../types';
import { WorkspaceAnalytics } from './WorkspaceAnalytics';
import { ProjectAnalytics } from './ProjectAnalytics';
import { TeamAnalytics } from './TeamAnalytics';
import { MemberAnalytics } from './MemberAnalytics';
import { CycleAnalytics } from './CycleAnalytics';

type AnalyticsTab = 'workspace' | 'project' | 'team' | 'member' | 'cycle';

const tabs: { value: AnalyticsTab; label: string; icon: React.ReactNode }[] = [
  { value: 'workspace', label: 'Overview', icon: <BarChart3 size={15} /> },
  { value: 'project', label: 'Project', icon: <FolderKanban size={15} /> },
  { value: 'team', label: 'Team', icon: <Users size={15} /> },
  { value: 'member', label: 'Member', icon: <User size={15} /> },
  { value: 'cycle', label: 'Cycle', icon: <RotateCcw size={15} /> },
];

interface EntityOption {
  id: string;
  name: string;
}

const EntitySelector: React.FC<{
  label: string;
  options: EntityOption[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
}> = ({ label, options, value, onChange, loading }) => (
  <div className="flex items-center gap-3">
    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 min-w-[200px]"
    >
      <option value="">Select {label.toLowerCase()}...</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.name}
        </option>
      ))}
    </select>
  </div>
);

export const AnalyticsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const workspace = useAuthStore((s) => s.workspace);
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = workspace?.role === 'owner' || workspace?.role === 'admin';

  const rawTab = searchParams.get('tab') as AnalyticsTab | null;
  const activeTab = rawTab || (isAdmin ? 'workspace' : 'project');
  const entityId = searchParams.get('id') || '';
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');

  // Entity lists for selectors (fetched from existing data sources)
  const [projects, setProjects] = useState<EntityOption[]>([]);
  const [teams, setTeams] = useState<EntityOption[]>([]);
  const [members, setMembers] = useState<EntityOption[]>([]);
  const [cycles, setCycles] = useState<EntityOption[]>([]);

  // Load entity lists when tabs change
  useEffect(() => {
    const loadEntities = async () => {
      try {
        if (activeTab === 'project' && projects.length === 0) {
          const { data } = await privateApi.get('/projects', { params: { limit: 100 } });
          const items = data.data ?? data;
          setProjects(Array.isArray(items) ? items.map((p: any) => ({ id: p.id, name: p.name })) : []);
        }
        if (activeTab === 'team' && teams.length === 0) {
          const { data } = await privateApi.get('/teams');
          const items = data.data ?? data;
          setTeams(Array.isArray(items) ? items.map((t: any) => ({ id: t.id, name: t.name })) : []);
        }
        if (activeTab === 'member' && members.length === 0) {
          const { data } = await privateApi.get('/workspaces/members');
          const items = data.data ?? data;
          setMembers(Array.isArray(items) ? items.map((m: any) => ({ id: m.userId ?? m.id, name: m.user?.name ?? m.name })) : []);
        }
        if (activeTab === 'cycle' && cycles.length === 0) {
          const { data } = await privateApi.get('/cycles', { params: { limit: 50 } });
          const items = data.data ?? data;
          setCycles(Array.isArray(items) ? items.map((c: any) => ({ id: c.id, name: c.name })) : []);
        }
      } catch {
        // Silently handle — user can still type IDs manually
      }
    };
    loadEntities();
  }, [activeTab]);

  const setTab = (tab: AnalyticsTab) => {
    const params: Record<string, string> = { tab };
    // Keep entity ID if switching back to same tab type
    if (tab !== activeTab) {
      // For member tab, default to current user if not admin
      if (tab === 'member' && !isAdmin && currentUser?.id) {
        params.id = currentUser.id;
      }
    } else if (entityId) {
      params.id = entityId;
    }
    setSearchParams(params);
  };

  const setEntityId = (id: string) => {
    setSearchParams({ tab: activeTab, id });
  };

  const renderEntitySelector = () => {
    switch (activeTab) {
      case 'project':
        return (
          <EntitySelector
            label="Project"
            options={projects}
            value={entityId}
            onChange={setEntityId}
          />
        );
      case 'team':
        return (
          <EntitySelector
            label="Team"
            options={teams}
            value={entityId}
            onChange={setEntityId}
          />
        );
      case 'member':
        return (
          <EntitySelector
            label="Member"
            options={members}
            value={entityId}
            onChange={setEntityId}
          />
        );
      case 'cycle':
        return (
          <EntitySelector
            label="Cycle"
            options={cycles}
            value={entityId}
            onChange={setEntityId}
          />
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'workspace':
        return <WorkspaceAnalytics period={period} onPeriodChange={setPeriod} />;
      case 'project':
        if (!entityId) return <SelectEntityPrompt entity="project" />;
        return <ProjectAnalytics projectId={entityId} period={period} onPeriodChange={setPeriod} />;
      case 'team':
        if (!entityId) return <SelectEntityPrompt entity="team" />;
        return <TeamAnalytics teamId={entityId} period={period} onPeriodChange={setPeriod} />;
      case 'member':
        if (!entityId) return <SelectEntityPrompt entity="member" />;
        return <MemberAnalytics memberId={entityId} period={period} onPeriodChange={setPeriod} />;
      case 'cycle':
        if (!entityId) return <SelectEntityPrompt entity="cycle" />;
        return <CycleAnalytics cycleId={entityId} period={period} onPeriodChange={setPeriod} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <header className="shrink-0 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BarChart3 size={20} className="text-primary" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-text-primary-dark">Analytics</h1>
          </div>
          {activeTab !== 'workspace' && renderEntitySelector()}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6">
          {tabs.map((tab) => {
            // Hide workspace tab for non-admins
            if (tab.value === 'workspace' && !isAdmin) return null;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setTab(tab.value)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 -mb-px ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {renderContent()}
      </div>
    </div>
  );
};

const SelectEntityPrompt: React.FC<{ entity: string }> = ({ entity }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 text-gray-300 dark:text-gray-600">
      <BarChart3 size={28} />
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-text-primary-dark">
      Select a {entity}
    </h3>
    <p className="mt-2 max-w-sm text-sm text-gray-400">
      Choose a {entity} from the dropdown above to view its analytics.
    </p>
  </div>
);
