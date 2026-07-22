import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import { ArrowLeft, Building, Globe, CheckCircle2, AlertCircle, Loader2, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import { workspaceService, workspaceQueryKeys } from '@/features/workspace';
import { sidebarQueryKeys } from '@features/sidebar';
import { Logo, FormInput, SubmitButton, AuthFooter } from './shared';

/**
 * CreateWorkspacePage — /org-creation
 *
 * Step 3 of onboarding: Account → Verify → Workspace.
 * User is authenticated via Clerk at this point.
 *
 * Implements workspace_integration.md §2:
 * - Name field (1-100 chars, required)
 * - Slug field (3-50 chars, auto-generated from name, editable, validated)
 * - Slug real-time availability check (debounced 300ms)
 * - Reserved slug rejection (client-side)
 * - Team size selector (optional)
 * - POST /workspaces on submit
 *
 * Error handling per workspace_integration.md §2:
 * - WORKSPACE_SLUG_TAKEN (409) → inline error on slug field
 * - VALIDATION_ERROR (422) → field-level errors
 * - UNAUTHORIZED (401) → handled by error interceptor → redirect to login
 */

// Team size options — display friendly labels, send backend enum values
// Backend expects: "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE"
const TEAM_SIZES = [
  { label: '1-5', value: 'SMALL' },
  { label: '6-20', value: 'MEDIUM' },
  { label: '21-50', value: 'LARGE' },
  { label: '50+', value: 'ENTERPRISE' },
];

export const CreateWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { isLoaded, isSignedIn } = useUser();
  const showToast = useToastStore((s) => s.showToast);
  const setWorkspace = useAuthStore((s) => s.setWorkspace);
  const workspace = useAuthStore((s) => s.workspace);
  const authSyncStatus = useAuthStore((s) => s.authSyncStatus);

  // When ?new=true is present, user is intentionally creating an additional workspace
  const isAddingNew = searchParams.get('new') === 'true';

  // ── Form state ──
  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false); // Stop auto-gen once user edits slug
  const [teamSize, setTeamSize] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Slug validation state ──
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null); // null = not checked yet
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate('/login', { replace: true });
      return;
    }

    // Only redirect to dashboard if user already has a workspace AND is not
    // intentionally creating an additional one (via ?new=true from the switcher)
    if (authSyncStatus === 'ready' && workspace && !isAddingNew) {
      navigate('/dashboard', { replace: true });
    }
  }, [authSyncStatus, isLoaded, isSignedIn, navigate, workspace, isAddingNew]);

  /**
   * Auto-generate slug from org name.
   * Per workspace_integration.md §2: Auto-Generating Slug from Name.
   * Stops auto-generating if user manually edited the slug field.
   */
  const handleNameChange = (value: string) => {
    setOrgName(value);
    if (!slugManuallyEdited) {
      const generated = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generated);
    }
  };

  /**
   * Handle manual slug edits.
   * Marks slug as manually edited so name changes won't overwrite it.
   * Per workspace_integration.md §2: "If the user manually edits the slug, stop auto-generating."
   */
  const handleSlugChange = (value: string) => {
    // Enforce lowercase + valid chars as user types
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(sanitized);
    setSlugManuallyEdited(true);
  };

  /**
   * Debounced slug availability check.
   * Per workspace_integration.md §2: "Check availability via GET /workspaces/check-slug/:slug (debounce 300ms)"
   * Runs client-side validation first, then calls backend if valid.
   */
  useEffect(() => {
    // Reset state when slug changes
    setSlugAvailable(null);
    setSlugChecking(false);

    // Clear previous timer
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);

    // Client-side validation first
    const validationError = workspaceService.validateSlug(slug);
    if (slug.length === 0) {
      setSlugError(null);
      return;
    }
    if (validationError) {
      setSlugError(validationError);
      return;
    }
    setSlugError(null);

    // Debounce the backend availability check (300ms)
    setSlugChecking(true);
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const available = await workspaceService.checkSlug(slug);
        setSlugAvailable(available);
        if (!available) {
          setSlugError('This URL is already taken');
        }
      } catch {
        // If check fails, don't block the user — backend will validate on submit
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    }, 300);

    return () => {
      if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    };
  }, [slug]);

  /**
   * Submit workspace creation.
   * Calls POST /workspaces via workspaceService.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Client-side validation ──
    const trimmedName = orgName.trim();
    if (!trimmedName) {
      showToast('Please enter an organization name', 'error', 'Validation error');
      return;
    }
    if (trimmedName.length > 100) {
      showToast('Organization name must be 100 characters or less', 'error', 'Validation error');
      return;
    }

    const finalSlug = slug || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slugValidation = workspaceService.validateSlug(finalSlug);
    if (slugValidation) {
      setSlugError(slugValidation);
      return;
    }

    console.log('[Workspace] Creating workspace:', { name: trimmedName, slug: finalSlug, teamSize });
    setIsSubmitting(true);

    try {
      // Try real API call first
      const workspace = await workspaceService.create({
        name: trimmedName,
        slug: finalSlug,
        teamSize: teamSize || undefined,
      });

      console.log('[Workspace] Created via API:', workspace);
      // Store workspace + defaultTeamId (auto-created team for invites/first project)
      setWorkspace({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        logo: workspace.logo,
        role: (workspace.role?.toLowerCase() as any) || 'owner',
        defaultTeamId: workspace.defaultTeamId,
        customStatuses: workspace.customStatuses,
        workflowAutomation: workspace.workflowAutomation,
        uploadPolicy: workspace.uploadPolicy,
      });

      // Invalidate workspace list so the switcher sees the new workspace
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.all });

      showToast('Workspace created!', 'success', 'Welcome to Trussen');
      console.log('[Workspace] Redirecting to /dashboard');
      navigate('/dashboard');
    } catch (err: any) {
      const status = err.response?.status;
      const errorCode = err.response?.data?.error?.code;
      const errorMessage = err.response?.data?.error?.message;

      if (status === 409 && errorCode === 'WORKSPACE_SLUG_TAKEN') {
        // Slug taken — show inline error, don't toast (per workspace_integration.md §2)
        console.warn('[Workspace] Slug taken:', finalSlug);
        setSlugError('This URL is already taken');
        setSlugAvailable(false);
      } else if (status === 422) {
        // Validation error from backend — show field-level errors
        console.warn('[Workspace] Validation error:', err.response?.data);
        const details = err.response?.data?.error?.details;
        if (Array.isArray(details) && details.length > 0) {
          showToast(details[0].message, 'error', 'Validation error');
        } else {
          showToast(errorMessage || 'Invalid input', 'error', 'Validation error');
        }
      } else if (!err.response) {
        showToast('Could not reach the backend. Please try again when the server is available.', 'error', 'Workspace creation failed');
      } else {
        // Other errors — error interceptor already toasted for 401/429/500
        console.error('[Workspace] Creation failed:', status, errorMessage);
        if (status !== 401 && status !== 429 && (status || 0) < 500) {
          showToast(errorMessage || 'Failed to create workspace', 'error', 'Workspace creation failed');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Slug status indicator — shows checking/available/error state.
   */
  const SlugStatus = () => {
    if (!slug || slug.length < 3) return null;
    if (slugError) {
      return (
        <div className="flex items-center gap-1.5 mt-1.5">
          <AlertCircle size={13} className="text-red-500 shrink-0" />
          <span className="text-xs text-red-500">{slugError}</span>
        </div>
      );
    }
    if (slugChecking) {
      return (
        <div className="flex items-center gap-1.5 mt-1.5">
          <Loader2 size={13} className="text-gray-400 animate-spin shrink-0" />
          <span className="text-xs text-gray-400">Checking availability...</span>
        </div>
      );
    }
    if (slugAvailable === true) {
      return (
        <div className="flex items-center gap-1.5 mt-1.5">
          <Check size={13} className="text-green-500 shrink-0" />
          <span className="text-xs text-green-500">{slug}.trussen.app is available</span>
        </div>
      );
    }
    return null;
  };

  if (!isLoaded || (isSignedIn && authSyncStatus !== 'ready')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-bg-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold animate-pulse">
            L
          </div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn || (workspace && !isAddingNew)) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-bg-dark selection:bg-primary/30">
      {/* ── Top bar ── */}
      <div className="px-5 sm:px-8 py-5 flex items-center justify-between">
        {isAddingNew ? (
          <button
            type="button"
            onClick={() => navigate('/select-workspace')}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="font-medium">Back</span>
          </button>
        ) : (
          <Logo />
        )}
        {/* Progress stepper — only during onboarding, not when adding a new workspace */}
        {!isAddingNew && (
          <div className="hidden sm:flex items-center gap-2">
            {['Account', 'Verify', 'Workspace'].map((step, i) => (
              <React.Fragment key={step}>
                {i > 0 && <div className="w-8 h-0.5 rounded-full bg-primary" />}
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i < 2 ? 'bg-primary text-white'
                      : 'bg-primary text-white ring-4 ring-primary/20'
                  }`}>
                    {i < 2 ? <CheckCircle2 size={12} /> : 3}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{step}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="w-24" />
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Building size={36} className="text-primary" />
              </motion.div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold dark:text-white tracking-tight">
              {isAddingNew ? 'New workspace' : 'Create your workspace'}
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {isAddingNew ? 'Set up another workspace for a different team or project.' : "This is your team's home on Trussen."}
            </p>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Organization name — auto-generates slug */}
            <FormInput
              icon={<Building size={16} />}
              placeholder="Acme Corp"
              value={orgName}
              onChange={handleNameChange}
              label="Organization name"
            />

            {/* Workspace URL with .trussen.app suffix + live validation */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Workspace URL</label>
              <div className="flex group">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary transition-colors">
                    <Globe size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="acme"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/[0.04] border rounded-l-xl outline-none focus:ring-2 transition-all text-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 ${
                      slugError
                        ? 'border-red-300 dark:border-red-800 focus:ring-red-200 focus:border-red-400'
                        : slugAvailable === true
                        ? 'border-green-300 dark:border-green-800 focus:ring-green-200 focus:border-green-400'
                        : 'border-gray-200 dark:border-white/[0.08] focus:ring-primary/20 focus:border-primary/50'
                    }`}
                  />
                </div>
                <span className="inline-flex items-center px-4 py-3 bg-gray-100 dark:bg-white/[0.06] border border-l-0 border-gray-200 dark:border-white/[0.08] rounded-r-xl text-xs text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
                  .trussen.app
                </span>
              </div>
              {/* Slug validation status indicator */}
              <SlugStatus />
            </div>

            {/* Team size selector (optional) */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                How large is your team? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TEAM_SIZES.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTeamSize(teamSize === value ? null : value)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      teamSize === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/[0.12]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <SubmitButton disabled={isSubmitting || !!slugError}>
                {isSubmitting ? 'Creating workspace...' : 'Create Workspace'}
              </SubmitButton>
            </div>
          </form>

          {/* Terms */}
          <p className="mt-6 text-center text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed">
            By continuing, you agree to our{' '}
            <span className="hover:underline cursor-pointer text-gray-500 dark:text-gray-400">Terms</span> and{' '}
            <span className="hover:underline cursor-pointer text-gray-500 dark:text-gray-400">Privacy Policy</span>.
          </p>
        </motion.div>
      </div>

      <AuthFooter />
    </div>
  );
};
