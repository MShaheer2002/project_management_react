import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ChevronRight,
  Filter,
  Layers,
  LayoutDashboard,
  Loader2,
  Map,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '@/AppContext';
import { MemberPerformancePanel } from '@/components/analytics/MemberPerformancePanel';
import { ActivityPage } from '@/pages/ActivityPage';
import { RoadmapPage } from '@/pages/RoadmapPage';
import { IssuesPage } from '@/features/issues/components/IssuesPage';
import { MOCK_ACTIVITIES, MOCK_ISSUES, MOCK_PROJECTS, MOCK_USERS } from '@/constants';
import { getStoredIssues } from '@/lib/issue-storage';
import { buildMemberPerformanceRows, mergeIssuesById } from '@shared/analytics/memberPerformance';
import { canManageProject } from '@shared/permissions';
import { getApiErrorCode, getApiErrorMessage, getApiFieldErrors } from '@shared/services';
import { useWorkspaceMemberOptions } from '@features/workspace';
import {
  useAddProjectMembers,
  useDeleteProject,
  useProjectDetail,
  useProjectMembers,
  useRemoveProjectMember,
  useUpdateProject,
} from '../hooks/useProjectData';
import type { ProjectMemberRow, ProjectStatus, ProjectVisibility } from '../types';
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

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const role = useAuthStore((state) => state.workspace?.role);
  const currentUserId = useAuthStore((state) => state.currentUser?.id);

  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'board' | 'roadmap' | 'members' | 'activity' | 'settings'>('overview');
  const [storedIssues, setStoredIssues] = useState<Issue[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [isLeadPickerOpen, setIsLeadPickerOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState('');
  const [visibility, setVisibility] = useState<ProjectVisibility>('PUBLIC');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [enableRoadmap, setEnableRoadmap] = useState(true);
  const [enableCycles, setEnableCycles] = useState(true);
  const [enableTracking, setEnableTracking] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const memberPickerRef = useRef<HTMLDivElement | null>(null);
  const leadPickerRef = useRef<HTMLDivElement | null>(null);
  const deferredMemberSearch = useDeferredValue(memberSearch);
  const deferredLeadSearch = useDeferredValue(leadSearch);

  const projectQuery = useProjectDetail(id);
  const membersQuery = useProjectMembers(id, {
    sort: 'name:asc',
    limit: 50,
  });
  const addMembers = useAddProjectMembers(id);
  const removeMember = useRemoveProjectMember(id);
  const updateProject = useUpdateProject(id);
  const deleteProject = useDeleteProject(id);

  const memberOptionsQuery = useWorkspaceMemberOptions(
    {
      q: deferredMemberSearch.trim() || undefined,
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

  const project = projectQuery.data;
  const members = membersQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const memberOptions = memberOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const leadOptions = leadOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const errorCode = getApiErrorCode(projectQuery.error);

  const matchedMockProject = useMemo(() => {
    if (!project) return null;
    return (
      MOCK_PROJECTS.find((mockProject) => mockProject.name.toLowerCase() === project.name.toLowerCase()) ?? null
    );
  }, [project]);

  const projectIssues = useMemo(() => {
    if (!project) return [];
    const allIssues = mergeIssuesById(MOCK_ISSUES, storedIssues);

    return allIssues.filter((issue) => {
      if (issue.projectId === project.id) return true;
      if (matchedMockProject && issue.projectId === matchedMockProject.id) return true;
      return false;
    });
  }, [matchedMockProject, project, storedIssues]);

  const projectActivities = useMemo(() => {
    if (!matchedMockProject) return [];
    return MOCK_ACTIVITIES.filter(
      (activity) =>
        activity.targetId === matchedMockProject.id ||
        projectIssues.some((issue) => issue.id === activity.targetId)
    );
  }, [matchedMockProject, projectIssues]);

  const projectAnalyticsRows = useMemo(() => {
    const subjects = members.map((member) => {
      const matchedMockUser =
        MOCK_USERS.find((user) => user.email.toLowerCase() === member.email.toLowerCase()) ??
        MOCK_USERS.find((user) => user.name.toLowerCase() === member.name.toLowerCase()) ??
        null;

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        avatar: member.avatar ?? null,
        roleLabel: member.membershipRole === 'LEAD' ? 'Lead' : member.role.toLowerCase(),
        assigneeIds: Array.from(
          new Set([member.id, matchedMockUser?.id].filter((value): value is string => Boolean(value)))
        ),
      };
    });

    return buildMemberPerformanceRows(subjects, projectIssues);
  }, [members, projectIssues]);

  const projectUnassignedCount = projectIssues.filter((issue) => !issue.assigneeId).length;
  const canManage = canManageProject(role, currentUserId, project?.lead?.id);

  useEffect(() => {
    if (!project) return;

    setName(project.name);
    setDescription(project.description ?? '');
    setLeadId(project.lead?.id ?? '');
    setVisibility(project.visibility);
    setStatus(project.status);
    setStartDate(project.startDate ?? '');
    setTargetDate(project.targetDate ?? '');
    setEnableRoadmap(project.features.roadmap);
    setEnableCycles(project.features.cycles);
    setEnableTracking(project.features.issueTracking);
    setFieldErrors({});
  }, [project]);

  useEffect(() => {
    setStoredIssues(getStoredIssues());
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'created_issues') {
        setStoredIssues(getStoredIssues());
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
    { id: 'issues', label: 'Issues', icon: <Filter size={14} /> },
    { id: 'board', label: 'Board', icon: <Layers size={14} /> },
    { id: 'roadmap', label: 'Roadmap', icon: <Map size={14} /> },
    { id: 'members', label: 'Members', icon: <Users size={14} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={14} /> },
  ] as const;
  const visibleTabs = canManage
    ? [...tabs, { id: 'settings', label: 'Settings', icon: <Settings size={14} /> }]
    : tabs;

  const selectedLead =
    leadOptions.find((option) => option.id === leadId) ??
    (project?.lead && project.lead.id === leadId
      ? {
          id: project.lead.id,
          name: project.lead.name,
          email: project.lead.email,
          role: 'LEAD',
        }
      : null);

  const selectableMembers = memberOptions.filter((option) => !members.some((member) => member.id === option.id));

  const handleAddMembers = async () => {
    if (selectedMemberIds.length === 0) {
      showToast('Select at least one member to add.', 'error', 'Validation error');
      return;
    }

    try {
      await addMembers.mutateAsync({ userIds: selectedMemberIds });
      setSelectedMemberIds([]);
      setIsMemberPickerOpen(false);
      showToast('Project members updated.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to add project members.', 'error', 'Update failed');
    }
  };

  const handleRemoveMember = async (member: ProjectMemberRow) => {
    try {
      await removeMember.mutateAsync(member.id);
      showToast('Project member removed.', 'success');
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'FORBIDDEN') {
        showToast('Reassign the project lead before removing them.', 'error', 'Action blocked');
        return;
      }
      showToast(getApiErrorMessage(error) || 'Failed to remove project member.', 'error', 'Update failed');
    }
  };

  const handleSave = async () => {
    setFieldErrors({});

    try {
      await updateProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        leadId: leadId || undefined,
        visibility,
        status,
        startDate: startDate || null,
        targetDate: targetDate || null,
        features: {
          roadmap: enableRoadmap,
          cycles: enableCycles,
          issueTracking: enableTracking,
        },
      });
      showToast('Project settings updated.', 'success');
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'PROJECT_NAME_TAKEN') {
        setFieldErrors({ name: ['A project with this name already exists.'] });
        return;
      }
      const validationErrors = getApiFieldErrors(error);
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        return;
      }

      showToast(getApiErrorMessage(error) || 'Failed to update project.', 'error', 'Update failed');
    }
  };

  const handleArchive = async () => {
    try {
      await updateProject.mutateAsync({ status: 'ARCHIVED' });
      showToast('Project archived.', 'success');
      setStatus('ARCHIVED');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to archive project.', 'error', 'Archive failed');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this project permanently?');
    if (!confirmed) return;

    try {
      await deleteProject.mutateAsync();
      showToast('Project deleted.', 'success');
      navigate('/projects');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to delete project.', 'error', 'Delete failed');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6 p-6 max-w-6xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">Description</h3>
            <p className="leading-relaxed text-gray-600 dark:text-gray-400">
              {project?.description || 'No description provided yet.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Issues</p>
              <p className="mt-3 text-2xl font-bold">{project?.stats.issueCount ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Completed</p>
              <p className="mt-3 text-2xl font-bold">{project?.stats.completedIssueCount ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Members</p>
              <p className="mt-3 text-2xl font-bold">{project?.stats.memberCount ?? members.length}</p>
            </div>
          </div>

          <MemberPerformancePanel
            title="Member Performance"
            subtitle="Task completion for members assigned within this project."
            rows={projectAnalyticsRows}
            emptyTitle="No member performance yet"
            emptyDescription="Project issue analytics will fill in here as real issue data lands in later phases."
            unassignedCount={projectUnassignedCount}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">Progress</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{project?.progress ?? 0}%</span>
                <span className="text-xs text-gray-400">{project?.stats.issueCount ?? 0} issues</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${project?.progress ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Team</h3>
              <button
                onClick={() => {
                  setActiveTab('members');
                  setIsMemberPickerOpen(true);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:border-primary/40 hover:text-primary dark:border-border-dark dark:hover:bg-white/5"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex -space-x-2">
                {members.slice(0, 6).map((member) =>
                  member.avatar ? (
                    <img
                      key={member.id}
                      src={member.avatar}
                      className="h-8 w-8 rounded-full border-2 border-white dark:border-card-dark"
                      alt={member.name}
                    />
                  ) : (
                    <AvatarFallback
                      key={member.id}
                      name={member.name}
                      sizeClassName="h-8 w-8 border-2 border-white dark:border-card-dark"
                      textClassName="text-xs"
                    />
                  )
                )}
              </div>
              <p className="text-xs text-gray-400">
                {project?.team.name} team
                {project?.department ? ` · ${project.department.name}` : ''}
                {' · '}
                {project?.stats.memberCount ?? members.length} members
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Project members</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Members directly assigned to this project.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsMemberPickerOpen((current) => !current)}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20"
          >
            <Plus size={16} />
            Add Members
          </button>
        </div>

        <div ref={memberPickerRef} className="relative">
          {isMemberPickerOpen && (
            <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-border-dark dark:bg-card-dark">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Search members"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                />
              </div>

              <div className="mt-3 max-h-[220px] space-y-1 overflow-y-auto pr-1">
                {selectableMembers.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setSelectedMemberIds((current) =>
                        current.includes(option.id)
                          ? current.filter((value) => value !== option.id)
                          : [...current, option.id]
                      )
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                      selectedMemberIds.includes(option.id)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 bg-white hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]'
                    }`}
                  >
                    <p className="truncate text-sm font-semibold">{option.name}</p>
                    <p className="truncate text-[11px] text-gray-400">{option.email} · {option.role}</p>
                  </button>
                ))}
              </div>

              {memberOptionsQuery.hasNextPage && (
                <button
                  type="button"
                  onClick={() => memberOptionsQuery.fetchNextPage()}
                  className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold dark:border-border-dark"
                >
                  {memberOptionsQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
                </button>
              )}

              <div className="mt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMemberIds([]);
                    setIsMemberPickerOpen(false);
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMembers}
                  disabled={addMembers.isPending || selectedMemberIds.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {addMembers.isPending && <Loader2 size={15} className="animate-spin" />}
                  Add Selected
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50/60 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:bg-black/10">
              <th className="px-6 py-4">Member</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Team</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
            {members.map((member) => (
              <tr key={member.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {member.avatar ? (
                      <img src={member.avatar} className="h-9 w-9 rounded-full" alt={member.name} />
                    ) : (
                      <AvatarFallback name={member.name} sizeClassName="h-9 w-9" textClassName="text-sm" />
                    )}
                    <div>
                      <p className="text-sm font-bold">{member.name}</p>
                      <p className="text-[11px] text-gray-400">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{member.role}</span>
                    {member.membershipRole === 'LEAD' && (
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                        Lead
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {member.team?.name || 'No team'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Recently'}
                </td>
                <td className="px-6 py-4 text-right">
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition-all hover:bg-red-500 hover:text-white dark:border-red-500/20"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-4xl space-y-10 p-8">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">General Settings</h2>
            <p className="text-sm text-gray-400">Manage this project's identity and ownership.</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateProject.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {updateProject.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>

        <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Project name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
            />
            {renderFieldError(fieldErrors, 'name')}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Project description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-32 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
            />
          </label>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div ref={leadPickerRef} className="relative">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Project lead</span>
              <button
                type="button"
                onClick={() => setIsLeadPickerOpen((current) => !current)}
                className={pickerButtonClassName}
              >
                <p className="truncate text-sm font-semibold">{selectedLead?.name || 'Select lead'}</p>
                <p className="truncate text-[11px] text-gray-400">{selectedLead?.email || 'Search workspace members'}</p>
              </button>
              {renderFieldError(fieldErrors, 'leadId')}

              {isLeadPickerOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 space-y-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-border-dark dark:bg-card-dark">
                  <div className="relative">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={leadSearch}
                      onChange={(event) => setLeadSearch(event.target.value)}
                      placeholder="Search lead"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                    />
                  </div>

                  <div className="max-h-[200px] space-y-1 overflow-y-auto pr-1">
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

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Visibility</span>
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as ProjectVisibility)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
              >
                <option value="PUBLIC">Public to workspace</option>
                <option value="PRIVATE">Private to members</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as ProjectStatus)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
              >
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Target date</span>
              <input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Project Features</h2>
          <p className="text-sm text-gray-400">Control which project capabilities are enabled.</p>
        </div>
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
          {[
            {
              label: 'Roadmap',
              description: 'Visualize project timeline and milestones.',
              value: enableRoadmap,
              setValue: setEnableRoadmap,
            },
            {
              label: 'Cycles',
              description: 'Enable sprint-based planning and velocity tracking.',
              value: enableCycles,
              setValue: setEnableCycles,
            },
            {
              label: 'Issue Tracking',
              description: 'Manage bugs, tasks, and feature requests.',
              value: enableTracking,
              setValue: setEnableTracking,
            },
          ].map((feature) => (
            <label
              key={feature.label}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50 dark:border-border-dark dark:hover:bg-white/5"
            >
              <div>
                <p className="text-sm font-semibold">{feature.label}</p>
                <p className="text-xs text-gray-400">{feature.description}</p>
              </div>
              <input
                type="checkbox"
                checked={feature.value}
                onChange={(event) => feature.setValue(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-red-500">Danger Zone</h2>
          <p className="text-sm text-gray-400">Critical actions for this project.</p>
        </div>
        <div className="space-y-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold">Archive Project</h4>
              <p className="text-xs text-gray-400">Mark this project as inactive without deleting it.</p>
            </div>
            <button
              type="button"
              onClick={handleArchive}
              className="rounded-lg border border-red-500/20 px-4 py-2 text-sm font-bold text-red-500 transition-all hover:bg-red-500 hover:text-white"
            >
              Archive
            </button>
          </div>

          <div className="h-px bg-red-500/10" />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold">Delete Project</h4>
              <p className="text-xs text-gray-400">Permanently remove this project and its linked data.</p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-600"
            >
              <Trash2 size={16} />
              Delete Permanently
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  if (projectQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Loading project...
      </div>
    );
  }

  if (projectQuery.error || !project) {
    const hidden = errorCode === 'PRIVATE_PROJECT_FORBIDDEN';

    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <Layers size={30} />
        </div>
        <h2 className="text-xl font-bold">{hidden ? 'Project not available' : 'Project not found'}</h2>
        <p className="mt-2 max-w-md text-sm text-gray-400">
          {hidden
            ? 'This private project is not visible in the current workspace context.'
            : 'The requested project could not be loaded.'}
        </p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-gray-200 px-6 pt-6 dark:border-border-dark">
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
          <span onClick={() => navigate('/projects')} className="cursor-pointer hover:text-primary">
            Projects
          </span>
          <ChevronRight size={12} />
          <span className="font-medium text-gray-900 dark:text-gray-100">{project.name}</span>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-sm text-gray-400">Updated {new Date(project.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab('members');
                setIsMemberPickerOpen(true);
              }}
              className="rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50 dark:border-border-dark dark:hover:bg-white/5"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => navigate('/issues/create')}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              New Issue
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 pb-3 text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeProjectTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-black/10">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'issues' && <IssuesPage projectId={project.id} title={`${project.name} Issues`} showTeamScopeBadge={false} />}
        {activeTab === 'board' && (
          <IssuesPage
            projectId={project.id}
            title={`${project.name} Board`}
            showTeamScopeBadge={false}
            initialViewMode="kanban"
          />
        )}
        {activeTab === 'roadmap' && <RoadmapPage />}
        {activeTab === 'members' && renderMembers()}
        {activeTab === 'activity' && <ActivityPage activities={projectActivities} title="Project Activity" />}
        {activeTab === 'settings' && canManage && renderSettings()}
      </div>
    </div>
  );
};
