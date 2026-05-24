# Phase 4 Backend Contract

This document translates Phase 4 from [build-phases.md](./build-phases.md) into the concrete backend contract the frontend needs in order to complete Projects.

Phases 0, 1, 2, and 3 are assumed complete:

- Clerk auth works
- active workspace selection works
- workspace membership and invitations work
- teams and departments work
- workspace-scoped requests already use `X-Workspace-Id`

This doc follows the architecture constraints in [rules.md](../architecture/rules.md):

- project page data must come from real routes and real APIs, not frontend-only mock aggregation
- `/projects` and `/projects/:id` must be stable and deep-linkable
- list and picker data must support server-side search and pagination
- feature UIs should be able to fetch data through services and TanStack Query hooks without special-case response parsing

## Goal

Phase 4 frontend needs backend support for:

- project CRUD
- project membership management
- searchable project lists and project picker data
- project detail data for overview, settings, and members
- project references inside team, department, issue, dashboard, and roadmap surfaces
- project visibility, lead assignment, and basic feature flags

## Frontend Surfaces Blocked On Phase 4 APIs

The backend contract must support these UI surfaces:

- Projects list page
- Project detail page
- Create project modal
- Project settings tab
- Project members tab
- Team detail project cards
- Department detail project cards
- Create issue project selector
- issue list/project filtering
- future project edit dialogs and project member dialogs

Important current frontend detail:

- the current project UI already exposes `team`, `department`, `lead`, `members`, `visibility`, `startDate`, `targetDate`, and feature toggles in the create/settings surfaces
- the current project detail shell also exposes overview, issues, board, roadmap, members, activity, and settings tabs
- not every visible tab needs a Phase 4 backend route yet; some remain Phase 5+ concerns and are called out explicitly below

## Shared API Conventions

### Auth and workspace scope

- All `/projects` routes are authenticated.
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

For paginated lists, frontend currently expects top-level `meta`:

```ts
type ApiPaginatedResponse<T> = {
  success: true;
  data: T[];
  meta: {
    total: number;
    cursor: string | null;
    hasMore: boolean;
  };
};
```

Do not return paginated project lists as nested `data.items/pageInfo` unless the frontend is changed first.

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

### Pagination

Required query params on list-style routes:

- `cursor`
- `limit`
- `q`
- `sort`

Recommended defaults:

- default `limit`: `20`
- max `limit`: `100`
- default sort for full page lists: `updatedAt:desc`
- default sort for search pickers: relevance first, then `name:asc`

### Search

Search must be server-side and case-insensitive.

Recommended matching:

- projects: `name`, `description`, `slug`
- project members: `name`, `email`

### Compact vs full list views

To avoid over-fetching for picker dialogs, project list endpoints should support:

- `view=compact`
- `view=full`

If `view` is omitted, `full` is acceptable for page views. Picker UIs should use `compact`.

## Core Resource Shapes

### Project summary

Used by:

- `/projects`
- team detail project cards
- department detail project cards
- dashboard/recent project cards

```ts
type ProjectSummary = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  visibility: 'PUBLIC' | 'PRIVATE';
  progress: number;
  startDate?: string | null;
  targetDate?: string | null;
  createdAt: string;
  updatedAt: string;
  lead: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  team: {
    id: string;
    name: string;
  };
  department: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
  stats: {
    issueCount: number;
    completedIssueCount: number;
    memberCount: number;
  };
  features: {
    roadmap: boolean;
    cycles: boolean;
    issueTracking: boolean;
  };
};
```

### Project detail

Used by `/projects/:id`.

```ts
type ProjectDetail = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  visibility: 'PUBLIC' | 'PRIVATE';
  progress: number;
  startDate?: string | null;
  targetDate?: string | null;
  createdAt: string;
  updatedAt: string;
  lead: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  team: {
    id: string;
    name: string;
  };
  department: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
  stats: {
    issueCount: number;
    completedIssueCount: number;
    memberCount: number;
  };
  features: {
    roadmap: boolean;
    cycles: boolean;
    issueTracking: boolean;
  };
};
```

### Project compact

Used by project picker UIs and future project search dialogs.

