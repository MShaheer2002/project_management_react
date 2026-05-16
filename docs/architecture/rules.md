# Architecture Rules

These rules are non-negotiable. Every contributor, every PR, every line of code must respect them. If a rule blocks you, you're probably solving the wrong problem — step back and redesign.

---

## 1. Feature Boundaries

### R1.1 — Features are isolated domains
Each feature owns its own components, pages, hooks, services, and types. A feature is a vertical slice of the application, not a technical layer.

### R1.2 — No cross-feature internal imports
Features must **never** reach into another feature's internals (components, hooks, services). Cross-feature communication is only allowed through a feature's **public API** (`index.ts`) or through `shared/`.

```
ALLOWED:     features/issues/ → shared/components/ui/Modal.tsx
ALLOWED:     features/issues/ → @mocks/issues.ts
ALLOWED:     features/issues/ → features/projects/index.ts (public API — types, exported hooks)
FORBIDDEN:   features/issues/ → features/projects/components/ProjectCard.tsx (internal)
FORBIDDEN:   features/issues/ → features/teams/hooks/useTeams.ts (internal)
FORBIDDEN:   features/issues/ → features/projects/services/projectService.ts (internal)
```

**When to use cross-feature public API vs shared/:**
- If feature B needs a **type** from feature A (e.g., `Project` type in issues) → import from A's `index.ts`
- If feature B needs a **component** from feature A → move it to `shared/`, it's no longer feature-scoped
- If 3+ features need the same type → move it to `shared/types/`

### R1.3 — Barrel exports are the public API
Every feature must have an `index.ts` that exports only what the outside world needs. Internal files are private. `app/routes.tsx` imports pages through these barrel files.

```ts
// features/issues/index.ts — this is the ONLY entry point for other features
export { IssuesPage } from './pages/IssuesPage';
export { CreateIssuePage } from './pages/CreateIssuePage';
export type { Issue, Priority, Status } from './types';
// DO NOT export internal components, services, or hooks unless another feature genuinely needs them
```

### R1.4 — Features cannot reach into another feature's internals
Even if something exists in another feature, you cannot import it by path. Only `index.ts` exports are accessible. If a component from feature A is needed in feature B, move it to `shared/`.

### R1.5 — One feature, one domain
Don't merge unrelated domains into a single feature for convenience. `settings/` contains settings-related pages (billing, API keys, integrations) because they share a domain context. But `issues/` and `projects/` are separate features even though issues belong to projects — they have independent lifecycles.

### R1.6 — Grow into complexity, don't start with it
A feature only needs the folders it actually uses. Don't pre-create empty `services/`, `hooks/`, or `components/` directories.

**Minimum viable feature:**
```
features/activity/
├── pages/
│   └── ActivityPage.tsx
└── index.ts
```

**Add folders only when needed:**
- Add `components/` when a page grows beyond 200 lines and needs extraction
- Add `hooks/` when business logic needs to be shared between components or tested independently
- Add `services/` when real API calls exist or data access needs abstraction
- Add `types.ts` when the feature defines domain types used in its public API

Don't create structure for structure's sake. A feature with just a page and an index is perfectly valid.

---

## 2. Routing

### R2.1 — URL is the single source of truth for navigation
Never use React state (`useState`, context) to determine which page the user is on. The URL determines the view. Period.

```
FORBIDDEN:   const [currentView, setView] = useState('issues')
REQUIRED:    useNavigate(), useParams(), useSearchParams()
```

### R2.2 — Every page must be deep-linkable
If a user copies the URL and pastes it in a new tab, the exact same view must load. No page should require navigating through other pages to reach it.

### R2.3 — Entity selection lives in the URL
Selecting an issue, project, team, or any entity must change the URL. Use route params (`:id`) or search params (`?issue=LIN-101`), never context state.

```
FORBIDDEN:   setSelectedIssueId('LIN-101')
REQUIRED:    navigate('/issues/LIN-101') or setSearchParams({ issue: 'LIN-101' })
```

### R2.4 — All routes are defined in one place
`app/routes.tsx` is the single route registry. No feature defines its own routes inline. This makes the full route map auditable and prevents route conflicts.

### R2.5 — Route guards wrap routes, not pages
Access control is handled by guard components (`AuthGuard`, `RoleGuard`, `GuestGuard`) that wrap `<Outlet />` in `routes.tsx`. Pages must never contain their own auth redirect logic.

```tsx
// CORRECT — guard in routes.tsx
<Route element={<RoleGuard roles={['admin']} />}>
  <Route path="/settings/billing" element={<BillingPage />} />
</Route>

// FORBIDDEN — guard inside page
const BillingPage = () => {
  if (user.role !== 'admin') return <Navigate to="/dashboard" />;
  // ...
};
```

