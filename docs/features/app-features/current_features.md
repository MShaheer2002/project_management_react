# Current Features — Complete Reference

> Snapshot of every feature, UI behavior, animation, and mock data dependency
> as of the architecture migration. Use this to rebuild features against real APIs.
> Nothing in this doc should be lost — only the data source changes (mock → API).

---

## 1. Dashboard (`/dashboard` — DashboardPage.tsx, 289 lines)

### What it shows
- **4 stat cards**: Issues Completed, Active Projects, Team Members, Open Issues
  - Each card has: icon (in primary/10 bg), value (2xl bold), label (xs uppercase), trend badge (green %)
- **Velocity chart** (Recharts BarChart): completed vs open issues per day (Mon–Sun)
  - Bar colors: primary (completed), gray (open)
  - CartesianGrid, Tooltip, ResponsiveContainer
- **Sprint progress chart** (Recharts LineChart): open issues trend line
- **Assigned to me section**: Top 5 issues filtered by `assigneeId === currentUser.id`
  - Shows: priority dot, title, status badge, due date
  - Click → opens ContextPanel (setSelectedIssueId)
- **Team activity feed**: 3 most recent activities
- **Active projects**: Project cards with progress bars
- **Upcoming deadlines**: Issues with due dates, sorted overdue → today → future

### Mock data used
- `MOCK_ISSUES` — filtered for assigned/due dates
- `MOCK_PROJECTS` — for active projects list
- `MOCK_USERS` — for assignee display
- `MOCK_ACTIVITIES` — for activity feed

### Animations
- None (static page, scroll-based layout)

---

## 2. Issues (`/issues` — IssuesPage.tsx, 308 lines)

### Views
- **List view**: Table with columns — checkbox, ID, title, type badge, status, assignee avatar, priority, due date
  - Sortable by column headers (ArrowUpDown icon)
  - Row click → setSelectedIssueId (opens ContextPanel)
- **Kanban board view**: 5 columns (Backlog, Todo, In Progress, Review, Done)
  - Uses KanbanBoard component with dnd-kit drag-and-drop
  - Card shows: priority dot, title, type badge, subtask count, assignee avatar
  - Drag between columns changes issue status
- **Calendar view**: Placeholder (not fully implemented)

### Filters & search
- Text search (title or ID match)
- Department filter dropdown
- View mode toggle (list/kanban/calendar icons)
- Team scoping via URL query param `?team=`

### Sub-components defined inline
- `TypeBadge` — task/bug/issue with colored badges and icons (CheckSquare, Bug, Zap)
- `PriorityIcon` — AlertCircle with priority-based colors
- `StatusIcon` — CheckCircle2 (done), Clock (in-progress/review), circle borders (todo/backlog)

### Mock data used
- `MOCK_ISSUES` + `getStoredIssues()` (localStorage)
- `MOCK_USERS` — assignee avatars/names
- `MOCK_DEPARTMENTS` — department filter
- `MOCK_PROJECTS` — project name display
- `MOCK_TEAMS` — team filter
- `PRIORITY_COLORS`, `STATUS_LABELS`, `ISSUE_TYPE_CONFIG`

---

## 3. Kanban Board (`components/board/KanbanBoard.tsx`, 222 lines)

### Behavior
- 5 columns: Backlog, Todo, In Progress, Review, Done
- **Drag-and-drop** via `@dnd-kit/core`, `@dnd-kit/sortable`
  - `PointerSensor` with 8px activation distance
  - `KeyboardSensor` for accessibility
- Drop on column → changes issue status
- Drop on card → reorder within column

### Animations
- Drag: card scales to 1.05x with slight rotation based on mouse position
- Drop: opacity transition

### Sub-components
- `BoardColumn.tsx` (83 lines) — column header with count, issue cards, "New issue" button
- `BoardCard.tsx` (111 lines) — card with priority dot, title, type badge, subtask progress, assignee

### Mock data used
- Receives issues as props (from parent page)
- `MOCK_USERS` — assignee avatar in BoardCard

---

## 4. Issue Detail (`/issues/:issueId` — IssueDetailPage.tsx, 437 lines)

### Sections
- **Header**: Issue ID (monospace), type badge, title, creator info, creation date
- **Description**: Rich text content
- **Type-specific sections**:
  - Bug: Steps to Reproduce, Expected Behavior (green border), Actual Behavior (red border)
  - Issue/Feature: Acceptance Criteria (purple border)
