import React, { useMemo, useState } from 'react';
import { Search, UserPlus, MoreHorizontal, Shield, Filter, Building2, Loader2, XCircle } from 'lucide-react';
import { useSidebarData } from '@features/sidebar';
import {
  useRemoveMember,
  useRevokeInvitation,
  useUpdateMemberRole,
  useWorkspaceInvitations,
  useWorkspaceMembers,
  type InvitationRole,
  type WorkspaceMemberResponse,
} from '@features/workspace';
import type { ApiAxiosError } from '@shared/services/types';
import { useApp } from '../AppContext';
import { useAuthStore } from '@/app/stores/useAuthStore';

const toRole = (role: string) => role.toLowerCase() as 'owner' | 'admin' | 'member' | 'guest';
const toInvitationRole = (role: string) => role.toUpperCase() as InvitationRole;
const memberId = (member: WorkspaceMemberResponse) => member.id;
const memberName = (member: WorkspaceMemberResponse) => member.name || 'Unknown member';
const memberEmail = (member: WorkspaceMemberResponse) => member.email || '';
const memberAvatar = (member: WorkspaceMemberResponse) => member.avatar;
const memberTeams = (member: WorkspaceMemberResponse) => {
  const teams = member.teams?.length ? member.teams : member.team ? [member.team] : [];
  return teams;
};
const memberTeamName = (member: WorkspaceMemberResponse) => {
  const teams = memberTeams(member);
  if (teams.length === 0) return 'No Team';
  if (teams.length === 1) return teams[0].name;
  return `${teams[0].name} +${teams.length - 1}`;
};
const memberDepartments = (member: WorkspaceMemberResponse) => {
  const departments = member.departments?.length
    ? member.departments
    : member.department
      ? [member.department]
      : member.team?.department
        ? [member.team.department]
        : [];
  const unique = new Map<string, { id: string; name: string }>();
  departments.forEach((department) => unique.set(department.id, department));
  memberTeams(member).forEach((team) => {
    if (team.department) unique.set(team.department.id, team.department);
  });
  return Array.from(unique.values());
};
const memberDepartmentName = (member: WorkspaceMemberResponse) => {
  const departments = memberDepartments(member);
  if (departments.length === 0) return '';
  if (departments.length === 1) return departments[0].name;
  return `${departments[0].name} +${departments.length - 1}`;
};