### R2.5.1 — Permission logic lives in one place
All role and permission checks must go through `shared/permissions/`. Guards, components, and hooks that need to check access use these functions — never inline role string comparisons.

```ts
// shared/permissions/roles.ts
import type { UserRole } from '@features/members';

export const canAccessBilling = (role: UserRole): boolean =>
  ['owner', 'admin'].includes(role);

export const canManageTeams = (role: UserRole): boolean =>
  ['owner', 'admin', 'member'].includes(role);

export const canDeleteIssues = (role: UserRole): boolean =>
  ['owner', 'admin'].includes(role);
```

```tsx
// CORRECT — guard uses shared permission function
<Route element={<RoleGuard check={canAccessBilling} />}>

// CORRECT — component uses same permission function
{canDeleteIssues(user.role) && <DeleteButton />}

// FORBIDDEN — duplicating role logic
if (user.role === 'admin' || user.role === 'co-admin') { ... }  // scattered in 5 files
```

This guarantees that if a role's access changes, you update one function — not 12 files.

### R2.6 — Use `<Link>` and `useNavigate()`, never `window.location`
All navigation goes through React Router. Direct `window.location` manipulation breaks SPA behavior and client-side state.

### R2.7 — Lazy-load feature pages
Every feature page imported in `routes.tsx` must use `React.lazy()`. This keeps the initial bundle small and loads features on demand.

```ts
const IssuesPage = lazy(() => import('@features/issues').then(m => ({ default: m.IssuesPage })));
```

---

## 3. State Management

### R3.1 — State has exactly one owner
Every piece of state must have one clearly defined owner. Refer to the State Ownership table in `proposed-structure.md`. If you can't name the owner, the state shouldn't exist yet.

### R3.2 — No God Context / God Store
No single store or context may hold more than one domain concern. Each Zustand store handles exactly one responsibility:

| Store              | Responsibility               | Nothing else             |
|--------------------|------------------------------|--------------------------|
| `useAuthStore`     | User session, org            | No theme, no UI state    |
| `useThemeStore`    | Light/dark/system theme      | No auth, no toasts       |
| `useToastStore`    | Toast notifications          | No auth, no theme        |
| `useUIStore`       | Sidebar, command palette     | No auth, no domain data  |

### R3.3 — Default to local state
`useState` inside the component that needs it. Only escalate to context/provider when the state is genuinely needed by components in **different** subtrees that don't share a common parent.

Escalation ladder:
1. `useState` in the component
2. Lift state to nearest shared parent
3. URL params / search params
4. `useLocalStorage` for persistent preferences
5. Context provider (last resort for truly global state)

### R3.4 — UI state is never global
Modal open/close, dropdown visibility, form state, filter selections, sort order — these are **always** local state or URL search params. Never put them in a context provider.

```
FORBIDDEN:   <AppContext> with activeModal, isCommandPaletteOpen, selectedTab
REQUIRED:    const [isOpen, setOpen] = useState(false) inside the owning component
```

### R3.5 — Server state is managed by TanStack Query
Domain data (issues, projects, teams) must be fetched through TanStack Query hooks that call services. Components never call services directly. Never use raw `useState` + `useEffect` for data fetching.

```
FORBIDDEN:   const [issues, setIssues] = useState([]); useEffect(() => { fetchIssues()... })
REQUIRED:    const { data: issues, isLoading, error } = useIssues(); // wraps useQuery
```

### R3.6 — No prop drilling beyond 2 levels
If you're passing a prop through more than 2 intermediate components that don't use it, use composition (children pattern), a hook, or context instead.

### R3.7 — Derived state is computed, not stored
If a value can be calculated from existing state, compute it. Don't store it separately.

```ts
// FORBIDDEN
const [issues, setIssues] = useState([]);
const [urgentCount, setUrgentCount] = useState(0); // derived from issues

// REQUIRED
const issues = useIssues();
const urgentCount = useMemo(() => issues.filter(i => i.priority === 'urgent').length, [issues]);
```

---

## 4. Data Layer & Services

### R4.1 — Components never fetch data directly
Components call hooks. Hooks call services. Services call the API. This is the data flow — no shortcuts.

```
Component → Hook → Service → API/Mock
     ↑        ↑        ↑
     UI    Business   Data access
          logic
```

### R4.2 — Services are the only data access layer
All API calls, mock data imports, and external data access go through service files. No component or hook may import from `@mocks/` directly.

```ts
// FORBIDDEN — component importing mock data
import { MOCK_ISSUES } from '@mocks/issues';

// REQUIRED — service abstracts the data source
// features/issues/services/issueService.ts
import { MOCK_ISSUES } from '@mocks/issues';

export const issueService = {
  getAll: async (): Promise<Issue[]> => MOCK_ISSUES,
};
```

