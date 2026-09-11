import type { AuthWorkspace } from '@/app/stores/useAuthStore';

/**
 * The single source of truth for "given who's signed in and which workspaces
 * they belong to, what should happen next" — the decision tree from
 * Trussen's routing spec (global vs. workspace context, single vs. multiple
 * workspaces, tenant-subdomain priority). AuthSync is the only caller; it
 * exists as its own pure, dependency-free function specifically so this
 * logic isn't buried inside a useEffect where nothing else can reuse or
 * test it in isolation.
 *
 * This function only decides WHERE to go — it never performs the
 * navigation itself (that's AuthSync's job, since crossing to another
 * subdomain needs `window.location`, while staying put needs React
 * Router's `navigate`). Keeping the decision pure like this is what makes
 * it possible to reason about (or eventually unit test) every branch
 * without mounting a component or mocking Clerk.
 */

/** Paths where NOT having a workspace yet should not force onboarding. */
export const ONBOARDING_EXEMPT_PATHS = [
  '/',
  '/marketing',
  '/login',
  '/signup',
  '/email-verification',
  '/forgot-password',
  '/reset-password',
  '/sso-callback',
  '/invite',
  '/org-creation',
  '/select-workspace',
  '/no-access',
] as const;

/**
 * The ONLY bare-domain path where landing on a resolved workspace should
 * cross over to that workspace's subdomain. Deliberately an allowlist, not
 * a denylist of "safe" paths to stay on — a denylist misses anything not
 * explicitly listed (e.g. "acme.localhost:3000/dashboard" edited down to
 * "localhost:3000/dashboard" would redirect right back if "/dashboard"
 * wasn't itself denylisted). /signup is deliberately excluded even for an
 * already-signed-in user: "sign up" means "I want something new," which
 * GuestGuard sends to /org-creation instead — never into an existing
 * workspace's subdomain.
 */
export const REDIRECT_TO_SUBDOMAIN_PATHS = ['/login'] as const;

export function isOnboardingExempt(path: string): boolean {
  return ONBOARDING_EXEMPT_PATHS.some((p) => path === p || (p !== '/' && path.startsWith(p + '/')));
}

export function shouldCrossToSubdomain(path: string): boolean {
  return (REDIRECT_TO_SUBDOMAIN_PATHS as readonly string[]).includes(path);
}

export interface WorkspaceDecisionInput {
  /** Company subdomain from the current URL, or null on the bare domain. */
  tenantSlug: string | null;
  /** null = the /workspaces fetch failed (offline/backend down), not "zero workspaces." */
  backendWorkspaces: AuthWorkspace[] | null;
  /** Last-active workspace persisted from a previous session (bare-domain flows only). */
  persistedWorkspace: AuthWorkspace | null;
  currentPath: string;
}

export type WorkspaceDecision =
  /** Set this workspace active. `crossToSubdomain: true` means a real navigation is needed. */
  | { type: 'ENTER_WORKSPACE'; workspace: AuthWorkspace; crossToSubdomain: boolean }
  /** Signed in, but not a member of the CURRENT subdomain's workspace. */
  | { type: 'NO_ACCESS' }
  /** Multiple workspaces, no clear preference — show the picker (bare domain only). */
  | { type: 'SELECT_WORKSPACE'; temporaryWorkspace: AuthWorkspace }
  /** Zero workspaces anywhere — must create the first one (bare domain only). */
  | { type: 'ONBOARD' };

/**
 * Pure decision function — see module doc above. Whether to actually
 * navigate for a given decision (vs. leaving the user on a page they're
 * deliberately on, like /select-workspace) is the caller's job via
 * isOnboardingExempt — that's an execution concern, not a routing-logic
 * one, so it's kept out of this function to keep every branch here a
 * straightforward, unconditional answer to "which workspace is correct."
 */
export function decideWorkspaceDestination(input: WorkspaceDecisionInput): WorkspaceDecision {
  const { tenantSlug, backendWorkspaces, persistedWorkspace, currentPath } = input;

  if (backendWorkspaces === null) {
    // Backend unreachable — fall back to whatever was last persisted rather
    // than forcing onboarding over what might just be a network blip.
    return persistedWorkspace
      ? { type: 'ENTER_WORKSPACE', workspace: persistedWorkspace, crossToSubdomain: false }
      : { type: 'ONBOARD' };
  }

  if (tenantSlug) {
    // On a company subdomain, that subdomain's workspace is the ONLY
    // acceptable one — never fall back to a persisted or "first" workspace
    // the user happens to also belong to (scenario 7: explicit workspace
    // context always wins, no picker).
    const tenantMatch = backendWorkspaces.find((ws) => ws.slug === tenantSlug);
    return tenantMatch
      ? { type: 'ENTER_WORKSPACE', workspace: tenantMatch, crossToSubdomain: false }
      : { type: 'NO_ACCESS' };
  }

  // Bare domain from here on.
  if (backendWorkspaces.length === 0) {
    return { type: 'ONBOARD' };
  }

  const persistedMatch = persistedWorkspace
    ? backendWorkspaces.find((ws) => ws.id === persistedWorkspace.id)
    : null;

  if (persistedMatch) {
    return {
      type: 'ENTER_WORKSPACE',
      workspace: persistedMatch,
      crossToSubdomain: shouldCrossToSubdomain(currentPath),
    };
  }

  if (backendWorkspaces.length === 1) {
    return {
      type: 'ENTER_WORKSPACE',
      workspace: backendWorkspaces[0]!,
      crossToSubdomain: shouldCrossToSubdomain(currentPath),
    };
  }

  // Multiple workspaces, no stored preference — let the user choose.
  return { type: 'SELECT_WORKSPACE', temporaryWorkspace: backendWorkspaces[0]! };
}
