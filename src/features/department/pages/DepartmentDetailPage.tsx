import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  Grid,
  History,
  Layers,
  LayoutDashboard,
  Loader2,
  Mail,
  MoreHorizontal,
  Palette,
  Plus,
  Save,
  Search,
  Settings as SettingsIcon,
  Shield,
  Table as TableIcon,
  Terminal,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useApp } from '@/AppContext';
import { Modal } from '@/components/modals/Modal';
import { ActivityPage } from '@features/activity';
import {
  MOCK_DEPARTMENTS,
  MOCK_ISSUES,
  MOCK_PROJECTS,
  MOCK_TEAMS,
  MOCK_USERS,
} from '@/constants';
import { useProjectsDirectory } from '@features/projects';
import { useWorkspaceMemberOptions } from '@features/workspace';
import { useTeamsDirectory, useUpdateAnyTeam } from '@features/team';
import { canManageDepartment } from '@shared/permissions';
import { getApiErrorCode, getApiErrorMessage, getApiFieldErrors } from '@shared/services';
import {
  useAddDepartmentMembers,
  useDeleteDepartment,
  useDepartmentDetail,
  useDepartmentMembers,
  useRemoveDepartmentMember,
  useUpdateDepartment,
} from '../hooks/useDepartmentData';

const pickerButtonClassName =
  'w-full rounded-xl bg-gray-50 px-4 py-3 text-left text-sm font-bold outline-none transition-all hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10';

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

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: string;
}> = ({ label, value, icon, trend, color = 'primary' }) => (
  <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
    <div className="mb-4 flex items-center justify-between">
      <div
        className={`rounded-xl p-2 bg-${color}/10 text-${color}`}
        style={color.startsWith('#') ? { backgroundColor: `${color}15`, color } : {}}
      >
        {icon}
      </div>
      {trend && (
        <div
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            trend.value >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}
        >
          {trend.value >= 0 ? '+' : ''}
          {trend.value}% {trend.label}
        </div>
      )}
    </div>
    <div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-70">{label}</p>
    </div>
  </div>
);