### R4.3 — Services return promises, always
Even when returning mock data, services must be async. This ensures zero refactoring when switching to a real API.

```ts
// CORRECT
getAll: async (): Promise<Issue[]> => MOCK_ISSUES

// FORBIDDEN
getAll: (): Issue[] => MOCK_ISSUES
```

### R4.4 — One service per feature domain
`issueService` handles issues. `projectService` handles projects. Don't create a mega `apiService` that handles everything.

### R4.5 — Base API client lives in `shared/services/api.ts`
All HTTP configuration (base URL, headers, auth tokens, interceptors, error handling) lives in one Axios instance. Feature services import and use this client.

```ts
// shared/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// features/issues/services/issueService.ts
import { api } from '@shared/services/api';
export const issueService = {
  getAll: () => api.get<Issue[]>('/issues').then(r => r.data),
};
```

---

## 5. Caching & Data Freshness

### R5.0 — TanStack Query is the caching layer
TanStack Query (already installed) handles all server state caching. Do not build manual caching with `useState` + `useRef`. Every data-fetching hook must use `useQuery` or `useMutation`.

```ts
// CORRECT — TanStack Query
function useIssues() {
  return useQuery({ queryKey: ['issues'], queryFn: issueService.getAll });
}

// FORBIDDEN — manual caching
function useIssues() {
  const [state, setState] = useState<DataState<Issue[]>>({...});
  const cacheRef = useRef(null);
  // ... manual fetch + cache logic
}
```

Query client is configured in `shared/lib/query-client.ts` with 5-minute stale time.

### R5.1 — Cache at the hook level, not the component level
Hooks own the caching logic. Components receive data and never know whether it came from cache or a fresh fetch.

### R5.2 — Every data hook must handle three states
TanStack Query returns `{ data, isLoading, error }`. Every component consuming data must handle all three. No assuming data is always available.

```tsx
const { data: issues, isLoading, error } = useIssues();

if (isLoading) return <LoadingState />;
if (error) return <ErrorState message="Failed to load issues" onRetry={refetch} />;
return <IssueList issues={issues} />;
```

### R5.3 — Stale-while-revalidate is handled by TanStack Query
The query client is configured with `staleTime: 5 minutes`. TanStack Query automatically returns cached data while revalidating in the background. Do not implement this pattern manually.

### R5.4 — Cache invalidation is explicit via `useMutation`
When a mutation happens (create, update, delete), use `useMutation` with `onSuccess` to invalidate the relevant query. Don't rely on timers or hope.

```ts
export const useCreateIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: issueService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issues'] }),
  });
};
```

### R5.5 — No duplicate fetches for the same data
If two components on the same page need the same data, they should share the same hook instance (via a parent) or use a shared cache. Don't fetch the same endpoint twice.

### R5.6 — Optimistic updates for instant feedback
For user-initiated mutations (status change, assignment, etc.), use TanStack Query's `onMutate` for optimistic updates with automatic rollback.

```ts
export const useUpdateIssueStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, status }: { issueId: string; status: Status }) =>
      issueService.updateStatus(issueId, status),
    onMutate: async ({ issueId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['issues'] });
      const previous = queryClient.getQueryData<Issue[]>(['issues']);
      queryClient.setQueryData<Issue[]>(['issues'], old =>
        old?.map(i => i.id === issueId ? { ...i, status } : i)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['issues'], context?.previous); // rollback
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['issues'] }),
  });
};
```

---

## 6. Component Design

### R6.1 — One component per file
No defining multiple exported components in a single file. Helper components used only inside one file (not exported) are the only exception.

### R6.2 — Pages are thin orchestrators
Page components fetch data (via hooks), compose feature components, and handle layout. They contain minimal logic and zero direct DOM styling beyond layout.

```tsx
// CORRECT — thin page
export const IssuesPage = () => {
  const { issues, isLoading } = useIssues();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  if (isLoading) return <LoadingState />;
  return viewMode === 'list' ? <IssueList issues={issues} /> : <IssueKanban issues={issues} />;
};

// FORBIDDEN — 300-line page with inline everything
export const IssuesPage = () => {
  // ... 50 lines of state
  // ... 100 lines of handlers
  // ... 150 lines of JSX with inline styles
};
```

### R6.3 — Components are typed with explicit props interfaces
Every component must have a named props interface or type. No inline anonymous types.

```ts
// CORRECT
interface IssueRowProps {
  issue: Issue;
  onSelect: (id: string) => void;
}
export const IssueRow: React.FC<IssueRowProps> = ({ issue, onSelect }) => { ... };

// FORBIDDEN
export const IssueRow = ({ issue, onSelect }: { issue: any; onSelect: any }) => { ... };
```

### R6.4 — No `any` type
Use `unknown` if the type is genuinely not known. Prefer specific types or generics. `any` silently kills type safety.