- **Subtasks**: SubtaskList component with progress bar
- **Properties sidebar** (right side):
  - Status dropdown
  - Priority dropdown (colored)
  - Assignee dropdown
  - Due date picker
  - Labels (tag list with add button)
- **Discussion tabs**:
  - Comments tab: input with file/mention buttons, comment list
  - Activity tab: timeline of changes

### Actions
- Change status/priority/assignee/due date/labels
- Delete issue (with confirmation)
- Submit comments

### Mock data used
- `MOCK_ISSUES` + `getStoredIssues()` — find by issueId param
- `MOCK_USERS` — assignee/creator display
- `MOCK_PROJECTS` — project name

### Animations
- None (static detail view)

---

## 5. Create Issue (`/issues/create` — CreateIssuePage.tsx, 873 lines)

### Form fields
- **Type selector**: Task / Bug / Issue (changes visible fields)
- **Title**: Auto-focused input
- **Description**: RichTextEditor (min 300px height)
- **Project**: Required dropdown
- **Priority**: 4 options (Low, Medium, High, Urgent)
- **Status**: Multi-state dropdown
- **Assignee**: User selector or unassigned
- **Department**: Optional dropdown
- **Due date + time**: Date picker + time selector (12:00 default)
- **Complexity estimate**: Number input with "Pts" suffix
- **Labels**: Multi-select (Bug, Feature, Design, Backend, Frontend)

### Type-specific fields
- Bug: Steps to Reproduce, Expected/Actual Behavior, Severity (Low/Medium/High)
- Issue: Acceptance Criteria, Related Issues (comma-separated), Notes
- Task: Standard fields only

### Subtask management
- Add/edit/delete/reorder subtasks
- Inline editing (double-click), progress bar

### Special behaviors
- **Auto-draft save** to localStorage every 5 seconds
- Load saved draft on page mount
- **Keyboard shortcuts**: Cmd+Enter to submit, Esc to cancel
- Auto-generated issue ID via `generateNextIssueId()`

### Mock data used
- `MOCK_PROJECTS` — project dropdown
- `MOCK_USERS` — assignee dropdown
- `MOCK_DEPARTMENTS` — department dropdown
- `MOCK_TEAMS` — team context
- `ISSUE_TYPE_CONFIG` — type labels/colors
- `generateNextIssueId()` / `saveCreatedIssue()` from lib/issue-storage.ts

---

## 6. My Issues (`/issues/my` — MyIssuesPage.tsx, 229 lines)

### Tabs
- **Assigned to Me**: Issues where `assigneeId === currentUser.id` and status ≠ done
- **Created by Me**: Issues where `creatorId === currentUser.id`
- **Completed**: Issues assigned to user with status === done

### Views
- List view (table) and Board view (kanban) toggle
- Text search + type filter (All / Tasks / Bugs / Issues)

### Mock data used
- `MOCK_ISSUES` + `getStoredIssues()`
- `MOCK_USERS`, `MOCK_PROJECTS`
- `ISSUE_TYPE_CONFIG`, `PRIORITY_COLORS`, `STATUS_LABELS`

---

## 7. Context Panel (`components/ContextPanel.tsx`, 362 lines)

### Behavior
- Slides in from right (450px wide) when `selectedIssueId` is set
- Spring animation entry/exit via `motion/react`
- Shows full issue detail without leaving current page

### Sections
- Header: Issue ID, "Open Full Page" link, Delete button, Close button
- Title + description (editable on hover)
- Type-specific content (bug fields, acceptance criteria)
- Subtasks (SubtaskList component)
- Metadata grid: Status, Priority, Assignee, Due Date, Labels
- Discussion tabs: Comments + Activity

### Animations
- `initial={{ x: 450 }}` → `animate={{ x: 0 }}` (spring)
- Backdrop overlay with `onClick` to close

### Mock data used
- `MOCK_ISSUES` + `getStoredIssues()` — find by selectedIssueId
- `MOCK_USERS` — assignee/creator
- `MOCK_PROJECTS` — project name
- `ISSUE_TYPE_CONFIG`, `STATUS_LABELS`, `PRIORITY_COLORS`

---

## 8. SubtaskList (`features/issues/components/SubtaskList.tsx`, 294 lines)

### Features
- Drag-to-reorder via dnd-kit
- Checkbox toggle (completed state)
- Inline editing (double-click to edit, Enter/Esc to save/cancel)
- Delete button (hover reveal)
- Add subtask input at bottom
- Progress bar with percentage
- Toast when all subtasks complete

