# Phase 4 Frontend Project UI Test Guide

This guide explains how to validate the Phase 4 project integration in the frontend UI.

Use this together with:

- [phase-4-frontend-project-integration-guide.md](./phase-4-frontend-project-integration-guide.md)
- [../../setup/phase4-backend-contract.md](../../setup/phase4-backend-contract.md)

This is a UI validation guide, not a backend setup guide.

## Goal

Confirm that the frontend project surfaces are reading and mutating real Phase 4 backend data instead of relying on mock project data.

The main UI surfaces to validate are:

- `/projects`
- `/projects/:id`
- create project modal
- project member management flows
- project references inside team and department pages
- project selection dependencies used by issue creation and filtering

## Prerequisites

Before testing:

- frontend app is running with the correct `BASE_URL`
- backend is running with the Phase 4 project module enabled
- backend migrations are applied
- Phase 3 team and department APIs are already working
- you can sign in and reach a workspace
- the active workspace is selected correctly

Recommended test users:

- `OWNER` or `ADMIN` for full coverage
- `MEMBER` for create-project and restricted edit coverage
- `GUEST` for private visibility checks

## Required Backend Endpoints

These UI checks depend on:

- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`
- `DELETE /projects/:id`
- `GET /projects/:id/members`
- `POST /projects/:id/members`
- `DELETE /projects/:id/members/:uid`

These existing Phase 3 endpoints are also required by the project modal:

- `GET /teams?view=compact`
- `GET /departments?view=compact`
- `GET /workspaces/:workspaceId/members?view=compact`

These project option dependencies should work for issue-related screens once wired:

- `GET /projects?view=compact`
- `GET /projects?teamId=<teamId>&view=compact`

## Smoke Test

1. Sign in and confirm the app lands inside a valid workspace.
2. Open `/projects`.
3. Confirm the page loads without a 4xx/5xx error.
4. Open a project detail page from the list.
5. Refresh directly on `/projects/:id`.

Expected result:

- the projects page loads from the backend
- project detail works on direct refresh
- the app does not need a prior navigation step to resolve `/projects/:id`

## Projects List

### 1. Directory Load

1. Open `/projects`
2. Confirm project cards render
3. Confirm each card shows:
   - project name
   - description
   - team label
   - issue count
   - progress

Expected result:

- data comes from `GET /projects?view=full`
- cards match backend data for name, team, counts, and status/progress-related fields

### 2. Search

1. Use the project search input
2. Search by project name
3. Search by a partial name
4. Clear the search

Expected result:

- search is server-backed
- the list updates to matching projects only
- clearing search restores the full visible project list

### 3. Team Scope

1. Open a team page that links to a project list scope, or open `/projects?team=<teamId>` if that flow exists in the app
2. Confirm the list shows only projects for that team
3. Confirm the UI shows the team scope label when appropriate

Expected result:

- project list is filtered correctly by team
- scope label and result set agree with each other

### 4. Pagination

1. Seed more than one page of projects in the workspace
2. Trigger the list’s pagination behavior if available
   - load more
   - infinite scroll
   - cursor-driven fetch in devtools/network

Expected result:

- pagination uses backend cursor semantics
- no duplicate project cards appear
- existing cards remain stable while more rows append

If the current UI does not yet expose a visible load-more control, this check can be verified through the integrated query behavior and network requests.

## Create Project Modal

### 1. Open and Load Dependencies

1. Open `/projects`
2. Click `New Project`
3. Confirm the modal opens
4. Open these pickers one by one:
   - Team
   - Department
   - Project Lead
   - Members

Expected result:

- team picker loads from `GET /teams?view=compact`
- department picker loads from `GET /departments?view=compact`
- lead and member pickers load from workspace member option endpoints

### 2. Search Pickers

1. Search inside the Team picker
2. Search inside the Department picker
3. Search inside the Lead picker
4. Search inside the Members picker
5. Select values in each picker

Expected result:

- all picker searches are server-backed
- selected values appear in the trigger button after selection
- recent selections appear on repeated opens

### 3. Create Flow

1. Enter a project name
2. Enter a description
3. Select a team
4. Optionally select a department
5. Select a lead
6. Add members
7. Set visibility
8. Set start/target dates if supported
9. Toggle feature flags
10. Submit

Expected result:

- frontend sends `POST /projects`
- slug is not required in UI
- backend creates the project successfully
- modal closes
- project appears in `/projects`
- opening the new project shows the same data returned by the backend

### 4. Create Guard Rails

Test these cases:

- submit without project name
- submit without team
- submit without lead
- create duplicate project name in same workspace
- choose an invalid lead or invalid team through a forced request

Expected result:

- missing required fields are blocked in UI
- duplicate name shows usable field or toast error
- invalid backend references surface an error instead of silent failure

## Project Detail Page

### 1. Header and Overview

1. Open a project detail page
2. Confirm the header renders:
   - project name
   - updated date
3. Confirm overview renders:
   - description
   - progress card
   - team card

Expected result:

- `GET /projects/:id` drives the project detail shell
- overview values match backend detail payload

### 2. Direct URL Refresh

1. Copy a `/projects/:id` URL
2. Open it in a new tab
3. Refresh the page

Expected result:

- the project still loads correctly
- no prior page navigation is required

### 3. Private Project Visibility

1. Create or use a private project
2. Access it as an allowed user
3. Access it as a disallowed user, especially `GUEST`

Expected result:

- allowed users can open the detail page
- disallowed users do not see the project in lists
- direct access should resolve as hidden/not found behavior, not data leakage

## Project Members

### 1. Members List

1. Open a project detail page
2. Open the `Members` tab
3. Confirm the current project members load

Expected result:

- members tab uses `GET /projects/:id/members`
- lead/member distinctions are reflected correctly if the UI shows them

### 2. Add Members

1. Use the project add-member action if present
2. Search for one or more workspace members
3. Add them

Expected result:

- frontend sends `POST /projects/:id/members`
- newly added members appear in the members tab after refresh/invalidation

### 3. Remove Members

1. Remove a non-lead project member
2. Refresh the page

Expected result:

- frontend sends `DELETE /projects/:id/members/:uid`
- removed member no longer appears

## Project Settings

### 1. General Settings

1. Open the `Settings` tab on a project
2. Change:
   - name
   - description
   - lead
   - visibility
3. Save

Expected result:

- frontend sends `PATCH /projects/:id`
- changes persist after refresh
- detail header and list card reflect the updated values

### 2. Archive vs Delete

1. Archive a project
2. Confirm it is no longer treated like an active project
3. Delete a separate test project

Expected result:

- archive is a status change, not deletion
- delete is destructive and removes the project from visible lists
- the two actions are not treated as the same backend operation

## Team and Department Cross-Checks

### 1. Team Detail Project Tab

1. Open a team detail page
2. Open the projects tab or project card area

Expected result:

- projects shown there match `GET /projects?teamId=<teamId>&view=full`

### 2. Department Detail Project Tab

1. Open a department detail page
2. Open the projects tab

Expected result:

- projects shown there match `GET /projects?departmentId=<departmentId>&view=full`

## Issue Dependency Checks

These do not require full Phase 5 issue integration, but project option data should still work.

### 1. Create Issue Project Selection

1. Open the create issue screen
2. Open the project selector
3. Confirm active projects are available

Expected result:

- project picker can be backed by `GET /projects?view=compact`
- team-scoped issue creation can use `GET /projects?teamId=<teamId>&view=compact`

### 2. Project-Scoped Issue View

1. Open a project detail page
2. Open the `Issues` tab
3. Confirm the route and page can scope issue UI to the current project

Expected result:

- the project shell passes the correct project context
- do not fail Phase 4 solely because issue CRUD is still in Phase 5

## Permission Checks

Run these quick checks with different users:

- `OWNER`: full project access
- `ADMIN`: full project access
- `MEMBER`: create project, view allowed projects, restricted destructive actions if policy requires
- `GUEST`: only non-private allowed project visibility

Expected result:

- create/edit/delete/archive actions only appear for allowed roles
- server still denies unauthorized attempts even if forced manually

## Out of Scope For Phase 4 UI Validation

Do not fail Phase 4 integration if these are still placeholder, shell-only, or mock-backed:

- issue CRUD inside project tabs
- board persistence
- roadmap backend data
- activity feed backend data
- cycle analytics
- custom workflow persistence
- project permission matrix persistence

These can exist in the UI already without being true Phase 4 blockers.

## Troubleshooting

If the UI does not behave as expected, check:

- active workspace is selected correctly
- `X-Workspace-Id` is present on all project requests
- list responses use top-level `meta`
- project create/update responses include lead, team, department, stats, and features in the expected shape
- private project access is not leaking data through list endpoints

Common response branches to verify:

- `401` unauthenticated
- `403` forbidden
- `404` missing or hidden project
- `409` uniqueness conflict
- `422` validation error

## Frontend Done-When Checklist

- [ ] `/projects` loads from real backend data
- [ ] project search is server-backed
- [ ] team-scoped project lists work
- [ ] create project modal uses real team/department/member option queries
- [ ] project create works without slug input
- [ ] `/projects/:id` works on direct refresh
- [ ] project settings persist through `PATCH /projects/:id`
- [ ] project members list/add/remove works
- [ ] archive and delete are distinct UI flows
- [ ] private projects do not leak to unauthorized users
- [ ] issue/project dependency selectors can consume compact project lists
