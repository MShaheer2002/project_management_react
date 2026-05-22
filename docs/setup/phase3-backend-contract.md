# Phase 3 Backend Contract

This document translates Phase 3 from [build-phases.md](./build-phases.md) into the concrete backend contract the frontend needs in order to complete Teams and Departments.

Phase 0, 1, and 2 are assumed complete:

- Clerk auth works
- active workspace selection works
- workspace membership and invitations work
- workspace-scoped requests already use `X-Workspace-Id`

This doc follows the architecture constraints in [rules.md](../architecture/rules.md):

- page data must come from real routes and real APIs, not frontend-only aggregation
- detail pages are URL-driven, so `/teams/:id` and `/departments/:id` must be stable and deep-linkable
- server state is fetched through TanStack Query hooks and feature services, so endpoints must support deterministic filtering, pagination, and refetch

## Goal

Phase 3 frontend needs backend support for:

- department CRUD
- team CRUD
- department membership management
- team membership management
- searchable picker data for leads, heads, departments, teams, and members
- paginated list and detail endpoints that scale to hundreds or thousands of records

## Frontend Surfaces Blocked On Phase 3 APIs

The backend contract must support these UI surfaces:

- Departments list page
- Department detail page
- Teams list page
- Team detail page
- Create department modal
- Create team modal
- future edit dialogs for department and team settings
- searchable member/department/team pickers

## Shared API Conventions

### Auth and workspace scope

- All `/departments` and `/teams` routes are authenticated.
- All workspace-scoped routes use `X-Workspace-Id`.
- Caller must already be a member of the active workspace.

### Success envelope

Frontend currently expects the standard success envelope:

```ts
type ApiResponse<T> = {
  success: true;
  data: T;
};
```

For paginated lists, keep pagination inside `data` instead of top-level `meta`:

```ts
type CursorPage<T> = {
  items: T[];
  pageInfo: {
    nextCursor: string | null;
    hasMore: boolean;
    totalCount?: number;
  };
};
```

Recommended response shape:

```ts
type PaginatedResponse<T> = ApiResponse<CursorPage<T>>;
```

### Error envelope

```ts
type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
};
```

### Roles

Backend should continue returning uppercase workspace roles:

- `OWNER`
- `ADMIN`
- `MEMBER`
- `GUEST`

Frontend already normalizes them to lowercase when needed.

### Pagination

Large lists must not require fetching the whole workspace.

Required query params on list-style routes:

- `cursor`
- `limit`
- `q`
- `sort`

Recommended defaults:

- default `limit`: `20`
- max `limit`: `100`
- default sort for lists: `name:asc`
- default sort for picker searches: relevance first, then `name:asc`

### Search

Search must be server-side and case-insensitive.

Recommended matching:

- departments: `name`, `description`
- teams: `name`, `description`
- members: `name`, `email`

### Compact vs full list views

To avoid over-fetching for search dialogs, list endpoints should support:

- `view=compact`
- `view=full`

If `view` is omitted, `full` is acceptable for page views. Picker UIs should use `compact`.

## Core Resource Shapes

### Department summary

Used by departments list, department picker, and relation summaries.

```ts
type DepartmentSummary = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  head: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  stats: {
    memberCount: number;
    teamCount: number;
    projectCount: number;
  };
};
```

### Department detail

Used by `/departments/:id`.

```ts
type DepartmentDetail = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  head: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  stats: {
    memberCount: number;
    teamCount: number;
    projectCount: number;
    issueCount?: number;
  };
};
```

### Team summary

Used by teams list, team picker, and relation summaries.

```ts
type TeamSummary = {
  id: string;
  name: string;
  description?: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  createdAt: string;
  updatedAt: string;
  lead: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  department: {
    id: string;
    name: string;
  } | null;
  stats: {
    memberCount: number;
    projectCount: number;
  };
};
```

### Team detail

Used by `/teams/:id`.

```ts
type TeamDetail = {
  id: string;
  name: string;
  description?: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  createdAt: string;
  updatedAt: string;
  lead: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  department: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
  stats: {
    memberCount: number;
    projectCount: number;
    issueCount?: number;
  };
};
```

### Member option

Used by compact picker dialogs and search dropdowns.

```ts
type MemberOption = {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
};
```

### Member list row

Used by team/department member tabs and workspace members screens.

```ts
type MemberListRow = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  joinedAt?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
};
```

## Department API Contract

### `POST /departments`

Create a department inside the active workspace.

Permissions:

- `ADMIN+`

Request body:

