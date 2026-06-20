const INVITE_MEMBER_DRAFT_STORAGE_KEY = 'trussen:invite-member:draft';

export type InviteMemberDraft = {
  teamId?: string | null;
  departmentId?: string | null;
};

export const setInviteMemberDraft = (draft: InviteMemberDraft | null) => {
  if (typeof window === 'undefined') return;

  if (!draft) {
    window.sessionStorage.removeItem(INVITE_MEMBER_DRAFT_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(INVITE_MEMBER_DRAFT_STORAGE_KEY, JSON.stringify(draft));
};

export const consumeInviteMemberDraft = (): InviteMemberDraft | null => {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(INVITE_MEMBER_DRAFT_STORAGE_KEY);
  window.sessionStorage.removeItem(INVITE_MEMBER_DRAFT_STORAGE_KEY);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as InviteMemberDraft;
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      teamId: typeof parsed.teamId === 'string' ? parsed.teamId : null,
      departmentId: typeof parsed.departmentId === 'string' ? parsed.departmentId : null,
    };
  } catch {
    return null;
  }
};
