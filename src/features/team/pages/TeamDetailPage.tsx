import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ChevronRight,
  FileText,
  Filter,
  Layers,
  LayoutDashboard,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '@/AppContext';
import { MemberPerformancePanel } from '@/components/analytics/MemberPerformancePanel';
import { ActivityPage } from '@features/activity';
import { DocumentsPanel, useTeamDocuments } from '@features/documents';
import type { DocumentRecord } from '@features/documents';
import { IssuesPage } from '@features/issues';
import { buildMemberPerformanceRows } from '@shared/analytics/memberPerformance';
import { canManageTeam } from '@shared/permissions';
import { getApiErrorCode, getApiErrorMessage, getApiFieldErrors } from '@shared/services';
import { useIssuesDirectory } from '@features/issues';
import { useProjectsDirectory } from '@features/projects';
import { useWorkspaceMemberOptions } from '@features/workspace';
import {
  useAddTeamMembers,
  useDeleteTeam,
  useRemoveTeamMember,
  useTeamDetail,
  useTeamMembers,
  useUpdateTeam,
} from '../hooks/useTeamData';
import type { Issue } from '@/types';

const pickerButtonClassName =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left transition-all hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]';

const renderFieldError = (errors: Record<string, string[]>, field: string) =>
  errors[field]?.[0] ? <p className="mt-1 text-xs text-red-500">{errors[field][0]}</p> : null;