### Animations
- Reorder with dnd-kit sortable transition

### Mock data used
- Receives subtasks as props
- Calls `updateStoredIssue()` from lib/issue-storage.ts

---

## 9. Projects (`/projects` — ProjectsPage.tsx, 109 lines)

### Display
- Card grid: name, description, team, progress bar, issue count, last updated
- Filterable by team via URL query param `?team=`

### Actions
- Click card → navigate to `/projects/:id`
- "New Project" button → opens CreateProjectModal

### Mock data used
- `MOCK_PROJECTS`, `MOCK_TEAMS`

---

## 10. Project Detail (`/projects/:id` — ProjectDetailPage.tsx, 387 lines)

### Tabs
1. **Overview**: Description, recent issues (3), progress bar, team members
2. **Issues**: Full IssuesPage filtered to project
3. **Board**: KanbanBoard filtered to project
4. **Roadmap**: Timeline placeholder
5. **Members**: Team members list
6. **Activity**: Activity timeline
7. **Settings** (lead/admin only):
   - General: name, description, lead, visibility
   - Workflow: custom status management
   - Permissions: who can create/edit/manage
   - Danger Zone: archive or delete project

### Mock data used
- `MOCK_PROJECTS` — find by id param
- `MOCK_ISSUES` — filtered by projectId
- `MOCK_USERS`, `MOCK_TEAMS`

---

## 11. Teams (`/teams` — TeamsPage.tsx, 99 lines)

### Display
- Card grid: team name, lead (shield badge), member avatars (up to 4 + count), project count
- "Create Team" button → opens CreateTeamModal

### Mock data used
- `MOCK_TEAMS`, `MOCK_USERS`

---

## 12. Team Detail (`/teams/:id` — TeamDetailPage.tsx, 129 lines)

### Tabs
- Members (delegates to MembersPage)
- Projects (filtered grid)
- Issues (IssuesPage filtered by team)
- Activity (timeline)

### Mock data used
- `MOCK_TEAMS`, `MOCK_USERS`, `MOCK_PROJECTS`

---

## 13. Departments (`/departments` — DepartmentsPage.tsx, 239 lines)

### Views
- **Grid view**: Cards with icon/color, name, description, stats (members/teams/projects), department head
- **List view**: Table format

### Mock data used
- `MOCK_DEPARTMENTS`, `MOCK_USERS`

---

## 14. Department Detail (`/departments/:id` — DepartmentDetailPage.tsx, 706 lines)

### Tabs
1. **Overview**: 4 stat cards (resources, active projects, efficiency, resource load), velocity chart (Recharts AreaChart), workload distribution chart (horizontal bar), key details
2. **Members**: Table with avatar, name, email, status, team, role
3. **Teams**: Team cards grid
4. **Projects**: Project cards grid
5. **Activity**: Timeline
6. **Settings** (admin/head only): General, Visibility, Visual Identity (color picker, icon selector), Advanced (auto-membership, default), Danger Zone

### Charts
- Velocity: Recharts AreaChart with gradient fill
- Workload: Horizontal bar chart

### Mock data used
- `MOCK_DEPARTMENTS` — find by id
- `MOCK_TEAMS`, `MOCK_USERS`, `MOCK_PROJECTS`, `MOCK_ISSUES`

---

## 15. Cycles (`/cycles` — CyclesPage.tsx, 129 lines)

### Sections
- **Current cycle**: Highlighted card with progress bar, issue count, date range
- **Upcoming cycles**: List with dates
- **Completed cycles**: List with completion status

### Mock data used
- `MOCK_CYCLES`

---

## 16. Roadmap (`/roadmap` — RoadmapPage.tsx, 100 lines)

### Display
- Horizontal Gantt-style timeline with months (Jan–Dec)
- Project bars showing timeline with progress %
- Quarterly/monthly view toggle
- Navigation (prev/next)

### Mock data used
- `MOCK_PROJECTS`

---

## 17. Notifications / Inbox (`/inbox` — NotificationsPage.tsx, 141 lines)

### Tabs
- All, Mentions, Assignments, Updates

### Display
- Actor avatar with notification icon overlay
- Actor name + description + issue ID + timestamp
- Read status (blue dot if unread)
- Mark complete / more options actions

### Mock data used
- `MOCK_NOTIFICATIONS`, `MOCK_USERS`

---

## 18. Activity Feed (`/activity` — ActivityPage.tsx, 106 lines)

