import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { MainLayout } from '@/app/layouts/MainLayout';

// Pages — still imported from old locations during migration
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
import { LoginPage, SignupPage, VerifyEmailPage, CreateWorkspacePage, ForgotPasswordPage, ResetPasswordPage } from '@/pages/auth';
import { IssueDetailPage } from '@/pages/IssueDetailPage';

export const AppRoutes: React.FC = () => {
  const workspace = useAuthStore((s) => s.workspace);
  const role = workspace?.role;
  const isAdmin = role === 'owner' || role === 'admin';
  const isLead = isAdmin || role === 'member';

  return (
    <Routes>
      {/* Public / Auth routes */}
      <Route path="/marketing" element={<MarketingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/org-creation" element={<CreateWorkspacePage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/email-verification" element={<VerifyEmailPage />} />

      {/* Authenticated routes with MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
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

        {/* Role-guarded routes (inline for now, guards in Phase 3) */}
        <Route path="/analytics" element={isLead ? <ReportsPage /> : <Navigate to="/" />} />
        <Route path="/integrations" element={isLead ? <IntegrationsPage /> : <Navigate to="/" />} />
        <Route path="/templates" element={isAdmin ? <TemplatesPage /> : <Navigate to="/" />} />
        <Route path="/api-keys" element={isAdmin ? <ApiKeysPage /> : <Navigate to="/" />} />
        <Route path="/billing" element={isAdmin ? <BillingPage /> : <Navigate to="/" />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
};