const AvatarFallback: React.FC<{ name: string; sizeClassName: string; textClassName: string }> = ({
  name,
  sizeClassName,
  textClassName,
}) => (
  <div className={`flex items-center justify-center rounded-full bg-primary/10 text-primary ${sizeClassName}`}>
    <span className={`font-bold ${textClassName}`}>{name.charAt(0).toUpperCase()}</span>
  </div>
);

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useApp();
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const role = useAuthStore((state) => state.workspace?.role);

  const [memberPickerSearch, setMemberPickerSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [isLeadPickerOpen, setIsLeadPickerOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [leadId, setLeadId] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const memberPickerRef = useRef<HTMLDivElement | null>(null);
  const leadPickerRef = useRef<HTMLDivElement | null>(null);
  const deferredMemberPickerSearch = useDeferredValue(memberPickerSearch);
  const deferredLeadSearch = useDeferredValue(leadSearch);

  const teamQuery = useTeamDetail(id);
  const membersQuery = useTeamMembers(id, {
    sort: 'name:asc',
    limit: 50,
  });
  const projectsQuery = useProjectsDirectory(
    {
      teamId: id,
      sort: 'updatedAt:desc',
      limit: 24,
    },
    { enabled: Boolean(id) }
  );
  const issuesQuery = useIssuesDirectory(
    {
      teamId: id,
      sort: 'updatedAt:desc',
      limit: 100,
    },
    { enabled: Boolean(id) }
  );
  const recentDocsQuery = useTeamDocuments(id, { sort: 'createdAt:desc', limit: 5 }, { enabled: Boolean(id) });
  const recentDocs: DocumentRecord[] = recentDocsQuery.data?.pages.flatMap((page) => page.items).slice(0, 5) ?? [];

  const addMembers = useAddTeamMembers(id);
  const removeMember = useRemoveTeamMember(id);
  const updateTeam = useUpdateTeam(id);
  const deleteTeam = useDeleteTeam(id);

  const memberOptionsQuery = useWorkspaceMemberOptions(
    {
      q: deferredMemberPickerSearch.trim() || undefined,
      sort: 'name:asc',
      limit: 10,
    },
    { enabled: isMemberPickerOpen }
  );
  const leadOptionsQuery = useWorkspaceMemberOptions(
    {
      q: deferredLeadSearch.trim() || undefined,
      sort: 'name:asc',
      limit: 10,
    },
    { enabled: isLeadPickerOpen }
  );

  const team = teamQuery.data;
  const members = membersQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const relatedProjects = projectsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const memberOptions = memberOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const leadOptions = leadOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const errorCode = getApiErrorCode(teamQuery.error);

  const teamIssues = useMemo(() => {
    const issuesById = new Map<string, Issue>();
    issuesQuery.data?.pages.forEach((page) => {
      page.items.forEach((issue) => {
        issuesById.set(issue.id, issue);
      });
    });
    return Array.from(issuesById.values());
  }, [issuesQuery.data]);

  useEffect(() => {
    if (!team) return;
    setName(team.name);
    setDescription(team.description ?? '');
    setVisibility(team.visibility);
    setLeadId(team.lead?.id ?? '');
    setFieldErrors({});
  }, [team]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (memberPickerRef.current && !memberPickerRef.current.contains(target)) {
        setIsMemberPickerOpen(false);
      }
      if (leadPickerRef.current && !leadPickerRef.current.contains(target)) {
        setIsLeadPickerOpen(false);
      }
    };

    if (isMemberPickerOpen || isLeadPickerOpen) {
      document.addEventListener('mousedown', handlePointerDown);
    }

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isLeadPickerOpen, isMemberPickerOpen]);

  const canManage = canManageTeam(role, currentUserId, team?.lead?.id ?? null);
  const allowedTabs = canManage
    ? ['overview', 'members', 'projects', 'docs', 'issues', 'activity', 'settings']
    : ['overview', 'members', 'projects', 'docs', 'issues', 'activity'];
  const rawTab = searchParams.get('tab');
  const activeTab = allowedTabs.includes(rawTab ?? '') ? (rawTab as (typeof allowedTabs)[number]) : 'overview';

  useEffect(() => {
    if (activeTab === 'settings' && !canManage) {
      const next = new URLSearchParams(searchParams);
      next.delete('tab');
      setSearchParams(next, { replace: true });
    }
  }, [activeTab, canManage, searchParams, setSearchParams]);

  const handleTabChange = (tab: (typeof allowedTabs)[number]) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'overview') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
    { id: 'members', label: 'Members', icon: <Users size={14} /> },
    { id: 'projects', label: 'Projects', icon: <Layers size={14} /> },
    { id: 'docs', label: 'Docs', icon: <FileText size={14} /> },
    { id: 'issues', label: 'Issues', icon: <Filter size={14} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={14} /> },
  ] as const;
  const selectedLead =
    leadOptions.find((option) => option.id === leadId) ??
    (team?.lead && team.lead.id === leadId
      ? {
          id: team.lead.id,
          name: team.lead.name,
          email: team.lead.email,
          role: 'LEAD',
        }
      : null);
  const selectableMembers = memberOptions.filter(
    (option) => !members.some((member) => member.id === option.id)
  );
  const teamAnalyticsRows = useMemo(() => {
    const liveSubjects = members.map((member) => {
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        avatar: member.avatar ?? null,
        roleLabel:
          member.id === team?.lead?.id ? 'Lead' : member.role.toLowerCase().replace('-', ' '),
        assigneeIds: [member.id],
      };
    });

    return buildMemberPerformanceRows(liveSubjects, teamIssues);
  }, [members, team?.lead?.id, teamIssues]);
  const teamUnassignedCount = teamIssues.filter((issue) => !issue.assigneeId).length;

  if (teamQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Loading team...
      </div>
    );
  }

  if (!team || errorCode === 'TEAM_NOT_FOUND' || errorCode === 'PRIVATE_TEAM_FORBIDDEN') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/5">
          <Users size={26} />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold">Team not found</h1>
          <p className="text-sm text-gray-400">
            This team was deleted or isn&apos;t visible in the active workspace.
          </p>
        </div>
        <Link to="/teams" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">
          Back to teams
        </Link>
      </div>
    );
  }

  const handleToggleMember = (memberId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((value) => value !== memberId)
        : [...current, memberId]
    );
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    try {
      await updateTeam.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        leadId,
        visibility,
      });
      showToast('Team updated.', 'success');
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'TEAM_NAME_TAKEN') {
        setFieldErrors({ name: ['A team with this name already exists.'] });
        return;
      }
      if (code === 'LEAD_NOT_WORKSPACE_MEMBER') {
        setFieldErrors({ leadId: ['Selected lead is not a member of this workspace.'] });
        return;
      }
      const validationErrors = getApiFieldErrors(error);
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        return;
      }
      showToast(getApiErrorMessage(error) || 'Failed to update team.', 'error', 'Update failed');
    }
  };

  const handleAddMembers = async () => {
    if (selectedMemberIds.length === 0) return;

    try {
      await addMembers.mutateAsync({ userIds: selectedMemberIds });
      setSelectedMemberIds([]);
      setMemberPickerSearch('');
      setIsMemberPickerOpen(false);
      showToast('Members added to the team.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to add team members.', 'error', 'Action failed');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember.mutateAsync(userId);
      showToast('Member removed from the team.', 'success');
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'FORBIDDEN') {
        showToast('Reassign the team lead before removing them.', 'error', 'Action blocked');
        return;
      }
      showToast(getApiErrorMessage(error) || 'Failed to remove the member.', 'error', 'Action failed');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete ${team.name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteTeam.mutateAsync();
      showToast('Team deleted.', 'success');
      navigate('/teams');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to delete the team.', 'error', 'Delete failed');
    }
  };

  const renderMembers = () => (
    <div className="p-6">
      {membersQuery.isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm text-gray-400">
          <Loader2 size={18} className="mr-2 animate-spin" />
          Loading team members...
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-bold uppercase text-gray-400 dark:bg-black/10">
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
              {members.map((member) => (
                <tr key={member.id} className="group transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {member.avatar ? (
                        <img src={member.avatar} className="h-8 w-8 rounded-full" alt={member.name} />
                      ) : (
                        <AvatarFallback name={member.name} sizeClassName="h-8 w-8" textClassName="text-xs" />
                      )}
                      <div>
                        <div className="text-sm font-bold">{member.name}</div>
                        <div className="text-[11px] font-medium text-gray-400">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium capitalize text-gray-500">
                    {member.role.toLowerCase()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500 dark:bg-gray-800">
                      {member.department?.name || team.department?.name || 'No department'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-400">
                    {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Recently'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canManage && member.id !== team.lead?.id ? (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500 dark:hover:bg-white/10"
                        title="Remove member"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                        {member.id === team.lead?.id ? 'Lead' : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {membersQuery.hasNextPage && (
            <div className="border-t border-gray-100 p-4 text-center dark:border-border-dark">
              <button
                onClick={() => membersQuery.fetchNextPage()}
                disabled={membersQuery.isFetchingNextPage}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold dark:border-border-dark"
              >
                {membersQuery.isFetchingNextPage && <Loader2 size={15} className="animate-spin" />}
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MemberPerformancePanel
            title="Member Performance"
            subtitle="Completion progress for issues assigned across this team."
            rows={teamAnalyticsRows}
            emptyTitle="No member performance yet"
            emptyDescription="Assign issues to team members to start tracking completion and workload."
            unassignedCount={teamUnassignedCount}
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Docs</h3>
            <button
              onClick={() => handleTabChange('docs')}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all
            </button>
          </div>
          {recentDocs.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-300 dark:bg-white/5 dark:text-gray-600">
                <FileText size={18} />
              </div>
              <p className="text-xs text-gray-400">No docs attached yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDocs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleTabChange('docs')}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{doc.name}</p>
                    <p className="truncate text-[11px] text-gray-400">{doc.fileName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
      {projectsQuery.isLoading ? (
        <div className="col-span-full flex items-center justify-center py-20 text-sm text-gray-400">
          <Loader2 size={18} className="mr-2 animate-spin" />
          Loading projects...
        </div>
      ) : projectsQuery.error ? (
        <div className="col-span-full rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          <p>Failed to load team projects.</p>
          <button
            onClick={() => projectsQuery.refetch()}
            className="mt-3 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white"
          >
            Retry
          </button>
        </div>
      ) : relatedProjects.length > 0 ? (
        relatedProjects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => navigate(`/projects/${project.id}`)}
            className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-primary/30 dark:border-border-dark dark:bg-card-dark"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                <Layers size={20} />
              </div>
              <span className="rounded-md p-1.5 text-gray-400">
                <MoreHorizontal size={16} />
              </span>
            </div>
            <h3 className="mb-1 font-bold">{project.name}</h3>
            <p className="mb-4 line-clamp-2 text-xs text-gray-400">
              {project.description || 'No description provided yet.'}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-full bg-primary" style={{ width: `${project.progress}%` }} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <span>{project.stats.memberCount} members</span>
              <span>{project.stats.issueCount} issues</span>
            </div>
          </button>
        ))
      ) : (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-gray-400">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-white/5">
            <Layers size={32} className="opacity-20" />
          </div>
          <p className="font-medium">No projects are attached yet.</p>
        </div>
      )}
    </div>
  );

  const renderIssues = () => (
    <IssuesPage
      teamId={team.id}
      title="All Issues"
      showTeamScopeBadge={false}
      initialViewMode="kanban"
    />
  );

  const renderDocs = () => (
    <DocumentsPanel
      scope="team"
      entityId={team.id}
      title="Team docs"
      description="Team docs keep operating notes, rituals, and working agreements close to the team."
      emptyTitle="No team docs yet"
      emptyDescription="Add briefs, rituals, and working agreements that help this team stay aligned."
    />
  );

  const renderSettings = () => (
    <form onSubmit={handleSave} className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Team name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
            />
            {renderFieldError(fieldErrors, 'name')}
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 min-h-[110px] w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
            />
          </div>

          <div ref={leadPickerRef} className="relative">
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Team lead</label>
            <button
              type="button"
              onClick={() => setIsLeadPickerOpen((current) => !current)}
              className={`mt-2 ${pickerButtonClassName}`}
            >
              <p className="truncate text-sm font-semibold">{selectedLead?.name || 'Select a lead'}</p>
              <p className="truncate text-[11px] text-gray-400">{selectedLead?.email || 'Required'}</p>
            </button>
            {renderFieldError(fieldErrors, 'leadId')}

            {isLeadPickerOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 space-y-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-border-dark dark:bg-card-dark">
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={leadSearch}
                    onChange={(event) => setLeadSearch(event.target.value)}
                    placeholder="Search lead"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                  />
                </div>

                <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                  {leadOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setLeadId(option.id);
                        setIsLeadPickerOpen(false);
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                        leadId === option.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 bg-white hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]'
                      }`}
                    >
                      <p className="truncate text-sm font-semibold">{option.name}</p>
                      <p className="truncate text-[11px] text-gray-400">{option.email} · {option.role}</p>
                    </button>
                  ))}
                </div>

                {leadOptionsQuery.hasNextPage && (
                  <button
                    type="button"
                    onClick={() => leadOptionsQuery.fetchNextPage()}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold dark:border-border-dark"
                  >
                    {leadOptionsQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Visibility</label>
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as 'PUBLIC' | 'PRIVATE')}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>

          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-500 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-400 md:col-span-2">
            Department: {team.department?.name || 'No department assigned'}.
            <br />
            Phase 3 keeps the real team contract here while the legacy mock tabs stay visible for later integration.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleDelete}
          disabled={!canManage || deleteTeam.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
        >
          {deleteTeam.isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          Delete team
        </button>

        <button
          type="submit"
          disabled={!canManage || updateTeam.isPending || !name.trim() || !leadId}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {updateTeam.isPending && <Loader2 size={16} className="animate-spin" />}
          Save changes
        </button>
      </div>
    </form>
  );

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-gray-200 px-6 pt-6 dark:border-border-dark">
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
          <button onClick={() => navigate('/teams')} className="cursor-pointer transition-colors hover:text-primary">
            Teams
          </button>
          <ChevronRight size={12} />
          <span className="font-medium text-gray-900 dark:text-gray-100">{team.name}</span>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-white">
              {team.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Lead by</span>
                <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100">
                  {team.lead?.avatar ? (
                    <img src={team.lead.avatar} className="h-4 w-4 rounded-full" alt={team.lead.name} />
                  ) : team.lead?.name ? (
                    <AvatarFallback name={team.lead.name} sizeClassName="h-4 w-4" textClassName="text-[9px]" />
                  ) : null}
                  {team.lead?.name || 'Unassigned'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canManage && (
              <button
                onClick={() => handleTabChange('settings')}
                className="rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50 dark:border-border-dark dark:hover:bg-white/5"
              >
                <Settings size={18} />
              </button>
            )}

            {canManage && (
              <div ref={memberPickerRef} className="relative">
                <button
                  onClick={() => {
                    handleTabChange('members');
                    setIsMemberPickerOpen((current) => !current);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                >
                  <Plus size={16} />
                  <span>Invite</span>
                </button>

                {isMemberPickerOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[320px] space-y-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-border-dark dark:bg-card-dark">
                    <div className="relative">
                      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={memberPickerSearch}
                        onChange={(event) => setMemberPickerSearch(event.target.value)}
                        placeholder="Search member"
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                      />
                    </div>

                    <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                      {selectableMembers.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 px-3 py-5 text-center text-xs text-gray-400 dark:border-border-dark">
                          No available members.
                        </div>
                      ) : (
                        selectableMembers.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleToggleMember(option.id)}
                            className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                              selectedMemberIds.includes(option.id)
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-gray-200 bg-white hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]'
                            }`}
                          >
                            <p className="truncate text-sm font-semibold">{option.name}</p>
                            <p className="truncate text-[11px] text-gray-400">{option.email} · {option.role}</p>
                          </button>
                        ))
                      )}
                    </div>

                    {memberOptionsQuery.hasNextPage && (
                      <button
                        onClick={() => memberOptionsQuery.fetchNextPage()}
                        disabled={memberOptionsQuery.isFetchingNextPage}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold dark:border-border-dark"
                      >
                        {memberOptionsQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
                      </button>
                    )}

                    <button
                      onClick={handleAddMembers}
                      disabled={selectedMemberIds.length === 0 || addMembers.isPending}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {addMembers.isPending && <Loader2 size={15} className="animate-spin" />}
                      Add selected
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-2 pb-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-black/10">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'members' && renderMembers()}
        {activeTab === 'projects' && renderProjects()}
        {activeTab === 'docs' && renderDocs()}
        {activeTab === 'issues' && renderIssues()}
        {activeTab === 'activity' && <ActivityPage scope="team" scopeId={team.id} title="Activity" />}
        {activeTab === 'settings' && canManage && renderSettings()}
      </div>
    </div>
  );
};