### Display
- Vertical timeline with connecting line
- Each entry: avatar, name, action type badge, description, timestamp
- Action types: issue_created, issue_completed, comment_added, member_joined

### Mock data used
- `MOCK_ACTIVITIES`, `MOCK_USERS`

---

## 19. Analytics / Reports (`/analytics` — ReportsPage.tsx, 156 lines)

### Stat cards
- Tasks Completed (with trend %), Avg Resolution Time, Active Projects, Team Workload %

### Charts
- **Completion Velocity**: Recharts BarChart (completed per day)
- **Issue Distribution**: Donut/pie by status (Backlog, Todo, In Progress, Review, Done)
- **Team Performance table**: team name, members, completed, efficiency %, progress bar

### Controls
- Date range: Last 7 days / Last 30 days
- Export Data button

### Mock data used
- `MOCK_ISSUES`, `MOCK_PROJECTS`, `MOCK_TEAMS`, `MOCK_USERS`

---

## 20. Members (`/members` — MembersPage.tsx, 141 lines)

### Display
- Table: avatar, name, email, role badge, department, team
- Role badges: Owner (orange dot), Admin (shield), Member, Guest

### Filters
- Search by name/email
- Role filter: All, Owner, Admin, Member, Guest
- Department filter

### Mock data used
- `MOCK_USERS`, `MOCK_DEPARTMENTS`, `MOCK_TEAMS`

---

## 21. Settings (`/settings` — SettingsPage.tsx, 191 lines)

### Sections
- **Appearance**: Theme selector (Light/Dark/System)
- **Workspace Profile**: Switch Role (demo mock users), Org Name, Workspace URL
- **Security & Access**: 2FA toggle, SSO config
- **Danger Zone**: Delete Workspace

### Mock data used
- `MOCK_USERS` — for role switching demo
- `useApp()` — theme, currentUser, setCurrentUser

---

## 22. Billing (`/billing` — BillingPage.tsx, 120 lines)

### Display
- Current plan: name, next billing date, amount
- Usage: users count, storage, billing cycle
- Payment method card display
- Invoice history table: ID, date, amount, status, download

### Mock data used
- All hardcoded inline (no MOCK_ import)

---

## 23. Integrations (`/integrations` — IntegrationsPage.tsx, 95 lines)

### Display
- Integration cards: logo, name, description, connection status badge
- Connect/disconnect buttons
- Request Integration card

### Mock data used
- `MOCK_INTEGRATIONS`

---

## 24. API Keys (`/api-keys` — ApiKeysPage.tsx, 83 lines)

### Display
- Security banner
- Key cards: name, created date, last used, masked key, reveal/copy/delete buttons

### Mock data used
- `MOCK_API_KEYS`

---

## 25. Templates (`/templates` — TemplatesPage.tsx, 295 lines)

### Display
- Template card grid: name, description, creator, last updated
- Create/edit template form: name, description, rich text body, default priority/assignee/labels/checklist

### Mock data used
- All hardcoded inline (mock templates array inside component)

---

## 26. Marketing/Landing (`/` — MarketingPage.tsx, 914 lines)

### Sections
- Nav (sticky, scroll-blur), Hero (gradient headline, CTAs, app mockup with floating badges)
- Trusted By (logo strip), Features (4 visual cards with mock previews)
- Stats (40%, 3x, 100%, 10k+), How It Works (3 steps + app preview)
- Testimonials (3 cards with stars), Pricing (3 plans), CTA banner, Footer

### Animations
- `motion/react` scroll-triggered stagger via `useInView`
- Fade-up entrance on all sections
- Hero: progress bars animate width, floating badges slide in
- No mock data imports — all content is inline

---

## 27. Sidebar (`components/Sidebar.tsx`, 909 lines)

### Sections
- Workspace switcher dropdown (name, settings, invite, switch, logout)
- Search bar (Cmd+K trigger)
- Navigation: Your Work (Dashboard, Inbox, My Issues), Browse (All Issues, All Projects)
- Your Teams (expandable, team-scoped links for Issues, Projects, Cycles, Roadmap)
- Organization (Departments, Teams, Members, Activity, Analytics, Integrations, Templates, API Keys, Billing, Settings)
- Footer: theme toggle, sidebar collapse, logout, user profile

### Role-based visibility
- Analytics, Integrations: admin + member only
- Templates, API Keys, Billing: admin only

### Mock data used
- `MOCK_TEAMS` — team list in sidebar

---

## 28. Command Palette (`components/CommandPalette.tsx`, 116 lines)

