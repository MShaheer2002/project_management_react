/**
 * Validates a `?redirect=` query param value before it's ever used as a
 * navigation target. Only ever allows an internal, root-relative path —
 * never a full URL, and never a protocol-relative one (`//evil.com` is a
 * valid-looking "path" that browsers treat as a full URL to a different
 * host). This is the ONE place that check lives — every consumer of a
 * `redirect` param (GuestGuard, AuthSync, Signup, VerifyEmail) goes
 * through this, so the rule can't drift between them.
 */
export function getSafeRedirectPath(value: string | null | undefined): string | null {
  if (!value?.startsWith('/')) return null;
  // Let the browser decide where it really points: `/\evil.com` and
  // `/\t/evil.com` look like paths but resolve to another host (FE-N-01).
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}
