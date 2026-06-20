const CREATE_TEAM_DRAFT_STORAGE_KEY = 'trussen:create-team:draft';

export type CreateTeamDraft = {
  departmentId?: string | null;
  departmentName?: string | null;
};

export const setCreateTeamDraft = (draft: CreateTeamDraft | null) => {
  if (typeof window === 'undefined') return;

  if (!draft) {
    window.sessionStorage.removeItem(CREATE_TEAM_DRAFT_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(CREATE_TEAM_DRAFT_STORAGE_KEY, JSON.stringify(draft));
};

export const consumeCreateTeamDraft = (): CreateTeamDraft | null => {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(CREATE_TEAM_DRAFT_STORAGE_KEY);
  window.sessionStorage.removeItem(CREATE_TEAM_DRAFT_STORAGE_KEY);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CreateTeamDraft;
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      departmentId: typeof parsed.departmentId === 'string' ? parsed.departmentId : null,
      departmentName: typeof parsed.departmentName === 'string' ? parsed.departmentName : null,
    };
  } catch {
    return null;
  }
};
