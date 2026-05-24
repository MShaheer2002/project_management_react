import React, { useDeferredValue, useEffect, useRef, useState } from 'react';
import { Layout, Loader2, Map, RotateCcw, Search } from 'lucide-react';
import { useApp } from '@/AppContext';
import { useDepartmentOptions, type DepartmentCompact } from '@features/department';
import { useCreateProject, type ProjectVisibility } from '@features/projects';
import { useTeamOptions, type TeamCompact } from '@features/team';
import { useWorkspaceMemberOptions, type WorkspaceMemberOption } from '@features/workspace';
import { getApiErrorCode, getApiErrorMessage, getApiFieldErrors } from '@shared/services';
import { Modal } from './Modal';

const RECENT_SELECTION_LIMIT = 3;
const RECENT_STORAGE_KEYS = {
  team: 'linearis:create-project:recent-teams',
  department: 'linearis:create-project:recent-departments',
  lead: 'linearis:create-project:recent-leads',
  member: 'linearis:create-project:recent-members',
} as const;

type PickerKey = keyof typeof RECENT_STORAGE_KEYS;
type RecentTeam = Pick<TeamCompact, 'id' | 'name' | 'departmentId'>;
type RecentDepartment = Pick<DepartmentCompact, 'id' | 'name'>;
type RecentMember = WorkspaceMemberOption;

const pickerButtonClassName =
  'w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-left transition-all hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]';

const readRecentItems = <T extends { id: string }>(key: PickerKey): T[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEYS[key]);
    const parsed = JSON.parse(raw ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is T => Boolean(item) && typeof item.id === 'string')
      .slice(0, RECENT_SELECTION_LIMIT);
  } catch {
    return [];
  }
};

const writeRecentItems = <T extends { id: string }>(key: PickerKey, items: T[]) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(
    RECENT_STORAGE_KEYS[key],
    JSON.stringify(items.slice(0, RECENT_SELECTION_LIMIT))
  );
};

const rememberRecentItem = <T extends { id: string }>(items: T[], item: T) =>
  [item, ...items.filter((current) => current.id !== item.id)].slice(0, RECENT_SELECTION_LIMIT);

const renderFieldError = (errors: Record<string, string[]>, field: string) =>
  errors[field]?.[0] ? <p className="mt-1 text-xs text-red-500">{errors[field][0]}</p> : null;

