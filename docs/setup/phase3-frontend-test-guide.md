# Phase 3 Frontend Test Guide

This guide is for validating the Phase 3 frontend integration for:

- teams
- departments
- team membership management
- department membership management
- search pickers
- cursor pagination

Use it after the frontend and backend are both running.

## Prerequisites

- Frontend app is running with the correct `BASE_URL`
- Backend is running with the Phase 3 `team` and `department` modules enabled
- Backend migrations are applied
- You can sign in and reach a workspace
- The active workspace is selected correctly

Recommended test users:

- `OWNER` or `ADMIN` for full CRUD coverage
- `MEMBER` for team-create and restricted-access checks
- `GUEST` for private visibility checks

## Required Backend Endpoints

These frontend flows depend on:

- `GET /sidebar`
- `GET /workspaces`
- `GET /workspaces/:workspaceId/members`
- `GET /teams`
- `GET /teams/:id`
- `GET /teams/:id/members`
- `POST /teams`
- `PATCH /teams/:id`
- `DELETE /teams/:id`
- `POST /teams/:id/members`
- `DELETE /teams/:id/members/:uid`
- `GET /departments`
- `GET /departments/:id`
- `GET /departments/:id/members`
- `POST /departments`
- `PATCH /departments/:id`
- `DELETE /departments/:id`
- `POST /departments/:id/members`
- `DELETE /departments/:id/members/:uid`

## Smoke Test

1. Sign in and confirm the app lands in a valid workspace.
2. Open `/teams`.
3. Open `/departments`.
4. Confirm both pages load without mock data.
5. Confirm the create buttons match the current user role.

Expected result:

- `OWNER` and `ADMIN` can create departments and teams
- `MEMBER` can create teams but not departments
- `GUEST` should not get management actions

## Teams

### 1. Team Directory

1. Open `/teams`
2. Confirm the list loads from the backend
3. Search by team name
4. Change visibility filter
5. If more than 12 rows exist, use `Load more`

Expected result:

- Search is server-backed
- Visibility filter is server-backed
- Pagination appends more rows

### 2. Create Team

1. Click `Create Team`
2. Enter a team name and description
3. Open the lead picker
4. Search for a workspace member
5. Open the department picker
6. Search for a department or leave it empty
7. Open the members picker
8. Search and select multiple members
9. Submit

Expected result:

- Team is created successfully
- Modal closes
- Team appears in `/teams`
- Team appears in the sidebar team list
- Recent picks appear in the create dialog next time

### 3. Team Detail

1. Open a team from `/teams`
2. Confirm header data loads
3. Confirm counts render for members, projects, and issues
4. Search within the members tab
5. Use `Load more` if there are many members

Expected result:

- `GET /teams/:id` drives the header
- `GET /teams/:id/members` drives the member table

### 4. Team Membership

1. Open the `Add members` popover
2. Search and select one or more workspace members
3. Add them
4. Remove a non-lead member

Expected result:

- Added members appear in the list
- Removed members disappear from the list
- Sidebar and related queries refresh

### 5. Team Settings

1. Open the team settings tab as `OWNER`, `ADMIN`, or team lead
2. Change the name
3. Change the lead
4. Change visibility
5. Save

Expected result:

- Changes persist after refresh
- New lead is auto-added to the team if not already a member

### 6. Team Guard Rails

Test these cases:

- create a duplicate team name
- choose an invalid lead
- remove the current lead from the team

Expected result:

- duplicate name shows field-level error
- invalid lead shows field-level error
- removing the current lead is blocked until lead is reassigned

## Departments

### 1. Department Directory

1. Open `/departments`
2. Confirm the list loads from the backend
3. Search by department name
4. Change visibility filter
5. Switch between grid and list view
6. If more than 12 rows exist, use `Load more`

Expected result:

- Search is server-backed
- Pagination appends more rows
- Both views show the same backend data

### 2. Create Department

1. Click `Create Department`
2. Enter a department name and description
3. Pick a head or leave empty
4. Pick a color
5. Add initial members
6. Optionally mark it as default
7. Submit

Expected result:

- Department is created successfully
- Modal closes
- Department appears in `/departments`
- Recent picks appear in the create dialog next time

### 3. Department Detail

1. Open a department from `/departments`
2. Confirm overview stats load
3. Open the members tab
4. Open the teams tab

Expected result:

- `GET /departments/:id` drives overview and settings data
- `GET /departments/:id/members` drives the members tab
- `GET /teams?departmentId=<id>` drives the teams tab

### 4. Department Membership

1. Open the `Add members` popover
2. Search and add one or more workspace members
3. Remove a non-head member

Expected result:

- Added members appear immediately
- Removed members disappear immediately

### 5. Department Settings

1. Open the settings tab as `OWNER`, `ADMIN`, or department head
2. Rename the department
3. Change the head
4. Change visibility
5. Change the color
6. Toggle default department
7. Save

Expected result:

- Changes persist after refresh
- New head is auto-added to the department if not already a member
- Only one department remains default at a time

### 6. Department Guard Rails

Test these cases:

- create a duplicate department name
- choose an invalid head
- remove the current head from the department

Expected result:

- duplicate name shows field-level error
- invalid head shows field-level error
- removing the current head is blocked until head is reassigned

## Permission Checks

Run these quick checks with different users:

- `OWNER`: full access
- `ADMIN`: full Phase 3 access
- `MEMBER`: can create team, cannot create department
- `GUEST`: cannot manage private resources

Expected result:

- private teams and departments should resolve as hidden/not found for guests
- settings and destructive actions should only appear to allowed users

## Picker Checks

Verify these in both create dialogs and detail-page popovers:

- search is server-backed
- results are compact rows: name, email, role
- recent 3 picks are shown
- long result sets use `Load more`
- popovers overlay the parent container without resizing the modal/page

## Troubleshooting

### `500` on `/teams` or `/departments`

Usually means the backend build is not on the expected Phase 3 schema/module version.

Check:

- Phase 3 team and department modules are deployed
- Prisma migrations are applied
- backend can query team and department relations correctly

### Picker search does not work

Check:

- `GET /workspaces/:workspaceId/members` supports `q`, `cursor`, `limit`, `sort`, and `view`
- the frontend is sending the correct active workspace header

### Sidebar does not refresh after create/update

Check:

- `/sidebar` returns the updated team list
- the active workspace is correct

### Guest can still see private resource

Check:

- backend returns `404 PRIVATE_TEAM_FORBIDDEN` or `404 PRIVATE_DEPARTMENT_FORBIDDEN`
- frontend is using the active workspace and signed-in user you expect

## Done When

- Teams page loads from backend
- Departments page loads from backend
- Team create works
- Department create works
- Team detail works
- Department detail works
- Team membership add/remove works
- Department membership add/remove works
- Search pickers work with large datasets
- Pagination works for list pages and member tables
- Role-based actions appear only for allowed users