### R6.5 — Shared UI components are feature-agnostic
Components in `shared/components/ui/` must not import from any feature. They receive data through props and emit events through callbacks. They know nothing about issues, projects, or teams.

### R6.6 — Max component size: 200 lines
If a component exceeds 200 lines, extract sub-components or logic into hooks. This is a guideline with rare exceptions, not a suggestion.

---

## 7. UI, Theming & Responsive Design

### 7.0 — Design System Color Tokens

All colors in the app are defined as CSS custom properties in `src/index.css` under `@theme`. **Every component must use these tokens — never raw hex values.**

| Token                         | Value       | Usage                                |
|-------------------------------|-------------|--------------------------------------|
| `--color-primary`             | `#5f72ea`   | Buttons, links, active states, brand accent |
| `--color-bg-light`            | `#FFFFFF`   | Page background (light mode)         |
| `--color-bg-dark`             | `#0F1115`   | Page background (dark mode)          |
| `--color-sidebar-dark`        | `#151821`   | Sidebar background (dark mode)       |
| `--color-card-dark`           | `#1C1F2B`   | Card/panel backgrounds (dark mode)   |
| `--color-border-dark`         | `#2A2F3A`   | Borders/dividers (dark mode)         |
| `--color-text-primary-light`  | `#1E1E1E`   | Primary text (light mode)            |
| `--color-text-secondary-light`| `#6B7280`   | Secondary text (light mode)          |
| `--color-text-primary-dark`   | `#E5E7EB`   | Primary text (dark mode)             |
| `--color-text-secondary-dark` | `#9CA3AF`   | Secondary text (dark mode)           |

**Tailwind class mapping (use these, not raw CSS vars):**

| Purpose              | Light class                  | Dark class                         |
|----------------------|------------------------------|------------------------------------|
| Page background      | `bg-white`                   | `dark:bg-bg-dark`                  |
| Card background      | `bg-white`                   | `dark:bg-card-dark`                |
| Sidebar background   | `bg-gray-50`                 | `dark:bg-sidebar-dark`             |
| Primary text         | `text-gray-900`              | `dark:text-text-primary-dark`      |
| Secondary text       | `text-gray-500`              | `dark:text-text-secondary-dark`    |
| Borders              | `border-gray-200`            | `dark:border-border-dark`          |
| Primary accent       | `bg-primary`, `text-primary` | Same in both modes                 |
| Primary hover        | `hover:bg-primary/90`        | Same in both modes                 |
| Primary subtle bg    | `bg-primary/10`              | Same in both modes                 |
| Hover surfaces       | `hover:bg-gray-100`          | `dark:hover:bg-white/5`            |

### 7.0.1 — Semantic color usage for status and priority

These are consistent across the entire app. Never use different colors for the same meaning.

| Concept       | Color class                                          |
|---------------|------------------------------------------------------|
| Urgent        | `text-red-500 bg-red-100 dark:bg-red-900/30`        |
| High          | `text-orange-500 bg-orange-100 dark:bg-orange-900/30`|
| Medium        | `text-blue-500 bg-blue-100 dark:bg-blue-900/30`     |
| Low           | `text-gray-500 bg-gray-100 dark:bg-gray-800`        |
| Done/Success  | `text-green-500`                                     |
| In Progress   | `text-blue-500`                                      |
| Review        | `text-purple-500`                                    |
| Todo          | `text-gray-400` (with circle border)                |
| Backlog       | `text-gray-400` (with dashed circle border)         |
| Bug type      | `text-red-500 bg-red-100 dark:bg-red-900/30`        |
| Task type     | `text-gray-500 bg-gray-100 dark:bg-gray-800`        |
| Issue/Feature | `text-purple-500 bg-purple-100 dark:bg-purple-900/30`|
| Error toast   | `text-red-500`                                       |
| Success toast | `text-green-500`                                     |
| Info toast    | `text-blue-500`                                      |

### R7.1 — Tailwind CSS only
All styling uses Tailwind utility classes. No inline `style={}` objects except for truly dynamic values (e.g., calculated positions, chart dimensions, dynamic widths). No CSS modules, no styled-components, no emotion.

### R7.2 — Dark mode support is mandatory on every element
Every UI component must render correctly in both light and dark themes. This means every color-related class (`bg-*`, `text-*`, `border-*`, `shadow-*`, `ring-*`, `placeholder-*`) must have a `dark:` counterpart.

```tsx
// CORRECT — both modes covered
<div className="bg-white dark:bg-card-dark text-gray-900 dark:text-text-primary-dark border border-gray-200 dark:border-border-dark">

// FORBIDDEN — dark mode will look broken
<div className="bg-white text-gray-900 border border-gray-200">

// CORRECT — hover states in both modes
<button className="hover:bg-gray-100 dark:hover:bg-white/5">

// FORBIDDEN — hover only works in light mode
<button className="hover:bg-gray-100">
```

