# Proposed Architecture - Feature-Based Clean Architecture

## Principles

1. **Feature-first organization** - Code grouped by domain, not by technical role
2. **Each feature is self-contained** - Has its own types, hooks, components, and pages
3. **Shared code is explicit** - Common UI, utilities, and types live in `shared/`
4. **Clear data flow** - Services abstract data fetching; hooks abstract business logic
5. **Route-based navigation** - React Router (already installed) for URL-based navigation
6. **Use what's installed** - TanStack Query for server state, Zustand for client stores, React Hook Form + Zod for forms, Axios for HTTP

## Proposed Directory Structure

```
src/
├── app/
│   ├── App.tsx                        # Root component, router setup, providers
│   ├── routes.tsx                     # Centralized route definitions
│   ├── providers/
│   │   └── AppProviders.tsx           # Composes all providers (BrowserRouter, QueryClient, Zustand, Theme)
│   ├── stores/
│   │   ├── useThemeStore.ts           # Zustand store: theme (light/dark/system)
│   │   ├── useAuthStore.ts            # Zustand store: currentUser, organization, login/logout
│   │   └── useUIStore.ts              # Zustand store: sidebar collapsed, command palette open
│   └── layouts/
│       ├── MainLayout.tsx             # Sidebar + TopNavbar + Outlet
│       ├── AuthLayout.tsx             # Layout for auth pages
│       └── MarketingLayout.tsx        # Layout for marketing/landing
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── ForgotPasswordForm.tsx
│   │   ├── pages/
│   │   │   └── AuthPage.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── types.ts
│   │   └── index.ts                   # Public API barrel export
│   │
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── StatCard.tsx
│   │   │   ├── IssueChart.tsx
│   │   │   └── RecentIssues.tsx
│   │   ├── pages/
│   │   │   └── DashboardPage.tsx
│   │   └── index.ts
│   │
│   ├── issues/
│   │   ├── components/
│   │   │   ├── IssueList.tsx
│   │   │   ├── IssueRow.tsx
│   │   │   ├── IssueKanban.tsx          # Uses shared KanbanBoard
│   │   │   ├── IssueCalendar.tsx
│   │   │   ├── PriorityIcon.tsx
│   │   │   ├── StatusIcon.tsx
│   │   │   ├── TypeBadge.tsx
│   │   │   ├── SubtaskList.tsx
│   │   │   ├── CreateIssueForm.tsx
│   │   │   ├── CreateIssueModal.tsx
│   │   │   └── IssueDetailPanel.tsx
│   │   ├── pages/
│   │   │   ├── IssuesPage.tsx
│   │   │   ├── IssueDetailPage.tsx
│   │   │   ├── CreateIssuePage.tsx
│   │   │   └── MyIssuesPage.tsx
│   │   ├── hooks/
│   │   │   ├── useIssues.ts             # TanStack Query + issue-storage
│   │   │   └── useIssueFilters.ts
│   │   ├── services/
│   │   │   └── issueService.ts          # Wraps issue-storage + future API
│   │   ├── types.ts                     # Issue, Priority, Status, IssueType, Severity, IssueSubtask
│   │   └── index.ts
│   │
│   ├── projects/
│   │   ├── components/
│   │   │   ├── ProjectCard.tsx
│   │   │   └── ProjectProgress.tsx
│   │   ├── pages/
│   │   │   ├── ProjectsPage.tsx
│   │   │   └── ProjectDetailPage.tsx
│   │   ├── hooks/
│   │   │   └── useProjects.ts
│   │   ├── services/
│   │   │   └── projectService.ts
│   │   ├── types.ts                   # Project
│   │   └── index.ts
│   │
│   ├── teams/
│   │   ├── components/
│   │   │   ├── TeamCard.tsx
│   │   │   └── TeamMembers.tsx
│   │   ├── pages/
│   │   │   ├── TeamsPage.tsx
│   │   │   └── TeamDetailPage.tsx
│   │   ├── hooks/
│   │   │   └── useTeams.ts
│   │   ├── services/
│   │   │   └── teamService.ts
│   │   ├── types.ts                   # Team
│   │   └── index.ts
│   │
│   ├── departments/
│   │   ├── components/
│   │   │   └── DepartmentCard.tsx
│   │   ├── pages/
│   │   │   ├── DepartmentsPage.tsx
│   │   │   └── DepartmentDetailPage.tsx
│   │   ├── hooks/
│   │   │   └── useDepartments.ts
│   │   ├── types.ts                   # Department
│   │   └── index.ts
│   │
│   ├── members/
│   │   ├── components/
│   │   │   └── MemberRow.tsx
│   │   ├── pages/
│   │   │   └── MembersPage.tsx
│   │   ├── hooks/
│   │   │   └── useMembers.ts
│   │   ├── types.ts                   # User, UserRole
│   │   └── index.ts
│   │
│   ├── cycles/
│   │   ├── components/
│   │   │   └── CycleCard.tsx
│   │   ├── pages/
│   │   │   └── CyclesPage.tsx
│   │   ├── hooks/
│   │   │   └── useCycles.ts
│   │   ├── types.ts                   # Cycle
│   │   └── index.ts
│   │
│   ├── roadmap/
│   │   ├── pages/
│   │   │   └── RoadmapPage.tsx
│   │   └── index.ts
│   │
│   ├── tasks/
│   │   ├── pages/
│   │   │   └── MyTasksPage.tsx
│   │   ├── hooks/
│   │   │   └── useTasks.ts
│   │   └── index.ts
│   │
│   ├── notifications/
│   │   ├── components/
│   │   │   └── NotificationItem.tsx
│   │   ├── pages/
│   │   │   └── NotificationsPage.tsx
│   │   ├── hooks/
│   │   │   └── useNotifications.ts
│   │   ├── types.ts                   # Notification
│   │   └── index.ts
│   │
│   ├── activity/
│   │   ├── pages/
│   │   │   └── ActivityPage.tsx
│   │   ├── types.ts                   # Activity
│   │   └── index.ts
│   │
│   ├── analytics/
│   │   ├── pages/
│   │   │   └── ReportsPage.tsx
│   │   └── index.ts
│   │
│   ├── settings/
│   │   ├── pages/
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── BillingPage.tsx
│   │   │   ├── ApiKeysPage.tsx
│   │   │   └── IntegrationsPage.tsx
│   │   ├── hooks/
│   │   │   └── useSettings.ts
│   │   ├── types.ts                   # ApiKey, Integration
│   │   └── index.ts
│   │
│   ├── templates/
│   │   ├── pages/
│   │   │   └── TemplatesPage.tsx
│   │   └── index.ts
│   │
│   └── marketing/
│       ├── pages/
│       │   └── MarketingPage.tsx
│       └── index.ts
│
├── shared/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopNavbar.tsx
│   │   │   └── ContextPanel.tsx
│   │   ├── board/
│   │   │   ├── KanbanBoard.tsx          # Generic dnd-kit kanban (feature-agnostic)
│   │   │   ├── BoardColumn.tsx
│   │   │   └── BoardCard.tsx
│   │   ├── editor/
│   │   │   └── RichTextEditor.tsx
│   │   ├── feedback/
│   │   │   └── ToastContainer.tsx
│   │   └── CommandPalette.tsx
│   │
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   └── useKeyboardShortcut.ts
│   │
│   ├── lib/
│   │   └── query-client.ts            # TanStack Query client config
│   │
│   ├── services/
│   │   └── api.ts                     # Axios instance (base URL, headers, interceptors)
│   │
│   ├── guards/
│   │   ├── AuthGuard.tsx              # Redirect if not logged in
│   │   ├── RoleGuard.tsx              # Restrict by role (admin, lead, etc.)
│   │   └── GuestGuard.tsx             # Redirect if already logged in
│   │
│   ├── permissions/
│   │   └── roles.ts                   # Centralized permission functions (canAccessBilling, canManageTeams, etc.)
│   │
│   ├── constants/
│   │   ├── priorities.ts              # PRIORITY_COLORS, priority helpers
│   │   └── statuses.ts               # STATUS_LABELS, status helpers
│   │
│   ├── types/
│   │   └── common.ts                  # Toast, ModalType, shared enums
│   │
│   └── utils/
│       ├── cn.ts                      # Classname utility
│       └── date.ts                    # Date formatting helpers
│
├── mocks/                             # Temporary - removed when backend is ready
│   ├── users.ts
│   ├── issues.ts
│   ├── projects.ts
│   ├── teams.ts
│   ├── notifications.ts
│   ├── activities.ts
│   ├── integrations.ts
│   ├── cycles.ts
│   └── apiKeys.ts
│
├── main.tsx
└── index.css
```

