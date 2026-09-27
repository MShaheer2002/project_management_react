const API_BASE = (process.env.BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

/**
 * Image source for a workspace logo.
 *
 * The API only ever returns its own relative route (/workspaces/:id/logo,
 * which redirects to a short-lived signed link — see F-36), so the logo loads
 * from wherever this app's API lives. Anything else (a stale external URL
 * persisted in localStorage from before the fix, a protocol-relative
 * `//host`) is ignored rather than fetched, so no third party learns who is
 * looking at the page.
 */
export function workspaceLogoSrc(logo?: string | null): string | undefined {
  if (!logo || !logo.startsWith('/') || logo.startsWith('//')) return undefined;
  return `${API_BASE}${logo}`;
}