**Checklist for every component (no exceptions):**
- [ ] Background color has `dark:` variant
- [ ] Text color has `dark:` variant
- [ ] Border color has `dark:` variant
- [ ] Hover/focus states have `dark:` variant
- [ ] Placeholder text is visible in dark mode
- [ ] Shadows are appropriate (lighter in dark mode or use `dark:shadow-black/40`)
- [ ] No white text on white backgrounds, no dark text on dark backgrounds

### R7.3 — No hardcoded colors outside the design system
Use the theme tokens. No arbitrary hex values, no arbitrary `rgb()`, no `text-[#5B6AD0]`.

```
FORBIDDEN:   className="text-[#5B6AD0]"
FORBIDDEN:   className="bg-[rgb(15,17,21)]"
REQUIRED:    className="text-primary"
REQUIRED:    className="bg-bg-dark"
```

The only exception is gradient stops that extend the primary palette:
```tsx
// ALLOWED — gradient extending primary
className="bg-gradient-to-r from-primary via-violet-500 to-purple-500"
```

### R7.4 — Responsive design is mandatory — mobile, tablet, and desktop

Every page and component must work across **three** breakpoints. This is not optional or "nice to have" — it is a hard requirement.

| Breakpoint | Tailwind prefix | Min width | Target devices              |
|------------|-----------------|-----------|------------------------------|
| Mobile     | (default)       | 0px       | Phones (320px – 767px)       |
| Tablet     | `sm:` / `md:`   | 640px / 768px | Tablets, small laptops  |
| Desktop    | `lg:` / `xl:`   | 1024px / 1280px | Laptops, monitors     |

**Layout rules per breakpoint:**

| Pattern                   | Mobile (default)          | Tablet (`md:`)            | Desktop (`lg:`)           |
|---------------------------|---------------------------|---------------------------|---------------------------|
| Grid columns              | `grid-cols-1`             | `grid-cols-2`             | `grid-cols-3` or `grid-cols-4` |
| Sidebar                   | Hidden or overlay         | Collapsed (icons only)    | Full expanded (280px)     |
| Navigation                | Hamburger menu            | Horizontal nav            | Horizontal nav            |
| Card layouts              | Stacked full-width        | 2 columns                 | 3–4 columns               |
| Typography (hero)         | `text-3xl` / `text-4xl`   | `text-5xl`                | `text-6xl` / `text-7xl`   |
| Padding                   | `px-4 py-6`               | `px-6 py-8`               | `px-8 py-10`              |
| Modals                    | Full-screen               | Centered with max-width   | Centered with max-width   |
| Tables                    | Card list or horizontal scroll | Full table           | Full table                |
| Flex direction            | `flex-col`                | `flex-row`                | `flex-row`                |

```tsx
// CORRECT — responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

// CORRECT — responsive text sizing
<h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold">

// CORRECT — responsive padding
<section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">

// CORRECT — responsive flex direction
<div className="flex flex-col sm:flex-row items-center gap-4">

// CORRECT — hide on mobile, show on desktop
<div className="hidden lg:flex">

// FORBIDDEN — fixed widths that break on mobile
<div className="w-[800px]">

// FORBIDDEN — no responsive consideration
<div className="grid grid-cols-4 gap-8 px-8">
```

### R7.5 — Font is Inter, from the theme
The app uses `Inter` as defined in `--font-sans`. Never override with a different font family. Body text applies `font-sans antialiased` via the base layer.

### R7.6 — Consistent spacing scale
Use Tailwind's default spacing scale. Don't use arbitrary values like `p-[13px]` — pick the nearest standard value (`p-3` = 12px or `p-3.5` = 14px).

### R7.7 — Consistent border radius scale
| Element type      | Radius class    |
|-------------------|-----------------|
| Buttons, badges   | `rounded-lg` or `rounded-xl` |
| Cards, panels     | `rounded-xl` or `rounded-2xl` |
| Modals            | `rounded-2xl`   |
| Avatars           | `rounded-full`  |
| Inputs            | `rounded-lg`    |
| Page sections     | `rounded-2xl` or `rounded-3xl` |

### R7.8 — Consistent shadow scale
| Element type      | Shadow class                                   |
|-------------------|------------------------------------------------|
| Cards (resting)   | `shadow-sm`                                    |
| Cards (hover)     | `shadow-md` or `shadow-lg`                     |
| Modals/dropdowns  | `shadow-2xl`                                   |
| Primary buttons   | `shadow-lg shadow-primary/20`                  |
| Elevated panels   | `shadow-xl`                                    |
| Dark mode adjust  | Use `dark:shadow-black/40` for deeper shadows  |

