import React from 'react';
import {
  Building2,
  FolderKanban,
  Hash,
  Loader2,
  User,
  Users,
} from 'lucide-react';
import type { MentionMode } from '../hooks/useMentionAutocomplete';

const ENTITY_TYPES = [
  { mode: 'person' as const, label: 'Member', prefix: '', icon: User, hint: '@name', color: 'text-primary bg-primary/10' },
  { mode: 'project' as const, label: 'Project', prefix: 'project:', icon: FolderKanban, hint: '@project:name', color: 'text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-500/15' },
  { mode: 'team' as const, label: 'Team', prefix: 'team:', icon: Users, hint: '@team:name', color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/15' },
  { mode: 'department' as const, label: 'Department', prefix: 'dept:', icon: Building2, hint: '@dept:name', color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/15' },
  { mode: 'issue' as const, label: 'Issue', prefix: 'issue:', icon: Hash, hint: '@issue:ID', color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/15' },
];

type MentionDropdownProps = {
  mode: MentionMode;
  query: string;
  members: Array<{ id: string; name: string; email?: string }>;
  projects: Array<{ id: string; name: string }>;
  teams: Array<{ id: string; name: string }>;
  departments: Array<{ id: string; name: string }>;
  issues: Array<{ id: string; title: string }>;
  isLoadingMembers: boolean;
  isLoadingProjects: boolean;
  isLoadingTeams: boolean;
  isLoadingDepts: boolean;
  isLoadingIssues: boolean;
  onSelectPerson: (name: string, id: string) => void;
  onSelectProject: (name: string, id: string) => void;
  onSelectTeam: (name: string, id: string) => void;
  onSelectDepartment: (name: string, id: string) => void;
  onSelectIssue: (id: string) => void;
  onSwitchMode: (mode: MentionMode, prefix: string) => void;
  position?: 'above' | 'below';
};

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  mode, query, members, projects, teams, departments, issues,
  isLoadingMembers, isLoadingProjects, isLoadingTeams, isLoadingDepts, isLoadingIssues,
  onSelectPerson, onSelectProject, onSelectTeam, onSelectDepartment, onSelectIssue, onSwitchMode,
  position = 'below',
}) => {
  const posClass = position === 'above' ? 'bottom-full mb-1' : 'top-full mt-1';

  return (
    <div className={`absolute left-0 ${posClass} z-50 w-[280px] max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-2xl dark:border-border-dark dark:bg-card-dark`}>

      {/* Selector mode */}
      {mode === 'selector' && (
        <>
          <div className="px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-gray-400">Mention</div>
          {ENTITY_TYPES.map((et) => {
            const q = query.toLowerCase();
            if (q && !et.label.toLowerCase().startsWith(q) && !et.prefix.startsWith(q) && !et.mode.startsWith(q)) return null;
            return (
              <button key={et.mode} type="button" onMouseDown={(e) => e.preventDefault()}
                onClick={() => et.prefix ? onSwitchMode(et.mode, et.prefix) : onSwitchMode('person', '')}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/[0.06]"
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded-md ${et.color}`}><et.icon size={11} /></div>
                <div>
                  <div className="text-[12px] font-medium text-gray-700 dark:text-gray-200">{et.label}</div>
                  <div className="text-[9px] text-gray-400">{et.hint}</div>
                </div>
              </button>
            );
          })}
          {query && members.length > 0 && (
            <>
              <div className="my-0.5 border-t border-gray-100 dark:border-border-dark" />
              {members.slice(0, 4).map((m) => (
                <button key={m.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onSelectPerson(m.name, m.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">{(m.name || 'U').charAt(0).toUpperCase()}</div>
                  <span className="truncate text-[11px] text-gray-700 dark:text-gray-300">{m.name}</span>
                </button>
              ))}
            </>
          )}
        </>
      )}

      {/* Person mode */}
      {mode === 'person' && (
        isLoadingMembers ? <Loading /> : members.length === 0 ? <Empty label="members" /> :
        members.map((m) => (
          <button key={m.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onSelectPerson(m.name, m.id)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/[0.06]"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">{(m.name || 'U').charAt(0).toUpperCase()}</div>
            <div className="min-w-0">
              <div className="truncate text-[11px] font-medium text-gray-700 dark:text-gray-200">{m.name}</div>
              {m.email && <div className="truncate text-[9px] text-gray-400">{m.email}</div>}
            </div>
          </button>
        ))
      )}

      {/* Project mode */}
      {mode === 'project' && (
        isLoadingProjects ? <Loading /> : projects.length === 0 ? <Empty label="projects" /> :
        projects.map((p) => (
          <button key={p.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onSelectProject(p.name, p.id)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/[0.06]"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-500/15"><FolderKanban size={11} /></div>
            <span className="truncate text-[11px] font-medium text-gray-700 dark:text-gray-200">{p.name}</span>
          </button>
        ))
      )}

      {/* Team mode */}
      {mode === 'team' && (
        isLoadingTeams ? <Loading /> : teams.length === 0 ? <Empty label="teams" /> :
        teams.map((t) => (
          <button key={t.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onSelectTeam(t.name, t.id)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/[0.06]"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/15"><Users size={11} /></div>
            <span className="truncate text-[11px] font-medium text-gray-700 dark:text-gray-200">{t.name}</span>
          </button>
        ))
      )}

      {/* Department mode */}
      {mode === 'department' && (
        isLoadingDepts ? <Loading /> : departments.length === 0 ? <Empty label="departments" /> :
        departments.map((d) => (
          <button key={d.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onSelectDepartment(d.name, d.id)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/[0.06]"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/15"><Building2 size={11} /></div>
            <span className="truncate text-[11px] font-medium text-gray-700 dark:text-gray-200">{d.name}</span>
          </button>
        ))
      )}

      {/* Issue mode */}
      {mode === 'issue' && (
        isLoadingIssues ? <Loading /> : issues.length === 0 ? <Empty label="issues" /> :
        issues.map((issue) => (
          <button key={issue.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onSelectIssue(issue.id)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/[0.06]"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/15"><Hash size={11} /></div>
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold text-gray-700 dark:text-gray-200">{issue.id}</div>
              <div className="truncate text-[9px] text-gray-400">{issue.title}</div>
            </div>
          </button>
        ))
      )}
    </div>
  );
};

const Loading = () => (
  <div className="flex items-center gap-2 px-3 py-2 text-[10px] text-gray-400"><Loader2 size={10} className="animate-spin" /> Loading...</div>
);

const Empty: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-3 py-2 text-[10px] text-gray-400">No matching {label}</div>
);