### Behavior
- Opens via Cmd+K
- Search input with action list
- Actions: Create issue, Go to Dashboard/Inbox/My Issues/Projects/Teams/Roadmap/Settings
- Esc to close, click outside to close

### Animations
- Modal overlay with backdrop blur
- Scale + fade enter/exit

### Mock data used
- None (navigation actions only)

---

## 29. RichTextEditor (`components/RichTextEditor.tsx`, 210 lines)

### Features
- Formatting toolbar: Bold, Italic, Heading, List, Link, Code, Image
- contentEditable div with HTML output
- Paste handling
- Placeholder text

### Mock data used
- None

---

## 30. Modals

| Modal | File | Lines | Mock data used |
|---|---|---|---|
| CreateProjectModal | modals/CreateProjectModal.tsx | 221 | `MOCK_TEAMS`, `MOCK_DEPARTMENTS` |
| CreateTeamModal | modals/CreateTeamModal.tsx | 159 | `MOCK_USERS`, `MOCK_DEPARTMENTS` |
| CreateDepartmentModal | modals/CreateDepartmentModal.tsx | 190 | `MOCK_USERS` |
| CreateCycleModal | modals/CreateCycleModal.tsx | 152 | None (date inputs only) |
| CreateIssueModal | features/issues/CreateIssueModal.tsx | 253 | `MOCK_PROJECTS`, `MOCK_USERS`, `ISSUE_TYPE_CONFIG` |
| InviteMemberModal | modals/InviteMemberModal.tsx | 134 | None (email + role inputs) |
| GenerateApiKeyModal | modals/GenerateApiKeyModal.tsx | 132 | None (name input only) |
| ModalManager | modals/ModalManager.tsx | 28 | None (switch on activeModal) |
| Modal (base) | modals/Modal.tsx | 62 | None (wrapper component) |

---

## 31. Toast System

### Current behavior
- Types: success (green), error (red), warning (orange), info (blue)
- Bold title + message text
- X dismiss button
- Progress bar (shrinks to 0% as auto-dismiss timer runs)
- Auto-dismiss: 6s for errors, 5s for others
- Stacked bottom-right, AnimatePresence for enter/exit

---

## 32. Shared Constants (used across features)

| Constant | File | Used by |
|---|---|---|
| `PRIORITY_COLORS` | shared/constants/priorities.ts | Issues, Dashboard, ContextPanel, MyIssues |
| `STATUS_LABELS` | shared/constants/statuses.ts | Issues, Dashboard, ContextPanel, KanbanBoard |
| `ISSUE_TYPE_CONFIG` | shared/constants/issueTypes.ts | Issues, CreateIssue, IssueDetail, ContextPanel |

---

## 33. Data Persistence (localStorage)

| Key | File | Purpose |
|---|---|---|
| `created_issues` | lib/issue-storage.ts | User-created issues saved to localStorage |
| `linearis-auth` | app/stores/useAuthStore.ts | Persisted workspace (survives refresh) |
| `app-ui` | app/stores/useUIStore.ts | Sidebar collapsed state |
| `app-theme` | app/stores/useThemeStore.ts | Theme preference (light/dark/system) |

---

## 34. Mock Data Files (to be commented out)

| File | Exports | Imported by (count) |
|---|---|---|
| `mocks/users.ts` | `MOCK_USERS` | ~15 files |
| `mocks/issues.ts` | `MOCK_ISSUES` | ~10 files |
| `mocks/projects.ts` | `MOCK_PROJECTS` | ~8 files |
| `mocks/teams.ts` | `MOCK_TEAMS` | ~7 files |
| `mocks/departments.ts` | `MOCK_DEPARTMENTS` | ~5 files |
| `mocks/notifications.ts` | `MOCK_NOTIFICATIONS` | ~2 files |
| `mocks/activities.ts` | `MOCK_ACTIVITIES` | ~2 files |
| `mocks/integrations.ts` | `MOCK_INTEGRATIONS` | ~1 file |
| `mocks/cycles.ts` | `MOCK_CYCLES` | ~1 file |
| `mocks/apiKeys.ts` | `MOCK_API_KEYS` | ~1 file |
| `mocks/organizations.ts` | `MOCK_ORGANIZATIONS` | ~1 file |
| `constants.ts` | Re-exports all above | Legacy imports |
| `lib/issue-storage.ts` | `getStoredIssues`, `saveCreatedIssue`, etc. | ~5 files |