### R7.9 — Transitions and animations
- All interactive elements must have `transition-colors` or `transition-all` for hover/focus states
- Use `motion/react` (framer-motion) for enter/exit animations and scroll-triggered reveals
- Preferred animation timing: `duration-300` for UI transitions, `duration-500`–`duration-800` for page-level reveals
- Use `ease-[0.22,1,0.36,1]` (custom ease-out) for motion animations
- Never use `transition-none` on interactive elements

### R7.10 — Backdrop blur for overlays
Sticky headers, modals, and dropdown overlays use `backdrop-blur-md` or `backdrop-blur-xl` with semi-transparent backgrounds:

```tsx
// Sticky header
className="bg-white/90 dark:bg-bg-dark/90 backdrop-blur-xl"

// Modal backdrop
className="fixed inset-0 bg-black/50 backdrop-blur-sm"
```

### R7.11 — Z-index scale
| Layer             | Z-index  | Usage                        |
|-------------------|----------|------------------------------|
| Base content      | `z-0`    | Page content                 |
| Sticky headers    | `z-30`   | TopNavbar                    |
| Overlays/backdrops| `z-40`   | Modal backdrops, menu overlays|
| Modals/dropdowns  | `z-50`   | Modals, command palette, dropdowns |

Never use arbitrary z-index values like `z-[9999]`.

### R7.12 — Scrollbar styling
Custom scrollbar is defined globally in `index.css`. Do not override per-component. Use `overflow-y-auto` and `overflow-hidden` appropriately. For containers that should hide scrollbars visually, use the `scrollbar-hide` utility if available, or `overflow-y-auto` with the global thin scrollbar.

### R7.13 — Selection color
The app uses `selection:bg-primary/30` on the root container. This is inherited — don't override it per-component.

---

## 8. Error Handling

### R8.1 — Errors are handled at the boundary, not scattered
Use React Error Boundaries at the layout level. Individual components should handle their own data-loading errors (via hook state), but unexpected errors bubble to the boundary.

### R8.2 — Every async operation must handle failure
No unhandled promise rejections. Every `await` must be in a try/catch or have a `.catch()`.

```ts
// FORBIDDEN
const data = await issueService.getAll(); // what if this throws?

// REQUIRED
try {
  const data = await issueService.getAll();
} catch (error) {
  showToast('Failed to load issues', 'error');
}
```

### R8.3 — User-facing errors must be actionable
Don't show "Something went wrong." Tell the user what failed and what they can do: retry, contact support, or check their input.

### R8.4 — Never swallow errors silently
```ts
// FORBIDDEN
try { await save(); } catch {} // error disappears

// REQUIRED
try { await save(); } catch (error) {
  console.error('Failed to save issue:', error);
  showToast('Failed to save. Please try again.', 'error');
}
```

---

## 9. Type Safety

### R9.1 — Strict TypeScript, no escape hatches
`tsconfig.json` must have `strict: true`. No `@ts-ignore`, no `@ts-expect-error` without a linked issue/TODO explaining why.

### R9.2 — Types are co-located with their feature
Issue types live in `features/issues/types.ts`. Project types live in `features/projects/types.ts`. Only truly shared types (Toast, common enums) live in `shared/types/`.

### R9.3 — API response types match service return types
The type returned by a service must match what the API actually returns. Don't transform data in services without updating the types.

### R9.4 — Enums are union types, not TypeScript `enum`
```ts
// CORRECT
type Priority = 'low' | 'medium' | 'high' | 'urgent';

// FORBIDDEN
enum Priority { Low, Medium, High, Urgent }
```

String union types are smaller in bundles, work with plain JSON, and are easier to debug.

---

## 10. Performance

### R10.1 — Lazy-load every feature route
No feature page should be in the main bundle. Use `React.lazy()` + `<Suspense>` for every route.

### R10.2 — Memoize expensive computations
Use `useMemo` for filtering, sorting, and transforming lists. Use `useCallback` for event handlers passed as props to memoized child components. Don't memoize everything — only what is measurably expensive or causes unnecessary re-renders.

### R10.3 — Images and heavy assets are lazy-loaded
Use `loading="lazy"` on images. Use dynamic `import()` for heavy libraries (charts, editors).

### R10.4 — Context providers are split to prevent cascade re-renders
This is why we have separate `ThemeProvider`, `AuthProvider`, `ToastProvider` — a theme change must not re-render every component that reads auth state.

### R10.5 — Lists use stable keys
Use unique, stable identifiers (entity IDs) as `key` props. Never use array index as key for dynamic lists.

```tsx
// CORRECT
{issues.map(issue => <IssueRow key={issue.id} issue={issue} />)}

// FORBIDDEN
{issues.map((issue, index) => <IssueRow key={index} issue={issue} />)}
```

