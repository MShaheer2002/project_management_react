const PRODUCTION_ROOT_DOMAIN = 'trussen.app';
const LOCAL_ROOT_DOMAIN = 'localhost'; // lets `fissiontech.localhost:3000` work in dev, no /etc/hosts needed
const RESERVED_SLUGS = new Set(['www', 'api', 'app']);

/**
 * Reads the current tab's own hostname and pulls out the company subdomain,
 * if any — e.g. "fissiontech.trussen.app" -> "fissiontech",
 * "fissiontech.localhost" -> "fissiontech" (local testing), and the bare
 * "trussen.app" / "localhost" -> null (no tenant — marketing/landing page).
 */
export function getTenantSlugFromHost(hostname: string = window.location.hostname): string | null {
  const host = hostname.toLowerCase();

  for (const root of [PRODUCTION_ROOT_DOMAIN, LOCAL_ROOT_DOMAIN]) {
    if (host === root) return null;
    if (host.endsWith(`.${root}`)) {
      const slug = host.slice(0, -(root.length + 1));
      return slug && !slug.includes('.') && !RESERVED_SLUGS.has(slug) ? slug : null;
    }
  }

  return null; // ngrok, IPs, or any other host — no tenant
}

/**
 * Builds the full URL for a workspace's own subdomain — e.g. slug
 * "fissiontech" -> "https://fissiontech.trussen.app/dashboard" in
 * production, or "http://fissiontech.localhost:3000/dashboard" in dev.
 *
 * Used whenever the active workspace is determined (or changed) while the
 * browser is NOT already on that workspace's subdomain — logging in from
 * the bare domain, picking a workspace, or creating a new one. Each
 * company's own subdomain is the only place its dashboard is meant to run,
 * so this is always a real browser navigation (window.location), never a
 * client-side route change — it's a different origin.
 */
export function buildWorkspaceUrl(slug: string, path: string = '/dashboard'): string {
  const port = window.location.port ? `:${window.location.port}` : '';
  const host = import.meta.env.DEV ? `${slug}.${LOCAL_ROOT_DOMAIN}${port}` : `${slug}.${PRODUCTION_ROOT_DOMAIN}`;
  return `${window.location.protocol}//${host}${path}`;
}

/**
 * Builds a URL on the bare landing domain — e.g. "https://trussen.app/marketing"
 * in production, or "http://localhost:3000/marketing" in dev. The opposite of
 * buildWorkspaceUrl: this is "leave whatever tenant subdomain you're on and go
 * to the plain root domain," used by the logo's "go home" link and by
 * TenantResolver when a subdomain doesn't resolve to a real workspace.
 */
export function buildLandingUrl(path: string = '/'): string {
  const port = window.location.port ? `:${window.location.port}` : '';
  const host = import.meta.env.DEV ? `${LOCAL_ROOT_DOMAIN}${port}` : PRODUCTION_ROOT_DOMAIN;
  return `${window.location.protocol}//${host}${path}`;
}
