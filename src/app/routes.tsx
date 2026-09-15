import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useTenantStore } from '@/app/stores/useTenantStore';
import { MainLayout } from '@/app/layouts/MainLayout';
import { AuthGuard } from '@shared/guards/AuthGuard';
import { GuestGuard } from '@shared/guards/GuestGuard';
import { TrussenAppLogo } from '@/assets/svg/TrussenAppLogo';

// ── Auth pages (Clerk-integrated) ──
import {
  LoginPage,
  SignupPage,
  VerifyEmailPage,
  CreateWorkspacePage,
  SelectWorkspacePage,
  InvitePage,
  NoWorkspaceAccessPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  SSOCallbackPage,
} from '@/pages/auth';

// ── App pages (still in old locations — will move to features/ in Phase 2) ──
import { DashboardPage } from '@/pages/DashboardPage';
import { IssuesPage } from '@/features/issues/components/IssuesPage';
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage';
import { TeamsPage } from '@/features/team/pages/TeamsPage';
import { TeamDetailPage } from '@/features/team/pages/TeamDetailPage';
import { ActivityPage } from '@features/activity';
import { RoadmapPage } from '@features/roadmap';
import { SettingsPage } from '@/pages/SettingsPage';
import { MembersPage } from '@/pages/MembersPage';
import { MyIssuesPage } from '@/pages/MyIssuesPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { AnalyticsPage } from '@features/analytics';
import { IntegrationsPage } from '@/pages/IntegrationsPage';
import { MarketingPage } from '@/pages/MarketingPage';
import {
  FeaturesPage,
  IntegrationsPage as MarketingIntegrationsPage,
  PricingPage,
  ChangelogPage,
  RoadmapPage as MarketingRoadmapPage,
  AboutPage,
  BlogPage,
  CareersPage,
  ContactPage,
  PressPage,
  PrivacyPage,
  TermsPage,
  CookiePolicyPage,
  SecurityPage,
} from '@/pages/marketing';
import { CyclesPage } from '@/pages/CyclesPage';
import { CycleDetailPage } from '@/pages/CycleDetailPage';
import { BillingPage } from '@/pages/BillingPage';
import { AiUsagePage } from '@/pages/AiUsagePage';
import { AiConnectionsPage } from '@/pages/AiConnectionsPage';
import { ConnectAiPage } from '@/pages/ConnectAiPage';
import { ProjectDetailPage } from '@/features/projects/pages/ProjectDetailPage';
import { DepartmentsPage } from '@/features/department/pages/DepartmentsPage';
import { DepartmentDetailPage } from '@/features/department/pages/DepartmentDetailPage';
import { CreateIssuePage } from '@/pages/CreateIssuePage';
import { TemplatesPage } from '@features/templates';
import { IssueDetailPage } from '@/pages/IssueDetailPage';

const CreateIssuePageKeyed: React.FC = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return <CreateIssuePage key={workspaceId ?? 'none'} />;
};

const RootPage: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const workspace = useAuthStore((s) => s.workspace);
  const authSyncStatus = useAuthStore((s) => s.authSyncStatus);
  const tenantSlug = useTenantStore((s) => s.slug);

  // The bare domain's root ALWAYS shows the landing page — signed in or
  // not. Same pattern as atlassian.com or slack.com: the marketing domain
  // never auto-drops a visitor into a specific tenant just because a
  // session happens to exist: entering a workspace is an explicit action
  // (signing in on /login, which — unlike this page — DOES redirect to the
  // workspace's subdomain once resolved; see AuthSync's
  // REDIRECT_TO_SUBDOMAIN_PATHS, which is exactly ['/login']).
  if (!tenantSlug) {
    return <MarketingPage />;
  }

  // On a company subdomain, root IS the app's entry point.
  if (!isLoaded || (isSignedIn && authSyncStatus !== 'ready')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-bg-dark">
        <div className="flex flex-col items-center gap-3">
          <TrussenAppLogo className="w-12 h-12 animate-pulse" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // A company subdomain never shows a signup form — see the /signup route
  // below, which redirects here too.
  if (!isSignedIn) {
    return <LoginPage />;
  }

  if (workspace) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/org-creation" replace />;
};

