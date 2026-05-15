# Migration Plan - Current to Feature-Based Architecture

## Migration Strategy

**Approach:** Incremental, feature-by-feature migration. The app stays working after each step. No big-bang rewrite.

**Critical constraint:** After every step, `npm run dev` must work. If it doesn't, fix before moving on.

## What's Already Done (Don't Redo)
- React Router installed and working (routes in `App.tsx`)
- TanStack Query installed with `query-client.ts`
- Zustand, React Hook Form, Zod, Axios installed
- `BrowserRouter` + `QueryClientProvider` in `main.tsx`
- `features/issues/` and `features/projects/` partially created (need restructuring)
- `useNavigate()` and `<Link>` already used in Sidebar and TopNavbar

## What Still Needs To Be Done
- Split God Context (`AppContext.tsx`) into Zustand stores
- Fix broken feature folder structure (pages inside `components/`)
- Create remaining 13 feature folders
- Add service layer per feature
- Add TanStack Query hooks per feature
- Split `types.ts` and `constants.ts`
- Create route guards
- Move shared components out of flat `components/`
- Add path aliases

---

## Phase 1: Foundation

### Step 1.1 - Add path aliases
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@app/*": ["./src/app/*"],
      "@features/*": ["./src/features/*"],
      "@shared/*": ["./src/shared/*"],
      "@mocks/*": ["./src/mocks/*"]
    }
  }
}
```

Update `vite.config.ts` resolve aliases to match:
```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@app': path.resolve(__dirname, './src/app'),
    '@features': path.resolve(__dirname, './src/features'),
    '@shared': path.resolve(__dirname, './src/shared'),
    '@mocks': path.resolve(__dirname, './src/mocks'),
  },
},
```

### Step 1.2 - Create Zustand stores (replace AppContext)
1. Create `src/app/stores/useThemeStore.ts` — extract theme state + `useEffect` from `AppContext.tsx`
2. Create `src/app/stores/useAuthStore.ts` — extract `currentUser`, `organization`
3. Create `src/app/stores/useUIStore.ts` — extract `isSidebarCollapsed`, `isCommandPaletteOpen`
4. Create `src/app/stores/useToastStore.ts` — extract `toasts`, `showToast`
5. Update all consumers to use Zustand stores instead of `useApp()`
6. **Delete `AppContext.tsx`** once all state is migrated

**What moves where:**

| AppContext state        | Zustand store       | Notes                              |
|-------------------------|---------------------|------------------------------------|
| `theme`, `setTheme`    | `useThemeStore`     | With localStorage persist          |
| `currentUser`, `org`   | `useAuthStore`      | With `login()`, `logout()` actions |
| `isSidebarCollapsed`   | `useUIStore`        | With localStorage persist          |
| `isCommandPaletteOpen` | `useUIStore`        | No persist needed                  |
| `toasts`, `showToast`  | `useToastStore`     | No persist needed                  |
| `selectedIssueId`      | **Deleted**         | Use URL params `/issues/:id`       |
| `activeModal`          | **Deleted**         | Local `useState` per page          |

### Step 1.3 - Create `app/` layer
1. Create `src/app/App.tsx` — move from `src/App.tsx`
2. Create `src/app/routes.tsx` — extract all `<Route>` definitions
3. Move `TopNavbar` out of `App.tsx` into `src/shared/components/layout/TopNavbar.tsx`
4. Create `src/app/layouts/MainLayout.tsx` — Sidebar + TopNavbar + `<Outlet />`
5. Create `src/app/layouts/AuthLayout.tsx` — minimal layout + `<Outlet />`
6. Update `src/main.tsx` to import from `src/app/App.tsx`

### Step 1.4 - Create `shared/` structure
Move existing shared components:

| From                                | To                                              |
|-------------------------------------|-------------------------------------------------|
| `components/Modal.tsx`              | `shared/components/ui/Modal.tsx`                |
| `components/Sidebar.tsx`            | `shared/components/layout/Sidebar.tsx`          |
| `components/ContextPanel.tsx`       | `shared/components/layout/ContextPanel.tsx`     |
| `components/CommandPalette.tsx`     | `shared/components/CommandPalette.tsx`           |
| `components/ToastContainer.tsx`     | `shared/components/feedback/ToastContainer.tsx`  |
| `components/RichTextEditor.tsx`     | `shared/components/editor/RichTextEditor.tsx`   |
| `components/board/KanbanBoard.tsx`  | `shared/components/board/KanbanBoard.tsx`       |
| `components/board/BoardColumn.tsx`  | `shared/components/board/BoardColumn.tsx`       |
| `components/board/BoardCard.tsx`    | `shared/components/board/BoardCard.tsx`         |
| `lib/query-client.ts`              | `shared/lib/query-client.ts`                    |

Extract from `constants.ts` into shared:
- `shared/constants/priorities.ts` — `PRIORITY_COLORS`
- `shared/constants/statuses.ts` — `STATUS_LABELS`
- `shared/constants/issueTypes.ts` — `ISSUE_TYPE_CONFIG`

**Delete:** `components/modals/ModalManager.tsx` — each page manages its own modals.

### Step 1.5 - Create `mocks/` directory
Split `constants.ts` into per-domain mock files:

| Mock data              | File                      |
|------------------------|---------------------------|
| `MOCK_USERS`           | `mocks/users.ts`          |
| `MOCK_ISSUES`          | `mocks/issues.ts`         |
| `MOCK_PROJECTS`        | `mocks/projects.ts`       |
| `MOCK_TEAMS`           | `mocks/teams.ts`          |
| `MOCK_DEPARTMENTS`     | `mocks/departments.ts`    |
| `MOCK_NOTIFICATIONS`   | `mocks/notifications.ts`  |
| `MOCK_ACTIVITIES`      | `mocks/activities.ts`     |
| `MOCK_INTEGRATIONS`    | `mocks/integrations.ts`   |
| `MOCK_CYCLES`          | `mocks/cycles.ts`         |
| `MOCK_API_KEYS`        | `mocks/apiKeys.ts`        |
| `MOCK_ORGANIZATIONS`   | `mocks/organizations.ts`  |

**Delete `constants.ts`** when empty.

### Step 1.6 - Split `types.ts`
Create `shared/types/common.ts` for cross-cutting types (`Toast`, `ModalType`). Feature-specific types stay in `types.ts` temporarily — they move into features in Phase 2.

---

## Phase 2: Migrate Features (One at a time)

For each feature, follow this checklist:

1. Create `src/features/<name>/` with only the folders needed (R1.6 — grow into complexity)
2. Move page component(s) into `features/<name>/pages/`
3. Extract inline sub-components into `features/<name>/components/`
4. Move relevant types from `src/types.ts` into `features/<name>/types.ts`
5. Create `features/<name>/services/<name>Service.ts` — wraps mock data access
6. Create `features/<name>/hooks/use<Name>.ts` — TanStack Query wrapper
7. Create `features/<name>/index.ts` barrel export
8. Update route in `app/routes.tsx`
9. **Verify:** `npm run dev`, navigate to the feature, confirm it works

### Migration order:

| #  | Feature        | Key files to move                                           | Types to extract                           |
|----|----------------|-------------------------------------------------------------|--------------------------------------------|
| 1  | marketing      | `MarketingPage.tsx`                                         | —                                          |
| 2  | auth           | `AuthPage.tsx`                                              | —                                          |
| 3  | activity       | `ActivityPage.tsx`                                          | `Activity`                                 |
| 4  | notifications  | `NotificationsPage.tsx`                                     | `Notification`                             |
| 5  | members        | `MembersPage.tsx`                                           | `User`, `UserRole`                         |
| 6  | departments    | `DepartmentsPage.tsx`, `DepartmentDetailPage.tsx`, `CreateDepartmentModal.tsx` | `Department`                |
| 7  | teams          | `TeamsPage.tsx`, `TeamDetailPage.tsx`, `CreateTeamModal.tsx` | `Team`                                    |
| 8  | projects       | Fix `features/projects/` structure, `ProjectDetailPage.tsx`, `CreateProjectModal.tsx` | `Project`          |
| 9  | issues         | Fix `features/issues/` structure, `IssueDetailPage.tsx`, `CreateIssuePage.tsx`, `MyIssuesPage.tsx`, `lib/issue-storage.ts` | `Issue`, `Priority`, `Status`, `IssueType`, `Severity`, `IssueSubtask`, `Label` |
| 10 | cycles         | `CyclesPage.tsx`, `CreateCycleModal.tsx`                    | `Cycle`                                    |
| 11 | roadmap        | `RoadmapPage.tsx`                                           | —                                          |
| 12 | dashboard      | `DashboardPage.tsx`                                         | —                                          |
| 13 | analytics      | `ReportsPage.tsx`                                           | —                                          |
| 14 | templates      | `TemplatesPage.tsx`                                         | —                                          |
| 15 | settings       | `SettingsPage.tsx`, `BillingPage.tsx`, `ApiKeysPage.tsx`, `IntegrationsPage.tsx`, `GenerateApiKeyModal.tsx`, `InviteMemberModal.tsx` | `ApiKey`, `Integration` |

**Special handling for issues (#9):**
- Fix existing `features/issues/components/IssuesPage.tsx` → move to `features/issues/pages/IssuesPage.tsx`
- Move `lib/issue-storage.ts` → `features/issues/services/issueStorage.ts`
- Create `features/issues/hooks/useIssues.ts` using TanStack Query wrapping `issueService`
- Move `SubtaskList.tsx` and `CreateIssueModal.tsx` to `features/issues/components/`

**Special handling for projects (#8):**
- Fix existing `features/projects/components/ProjectsPage.tsx` → move to `features/projects/pages/ProjectsPage.tsx`

After all features are migrated, **delete**:
- `src/pages/` (empty)
- `src/components/` (empty)
- `src/types.ts` (empty)
- `src/constants.ts` (empty)
- `src/lib/` (moved to features/shared)

---

## Phase 3: Guards and Access Control

### Step 3.1 - Create permissions layer
```ts
// shared/permissions/roles.ts
import type { UserRole } from '@features/members';

export const canAccessAdmin = (role: UserRole): boolean =>
  ['owner', 'admin'].includes(role);

export const canManageTeams = (role: UserRole): boolean =>
  ['owner', 'admin', 'member'].includes(role);
```

### Step 3.2 - Create route guards
- `shared/guards/AuthGuard.tsx` — wraps `<Outlet />`, redirects to `/login` if no `currentUser`
- `shared/guards/GuestGuard.tsx` — wraps `<Outlet />`, redirects to `/` if already logged in
- `shared/guards/RoleGuard.tsx` — accepts permission check function, renders `<Outlet />` or redirects

### Step 3.3 - Apply guards in `routes.tsx`
```tsx
// Public routes
<Route element={<GuestGuard />}>
  <Route path="/marketing" element={<MarketingPage />} />
  <Route path="/login" element={<AuthPage mode="login" />} />
  <Route path="/signup" element={<AuthPage mode="signup" />} />
  <Route path="/forgot-password" element={<AuthPage mode="forgot-password" />} />
  <Route path="/reset-password" element={<AuthPage mode="reset-password" />} />
  <Route path="/email-verification" element={<AuthPage mode="email-verification" />} />
  <Route path="/org-creation" element={<AuthPage mode="org" />} />
</Route>

// Authenticated routes
<Route element={<AuthGuard />}>
  <Route element={<MainLayout />}>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/inbox" element={<NotificationsPage />} />
    <Route path="/issues" element={<IssuesPage />} />
    <Route path="/issues/my" element={<MyIssuesPage />} />
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

    // Admin-only routes (owner, admin)
    <Route element={<RoleGuard check={canAccessAdmin} />}>
      <Route path="/billing" element={<BillingPage />} />
      <Route path="/api-keys" element={<ApiKeysPage />} />
      <Route path="/templates" element={<TemplatesPage />} />
    </Route>

    // Lead+ routes (owner, admin, member)
    <Route element={<RoleGuard check={canManageTeams} />}>
      <Route path="/analytics" element={<ReportsPage />} />
      <Route path="/integrations" element={<IntegrationsPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" />} />
  </Route>
</Route>
```

### Step 3.4 - Remove inline role checks
Delete `isAdmin` / `isLead` ternaries from route definitions in `App.tsx`.

---

## Phase 4: Final Cleanup

### Step 4.1 - Convert remaining `useApp()` calls
Search for any remaining `useApp()` imports and replace with specific Zustand store hooks.

### Step 4.2 - Update modal handling
Each feature that needs a creation modal manages it locally:
```tsx
// features/issues/pages/IssuesPage.tsx
const [isCreateOpen, setCreateOpen] = useState(false);
```
Delete `ModalManager.tsx` and `ModalType` from types.

### Step 4.3 - Break up oversized components
Priority targets (all > 200 lines per R6.6):
- `Sidebar.tsx` (895 lines) → extract into `SidebarSection`, `SidebarItem`, `SidebarTeamSection`, etc.
- `CreateIssuePage.tsx` (873 lines) → extract form sections into components, use React Hook Form + Zod
- `DepartmentDetailPage.tsx` (706 lines) → extract tab panels into components
- `IssueDetailPage.tsx` (437 lines) → extract detail sections

### Step 4.4 - Adopt React Hook Form + Zod for forms
Replace manual form state in:
- `CreateIssuePage.tsx`
- `CreateProjectModal.tsx`
- `CreateTeamModal.tsx`
- `CreateDepartmentModal.tsx`
- `AuthPage.tsx`
- `SettingsPage.tsx`

### Step 4.5 - Final verification checklist
- [ ] `npm run dev` — no errors
- [ ] `npm run build` — no TypeScript errors
- [ ] All routes load correctly
- [ ] Browser back/forward works
- [ ] Deep linking works (paste URL directly)
- [ ] Role guards block unauthorized routes
- [ ] No `useApp()` calls remain
- [ ] No imports from `src/constants.ts` or `src/types.ts`
- [ ] No imports between features (only via `index.ts` or `shared/`)
- [ ] `src/pages/`, `src/components/`, `src/AppContext.tsx`, `src/types.ts`, `src/constants.ts` are deleted