## Feature Module Anatomy

Each feature follows a consistent internal structure:

```
features/<feature>/
├── components/      # UI components scoped to this feature
├── pages/           # Route-level page components
├── hooks/           # Custom hooks (data fetching, business logic)
├── services/        # API calls for this domain
├── types.ts         # Types scoped to this feature
└── index.ts         # Barrel export (public API of the feature)
```

**Rules:**
- Features can import from `shared/` and `mocks/`
- Features **cannot** import from other features directly
- Cross-feature communication goes through shared hooks, route params, or URL state
- Only export what other modules need via `index.ts`

## Key Architectural Changes

### 1. React Router for Navigation
Replace the `currentView` state + switch statement with React Router v7:
- URL-based navigation with browser history support
- Deep linking (e.g., `/projects/p1`, `/issues/LIN-101`)
- Route-level code splitting with `React.lazy()`
- Nested layouts (MainLayout > Feature pages)

### 2. Split the God Context
Break `AppContext` into focused, independent contexts/stores:

| Current (AppContext)     | Proposed                                   | Why                                          |
|--------------------------|------------------------------------------  |----------------------------------------------|
| `theme`, `setTheme`     | `useThemeStore` (Zustand)                  | Global, rarely changes, no re-render cascade |
| `currentUser`, `org`    | `useAuthStore` (Zustand)                   | Cross-cutting auth state, selector-based reads |
| `currentView`, `setView`| **Deleted** — React Router (`useNavigate`) | URL is the source of truth for navigation    |
| `selectedIssueId`       | **Deleted** — URL params (`/issues/:id`)   | URL params replace selection state           |
| `isCommandPaletteOpen`  | `useUIStore` (Zustand)                     | Needed by TopNavbar + CommandPalette         |
| `isSidebarCollapsed`    | `useUIStore` (Zustand, persisted)          | Persistent preference via Zustand persist    |
| `activeModal`           | Local `useState` in owning page            | Each page manages its own modals             |
| `toasts`, `showToast`   | Zustand store or lightweight toast lib     | Used globally across features                |