```ts
type CreateDepartmentInput = {
  name: string;
  description?: string;
  headId?: string | null;
  color?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  isDefault?: boolean;
  memberIds?: string[];
};
```

Frontend needs:

- create modal submits `name`, `description`, `headId`, `color`
- initial members may be selected during create

Response:

- `ApiResponse<DepartmentDetail>`

### `GET /departments`

List departments in the active workspace.

Permissions:

- any workspace member
- guests only receive visible departments

Query params:

- `q`
- `cursor`
- `limit`
- `sort`
- `visibility`
- `headId`
- `view=compact|full`

Response:

- `ApiResponse<CursorPage<DepartmentSummary | Pick<DepartmentSummary, 'id' | 'name'>>>`

Minimum frontend use cases:

- departments list page
- department search field
- department picker in create team dialog
- department picker in invite flow

### `GET /departments/:id`

Get one department by id.

Permissions:

- any workspace member if visible
- guests must not be able to access private departments

Response:

- `ApiResponse<DepartmentDetail>`

### `PATCH /departments/:id`

Update department settings.

Permissions:

- `ADMIN+`
- department `HEAD`

Request body:

```ts
type UpdateDepartmentInput = {
  name?: string;
  description?: string | null;
  headId?: string | null;
  color?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  isDefault?: boolean;
};
```

Response:

- `ApiResponse<DepartmentDetail>`

### `DELETE /departments/:id`

Delete department.

Permissions:

- `ADMIN+`

Required behavior:

- department delete must set `teams.departmentId = null`
- member rows remain workspace members
- department memberships are removed transactionally

Response:

- `204 No Content` or `ApiResponse<{ id: string }>`

### `GET /departments/:id/members`

List department members.

Permissions:

- any workspace member if department is visible

Query params:

- `q`
- `cursor`
- `limit`
- `sort`
- `role`
- `view=compact|full`

Response:

- compact: `ApiResponse<CursorPage<MemberOption>>`
- full: `ApiResponse<CursorPage<MemberListRow>>`

### `POST /departments/:id/members`

Add one or more workspace members to a department.

Permissions:

- `ADMIN+`
- department `HEAD`

Request body:

```ts
type AddDepartmentMembersInput = {
  userIds: string[];
};
```

Response:

- `ApiResponse<{ added: string[] }>`

### `DELETE /departments/:id/members/:uid`

Remove a member from a department.

Permissions:

- `ADMIN+`
- department `HEAD`

Response:

- `204 No Content` or `ApiResponse<{ removed: string }>`

## Team API Contract

### `POST /teams`

Create a team inside the active workspace.

Permissions:

- `MEMBER+`

Request body:

```ts
type CreateTeamInput = {
  name: string;
  description?: string;
  leadId: string;
  departmentId?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  memberIds?: string[];
};
```

Frontend needs:

- create team modal submits `name`, `description`, `leadId`, `departmentId`
- initial members may be selected during create

Response:

- `ApiResponse<TeamDetail>`

### `GET /teams`

List teams in the active workspace.

Permissions:

- any workspace member
- guests only receive visible teams

Query params:

- `q`
- `cursor`
- `limit`
- `sort`
- `departmentId`
- `leadId`
- `visibility`
- `view=compact|full`

Response:

- `ApiResponse<CursorPage<TeamSummary | { id: string; name: string; departmentId?: string | null }>>`

Minimum frontend use cases:

- teams list page
- team selector in later project/invite flows
- team search and filtering

### `GET /teams/:id`

Get one team by id.

Permissions:

- any workspace member if visible
- guests must not be able to access private teams

Response:

- `ApiResponse<TeamDetail>`

### `PATCH /teams/:id`

Update team settings.

Permissions:

- `ADMIN+`
- team `LEAD`

Request body:

```ts
type UpdateTeamInput = {
  name?: string;
  description?: string | null;
  leadId?: string;
  departmentId?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
};
```

Response:

- `ApiResponse<TeamDetail>`

### `DELETE /teams/:id`

Delete team.

Permissions:

- `ADMIN+`

Response:

- `204 No Content` or `ApiResponse<{ id: string }>`

### `GET /teams/:id/members`

List team members.

Permissions:

- any workspace member if team is visible

Query params:

- `q`
- `cursor`
- `limit`
- `sort`
- `role`
- `view=compact|full`

Response:

- compact: `ApiResponse<CursorPage<MemberOption>>`
- full: `ApiResponse<CursorPage<MemberListRow>>`

### `POST /teams/:id/members`

Add one or more workspace members to a team.

Permissions:

- `ADMIN+`
- team `LEAD`

Request body:

```ts
type AddTeamMembersInput = {
  userIds: string[];
};
```

Response:

- `ApiResponse<{ added: string[] }>`

### `DELETE /teams/:id/members/:uid`

Remove a member from a team.

Permissions:

- `ADMIN+`
- team `LEAD`

Response:

- `204 No Content` or `ApiResponse<{ removed: string }>`

## Search and Picker Requirements

This is the main backend requirement that will unblock the frontend UX for real workspaces.

The frontend must not fetch every member, every department, or every team just to power a picker.

### Required picker support

#### Team lead picker

Use:

- `GET /workspaces/:workspaceId/members?q=<text>&limit=10&view=compact`

Needed fields:

- `id`
- `name`
- `email`
- `role`

#### Department head picker

Use:

- `GET /workspaces/:workspaceId/members?q=<text>&limit=10&view=compact`

Needed fields:

- `id`
- `name`
- `email`
- `role`

#### Team member picker

Use:

- `GET /workspaces/:workspaceId/members?q=<text>&cursor=<cursor>&limit=20&view=compact`

Needed fields:

- `id`
- `name`
- `email`
- `role`

#### Department picker

Use:

- `GET /departments?q=<text>&limit=10&view=compact`

Needed fields:

- `id`
- `name`

#### Future team picker

Use:

- `GET /teams?q=<text>&limit=10&view=compact`

Needed fields:

- `id`
- `name`
- `departmentId`

## Business Rules the Frontend Depends On

- Department names are unique within a workspace.
- Team names are unique within a workspace.
- A team can exist without a department.
- `headId` must be a workspace member.
- `leadId` must be a workspace member.
- If `headId` is set, backend should ensure the head is also a member of that department.
- If `leadId` is set, backend should ensure the lead is also a member of that team.
- Guests cannot list or open private departments or teams.
- If a workspace member is removed entirely from the workspace, backend should also remove team and department memberships in the same transaction or a guaranteed follow-up transaction.
- If `isDefault = true` is set on a department, backend should guarantee there is only one default department per workspace.

## Recommended Error Codes

These are the error codes the frontend can map to toasts or field errors:

- `DEPARTMENT_NAME_TAKEN`
- `TEAM_NAME_TAKEN`
- `DEPARTMENT_NOT_FOUND`
- `TEAM_NOT_FOUND`
- `HEAD_NOT_WORKSPACE_MEMBER`
- `LEAD_NOT_WORKSPACE_MEMBER`
- `MEMBER_NOT_WORKSPACE_MEMBER`
- `MEMBER_ALREADY_IN_DEPARTMENT`
- `MEMBER_ALREADY_IN_TEAM`
- `MEMBER_NOT_IN_DEPARTMENT`
- `MEMBER_NOT_IN_TEAM`
- `PRIVATE_DEPARTMENT_FORBIDDEN`
- `PRIVATE_TEAM_FORBIDDEN`
- `NOT_WORKSPACE_MEMBER`
- `FORBIDDEN`
- `VALIDATION_ERROR`

HTTP status guidance:

- `400` invalid payload
- `401` unauthenticated
- `403` authenticated but not allowed
- `404` missing resource or intentionally hidden private resource
- `409` uniqueness or membership conflict

## Out of Scope for Phase 3

These do not need to block the Phase 3 frontend:

- project CRUD
- issue CRUD
- activity feeds
- file upload for team or department logos
- analytics beyond simple counts

For counts that depend on later phases, returning `0` is acceptable for now:

- `projectCount`
- `issueCount`

## Minimum Backend Deliverable

If the backend wants the smallest possible implementation that still unblocks the frontend, this is the minimum set:

1. `POST /departments`
2. `GET /departments` with `q`, `cursor`, `limit`
3. `GET /departments/:id`
4. `PATCH /departments/:id`
5. `DELETE /departments/:id`
6. `GET /departments/:id/members` with `q`, `cursor`, `limit`
7. `POST /departments/:id/members`
8. `DELETE /departments/:id/members/:uid`
9. `POST /teams`
10. `GET /teams` with `q`, `cursor`, `limit`
11. `GET /teams/:id`
12. `PATCH /teams/:id`
13. `DELETE /teams/:id`
14. `GET /teams/:id/members` with `q`, `cursor`, `limit`
15. `POST /teams/:id/members`
16. `DELETE /teams/:id/members/:uid`
17. `GET /workspaces/:workspaceId/members` upgraded to support `q`, `cursor`, `limit`, `view=compact`

Without search and pagination on these endpoints, the frontend can only work for tiny mock-sized workspaces and Phase 3 will not scale beyond demos.