export const AppRoutes: React.FC = () => {
  // Read workspace role for inline role checks (will be replaced by RoleGuard in Phase 3)
  const workspace = useAuthStore((s) => s.workspace);
  const role = workspace?.role;
  const isAdmin = role === 'owner' || role === 'admin';
  const isLead = isAdmin || role === 'member';
  // Company subdomains are sign-in only — a new company is only ever
  // created from the bare domain, so /signup redirects there instead.
  const tenantSlug = useTenantStore((s) => s.slug);

  return (
    <Routes>
      {/*
       * SSO Callback — MUST be outside both guards.
       * During OAuth redirect, the user is in a transitional state
       * (not signed in yet, but not a guest either).
       * Clerk's AuthenticateWithRedirectCallback handles the exchange.
       */}
      <Route path="/sso-callback" element={<SSOCallbackPage />} />

      {/*
       * Root entrypoint.
       * Guests see marketing; signed-in users get routed to dashboard or onboarding.
       * This fixes OAuth flows that complete on `/` instead of the final app route.
       */}
      <Route path="/" element={<RootPage />} />
      <Route path="/marketing" element={<MarketingPage />} />

      {/*
       * Public marketing pages — bare domain only.
       *
       * Two of these (/integrations, /roadmap) share a path with real
       * authenticated app routes further down. Registering them only when
       * there's no tenant subdomain keeps both sets on clean URLs without
       * either shadowing the other: trussen.app/roadmap is the public
       * roadmap, acme.trussen.app/roadmap is that company's actual roadmap.
       */}
      {!tenantSlug && (
        <Route>
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/integrations" element={<MarketingIntegrationsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="/roadmap" element={<MarketingRoadmapPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/press" element={<PressPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiePolicyPage />} />
          <Route path="/security" element={<SecurityPage />} />
        </Route>
      )}

      {/*
       * Guest routes — only accessible when NOT signed in.
       * If a signed-in user visits /login, GuestGuard redirects them to /dashboard.
       */}
      <Route element={<GuestGuard />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={tenantSlug ? <Navigate to="/login" replace /> : <SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/*
       * Transitional auth routes — outside BOTH guards.
       * /email-verification: user starts unauthenticated, becomes authenticated mid-page
       *   when Clerk verifies the code. If wrapped in GuestGuard, the guard would kick
       *   them to /dashboard the moment the session activates — before navigate('/org-creation') fires.
       * /org-creation: user is authenticated but has no workspace yet.
       *   Must be outside AuthGuard's MainLayout (no sidebar/navbar during onboarding).
       */}
      <Route path="/email-verification" element={<VerifyEmailPage />} />
      <Route path="/org-creation" element={<CreateWorkspacePage />} />
      <Route path="/select-workspace" element={<SelectWorkspacePage />} />
      <Route path="/invite" element={<InvitePage />} />
      <Route path="/no-access" element={<NoWorkspaceAccessPage />} />

      {/*
       * Authenticated routes — only accessible when signed in.
       * If a guest visits /dashboard, AuthGuard redirects them to /login.
       */}
      <Route element={<AuthGuard />}>

        {/* Main app layout (sidebar + navbar + content) */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inbox" element={<NotificationsPage />} />
          <Route path="/issues/my" element={<MyIssuesPage />} />
          <Route path="/issues" element={<IssuesPage initialViewMode="kanban" />} />
          <Route path="/issues/create" element={<CreateIssuePageKeyed />} />
          <Route path="/issues/:issueId" element={<IssueDetailPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/:id" element={<TeamDetailPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/departments/:id" element={<DepartmentDetailPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/cycles" element={<CyclesPage />} />
          <Route path="/cycles/:cycleId" element={<CycleDetailPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/settings" element={isAdmin ? <SettingsPage /> : <Navigate to="/dashboard" />} />

          {/* Role-guarded routes (inline checks — will use RoleGuard component in Phase 3) */}
          <Route path="/analytics" element={isLead ? <AnalyticsPage /> : <Navigate to="/" />} />
          <Route path="/integrations" element={isAdmin ? <IntegrationsPage /> : <Navigate to="/" />} />
          <Route path="/templates" element={isAdmin ? <TemplatesPage /> : <Navigate to="/" />} />
          <Route path="/templates/new" element={isAdmin ? <TemplatesPage /> : <Navigate to="/" />} />
          <Route path="/templates/:templateId" element={isAdmin ? <TemplatesPage /> : <Navigate to="/" />} />
          <Route path="/templates/:templateId/edit" element={isAdmin ? <TemplatesPage /> : <Navigate to="/" />} />
          <Route path="/templates/:templateId/apply" element={isAdmin ? <TemplatesPage /> : <Navigate to="/" />} />
          <Route path="/ai-connections" element={isAdmin ? <AiConnectionsPage /> : <Navigate to="/" />} />
          <Route path="/billing" element={isAdmin ? <BillingPage /> : <Navigate to="/" />} />
          <Route path="/ai-usage" element={isAdmin ? <AiUsagePage /> : <Navigate to="/" />} />

          {/* Catch-all inside authenticated layout — redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>

        {/*
         * One-time OAuth connection setup — reached by an AI client's error
         * message on first connect, not by navigating through the app.
         * Deliberately outside MainLayout: no sidebar/navbar, single focused task.
         */}
        <Route path="/connect-ai" element={<ConnectAiPage />} />
      </Route>
    </Routes>
  );
};