### 3. Service Layer + TanStack Query for Data
Each feature gets a `services/` folder (data access) and `hooks/` folder (TanStack Query wrappers):

```ts
// features/issues/services/issueService.ts
import { MOCK_ISSUES } from '@mocks/issues';
import { getStoredIssues } from './issueStorage';
import type { Issue } from '../types';

export const issueService = {
  getAll: async (): Promise<Issue[]> => {
    // Merge mock + localStorage issues (current)
    // Replace with: return api.get<Issue[]>('/issues')
    return [...getStoredIssues(), ...MOCK_ISSUES];
  },
  getById: async (id: string): Promise<Issue | undefined> => {
    const all = await issueService.getAll();
    return all.find(i => i.id === id);
  },
};

// features/issues/hooks/useIssues.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issueService } from '../services/issueService';

export const useIssues = () => {
  return useQuery({ queryKey: ['issues'], queryFn: issueService.getAll });
};

export const useCreateIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: issueService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issues'] }),
  });
};
```

When a backend is ready, only the service files change — hooks and components remain untouched.

### 4. Route Guards
Centralize role-based access:

```tsx
// In routes.tsx
<Route element={<RoleGuard roles={['admin', 'co-admin']} />}>
  <Route path="/settings/billing" element={<BillingPage />} />
  <Route path="/settings/api-keys" element={<ApiKeysPage />} />
  <Route path="/templates" element={<TemplatesPage />} />
</Route>
```

### 5. Extract Reusable Sub-Components
Move inline sub-components into proper files:
- `StatCard` out of `DashboardPage.tsx` into `features/dashboard/components/`
- `PriorityIcon`, `StatusIcon` out of `IssuesPage.tsx` into `features/issues/components/`
- `TopNavbar` out of `App.tsx` into `shared/components/layout/`

## Route Map