export const CreateProjectModal: React.FC = () => {
  const { activeModal, setActiveModal, showToast } = useApp();
  const createProject = useCreateProject();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<ProjectVisibility>('PUBLIC');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [enableRoadmap, setEnableRoadmap] = useState(true);
  const [enableCycles, setEnableCycles] = useState(true);
  const [enableTracking, setEnableTracking] = useState(true);
  const [teamSearch, setTeamSearch] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [openPicker, setOpenPicker] = useState<PickerKey | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [recentTeams, setRecentTeams] = useState<RecentTeam[]>(() => readRecentItems<RecentTeam>('team'));
  const [recentDepartments, setRecentDepartments] = useState<RecentDepartment[]>(() =>
    readRecentItems<RecentDepartment>('department')
  );
  const [recentLeads, setRecentLeads] = useState<RecentMember[]>(() => readRecentItems<RecentMember>('lead'));
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>(() => readRecentItems<RecentMember>('member'));

  const teamPickerRef = useRef<HTMLDivElement | null>(null);
  const departmentPickerRef = useRef<HTMLDivElement | null>(null);
  const leadPickerRef = useRef<HTMLDivElement | null>(null);
  const memberPickerRef = useRef<HTMLDivElement | null>(null);

  const deferredTeamSearch = useDeferredValue(teamSearch);
  const deferredDepartmentSearch = useDeferredValue(departmentSearch);
  const deferredLeadSearch = useDeferredValue(leadSearch);
  const deferredMemberSearch = useDeferredValue(memberSearch);

  const teamOptionsQuery = useTeamOptions(
    {
      q: deferredTeamSearch.trim() || undefined,
      sort: 'name:asc',
      limit: 10,
    },
    { enabled: activeModal === 'create-project' && openPicker === 'team' }
  );
  const departmentOptionsQuery = useDepartmentOptions(
    {
      q: deferredDepartmentSearch.trim() || undefined,
      sort: 'name:asc',
      limit: 10,
    },
    { enabled: activeModal === 'create-project' && openPicker === 'department' }
  );
  const leadOptionsQuery = useWorkspaceMemberOptions(
    {
      q: deferredLeadSearch.trim() || undefined,
      sort: 'name:asc',
      limit: 10,
    },
    { enabled: activeModal === 'create-project' && openPicker === 'lead' }
  );
  const memberOptionsQuery = useWorkspaceMemberOptions(
    {
      q: deferredMemberSearch.trim() || undefined,
      sort: 'name:asc',
      limit: 10,
    },
    { enabled: activeModal === 'create-project' && openPicker === 'member' }
  );

  const teamOptions = teamOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const departmentOptions = departmentOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const leadOptions = leadOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const memberOptions = memberOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const selectedTeam =
    teamOptions.find((option) => option.id === teamId) ??
    recentTeams.find((option) => option.id === teamId) ??
    null;
  const selectedDepartment =
    departmentOptions.find((option) => option.id === departmentId) ??
    recentDepartments.find((option) => option.id === departmentId) ??
    null;
  const selectedLead =
    leadOptions.find((option) => option.id === leadId) ??
    recentLeads.find((option) => option.id === leadId) ??
    null;
  const selectedMemberPreview = selectedMemberIds
    .map(
      (memberId) =>
        memberOptions.find((option) => option.id === memberId) ??
        recentMembers.find((option) => option.id === memberId) ??
        null
    )
    .filter((item): item is RecentMember => Boolean(item))
    .slice(0, 3);

  useEffect(() => {
    if (!openPicker) return;

    const refs: Record<PickerKey, React.RefObject<HTMLDivElement | null>> = {
      team: teamPickerRef,
      department: departmentPickerRef,
      lead: leadPickerRef,
      member: memberPickerRef,
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const activeRef = refs[openPicker];

      if (activeRef.current && !activeRef.current.contains(target)) {
        setOpenPicker(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [openPicker]);

  useEffect(() => {
    if (activeModal !== 'create-project') {
      setOpenPicker(null);
    }
  }, [activeModal]);

  const storeRecentTeam = (item: RecentTeam) => {
    setRecentTeams((current) => {
      const next = rememberRecentItem(current, item);
      writeRecentItems('team', next);
      return next;
    });
  };

  const storeRecentDepartment = (item: RecentDepartment) => {
    setRecentDepartments((current) => {
      const next = rememberRecentItem(current, item);
      writeRecentItems('department', next);
      return next;
    });
  };

  const storeRecentLead = (item: RecentMember) => {
    setRecentLeads((current) => {
      const next = rememberRecentItem(current, item);
      writeRecentItems('lead', next);
      return next;
    });
  };

  const storeRecentMember = (item: RecentMember) => {
    setRecentMembers((current) => {
      const next = rememberRecentItem(current, item);
      writeRecentItems('member', next);
      return next;
    });
  };

  const handleTeamSelect = (item: RecentTeam | null) => {
    setTeamId(item?.id ?? '');
    if (item) {
      storeRecentTeam(item);
    }
    setOpenPicker(null);
  };

  const handleDepartmentSelect = (item: RecentDepartment | null) => {
    setDepartmentId(item?.id ?? '');
    if (item) {
      storeRecentDepartment(item);
    }
    setOpenPicker(null);
  };

  const handleLeadSelect = (item: RecentMember | null) => {
    setLeadId(item?.id ?? '');
    if (item) {
      storeRecentLead(item);
    }
    setOpenPicker(null);
  };

  const handleToggleMember = (item: RecentMember) => {
    if (!selectedMemberIds.includes(item.id)) {
      storeRecentMember(item);
    }

    setSelectedMemberIds((current) =>
      current.includes(item.id)
        ? current.filter((value) => value !== item.id)
        : [...current, item.id]
    );
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setTeamId('');
    setDepartmentId('');
    setLeadId('');
    setSelectedMemberIds([]);
    setVisibility('PUBLIC');
    setStartDate('');
    setTargetDate('');
    setEnableRoadmap(true);
    setEnableCycles(true);
    setEnableTracking(true);
    setTeamSearch('');
    setDepartmentSearch('');
    setLeadSearch('');
    setMemberSearch('');
    setOpenPicker(null);
    setFieldErrors({});
  };

  const handleClose = () => {
    setActiveModal(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    if (!name.trim()) return;
    if (!teamId || !leadId) {
      showToast('Select a team and project lead before creating the project.', 'error', 'Validation error');
      return;
    }

    try {
      await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        teamId,
        departmentId: departmentId || null,
        leadId,
        memberIds: selectedMemberIds,
        visibility,
        startDate: startDate || null,
        targetDate: targetDate || null,
        features: {
          roadmap: enableRoadmap,
          cycles: enableCycles,
          issueTracking: enableTracking,
        },
      });
      showToast('Project created successfully.', 'success');
      setActiveModal(null);
      resetForm();
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'PROJECT_NAME_TAKEN') {
        setFieldErrors({ name: ['A project with this name already exists.'] });
        return;
      }
      if (code === 'TEAM_NOT_IN_WORKSPACE') {
        setFieldErrors({ teamId: ['Selected team could not be used in this workspace.'] });
        return;
      }

      const validationErrors = getApiFieldErrors(error);
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        return;
      }

      showToast(getApiErrorMessage(error) || 'Failed to create project.', 'error', 'Create failed');
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'create-project'}
      onClose={handleClose}
      title="Create new project"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Project Name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Mobile App Redesign"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-black/20"
              required
            />
            {renderFieldError(fieldErrors, 'name')}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Description</label>
            <textarea
              placeholder="What is this project about?"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[100px] w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-black/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div ref={teamPickerRef} className="relative space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Team</label>
            <button
              type="button"
              onClick={() => setOpenPicker((current) => (current === 'team' ? null : 'team'))}
              className={pickerButtonClassName}
            >
              <p className="truncate text-[13px] font-semibold">{selectedTeam?.name || 'Select team'}</p>
              <p className="truncate text-[11px] text-gray-400">
                {selectedTeam
                  ? selectedTeam.departmentId
                    ? 'Linked to a department'
                    : 'No department linked'
                : 'Search available teams'}
              </p>
            </button>
            {renderFieldError(fieldErrors, 'teamId')}

            {openPicker === 'team' && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 space-y-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-border-dark dark:bg-card-dark">
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={teamSearch}
                    onChange={(event) => setTeamSearch(event.target.value)}
                    placeholder="Search team"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                  />
                </div>

                {recentTeams.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {recentTeams.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTeamSelect(item)}
                        className={`rounded-full border px-2 py-1 text-[10px] font-semibold transition-all ${
                          teamId === item.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-200 dark:border-border-dark'
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="max-h-[200px] space-y-1 overflow-y-auto pr-1">
                  {teamOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTeamSelect(item)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                        teamId === item.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 bg-white hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]'
                      }`}
                    >
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="truncate text-[11px] text-gray-400">
                        {item.departmentId ? 'Department linked' : 'No department linked'}
                      </p>
                    </button>
                  ))}
                </div>

                {teamOptionsQuery.hasNextPage && (
                  <button
                    type="button"
                    onClick={() => teamOptionsQuery.fetchNextPage()}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold dark:border-border-dark"
                  >
                    {teamOptionsQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div ref={departmentPickerRef} className="relative space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Department</label>
            <button
              type="button"
              onClick={() => setOpenPicker((current) => (current === 'department' ? null : 'department'))}
              className={pickerButtonClassName}
            >
              <p className="truncate text-[13px] font-semibold">{selectedDepartment?.name || 'No department'}</p>
              <p className="truncate text-[11px] text-gray-400">Optional</p>
            </button>
            {renderFieldError(fieldErrors, 'departmentId')}

            {openPicker === 'department' && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 space-y-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-border-dark dark:bg-card-dark">
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={departmentSearch}
                    onChange={(event) => setDepartmentSearch(event.target.value)}
                    placeholder="Search department"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                  />
                </div>

                {recentDepartments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {recentDepartments.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleDepartmentSelect(item)}
                        className={`rounded-full border px-2 py-1 text-[10px] font-semibold transition-all ${
                          departmentId === item.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-200 dark:border-border-dark'
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleDepartmentSelect(null)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                    departmentId === ''
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 bg-white hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]'
                  }`}
                >
                  <p className="text-sm font-semibold">No department</p>
                  <p className="text-[11px] text-gray-400">Keep this project outside a department</p>
                </button>

                <div className="max-h-[200px] space-y-1 overflow-y-auto pr-1">
                  {departmentOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleDepartmentSelect(item)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                        departmentId === item.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 bg-white hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]'
                      }`}
                    >
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                    </button>
                  ))}
                </div>

                {departmentOptionsQuery.hasNextPage && (
                  <button
                    type="button"
                    onClick={() => departmentOptionsQuery.fetchNextPage()}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold dark:border-border-dark"
                  >
                    {departmentOptionsQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div ref={leadPickerRef} className="relative space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Project Lead</label>
            <button
              type="button"
              onClick={() => setOpenPicker((current) => (current === 'lead' ? null : 'lead'))}
              className={pickerButtonClassName}
            >
              <p className="truncate text-[13px] font-semibold">{selectedLead?.name || 'Select lead'}</p>
              <p className="truncate text-[11px] text-gray-400">
                {selectedLead?.email || 'Search by name, email, or role'}
              </p>
            </button>
            {renderFieldError(fieldErrors, 'leadId')}

            {openPicker === 'lead' && (
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

                {recentLeads.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {recentLeads.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleLeadSelect(item)}
                        className={`rounded-full border px-2 py-1 text-[10px] font-semibold transition-all ${
                          leadId === item.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-200 dark:border-border-dark'
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="max-h-[200px] space-y-1 overflow-y-auto pr-1">
                  {leadOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleLeadSelect(item)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                        leadId === item.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 bg-white hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]'
                      }`}
                    >
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="truncate text-[11px] text-gray-400">{item.email} · {item.role}</p>
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Visibility</label>
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as ProjectVisibility)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-black/20"
            >
              <option value="PUBLIC">Public to workspace</option>
              <option value="PRIVATE">Private to members</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-black/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-black/20"
            />
          </div>
        </div>

        <div ref={memberPickerRef} className="relative space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Members</label>
          <button
            type="button"
            onClick={() => setOpenPicker((current) => (current === 'member' ? null : 'member'))}
            className={pickerButtonClassName}
          >
            <p className="truncate text-[13px] font-semibold">
              {selectedMemberIds.length === 0
                ? 'Add members'
                : `${selectedMemberIds.length} member${selectedMemberIds.length === 1 ? '' : 's'} selected`}
            </p>
            <p className="truncate text-[11px] text-gray-400">
              {selectedMemberPreview.length > 0
                ? selectedMemberPreview.map((item) => item.name).join(', ')
                : 'Search by name, email, or role'}
            </p>
          </button>
          {renderFieldError(fieldErrors, 'memberIds')}

          {openPicker === 'member' && (
            <div className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-30 space-y-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-border-dark dark:bg-card-dark">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Search member"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                />
              </div>

              {recentMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {recentMembers.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleMember(item)}
                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold transition-all ${
                        selectedMemberIds.includes(item.id)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 dark:border-border-dark'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="max-h-[220px] space-y-1 overflow-y-auto pr-1">
                {memberOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleMember(item)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                      selectedMemberIds.includes(item.id)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 bg-white hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]'
                    }`}
                  >
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="truncate text-[11px] text-gray-400">{item.email} · {item.role}</p>
                  </button>
                ))}
              </div>

              {memberOptionsQuery.hasNextPage && (
                <button
                  type="button"
                  onClick={() => memberOptionsQuery.fetchNextPage()}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold dark:border-border-dark"
                >
                  {memberOptionsQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-border-dark">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Features</label>
          <div className="grid grid-cols-1 gap-3">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-border-dark dark:hover:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-500 dark:bg-blue-900/30">
                  <Map size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Roadmap</p>
                  <p className="text-[10px] text-gray-400">Visualize project timeline and milestones.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableRoadmap}
                onChange={() => setEnableRoadmap(!enableRoadmap)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-border-dark dark:hover:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2 text-purple-500 dark:bg-purple-900/30">
                  <RotateCcw size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Cycles</p>
                  <p className="text-[10px] text-gray-400">Enable sprint-based planning and velocity tracking.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableCycles}
                onChange={() => setEnableCycles(!enableCycles)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-border-dark dark:hover:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-500 dark:bg-emerald-900/30">
                  <Layout size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Issue Tracking</p>
                  <p className="text-[10px] text-gray-400">Manage bugs, tasks, and feature requests.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableTracking}
                onChange={() => setEnableTracking(!enableTracking)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-border-dark">
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createProject.isPending || !name.trim() || !teamId || !leadId}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {createProject.isPending && <Loader2 size={16} className="animate-spin" />}
            Create Project
          </button>
        </div>
      </form>
    </Modal>
  );
};