```ts
type ProjectCompact = {
  id: string;
  name: string;
  teamId: string;
  departmentId?: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  visibility: 'PUBLIC' | 'PRIVATE';
};
```

### Project member row

Used by `/projects/:id/members` and the project members tab.

```ts
type ProjectMemberRow = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  joinedAt?: string | null;
  membershipRole: 'LEAD' | 'MEMBER';
  department: {
    id: string;
    name: string;
  } | null;
  team: {
    id: string;
    name: string;
  } | null;
};
```

### Project member option

Used by compact member search dialogs.

```ts
type ProjectMemberOption = {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
};
```

## Required Routes

Phase 4 should expose these routes for the current frontend UI:

```txt
POST   /projects
GET    /projects
GET    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id

GET    /projects/:id/members
POST   /projects/:id/members
DELETE /projects/:id/members/:uid
```

Notes:

- `GET /projects/:id/members` already exists in `build-phases.md`
- `POST` and `DELETE` membership routes are recommended additions because the current project UI includes explicit member selection and add-member affordances

## List Query Contract

`GET /projects` should support:

```txt
q
cursor
limit
sort
view
teamId
departmentId
leadId
status
visibility
```

Recommended `sort` values:

- `updatedAt:desc`
- `updatedAt:asc`
- `name:asc`
- `name:desc`
- `createdAt:desc`
- `createdAt:asc`
- `targetDate:asc`
- `targetDate:desc`

Example:

```http
GET /projects?q=mobile&teamId=team_xxx&status=ACTIVE&visibility=PUBLIC&cursor=proj_xxx&limit=12&view=full
X-Workspace-Id: <workspaceId>
```

## Project Member Query Contract

`GET /projects/:id/members` should support:

```txt
q
cursor
limit
sort
view
role
```

Recommended `sort` values:

- `name:asc`
- `name:desc`
- `joinedAt:asc`
- `joinedAt:desc`

## Create Project Contract

Important current UI detail:

- the frontend create modal does not expose a `slug` field
- backend should therefore auto-generate a unique slug from `name` if `slug` is omitted

Recommended request:

```http
POST /projects
Content-Type: application/json
X-Workspace-Id: <workspaceId>
```

```json
{
  "name": "Mobile App Redesign",
  "description": "Q3 redesign work for iOS and Android",
  "teamId": "team_xxx",
  "departmentId": "dept_xxx",
  "leadId": "user_xxx",
  "memberIds": ["user_a", "user_b"],
  "visibility": "PRIVATE",
  "startDate": "2026-06-01",
  "targetDate": "2026-08-30",
  "features": {
    "roadmap": true,
    "cycles": true,
    "issueTracking": true
  }
}
```

If backend wants to allow custom slug later, this is acceptable too:

```json
{
  "name": "Mobile App Redesign",
  "slug": "mobile-app-redesign",
  "teamId": "team_xxx",
  "leadId": "user_xxx"
}
```

### Create response

```json
{
  "success": true,
  "data": {
    "id": "proj_xxx",
    "name": "Mobile App Redesign",
    "slug": "mobile-app-redesign",
    "status": "ACTIVE",
    "visibility": "PRIVATE",
    "progress": 0,
    "lead": {
      "id": "user_xxx",
      "name": "Alex Rivera",
      "email": "alex@example.com",
      "avatar": null
    },
    "team": {
      "id": "team_xxx",
      "name": "Engineering"
    },
    "department": {
      "id": "dept_xxx",
      "name": "Platform",
      "color": "#5f72ea"
    },
    "stats": {
      "issueCount": 0,
      "completedIssueCount": 0,
      "memberCount": 2
    },
    "features": {
      "roadmap": true,
      "cycles": true,
      "issueTracking": true
    },
    "createdAt": "2026-05-23T12:00:00.000Z",
    "updatedAt": "2026-05-23T12:00:00.000Z"
  }
}
```

## List Response Contract