| Route                       | Feature        | Page Component         | Guard       |
|-----------------------------|----------------|------------------------|-------------|
| `/marketing`                | marketing      | MarketingPage          | GuestGuard  |
| `/login`                    | auth           | AuthPage (login)       | GuestGuard  |
| `/signup`                   | auth           | AuthPage (signup)      | GuestGuard  |
| `/forgot-password`          | auth           | AuthPage               | GuestGuard  |
| `/reset-password`           | auth           | AuthPage               | GuestGuard  |
| `/email-verification`       | auth           | AuthPage               | GuestGuard  |
| `/org-creation`             | auth           | AuthPage (org)         | GuestGuard  |
| `/`                         | dashboard      | DashboardPage          | AuthGuard   |
| `/inbox`                    | notifications  | NotificationsPage      | AuthGuard   |
| `/issues/my`                | issues         | MyIssuesPage           | AuthGuard   |
| `/issues`                   | issues         | IssuesPage             | AuthGuard   |
| `/issues/create`            | issues         | CreateIssuePage        | AuthGuard   |
| `/issues/:issueId`          | issues         | IssueDetailPage        | AuthGuard   |
| `/projects`                 | projects       | ProjectsPage           | AuthGuard   |
| `/projects/:id`             | projects       | ProjectDetailPage      | AuthGuard   |
| `/teams`                    | teams          | TeamsPage              | AuthGuard   |
| `/teams/:id`                | teams          | TeamDetailPage         | AuthGuard   |
| `/departments`              | departments    | DepartmentsPage        | AuthGuard   |
| `/departments/:id`          | departments    | DepartmentDetailPage   | AuthGuard   |
| `/members`                  | members        | MembersPage            | AuthGuard   |
| `/roadmap`                  | roadmap        | RoadmapPage            | AuthGuard   |
| `/cycles`                   | cycles         | CyclesPage             | AuthGuard   |
| `/activity`                 | activity       | ActivityPage           | AuthGuard   |
| `/settings`                 | settings       | SettingsPage           | AuthGuard   |
| `/analytics`                | analytics      | ReportsPage            | RoleGuard   |
| `/integrations`             | settings       | IntegrationsPage       | RoleGuard   |
| `/templates`                | templates      | TemplatesPage          | RoleGuard   |
| `/api-keys`                 | settings       | ApiKeysPage            | RoleGuard   |
| `/billing`                  | settings       | BillingPage            | RoleGuard   |

## State Ownership Rules

Every piece of state must have a clear owner. This prevents the God Context from re-emerging.

| State Type              | Owner                              | Example                                      |
|-------------------------|------------------------------------|----------------------------------------------|
| Auth state              | `useAuthStore` (Zustand)           | `currentUser`, `organization`, `isLoggedIn`  |
| Theme                   | `useThemeStore` (Zustand)          | `theme`, `setTheme`                          |
| Toast notifications     | Zustand store or toast lib         | `toasts`, `showToast`                        |
| UI state (sidebar, cmd) | `useUIStore` (Zustand, persisted)  | `isSidebarCollapsed`, `isCommandPaletteOpen` |
| Navigation              | React Router                       | `useNavigate()`, `useParams()`               |
| Entity selection        | URL params                         | `/issues/LIN-101` instead of `selectedIssueId` state |
| UI toggles (modals)     | Component-local `useState`         | `isCreateModalOpen` inside the page that owns it |
| Server/domain data      | TanStack Query via feature hooks   | `useIssues()`, `useProjects()`               |
| Form state              | React Hook Form + Zod              | `useForm<CreateIssueInput>()`                |

**Key rule:** If state is only used by one feature, it stays in that feature. If it's used by 2+ features, it goes in `shared/` or `app/providers/`. Never pre-promote state "just in case."

## Import Rules

```
app/          → can import from: shared/, features/ (only via index.ts)
features/X/   → can import from: shared/, mocks/
features/X/   → CANNOT import from: features/Y/ (no cross-feature imports)
shared/       → can import from: mocks/ (temporarily), shared/ internals
mocks/        → standalone, no imports from app/features/shared
```

Cross-feature data sharing happens through:
1. **URL params** — `/projects/:projectId/issues` passes `projectId` to issues feature
2. **Shared types** — `shared/types/common.ts` for types used across 2+ features
3. **Shared hooks** — If two features need the same data, the hook goes in `shared/hooks/`

## Dependencies (All Already Installed)

| Package              | Purpose                         | Status              |
|----------------------|---------------------------------|---------------------|
| `react-router-dom`   | URL-based routing               | Active, needs cleanup |
| `@tanstack/react-query` | Server state / caching       | Installed, needs adoption |
| `zustand`            | Client state stores             | Installed, needs adoption |
| `react-hook-form`    | Form management                 | Installed, needs adoption |
| `zod`                | Schema validation               | Installed, needs adoption |
| `axios`              | HTTP client                     | Installed, needs adoption |
| `@dnd-kit/*`         | Drag and drop (kanban)          | Active              |

No new dependencies needed. The migration is about properly using what's already installed.