---

## 11. Security

### R11.1 — Never trust client-side role checks alone
Route guards and UI hiding are for UX, not security. The backend must independently verify permissions. Client-side guards prevent UI confusion, not unauthorized access.

### R11.2 — Sanitize user-generated content
Any content rendered from user input or API responses must be sanitized. React's JSX escaping handles most cases, but never use `dangerouslySetInnerHTML` without sanitization.

### R11.3 — Auth tokens are stored securely
Use `httpOnly` cookies (preferred) or secure storage. Never store tokens in `localStorage` where XSS can access them. If `localStorage` is the only option (SPA with no backend-for-frontend), document the risk.

### R11.4 — API keys and secrets never appear in frontend code
No API keys, database credentials, or secrets in any file under `src/`. Use environment variables (`import.meta.env`) for configuration, and only expose what the frontend genuinely needs.

### R11.5 — Validate at system boundaries
Validate all form inputs before sending to the API. Validate all API responses before trusting their shape. Use TypeScript types as documentation, but runtime-check at boundaries.

---

## 12. File & Naming Conventions

### R12.1 — Component files are PascalCase
`IssueRow.tsx`, `CreateIssueForm.tsx`, `DashboardPage.tsx`

### R12.2 — Hook files are camelCase prefixed with `use`
`useIssues.ts`, `useAuth.ts`, `useLocalStorage.ts`

### R12.3 — Service files are camelCase suffixed with `Service`
`issueService.ts`, `projectService.ts`, `api.ts` (exception for the base client)

### R12.4 — Type files are `types.ts` inside their feature
Not `IssueTypes.ts`, not `issue.types.ts`. Just `types.ts` — the feature folder provides context.

### R12.5 — Test files are co-located
```
features/issues/
├── hooks/
│   ├── useIssues.ts
│   └── useIssues.test.ts     # right next to the source
```

### R12.6 — Path aliases are mandatory
Always use `@features/`, `@shared/`, `@mocks/`, `@app/`. Never use relative paths that cross architectural boundaries (e.g., `../../../shared/`).

```ts
// CORRECT
import { Modal } from '@shared/components/ui/Modal';

// FORBIDDEN
import { Modal } from '../../../shared/components/ui/Modal';
```

---

## 13. Backend Integration & Feature Documentation

Every feature that integrates with the backend **must** have its own documentation under `docs/features/<feature-name>/`. This is non-negotiable — undocumented integrations create black boxes that no one can debug, maintain, or onboard into.

### R13.1 — Every feature integration gets a docs folder

```
docs/features/
├── auth/
│   ├── integration.md       # API endpoints, request/response shapes, flow diagrams
│   ├── guide.md             # How to use auth in the frontend (hooks, stores, guards)
│   └── decisions.md         # Why we chose this approach (optional, for complex features)
├── issues/
│   ├── integration.md
│   └── guide.md
├── projects/
│   ├── integration.md
│   └── guide.md
└── ...per feature as integrated
```

### R13.2 — `integration.md` is mandatory for every backend-connected feature

This file documents the contract between frontend and backend. It must contain:

1. **Endpoints** — Every API endpoint the feature calls, with method, path, and purpose
2. **Request/Response types** — Exact shapes with TypeScript interfaces
3. **Auth requirements** — Which endpoints need auth, what roles can access them
4. **Error responses** — What error codes the backend returns and how the frontend handles each
5. **Flow diagrams** — For multi-step flows (e.g., auth: signup → verify → workspace creation)

```markdown
<!-- Example: docs/features/auth/integration.md -->

# Auth — Backend Integration

## Endpoints

| Method | Path                    | Purpose                  | Auth Required |
|--------|-------------------------|--------------------------|---------------|
| POST   | /api/auth/signup        | Create account           | No            |
| POST   | /api/auth/login         | Email + password login   | No            |
| POST   | /api/auth/verify-email  | Verify OTP code          | No            |
| POST   | /api/auth/forgot-password | Request reset link     | No            |
| POST   | /api/auth/reset-password  | Set new password       | No            |
| GET    | /api/auth/me            | Get current user         | Yes           |
| POST   | /api/auth/logout        | Invalidate session       | Yes           |
| GET    | /api/auth/google        | Google OAuth redirect    | No            |
| GET    | /api/auth/github        | GitHub OAuth redirect    | No            |

## Request / Response Types

### POST /api/auth/signup
Request:
  { name: string, email: string, password: string }
Response (201):
  { user: { id, name, email }, message: "Verification email sent" }
Error (409):
  { error: "EMAIL_ALREADY_EXISTS", message: "..." }

...for every endpoint
```

### R13.3 — `guide.md` documents frontend usage

This file explains how other developers (or your future self) should use the feature's frontend code:

1. **Hooks** — What hooks exist, what they return, when to use them
2. **Stores** — What Zustand stores the feature uses, their state shape
3. **Components** — Key components and their props
4. **Guards** — How route protection works for this feature
5. **Examples** — Copy-paste code snippets for common use cases

```markdown
<!-- Example: docs/features/auth/guide.md -->

# Auth — Frontend Guide

## Stores
- `useAuthStore` — holds `currentUser`, `organization`, `token`
- Access: `const user = useAuthStore(s => s.currentUser)`

## Hooks
- `useLogin()` — returns `useMutation` for email/password login
- `useSignup()` — returns `useMutation` for account creation
- `useLogout()` — clears auth state and redirects to /login

## Guards
- `AuthGuard` — redirects to /login if no token
- `GuestGuard` — redirects to / if already authenticated

## Usage
  const { mutate: login, isPending } = useLogin();
  login({ email, password }, { onSuccess: () => navigate('/') });
```

### R13.4 — Documentation is written BEFORE or DURING integration, not after

The integration doc is your plan. Write the endpoints table and request/response types first, then implement against it. This prevents:
- Building against assumptions that don't match the backend
- Forgetting to handle error cases
- Losing knowledge of what was built

### R13.5 — Keep docs in sync with code

When an endpoint changes, the integration doc must be updated in the same PR. Stale docs are worse than no docs. If you change a request shape, update `integration.md`. If you add a hook, update `guide.md`.

### R13.6 — `decisions.md` for non-obvious choices (optional)

If you made a significant architectural choice (e.g., "we use httpOnly cookies instead of localStorage for tokens because..."), document it. This prevents the next developer from "fixing" something that was intentional.

### R13.7 — Environment variables are documented per feature

Every feature that needs env vars must list them in its `integration.md`:

```markdown
## Environment Variables
| Variable              | Required | Default       | Description                |
|-----------------------|----------|---------------|----------------------------|
| VITE_API_URL          | Yes      | /api          | Backend API base URL       |
| VITE_GOOGLE_CLIENT_ID | Yes      | —             | Google OAuth client ID     |
| VITE_GITHUB_CLIENT_ID | Yes      | —             | GitHub OAuth client ID     |
```

### R13.8 — API client configuration

All backend calls go through the shared Axios instance (`shared/services/api.ts`). Feature services import this client — they never create their own Axios instances or use raw `fetch`.

```ts
// CORRECT — feature service uses shared API client
import { api } from '@shared/services/api';
export const authService = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data).then(r => r.data),
};

// FORBIDDEN — raw fetch or custom axios
export const login = (data: LoginRequest) => fetch('/api/auth/login', { ... });
```

### R13.9 — Token management is centralized in the auth store

Auth tokens, refresh logic, and session management live exclusively in `useAuthStore` and the API interceptor. No other feature manages tokens or auth headers.

```ts
// shared/services/api.ts — interceptor adds token automatically
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

Features never pass tokens manually — the interceptor handles it globally.

### R13.10 — Error handling follows a consistent pattern

Every service call that hits the backend must handle errors through a standard pattern:

```ts
// In the hook (TanStack Query handles retries and error state)
export const useLogin = () => {
  const showToast = useToastStore(s => s.showToast);
  return useMutation({
    mutationFn: authService.login,
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Something went wrong';
      showToast(message, 'error');
    },
  });
};
```

Backend error responses must follow a consistent shape:
```ts
interface ApiError {
  error: string;    // Machine-readable code (e.g., "EMAIL_ALREADY_EXISTS")
  message: string;  // Human-readable message for the user
}
```

---

## Quick Reference — Decision Tree

```
Where does this code go?

Is it a page rendered by a route?
  → features/<domain>/pages/

Is it a UI component used only by one feature?
  → features/<domain>/components/

Is it a UI component used by 2+ features?
  → shared/components/ui/

Is it a data-fetching function?
  → features/<domain>/services/

Is it business logic or data transformation?
  → features/<domain>/hooks/

Is it a type used only by one feature?
  → features/<domain>/types.ts

Is it a type used across features?
  → shared/types/common.ts

Is it a role/permission check?
  → shared/permissions/roles.ts

Is it a constant (colors, labels, config)?
  → shared/constants/

Is it a utility function (date formatting, classnames)?
  → shared/utils/

Is it mock data?
  → mocks/

Is it a route definition?
  → app/routes.tsx

Is it a layout wrapper?
  → app/layouts/

Is it global state (auth, theme, toast)?
  → app/providers/

Does the feature only have a page right now?
  → That's fine. features/<domain>/pages/ + index.ts is enough. Add folders when needed.

Are you integrating a feature with the backend?
  → Create docs/features/<feature>/integration.md FIRST, then implement.
  → Add docs/features/<feature>/guide.md for frontend usage.
```
