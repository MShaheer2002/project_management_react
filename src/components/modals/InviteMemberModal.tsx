import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from './Modal';
import { useApp } from '../../AppContext';
import { useSidebarData } from '@features/sidebar';
import { useSendInvitation, type InvitationRole } from '@features/workspace';
import type { ApiAxiosError } from '@shared/services/types';
import { ChevronDown, Loader2, Mail, Shield, Users, Building2 } from 'lucide-react';

export const InviteMemberModal: React.FC = () => {
  const { activeModal, setActiveModal, showToast } = useApp();
  const { data: sidebarData, isLoading: isSidebarLoading } = useSidebarData();
  const sendInvitation = useSendInvitation();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitationRole>('MEMBER');
  const [teamId, setTeamId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const teams = useMemo(() => sidebarData?.teams ?? [], [sidebarData?.teams]);
  const canInviteMembers = sidebarData?.permissions.canInviteMembers ?? false;

  useEffect(() => {
    if (!teamId && teams.length > 0) {
      setTeamId(teams[0].id);
    }
  }, [teamId, teams]);

  const resetForm = () => {
    setEmail('');
    setRole('MEMBER');
    setDepartmentId('');
    setTeamId(teams[0]?.id ?? '');
  };

  const handleClose = () => {
    setActiveModal(null);
    sendInvitation.reset();
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !teamId || !canInviteMembers) return;

    try {
      await sendInvitation.mutateAsync({
        email: trimmedEmail,
        role,
        teamId,
        departmentId: departmentId || undefined,
      });
      showToast(`Invitation sent to ${trimmedEmail}`, 'success', 'Invite sent');
      handleClose();
    } catch (error) {
      const apiError = error as ApiAxiosError;
      const code = apiError.response?.data?.error?.code;
      const message = apiError.response?.data?.error?.message;

      if (code === 'MEMBER_ALREADY_EXISTS') {
        showToast('This user is already a member.', 'error', 'Invite failed');
        return;
      }
      if (code === 'NOT_FOUND') {
        showToast('The selected team or department no longer exists.', 'error', 'Invite failed');
        return;
      }
      if (code === 'INSUFFICIENT_ROLE') {
        showToast("You don't have permission to invite members.", 'error', 'Invite failed');
        return;
      }
      showToast(message || 'Failed to send invitation.', 'error', 'Invite failed');
    }
  };

  const isSubmitting = sendInvitation.isPending;
  const isDisabled = isSubmitting || !email.trim() || !teamId || !canInviteMembers;

  return (
    <Modal
      isOpen={activeModal === 'invite-member'}
      onClose={handleClose}
      title="Invite new member"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Role</label>
            <div className="relative">
              <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as InvitationRole)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none font-medium"
              >
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
                <option value="GUEST">Guest</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Team Assignment</label>
            <div className="relative">
              <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                disabled={isSidebarLoading || teams.length === 0}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
                required
              >
                {teams.length === 0 && (
                  <option value="">No teams available</option>
                )}
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Department (Optional)</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
              >
                <option value="">No Department</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Department assignment will be available when the departments API is connected.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
          <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
            Invited members will receive an email with a link to join your workspace. They will have access to all public projects and their assigned team.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-border-dark">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isDisabled}
            className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Send Invite
          </button>
        </div>
      </form>
    </Modal>
  );
};