export const DepartmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const role = useAuthStore((state) => state.workspace?.role);

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'teams' | 'projects' | 'activity' | 'settings'>('overview');
  const [memberPickerSearch, setMemberPickerSearch] = useState('');
  const [headSearch, setHeadSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [isHeadPickerOpen, setIsHeadPickerOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [headId, setHeadId] = useState('');
  const [color, setColor] = useState('#5f72ea');
  const [isDefault, setIsDefault] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isAttachTeamModalOpen, setIsAttachTeamModalOpen] = useState(false);
  const [attachTeamSearch, setAttachTeamSearch] = useState('');
  const [attachingTeamId, setAttachingTeamId] = useState<string | null>(null);

  const memberPickerRef = useRef<HTMLDivElement | null>(null);
  const headPickerRef = useRef<HTMLDivElement | null>(null);
  const deferredMemberPickerSearch = useDeferredValue(memberPickerSearch);
  const deferredHeadSearch = useDeferredValue(headSearch);
  const deferredAttachTeamSearch = useDeferredValue(attachTeamSearch);

  const departmentQuery = useDepartmentDetail(id);
  const membersQuery = useDepartmentMembers(id, {
    sort: 'name:asc',
    limit: 50,
  });
  const teamsQuery = useTeamsDirectory(
    {
      departmentId: id,
      sort: 'name:asc',
      limit: 24,
    },
    { enabled: Boolean(id) }
  );
  const projectsQuery = useProjectsDirectory(
    {
      departmentId: id,
      sort: 'updatedAt:desc',
      limit: 24,
    },
    { enabled: Boolean(id) }
  );
  const attachableTeamsQuery = useTeamsDirectory(
    {
      q: deferredAttachTeamSearch.trim() || undefined,
      sort: 'name:asc',
      limit: 10,
    },
    { enabled: Boolean(id) && isAttachTeamModalOpen }
  );
  const addMembers = useAddDepartmentMembers(id);
  const removeMember = useRemoveDepartmentMember(id);
  const updateDepartment = useUpdateDepartment(id);
  const updateAnyTeam = useUpdateAnyTeam();
  const deleteDepartment = useDeleteDepartment(id);

  const memberOptionsQuery = useWorkspaceMemberOptions(
    {
      q: deferredMemberPickerSearch.trim() || undefined,
      sort: 'name:asc',
      limit: 10,
    },
    { enabled: isMemberPickerOpen }
  );
  const headOptionsQuery = useWorkspaceMemberOptions(
    {
      q: deferredHeadSearch.trim() || undefined,
      sort: 'name:asc',
      limit: 10,
    },
    { enabled: isHeadPickerOpen }
  );

  const department = departmentQuery.data;
  const members = membersQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const relatedTeams = teamsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const relatedProjects = projectsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const attachableTeams = (attachableTeamsQuery.data?.pages.flatMap((page) => page.items) ?? []).filter((team) => {
    if (team.department?.id === department?.id) {
      return false;
    }
    if (relatedTeams.some((relatedTeam) => relatedTeam.id === team.id)) {
      return false;
    }
    if (role === 'owner' || role === 'admin') {
      return true;
    }
    return team.lead?.id === currentUserId;
  });
  const memberOptions = memberOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const headOptions = headOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const errorCode = getApiErrorCode(departmentQuery.error);

  const matchedMockDepartment = useMemo(() => {
    if (!department) return MOCK_DEPARTMENTS[0] ?? null;
    return (
      MOCK_DEPARTMENTS.find(
        (mockDepartment) => mockDepartment.name.toLowerCase() === department.name.toLowerCase()
      ) ??
      MOCK_DEPARTMENTS[0] ??
      null
    );
  }, [department]);

  const mockDepartmentTeams = useMemo(() => {
    if (!matchedMockDepartment) return [];
    return MOCK_TEAMS.filter((team) => team.departmentId === matchedMockDepartment.id);
  }, [matchedMockDepartment]);

  const mockDepartmentTeamIds = useMemo(
    () => mockDepartmentTeams.map((team) => team.id),
    [mockDepartmentTeams]
  );

  const mockProjects = useMemo(() => {
    if (!matchedMockDepartment) return [];
    return MOCK_PROJECTS.filter(
      (project) =>
        project.departmentId === matchedMockDepartment.id || mockDepartmentTeamIds.includes(project.teamId)
    );
  }, [matchedMockDepartment, mockDepartmentTeamIds]);

  const mockIssues = useMemo(() => {
    if (!matchedMockDepartment) return [];
    return MOCK_ISSUES.filter(
      (issue) =>
        mockDepartmentTeamIds.includes(issue.teamId) ||
        mockProjects.some((project) => project.id === issue.projectId)
    );
  }, [mockDepartmentTeamIds, mockProjects]);

  const completedMockIssues = useMemo(
    () => mockIssues.filter((issue) => issue.status === 'done').length,
    [mockIssues]
  );

  const mockVelocity = useMemo(
    () => (mockIssues.length === 0 ? 84 : Math.round((completedMockIssues / mockIssues.length) * 100)),
    [completedMockIssues, mockIssues.length]
  );

  const velocityData = useMemo(
    () => [
      { day: 'Mon', issues: 4, velocity: 65 },
      { day: 'Tue', issues: 7, velocity: 72 },
      { day: 'Wed', issues: 5, velocity: 68 },
      { day: 'Thu', issues: 9, velocity: 85 },
      { day: 'Fri', issues: 12, velocity: 90 },
    ],
    []
  );

  const workloadData = useMemo(() => {
    if (relatedTeams.length > 0) {
      return relatedTeams.map((team) => {
        const mockTeam =
          MOCK_TEAMS.find((mockItem) => mockItem.name.toLowerCase() === team.name.toLowerCase()) ?? null;
        return {
          name: team.name,
          issues: mockIssues.filter((issue) => issue.teamId === mockTeam?.id).length,
        };
      });
    }

    return mockDepartmentTeams.map((team) => ({
      name: team.name,
      issues: mockIssues.filter((issue) => issue.teamId === team.id).length,
    }));
  }, [mockDepartmentTeams, mockIssues, relatedTeams]);

  useEffect(() => {
    if (!department) return;
    setName(department.name);
    setDescription(department.description ?? '');
    setVisibility(department.visibility);
    setHeadId(department.head?.id ?? '');
    setColor(department.color || '#5f72ea');
    setIsDefault(department.isDefault);
    setFieldErrors({});
  }, [department]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (memberPickerRef.current && !memberPickerRef.current.contains(target)) {
        setIsMemberPickerOpen(false);
      }
      if (headPickerRef.current && !headPickerRef.current.contains(target)) {
        setIsHeadPickerOpen(false);
      }
    };

    if (isMemberPickerOpen || isHeadPickerOpen) {
      document.addEventListener('mousedown', handlePointerDown);
    }

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isHeadPickerOpen, isMemberPickerOpen]);

  if (departmentQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Loading department...
      </div>
    );
  }

  if (!department || errorCode === 'DEPARTMENT_NOT_FOUND' || errorCode === 'PRIVATE_DEPARTMENT_FORBIDDEN') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertCircle size={48} className="mb-4 text-red-500 opacity-20" />
        <h2 className="text-xl font-bold">Department not found</h2>
        <button onClick={() => navigate('/departments')} className="font-medium text-primary hover:underline">
          Back to Departments
        </button>
      </div>
    );
  }

  const canManage = canManageDepartment(role, currentUserId, department.head?.id ?? null);
  const canAttachExistingTeams = role === 'owner' || role === 'admin' || role === 'member';
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
    { id: 'members', label: 'Members', icon: <Users size={14} /> },
    { id: 'teams', label: 'Teams', icon: <TableIcon size={14} /> },
    { id: 'projects', label: 'Projects', icon: <Layers size={14} /> },
    { id: 'activity', label: 'Activity', icon: <History size={14} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={14} />, hidden: !canManage },
  ].filter((tab) => !tab.hidden);

  const selectedHead =
    headOptions.find((option) => option.id === headId) ??
    (department.head && department.head.id === headId
      ? {
          id: department.head.id,
          name: department.head.name,
          email: department.head.email,
          role: 'HEAD',
        }
      : null);
  const selectableMembers = memberOptions.filter(
    (option) => !members.some((member) => member.id === option.id)
  );
  const mockEfficiency = mockIssues.length === 0 ? 84 : Math.min(96, Math.max(72, mockVelocity + 12));

  const handleToggleMember = (memberId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((value) => value !== memberId)
        : [...current, memberId]
    );
  };

  const handleCloseAttachTeamModal = () => {
    setIsAttachTeamModalOpen(false);
    setAttachTeamSearch('');
    setAttachingTeamId(null);
  };

  const handleAttachExistingTeam = async (teamId: string) => {
    setAttachingTeamId(teamId);

    try {
      await updateAnyTeam.mutateAsync({
        teamId,
        input: {
          departmentId: department.id,
        },
      });
      handleCloseAttachTeamModal();
      showToast('Team added to the department.', 'success');
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'FORBIDDEN') {
        showToast('You can only move teams you lead unless you are an admin or owner.', 'error', 'Action blocked');
        return;
      }
      if (code === 'DEPARTMENT_NOT_FOUND') {
        showToast('The department could not be found.', 'error', 'Action failed');
        return;
      }
      showToast(getApiErrorMessage(error) || 'Failed to attach the team.', 'error', 'Action failed');
    } finally {
      setAttachingTeamId(null);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    try {
      await updateDepartment.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        headId: headId || null,
        color: color.trim() || null,
        visibility,
        isDefault,
      });
      showToast('Department updated.', 'success');
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'DEPARTMENT_NAME_TAKEN') {
        setFieldErrors({ name: ['A department with this name already exists.'] });
        return;
      }
      if (code === 'HEAD_NOT_WORKSPACE_MEMBER') {
        setFieldErrors({ headId: ['Selected head is not a member of this workspace.'] });
        return;
      }
      const validationErrors = getApiFieldErrors(error);
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        return;
      }
      showToast(getApiErrorMessage(error) || 'Failed to update department.', 'error', 'Update failed');
    }
  };

  const handleAddMembers = async () => {
    if (selectedMemberIds.length === 0) return;

    try {
      await addMembers.mutateAsync({ userIds: selectedMemberIds });
      setSelectedMemberIds([]);
      setMemberPickerSearch('');
      setIsMemberPickerOpen(false);
      showToast('Members added to the department.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to add department members.', 'error', 'Action failed');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember.mutateAsync(userId);
      showToast('Member removed from the department.', 'success');
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'FORBIDDEN') {
        showToast('Reassign the department head before removing them.', 'error', 'Action blocked');
        return;
      }
      showToast(getApiErrorMessage(error) || 'Failed to remove the member.', 'error', 'Action failed');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete ${department.name}? Teams will remain but lose their department assignment.`
    );
    if (!confirmed) return;

    try {
      await deleteDepartment.mutateAsync();
      showToast('Department deleted.', 'success');
      navigate('/departments');
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to delete the department.', 'error', 'Delete failed');
    }
  };

  const renderOverview = () => (
    <div className="mx-auto max-w-7xl space-y-8 p-8 pb-24">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Resources"
          value={department.stats.memberCount || members.length}
          icon={<Users size={20} />}
          trend={{ value: 12, label: 'MoM' }}
        />
        <StatCard
          label="Active Projects"
          value={department.stats.projectCount ?? relatedProjects.length}
          icon={<Briefcase size={20} />}
          color="#ea5fba"
        />
        <StatCard
          label="Avg. Efficiency"
          value={`${mockEfficiency}%`}
          icon={<TrendingUp size={20} />}
          trend={{ value: 5.4, label: 'Weekly' }}
          color="#5fea64"
        />
        <StatCard
          label="Resource Load"
          value="72%"
          icon={<LayoutDashboard size={20} />}
          trend={{ value: -2, label: 'Stress Index' }}
          color="#eab45f"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Department Velocity</h3>
                <p className="mt-0.5 text-xs font-medium text-gray-400">
                  Completed issues across all teams this week
                </p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Output</span>
                </div>
              </div>
            </div>
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityData}>
                  <defs>
                    <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5f72ea" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#5f72ea" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.05} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#888', fontWeight: 700 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151821',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#fff',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                    }}
                    itemStyle={{ color: '#5f72ea', fontWeight: 800 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="velocity"
                    stroke="#5f72ea"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorVelocity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <h3 className="mb-8 text-sm font-black uppercase tracking-wider">Workload Distribution</h3>
            <div className="h-[240px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#888" opacity={0.05} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#888', fontWeight: 700 }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      backgroundColor: '#151821',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="issues" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <h3 className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <AlertCircle size={12} />
              Key Details
            </h3>
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-50">
                  About
                </p>
                <p className="text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-400">
                  {department.description?.trim() || 'No description provided.'}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-6 dark:border-border-dark">
                <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-50">
                  Leadership
                </p>
                {department.head ? (
                  <div className="flex items-center gap-4">
                    {department.head.avatar ? (
                      <img
                        src={department.head.avatar}
                        className="h-12 w-12 rounded-xl border-2 border-primary/10"
                        alt={department.head.name}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-primary/10 bg-primary/10 text-primary">
                        <span className="text-sm font-bold">{department.head.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold tracking-tight">{department.head.name}</div>
                      <div className="text-[11px] font-medium text-gray-400">{department.head.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-gray-100 p-4 text-center dark:border-border-dark">
                    <p className="text-[11px] font-bold uppercase text-gray-400">No head assigned</p>
                  </div>
                )}
              </div>

              <div className="block border-t border-gray-100 pt-6 dark:border-border-dark">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-50">
                  Visibility
                </p>
                <div className="inline-flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 dark:border-border-dark dark:bg-white/5">
                  <Shield size={12} className="text-primary" />
                  <span className="pointer-events-none text-[10px] font-black uppercase tracking-widest text-gray-500 capitalize">
                    {department.visibility.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => showToast('Detailed analytics are still mock-backed for now.', 'info')}
            className="group flex w-full translate-y-0 items-center justify-between rounded-2xl border border-primary/20 bg-primary/10 p-6 text-left text-primary transition-all hover:-translate-y-1 hover:bg-primary hover:text-white"
          >
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest">Reports</h4>
              <p className="text-[10px] font-bold opacity-70">View detailed analytics</p>
            </div>
            <ArrowUpRight className="opacity-40 group-hover:opacity-100" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="p-8">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-dark">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] font-bold uppercase text-gray-400 dark:bg-black/10">
              <th className="px-6 py-4">Member</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Team</th>
              <th className="px-6 py-4">Role</th>
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
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 transition-all animate-pulse" />
                    ONLINE
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500 dark:bg-gray-800">
                    {member.team?.name || 'No Team'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-medium capitalize text-gray-500">
                  {member.role.toLowerCase()}
                </td>
                <td className="px-6 py-4 text-right">
                  {canManage && member.id !== department.head?.id ? (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500 dark:hover:bg-white/10"
                      title="Remove member"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                      {member.id === department.head?.id ? 'Head' : ''}
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
    </div>
  );

  const renderTeams = () => {
    const content = relatedTeams.length > 0 ? (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {relatedTeams.map((team) => {
          return (
            <div
              key={team.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-primary/50 dark:border-border-dark dark:bg-card-dark"
            >
              <div className="flex-1 space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                    <Users size={20} />
                  </div>
                  <button className="rounded-md p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 dark:hover:bg-white/10 group-hover:opacity-100">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
                <div>
                  <h4 className="mb-1 text-lg font-bold">{team.name}</h4>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex h-7 items-center rounded-full border-2 border-white bg-gray-100 px-2 text-[10px] font-bold text-gray-500 dark:border-card-dark dark:bg-gray-800">
                      {team.stats.memberCount} members
                    </div>
                    <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {team.stats.projectCount} Projects
                    </span>
                  </div>
                  {team.lead && (
                    <p className="mt-2 truncate text-xs font-medium text-gray-400">
                      Lead: {team.lead.name}
                    </p>
                  )}
                </div>
              </div>
              <div
                className="cursor-pointer border-t border-gray-100 bg-gray-50/50 px-5 py-3 transition-colors hover:bg-primary/5 dark:border-border-dark dark:bg-black/20"
                onClick={() => navigate(`/teams/${team.id}`)}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  View Team Details
                </span>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-white/5">
          <Users size={32} className="opacity-20" />
        </div>
        <p className="font-medium">No teams linked to this department yet.</p>
      </div>
    );

    return (
      <div className="space-y-6 p-8">
        {content}
      </div>
    );
  };

  const renderProjects = () => (
    <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2 lg:grid-cols-3">
      {projectsQuery.isLoading ? (
        <div className="col-span-full flex items-center justify-center py-20 text-sm text-gray-400">
          <Loader2 size={18} className="mr-2 animate-spin" />
          Loading projects...
        </div>
      ) : projectsQuery.error ? (
        <div className="col-span-full rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          <p>Failed to load department projects.</p>
          <button
            type="button"
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
            className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-primary/50 dark:border-border-dark dark:bg-card-dark"
          >
            <div className="flex flex-1 flex-col p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                  <Briefcase size={20} />
                </div>
              </div>
              <h4 className="mb-2 text-lg font-bold transition-colors group-hover:text-primary">{project.name}</h4>
              <p className="mb-6 flex-1 line-clamp-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                {project.description || 'No description provided yet.'}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {project.progress}% Done
                  </span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-400 dark:bg-gray-800">
                    {project.stats.issueCount} Issues
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3 text-center transition-all group-hover:bg-primary/5 dark:border-border-dark dark:bg-black/20">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Go to Project</span>
            </div>
          </button>
        ))
      ) : (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-white/5">
            <Briefcase size={32} className="opacity-20" />
          </div>
          <p className="font-medium">No projects linked to this department yet.</p>
        </div>
      )}
    </div>
  );

  const renderActivity = () => <ActivityPage scope="workspace" title="Activity" />;

  const renderSettings = () => (
    <form onSubmit={handleSave} className="mx-auto max-w-4xl space-y-12 p-8 pb-24">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">General Settings</h2>
            <p className="text-sm font-medium text-gray-400">
              Manage department name, description, and leadership.
            </p>
          </div>
          <button
            type="submit"
            disabled={!canManage || updateDepartment.isPending || !name.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {updateDepartment.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>Save Changes</span>
          </button>
        </div>
        <div className="space-y-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Department Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-transparent bg-gray-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:border-transparent dark:bg-white/5"
              />
              {renderFieldError(fieldErrors, 'name')}
            </label>
            <label className="block">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Department Head
              </span>
              <div ref={headPickerRef} className="relative">
                <button type="button" onClick={() => setIsHeadPickerOpen((current) => !current)} className={pickerButtonClassName}>
                  <p className="truncate text-sm font-bold">{selectedHead?.name || 'No head assigned'}</p>
                  <p className="truncate text-[11px] font-medium text-gray-400">
                    {selectedHead?.email || 'Choose a workspace member'}
                  </p>
                </button>
                <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                {renderFieldError(fieldErrors, 'headId')}

                {isHeadPickerOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-20 space-y-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-border-dark dark:bg-card-dark">
                    <div className="relative">
                      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={headSearch}
                        onChange={(event) => setHeadSearch(event.target.value)}
                        placeholder="Search head"
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setHeadId('');
                        setIsHeadPickerOpen(false);
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                        headId === ''
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 bg-white hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]'
                      }`}
                    >
                      <p className="text-sm font-semibold">No head assigned</p>
                      <p className="text-[11px] text-gray-400">Leave this department without a head</p>
                    </button>

                    <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                      {headOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setHeadId(option.id);
                            setIsHeadPickerOpen(false);
                          }}
                          className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                            headId === option.id
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-gray-200 bg-white hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]'
                          }`}
                        >
                          <p className="truncate text-sm font-semibold">{option.name}</p>
                          <p className="truncate text-[11px] text-gray-400">{option.email} · {option.role}</p>
                        </button>
                      ))}
                    </div>

                    {headOptionsQuery.hasNextPage && (
                      <button
                        type="button"
                        onClick={() => headOptionsQuery.fetchNextPage()}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold dark:border-border-dark"
                      >
                        {headOptionsQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </label>
          </div>
          <label className="block">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Description
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border-none bg-gray-50 px-4 py-3 text-sm font-medium leading-relaxed outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:bg-white/5"
              placeholder="e.g. This department focuses on..."
            />
          </label>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Visibility & Access</h2>
          <p className="text-sm font-medium text-gray-400">Control who can see and join this department.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div className="space-y-6">
            <button
              type="button"
              className={`flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                visibility === 'PUBLIC'
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-gray-50 hover:border-gray-200 dark:bg-white/5 dark:hover:border-white/10'
              }`}
              onClick={() => setVisibility('PUBLIC')}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  visibility === 'PUBLIC' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400 dark:bg-gray-800'
                }`}
              >
                <Grid size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold">Public to Organization</h4>
                  {visibility === 'PUBLIC' && (
                    <div className="h-4 w-4 rounded-full border-4 border-white bg-primary shadow-sm dark:border-card-dark" />
                  )}
                </div>
                <p className="mt-1 text-xs font-medium leading-relaxed text-gray-400">
                  Anyone in the workspace can see members, teams, and projects in this department.
                </p>
              </div>
            </button>

            <button
              type="button"
              className={`flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                visibility === 'PRIVATE'
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-gray-50 hover:border-gray-200 dark:bg-white/5 dark:hover:border-white/10'
              }`}
              onClick={() => setVisibility('PRIVATE')}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  visibility === 'PRIVATE' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400 dark:bg-gray-800'
                }`}
              >
                <Shield size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold">Private to Members</h4>
                  {visibility === 'PRIVATE' && (
                    <div className="h-4 w-4 rounded-full border-4 border-white bg-primary shadow-sm dark:border-card-dark" />
                  )}
                </div>
                <p className="mt-1 text-xs font-medium leading-relaxed text-gray-400">
                  Only current members and admins can see content within this department.
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Visual Identity</h2>
          <p className="text-sm font-medium text-gray-400">
            Customize how the department appears across the app.
          </p>
        </div>
        <div className="space-y-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <div>
            <span className="mb-4 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Primary Color
            </span>
            <div className="flex flex-wrap gap-3">
              {['#5f72ea', '#ea5fba', '#5fea64', '#eab45f', '#ea5f5f', '#5feae4', '#a45fea', '#3b3b3b'].map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95 ${
                    color === swatch ? 'ring-4 ring-primary/20 ring-offset-2 dark:ring-offset-card-dark' : ''
                  }`}
                  style={{ backgroundColor: swatch }}
                  onClick={() => setColor(swatch)}
                >
                  {color === swatch && <div className="h-2 w-2 rounded-full bg-white shadow-sm" />}
                </button>
              ))}
            </div>
            {renderFieldError(fieldErrors, 'color')}
          </div>

          <div>
            <span className="mb-4 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Department Icon
            </span>
            <div className="flex flex-wrap gap-3">
              {[Building2, Terminal, Palette, Briefcase, Users, LayoutDashboard, History].map((IconComp, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => showToast('Icon selection is still visual-only for now.', 'info')}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all hover:bg-primary/10 hover:text-primary ${
                    index === 0 ? 'bg-primary/10 text-primary ring-2 ring-primary/20' : 'bg-gray-50 text-gray-400 dark:bg-white/5'
                  }`}
                >
                  <IconComp size={20} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Advanced Preferences</h2>
          <p className="text-sm font-medium text-gray-400">
            Fine-tune organizational workflows for this department.
          </p>
        </div>
        <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <button
            type="button"
            onClick={() => showToast('Automatic membership is still a mock-only preference.', 'info')}
            className="group flex w-full items-center justify-between rounded-xl bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                <Mail size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold">Automatic Membership</h4>
                <p className="mt-0.5 text-xs text-gray-400">
                  New workspace members automatically join this department.
                </p>
              </div>
            </div>
            <div className="relative h-6 w-11 rounded-full bg-gray-200 transition-colors group-hover:bg-gray-300 dark:bg-gray-800 dark:group-hover:bg-gray-700">
              <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsDefault((current) => !current)}
            className="group flex w-full items-center justify-between rounded-xl bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                <SettingsIcon size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold">Set as Default</h4>
                <p className="mt-0.5 text-xs text-gray-400">
                  Primary department for landing pages and initial filters.
                </p>
              </div>
            </div>
            <div className={`relative h-6 w-11 rounded-full transition-colors ${isDefault ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-800'}`}>
              <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${isDefault ? 'right-1' : 'left-1'}`} />
            </div>
          </button>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-red-500">Danger Zone</h2>
          <p className="text-sm font-medium text-gray-400">Critical actions that cannot be easily undone.</p>
        </div>
        <div className="space-y-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold">Archive Department</h4>
              <p className="mt-1 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
                Temporarily disable this department. All active projects and teams will be paused.
              </p>
            </div>
            <button
              type="button"
              onClick={() => showToast('Archive remains a mock action until the backend supports it.', 'info')}
              className="rounded-lg border border-red-500/20 px-6 py-2 text-sm font-bold text-red-500 transition-all hover:bg-red-500 hover:text-white"
            >
              Archive
            </button>
          </div>
          <div className="h-[1px] bg-red-500/10" />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold">Delete Permanently</h4>
              <p className="mt-1 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
                Destroy all data associated with this department. Members will be unassigned.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canManage || deleteDepartment.isPending}
              className="rounded-lg bg-red-500 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-600 disabled:opacity-50"
            >
              {deleteDepartment.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </section>
    </form>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex-shrink-0 border-b border-gray-200 bg-white px-6 pt-6 transition-colors dark:border-border-dark dark:bg-bg-dark">
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-400 transition-all">
          <button
            onClick={() => navigate('/departments')}
            className="cursor-pointer font-medium transition-colors hover:text-primary"
          >
            Departments
          </button>
          <ChevronRight size={12} />
          <span className="font-bold text-gray-900 dark:text-gray-100">{department.name}</span>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-xl shadow-primary/10 transition-all"
              style={{ backgroundColor: department.color || '#5f72ea' }}
            >
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{department.name}</h1>
                <span className="h-fit rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:bg-gray-800">
                  Dept
                </span>
              </div>
              <p className="mt-0.5 flex items-center gap-2 text-sm font-medium text-gray-400">
                <span>Created {new Date(department.createdAt).toLocaleDateString()}</span>
                {department.head && (
                  <>
                    <div className="h-1 w-1 rounded-full bg-gray-200 dark:bg-gray-800" />
                    <span className="flex items-center gap-1">
                      Managed by <span className="font-bold text-gray-900 dark:text-white">{department.head.name}</span>
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canAttachExistingTeams && (
              <button
                onClick={() => setIsAttachTeamModalOpen(true)}
                className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-600 transition-all hover:border-primary/40 hover:text-primary dark:border-border-dark dark:bg-card-dark dark:text-gray-300"
              >
                Add Existing Team
              </button>
            )}

            {canManage && (
              <div ref={memberPickerRef} className="relative">
                <button
                  onClick={() => {
                    setActiveTab('members');
                    setIsMemberPickerOpen((current) => !current);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
                >
                  <Plus size={16} />
                  <span>Add Member</span>
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

        <div className="flex items-center gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`relative flex items-center gap-2 pb-4 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeDepartmentTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary shadow-[0_-2px_8px_rgba(95,114,234,0.5)]"
                />
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="scrollbar-hide flex-1 overflow-y-auto bg-gray-50/30 dark:bg-black/10">
        <div className="mx-auto w-full pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'members' && renderMembers()}
              {activeTab === 'teams' && renderTeams()}
              {activeTab === 'projects' && renderProjects()}
              {activeTab === 'activity' && renderActivity()}
              {activeTab === 'settings' && renderSettings()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Modal
        isOpen={isAttachTeamModalOpen}
        onClose={handleCloseAttachTeamModal}
        title="Add Existing Team"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Move an existing workspace team into <span className="font-bold text-gray-900 dark:text-white">{department.name}</span>.
            </p>
          </div>

          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={attachTeamSearch}
              onChange={(event) => setAttachTeamSearch(event.target.value)}
              placeholder="Search teams by name"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
            />
          </div>

          <div className="space-y-2">
            {attachableTeamsQuery.isLoading ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-sm text-gray-400 dark:border-border-dark">
                <Loader2 size={16} className="mr-2 animate-spin" />
                Loading teams...
              </div>
            ) : attachableTeams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center dark:border-border-dark">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No teams available</p>
                <p className="mt-1 text-xs text-gray-400">
                  {role === 'member'
                    ? 'You can only move teams that you lead.'
                    : 'Try a different search or create a new team for this department.'}
                </p>
              </div>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {attachableTeams.map((team) => {
                  const isSubmitting = attachingTeamId === team.id;
                  const teamDepartmentLabel = team.department?.name || 'No department';
                  const leadLabel = team.lead?.name || 'No lead assigned';

                  return (
                    <div
                      key={team.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-border-dark dark:bg-white/[0.03]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{team.name}</p>
                        <p className="truncate text-xs text-gray-400">
                          {leadLabel} · {teamDepartmentLabel}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAttachExistingTeam(team.id)}
                        disabled={updateAnyTeam.isPending}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                        Add
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {attachableTeamsQuery.hasNextPage && (
            <button
              onClick={() => attachableTeamsQuery.fetchNextPage()}
              disabled={attachableTeamsQuery.isFetchingNextPage}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:border-primary/40 hover:text-primary disabled:opacity-50 dark:border-border-dark dark:text-gray-300"
            >
              {attachableTeamsQuery.isFetchingNextPage ? 'Loading...' : 'Load more teams'}
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
};
