/**
 * Removes workspace data this app keeps in localStorage (issue drafts, AI
 * chat history, recent member picks, the persisted workspace and role), so
 * the next person on a shared browser can't read it after sign-out (FE-07).
 * Theme and layout preferences are kept. The pending invite token is kept
 * too: signed-out visitors need it to finish joining (InvitePage owns it).
 */
const KEPT_KEYS = new Set(['trussen-pending-invite-token']);

const isWorkspaceDataKey = (key: string) =>
  !KEPT_KEYS.has(key) &&
  (key.startsWith('issue_draft') ||
    key.startsWith('trussen:') ||
    key.startsWith('trussen-') ||
    key === 'created_issues');

export const clearLocalWorkspaceData = () => {
  try {
    Object.keys(localStorage).filter(isWorkspaceDataKey).forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage blocked (private mode, site data off): nothing was saved either.
  }
};
