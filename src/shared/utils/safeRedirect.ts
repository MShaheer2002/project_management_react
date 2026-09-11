/**
 * Validates a `?redirect=` query param value before it's ever used as a
 * navigation target. Only ever allows an internal, root-relative path —
 * never a full URL, and never a protocol-relative one (`//evil.com` is a
 * valid-looking "path" that browsers treat as a full URL to a different
 * host). This is the ONE place that check lives — every consumer of a
 * `redirect` param (GuestGuard, AuthSync's cross-subdomain redirect) goes
 * through this, so the rule can't drift between them.
 */
export function getSafeRedirectPath(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.startsWith('/') && !value.startsWith('//') ? value : null;
}