```json
{
  "success": true,
  "data": [
    {
      "id": "proj_xxx",
      "name": "Mobile App Redesign",
      "slug": "mobile-app-redesign",
      "description": "Q3 redesign work for iOS and Android",
      "status": "ACTIVE",
      "visibility": "PRIVATE",
      "progress": 65,
      "startDate": "2026-06-01",
      "targetDate": "2026-08-30",
      "lead": {
        "id": "user_xxx",
        "name": "Alex Rivera",
        "email": "alex@example.com",
        "avatar": null
      },
      "team": {
        "id": "team_xxx",
        "name": "Engineering"
      },
      "department": {
        "id": "dept_xxx",
        "name": "Platform",
        "color": "#5f72ea"
      },
      "stats": {
        "issueCount": 18,
        "completedIssueCount": 11,
        "memberCount": 6
      },
      "features": {
        "roadmap": true,
        "cycles": true,
        "issueTracking": true
      },
      "createdAt": "2026-05-23T12:00:00.000Z",
      "updatedAt": "2026-05-23T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 42,
    "cursor": "proj_next",
    "hasMore": true
  }
}
```

## Detail Contract

`GET /projects/:id` should return `ProjectDetail`.

Recommended behavior:

- stable payload shape for direct page loads and refresh
- do not require a separate "bootstrap" route to resolve the project page
- return `404` for missing resources
- for private-project visibility denials, prefer a hidden-resource style `404` error code rather than exposing a generic forbidden page

Recommended private error code:

- `PRIVATE_PROJECT_FORBIDDEN`

## Update Contract

`PATCH /projects/:id` should support:

- `name`
- `slug?`
- `description`
- `leadId`
- `teamId`
- `departmentId`
- `visibility`
- `status`
- `startDate`
- `targetDate`
- `features`

Recommended example:

```json
{
  "name": "Mobile App Refresh",
  "description": "Updated project scope",
  "leadId": "user_next",
  "visibility": "PUBLIC",
  "status": "ARCHIVED",
  "targetDate": "2026-09-15",
  "features": {
    "roadmap": true,
    "cycles": false,
    "issueTracking": true
  }
}
```

## Project Members Contract

### List members

```http
GET /projects/:id/members?view=full&q=alex&cursor=<cursor>&limit=20
X-Workspace-Id: <workspaceId>
```

Paginated response:

```json
{
  "success": true,
  "data": [
    {
      "id": "user_xxx",
      "name": "Alex Rivera",
      "email": "alex@example.com",
      "avatar": null,
      "role": "MEMBER",
      "joinedAt": "2026-05-20T10:00:00.000Z",
      "membershipRole": "LEAD",
      "department": {
        "id": "dept_xxx",
        "name": "Platform"
      },
      "team": {
        "id": "team_xxx",
        "name": "Engineering"
      }
    }
  ],
  "meta": {
    "total": 6,
    "cursor": null,
    "hasMore": false
  }
}
```

### Add members

```http
POST /projects/:id/members
Content-Type: application/json
X-Workspace-Id: <workspaceId>
```

```json
{
  "userIds": ["user_a", "user_b"]
}
```

Recommended success:

```json
{
  "success": true,
  "data": {
    "added": ["user_a", "user_b"]
  }
}
```

### Remove member

```http
DELETE /projects/:id/members/:uid
X-Workspace-Id: <workspaceId>
```

## Business Rules

### Workspace and ownership

- Project belongs to exactly one workspace.
- Project belongs to exactly one team.
- Project may reference one department.
- Project may reference one project lead.
- Project may have explicit project members.

### Department behavior

Current frontend shows both `team` and `department` selection.

Recommended backend rule:

- `departmentId` may be accepted in create/update payloads
- if provided, it must either match the selected team's department or be normalized by backend to the team's actual department
- backend response must always return the normalized final `department`

This keeps the UI simple while preserving backend ownership of denormalized integrity.

### Lead and membership

- `leadId` must belong to the same workspace
- recommended: `leadId` must also be a project member
- recommended: project members must belong to the same workspace
- recommended: if the backend uses explicit project membership, members should also belong to the owning team unless product rules intentionally allow cross-team project staffing

### Slug behavior

- project slug must be unique within workspace
- slug should be auto-generated from `name` when omitted
- backend should return the resolved slug in create/update/detail responses

### Visibility

Frontend currently uses:

- `PUBLIC` -> public to workspace
- `PRIVATE` -> private to members

Recommended access model:

- `PUBLIC`: visible to workspace members, including guests if your workspace policy allows public guest visibility
- `PRIVATE`: visible to project members, project lead, admins, and owners

