import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { MainLayout } from '@/app/layouts/MainLayout';
import { AuthGuard } from '@shared/guards/AuthGuard';
import { GuestGuard } from '@shared/guards/GuestGuard';

// ── Auth pages (Clerk-integrated) ──
import {
  LoginPage,
  SignupPage,
  VerifyEmailPage,
  CreateWorkspacePage,
  ForgotPasswordPage,
  ResetPasswordPage,
  SSOCallbackPage,
} from '@/pages/auth';

// ── App pages (still in old locations — will move to features/ in Phase 2) ──
import { DashboardPage } from '@/pages/DashboardPage';
import { IssuesPage } from '@/features/issues/components/IssuesPage';
import { ProjectsPage } from '@/features/projects/components/ProjectsPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { RoadmapPage } from '@/pages/RoadmapPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { MembersPage } from '@/pages/MembersPage';
import { MyIssuesPage } from '@/pages/MyIssuesPage';
import { ActivityPage } from '@/pages/ActivityPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { IntegrationsPage } from '@/pages/IntegrationsPage';
import { MarketingPage } from '@/pages/MarketingPage';
import { CyclesPage } from '@/pages/CyclesPage';
import { BillingPage } from '@/pages/BillingPage';
import { ApiKeysPage } from '@/pages/ApiKeysPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { TeamDetailPage } from '@/pages/TeamDetailPage';
import { DepartmentsPage } from '@/pages/DepartmentsPage';
import { DepartmentDetailPage } from '@/pages/DepartmentDetailPage';
import { CreateIssuePage } from '@/pages/CreateIssuePage';
import { TemplatesPage } from '@/pages/TemplatesPage';
import { IssueDetailPage } from '@/pages/IssueDetailPage';

export const AppRoutes: React.FC = () => {
  // Read workspace role for inline role checks (will be replaced by RoleGuard in Phase 3)
  const workspace = useAuthStore((s) => s.workspace);
  const role = workspace?.role;
  const isAdmin = role === 'owner' || role === 'admin';
  const isLead = isAdmin || role === 'member';

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
       * Marketing / landing page — always accessible.
       * This is the first page every visitor sees at /.
       * Signed-in users visiting / get redirected to /dashboard below.
       */}
      <Route path="/" element={<MarketingPage />} />
      <Route path="/marketing" element={<MarketingPage />} />

      {/*
       * Guest routes — only accessible when NOT signed in.
       * If a signed-in user visits /login, GuestGuard redirects them to /dashboard.
       */}
      <Route element={<GuestGuard />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
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
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/issues/create" element={<CreateIssuePage />} />
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
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Role-guarded routes (inline checks — will use RoleGuard component in Phase 3) */}
          <Route path="/analytics" element={isLead ? <ReportsPage /> : <Navigate to="/" />} />
          <Route path="/integrations" element={isLead ? <IntegrationsPage /> : <Navigate to="/" />} />
          <Route path="/templates" element={isAdmin ? <TemplatesPage /> : <Navigate to="/" />} />
          <Route path="/api-keys" element={isAdmin ? <ApiKeysPage /> : <Navigate to="/" />} />
          <Route path="/billing" element={isAdmin ? <BillingPage /> : <Navigate to="/" />} />

          {/* Catch-all inside authenticated layout — redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>
      </Route>
    </Routes>
  );
};