export const MembersPage: React.FC = () => {
  const { setActiveModal, showToast } = useApp();
  const currentUser = useAuthStore((s) => s.currentUser);
  const { data: sidebarData } = useSidebarData();
  const { data: members = [], isLoading, error, refetch } = useWorkspaceMembers();
  const { data: invitations = [] } = useWorkspaceInvitations();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const revokeInvitation = useRevokeInvitation();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'admin' | 'member' | 'guest'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const canInviteMembers = sidebarData?.permissions.canInviteMembers ?? false;
  const canManageMembers = canInviteMembers;

  const departments = useMemo(() => {
    const seen = new Map<string, string>();
    members.forEach((member) => {
      memberDepartments(member).forEach((department) => seen.set(department.id, department.name));
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [members]);

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      memberName(member).toLowerCase().includes(search.toLowerCase()) ||
      memberEmail(member).toLowerCase().includes(search.toLowerCase());
    const role = toRole(member.role);
    const matchesRole = roleFilter === 'all' || role === roleFilter;
    const matchesDepartment =
      departmentFilter === 'all' ||
      memberDepartments(member).some((department) => department.id === departmentFilter);
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const handleMutationError = (error: unknown, fallback: string) => {
    const apiError = error as ApiAxiosError;
    const code = apiError.response?.data?.error?.code;
    const message = apiError.response?.data?.error?.message;
    if (code === 'CANNOT_DEMOTE_OWNER') {
      showToast('The workspace owner cannot be demoted.', 'error', 'Action blocked');
      return;
    }
    if (code === 'CANNOT_REMOVE_OWNER') {
      showToast('The workspace owner cannot be removed.', 'error', 'Action blocked');
      return;
    }
    showToast(message || fallback, 'error', 'Action failed');
  };

  const handleRoleChange = async (member: WorkspaceMemberResponse, role: InvitationRole) => {
    try {
      await updateRole.mutateAsync({ userId: memberId(member), role });
      setOpenActionId(null);
      showToast('Member role updated.', 'success');
    } catch (err) {
      handleMutationError(err, 'Failed to update member role.');
    }
  };

  const handleRemove = async (member: WorkspaceMemberResponse) => {
    const confirmed = window.confirm(`Remove ${memberName(member)} from this workspace?`);
    if (!confirmed) return;
    try {
      await removeMember.mutateAsync(memberId(member));
      setOpenActionId(null);
      showToast('Member removed.', 'success');
    } catch (err) {
      handleMutationError(err, 'Failed to remove member.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Members</h1>
          <span className="text-xs text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
            {members.length} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canInviteMembers && (
            <button
              onClick={() => setActiveModal('invite-member')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <UserPlus size={14} />
              <span>Invite Member</span>
            </button>
          )}
        </div>
      </header>

      <div className="p-6 space-y-6 overflow-y-auto">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              className="bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm py-1.5 px-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="guest">Guest</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-gray-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm py-1.5 px-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            >
              <option value="all">All Departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={20} className="animate-spin mr-2" />
            Loading members...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <XCircle size={28} className="text-red-500 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Failed to load members.</p>
            <button onClick={() => refetch()} className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">
              Retry
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl shadow-sm overflow-visible">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-200 dark:border-border-dark">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
                {filteredMembers.map((member) => {
                  const role = toRole(member.role);
                  const isOwner = role === 'owner';
                  const isSelf = memberId(member) === currentUser?.id;
                  return (
                    <tr key={memberId(member)} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {memberAvatar(member) ? (
                            <img src={memberAvatar(member) ?? undefined} className="w-9 h-9 rounded-xl border border-gray-100 dark:border-border-dark object-cover shadow-sm" alt={memberName(member)} />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {memberName(member).charAt(0)}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-bold tracking-tight text-gray-700 dark:text-gray-200">{memberName(member)}</span>
                            <span className="text-[11px] text-gray-400 font-medium">{memberEmail(member)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {role === 'owner' && <div className="w-2 h-2 rounded-full bg-primary" />}
                          {role === 'admin' && <Shield size={12} className="text-purple-500" />}
                          <span className={`text-[11px] font-black uppercase tracking-widest ${
                            role === 'owner' ? 'text-primary' :
                            role === 'admin' ? 'text-purple-500' :
                            role === 'guest' ? 'text-orange-500' : 'text-gray-400'
                          }`}>
                            {role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{memberDepartmentName(member) || <span className="italic opacity-50">None</span>}</td>
                      <td className="px-6 py-4 text-gray-400">{memberTeamName(member) || 'No Team'}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        {canManageMembers && !isOwner && !isSelf && (
                          <>
                            <button
                              onClick={() => setOpenActionId(openActionId === memberId(member) ? null : memberId(member))}
                              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 transition-colors"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {openActionId === memberId(member) && (
                              <div className="absolute right-6 top-10 z-50 w-44 rounded-lg bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark shadow-xl py-1">
                                {(['ADMIN', 'MEMBER', 'GUEST'] as InvitationRole[]).map((nextRole) => (
                                  <button
                                    key={nextRole}
                                    onClick={() => handleRoleChange(member, nextRole)}
                                    className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                  >
                                    Make {nextRole.toLowerCase()}
                                  </button>
                                ))}
                                <div className="h-px bg-gray-100 dark:bg-border-dark my-1" />
                                <button
                                  onClick={() => handleRemove(member)}
                                  className="w-full px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {canInviteMembers && (
          <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Pending Invitations</h2>
            </div>
            {invitations.filter((invite) => invite.status?.toLowerCase() === 'pending').length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400">No pending invitations.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-border-dark">
                {invitations.filter((invite) => invite.status?.toLowerCase() === 'pending').map((invite) => (
                  <div key={invite.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{invite.email}</p>
                      <p className="text-xs text-gray-400">
                        {invite.role.toLowerCase()} · {invite.teamName || 'No team'}{invite.departmentName ? ` · ${invite.departmentName}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => revokeInvitation.mutate(invite.id)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