At minimum:

- private projects must not leak into guest-visible lists
- hidden-resource access should return a consistent not-found style error

### Status

- allowed statuses: `ACTIVE`, `ARCHIVED`, `COMPLETED`
- archive is a non-destructive state transition
- delete is destructive
- archiving must not delete issues
- deleting a project may cascade issues, as already described in `build-phases.md`

### Progress and counts

Frontend needs `progress` and `stats.issueCount` on project cards and detail pages.

Until Phase 5 issue data is fully live:

- returning `0` is acceptable
- but still return the fields now so the payload shape stays stable

## Recommended Error Codes

Recommended codes the frontend can branch on cleanly:

- `PROJECT_NAME_TAKEN`
- `PROJECT_SLUG_TAKEN`
- `TEAM_NOT_IN_WORKSPACE`
- `DEPARTMENT_NOT_IN_WORKSPACE`
- `LEAD_NOT_WORKSPACE_MEMBER`
- `LEAD_NOT_PROJECT_MEMBER`
- `LEAD_NOT_TEAM_MEMBER`
- `MEMBER_NOT_WORKSPACE_MEMBER`
- `MEMBER_NOT_TEAM_MEMBER`
- `PRIVATE_PROJECT_FORBIDDEN`
- `PROJECT_STATUS_INVALID`
- `VALIDATION_ERROR`

## UI-to-API Mapping

### Projects page

Needs:

- `GET /projects?view=full`
- server-side `q`
- `teamId`, `status`, and `visibility` filters
- cursor pagination

### Team detail project tab

Needs:

- `GET /projects?teamId=<teamId>&view=full`

### Department detail project tab

Needs:

- `GET /projects?departmentId=<departmentId>&view=full`

### Create project modal

Needs:

- `POST /projects`
- uses existing Phase 3 option endpoints for:
  - `GET /teams?view=compact`
  - `GET /departments?view=compact`
  - `GET /workspaces/:workspaceId/members?view=compact`

### Project detail page

Needs:

- `GET /projects/:id`

### Project members tab

Needs:

- `GET /projects/:id/members`
- `POST /projects/:id/members`
- `DELETE /projects/:id/members/:uid`

### Project settings tab

Needs:

- `PATCH /projects/:id`
- `PATCH /projects/:id` with `status: ARCHIVED`
- `DELETE /projects/:id`

### Create issue page and issue filters

Even though issue CRUD is Phase 5, project option data must already support:

- `GET /projects?view=compact`
- `GET /projects?teamId=<teamId>&view=compact`

because issue creation and issue filtering depend on project selection.

## Out Of Scope For Phase 4

These should not block the first Phase 4 backend delivery:

- issue CRUD and issue lists inside the project tabs
- board/kanban persistence
- project activity feed
- roadmap timeline data
- cycle CRUD and sprint analytics
- custom workflow status persistence
- project permission matrix persistence
- project icon/logo upload field persistence if upload integration is not wired yet
- analytics beyond basic counts and progress

The current project detail UI already shows some of these shells. Those can remain mock or placeholder until later phases.

## Minimum Backend Deliverable

If the backend wants the smallest possible implementation that still unblocks the current frontend direction, this is the minimum set:

1. `POST /projects`
2. `GET /projects` with `q`, `cursor`, `limit`, `teamId`, `departmentId`, `status`, `visibility`, `view`
3. `GET /projects/:id`
4. `PATCH /projects/:id`
5. `DELETE /projects/:id`
6. `GET /projects/:id/members` with `q`, `cursor`, `limit`, `view`
7. `POST /projects/:id/members`
8. `DELETE /projects/:id/members/:uid`

## Backend Done-When Checklist

- [ ] Project can be created with team, lead, visibility, optional department, and optional members
- [ ] Backend auto-generates slug when frontend omits it
- [ ] Projects list supports search, filters, and cursor pagination
- [ ] Project detail is stable for direct `/projects/:id` loads
- [ ] Team and department filtered project lists work
- [ ] Project member list/add/remove works
- [ ] Private project visibility rules are enforced
- [ ] Archive and delete behaviors are distinct
- [ ] Response shapes match frontend `ApiResponse` and `ApiPaginatedResponse`
