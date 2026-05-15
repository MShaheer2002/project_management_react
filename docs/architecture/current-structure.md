# Current Architecture

## Overview

The app is a **Project Management Tool** (Linear-like) built with React 19, Vite, TypeScript, and Tailwind CSS v4. It has **React Router** for navigation (partially adopted) and **TanStack Query** installed (but barely used). A single monolithic context still holds all global state, and there are no feature boundaries, service layers, or route guards.

## Directory Structure

```
src/
├── App.tsx                          # Root component + TopNavbar + MainLayout + Routes
├── AppContext.tsx                    # Single monolithic context (ALL app state)
├── main.tsx                         # Entry point (BrowserRouter + QueryClientProvider)
├── index.css                        # Global styles
├── types.ts                         # ALL type definitions
├── constants.ts                     # ALL mock data + config constants
│
├── lib/
│   ├── issue-storage.ts             # localStorage CRUD for issues
│   └── query-client.ts              # TanStack Query client config
│
├── features/                        # Partially started — incorrect structure
│   ├── issues/
│   │   └── components/
│   │       ├── IssuesPage.tsx       # Page incorrectly inside components/
│   │       ├── CreateIssueModal.tsx
│   │       └── SubtaskList.tsx
│   └── projects/
│       └── components/
│           └── ProjectsPage.tsx     # Page incorrectly inside components/
│
├── components/
│   ├── Sidebar.tsx                  # 895 lines — oversized
│   ├── ContextPanel.tsx             # Right-side detail panel
│   ├── CommandPalette.tsx           # Cmd+K command palette
│   ├── ToastContainer.tsx           # Toast notifications
│   ├── RichTextEditor.tsx           # Rich text editor component
│   ├── board/
│   │   ├── KanbanBoard.tsx          # Drag-and-drop kanban
│   │   ├── BoardColumn.tsx
│   │   └── BoardCard.tsx
│   └── modals/
│       ├── Modal.tsx                # Base modal wrapper
│       ├── ModalManager.tsx         # Modal switch/renderer
│       ├── CreateProjectModal.tsx
│       ├── CreateCycleModal.tsx
│       ├── CreateTeamModal.tsx
│       ├── CreateDepartmentModal.tsx
│       ├── InviteMemberModal.tsx
│       └── GenerateApiKeyModal.tsx
│
├── pages/
│   ├── DashboardPage.tsx            # 289 lines
│   ├── IssueDetailPage.tsx          # 437 lines
│   ├── CreateIssuePage.tsx          # 873 lines — extremely oversized
│   ├── MyIssuesPage.tsx             # 229 lines
│   ├── ProjectDetailPage.tsx        # 387 lines
│   ├── DepartmentsPage.tsx          # 239 lines
│   ├── DepartmentDetailPage.tsx     # 706 lines — extremely oversized
│   ├── TeamsPage.tsx                # 99 lines
│   ├── TeamDetailPage.tsx           # 129 lines
│   ├── MembersPage.tsx              # 141 lines
│   ├── CyclesPage.tsx               # 129 lines
│   ├── RoadmapPage.tsx              # 100 lines
│   ├── NotificationsPage.tsx        # 141 lines
│   ├── ActivityPage.tsx             # 106 lines
│   ├── ReportsPage.tsx              # 156 lines
│   ├── SettingsPage.tsx             # 191 lines
│   ├── BillingPage.tsx              # 120 lines
│   ├── IntegrationsPage.tsx         # 95 lines
│   ├── ApiKeysPage.tsx              # 83 lines
│   ├── TemplatesPage.tsx            # 295 lines
│   ├── AuthPage.tsx                 # 315 lines
│   └── MarketingPage.tsx            # 278 lines
```

**Total source lines: ~11,200** across 48 files.

## Tech Stack

| Layer          | Technology                   | Status           |
|----------------|------------------------------|------------------|
| Framework      | React 19                     | Active           |
| Build          | Vite 6                       | Active           |
| Language       | TypeScript 5.8               | Active           |
| Styling        | Tailwind CSS v4              | Active           |
| Routing        | React Router v7              | Partially adopted |
| Server State   | TanStack Query v5            | Installed, barely used |
| Client State   | Zustand v5                   | Installed, not used |
| Forms          | React Hook Form + Zod        | Installed, not used |
| HTTP Client    | Axios                        | Installed, not used |
| DnD            | dnd-kit                      | Active (kanban)  |
| Animation      | Motion (framer-motion)       | Active           |
| Charts         | Recharts                     | Active           |
| Icons          | Lucide React                 | Active           |
| AI             | @google/genai                | Active           |

## Key Problems

### 1. God Context — Single Monolithic AppContext (Critical)
`AppContext.tsx` still holds **everything**: theme, current user, organization, selected issue, sidebar state, command palette, modal state, toasts. Every state change re-renders the entire app tree. This is unchanged from the initial codebase.

### 2. Installed But Not Used Libraries
TanStack Query, Zustand, React Hook Form, Zod, and Axios are all installed but not integrated. The app still uses:
- Direct mock imports instead of query hooks
- `AppContext` instead of Zustand stores
- Uncontrolled forms instead of React Hook Form
- No HTTP client (no real API calls)

### 3. Broken Feature Folder Structure
`features/issues/` and `features/projects/` exist but are structured wrong:
- Pages are inside `components/` (should be in `pages/`)
- No `index.ts` barrel exports
- No `types.ts`, `hooks/`, or `services/`
- Other features (teams, departments, cycles, etc.) haven't been migrated at all

### 4. No Separation of Concerns
- Pages import mock data directly from `constants.ts`
- No service/API layer despite having Axios installed
- No custom hooks — all logic lives directly in components
- Business logic (role checks, filtering) is inline in `App.tsx` and pages
- Sub-components (`StatCard`, `PriorityIcon`, `TypeBadge`) defined inside page files

### 5. Role-Based Access Inline
Inline ternary guards in route definitions:
```tsx
<Route path="/analytics" element={isLead ? <ReportsPage /> : <Navigate to="/" />} />
```
No centralized permission system. Roles changed to `owner | admin | member | guest`.

### 6. Type & Data Coupling
All domain types in one `types.ts`. All mock data in one `constants.ts` (now including `Department`, `Organization`, `ISSUE_TYPE_CONFIG`). Every feature aware of every type.

### 7. Oversized Components
- `Sidebar.tsx`: 895 lines
- `CreateIssuePage.tsx`: 873 lines
- `DepartmentDetailPage.tsx`: 706 lines
- `IssueDetailPage.tsx`: 437 lines
- `ProjectDetailPage.tsx`: 387 lines

### 8. Mixed Data Persistence
Issues use `localStorage` via `lib/issue-storage.ts`, while everything else uses in-memory mock constants. No consistent data layer.

### 9. New Domain: Departments
`Department` entity was added across types, constants, pages, modals, and sidebar — but without any feature boundary. It's scattered across `pages/`, `components/modals/`, and `constants.ts`.
