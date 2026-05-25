# Phase 7 Frontend Label Integration Guide

This guide documents the frontend integration for Phase 7 labels and provides a production-grade test checklist.

Backend references:
- [phase7-labels-backend-contract.md](./phase7-labels-backend-contract.md)
- [build-phases.md](./build-phases.md)

Architecture constraints:
- [rules.md](../architecture/rules.md)

## Goal

Integrate backend-driven labels across issue surfaces with a modern, minimal, professional UI:
- no static hardcoded label catalogs
- consistent label chips across list/detail/create
- issue-level label add/remove flows
- inline label creation from picker

## Integrated UI Surfaces

1. Create Issue page (`/issues/create`)
- dynamic label picker from `GET /labels`
- search labels
- create new label inline
- select multiple labels
- attach selected labels after issue creation

2. Issue Detail page (`/issues/:id`)
- labels card with inline editor
- add/remove labels on the issue
- create label inline from picker

3. Issue Side Panel
- same label editor behavior as full page

4. Issues list row chips
- consistent modern chips via shared `LabelChip`

## API Routes Used

Label catalog:
- `GET /labels`
- `POST /labels`
- `PATCH /labels/:labelId`
- `DELETE /labels/:labelId` (available in hooks; UI delete flow can be added in admin label manager)

Issue label assignment:
- `POST /issues/:issueId/labels`
- `DELETE /issues/:issueId/labels/:labelId`

## Frontend Data/Hook Wiring

Implemented in `features/issues`:

- `useIssueLabels`
- `useCreateLabel`
- `useUpdateLabel`
- `useDeleteLabel`
- `useAttachIssueLabels`
- `useAttachIssueLabelsAny`
- `useRemoveIssueLabel`
- `useRemoveIssueLabelAny`

Service methods:
- `listLabels`
- `createLabel`
- `updateLabel`
- `deleteLabel`
- `attachIssueLabels`
- `removeIssueLabel`

## Types Added

- `IssueLabelRow`
- `ListLabelsInput`
- `CreateLabelInput`
- `UpdateLabelInput`
- `AttachIssueLabelsInput`
- `IssueSummary.labelObjects?: IssueLabelRow[]`

## UX Behavior Rules

- label picker shows existing selected labels as chips
- search is case-insensitive via backend query
- create option appears when no exact label match exists
- selecting an already-selected label removes it (toggle behavior)
- create issue flow:
  - create issue first
  - then attach selected label IDs
- if backend still returns legacy `labels: string[]`, UI falls back for display

## Error Handling

- all label mutations use standard toast errors from API message
- on mutation success, relevant issue/label queries invalidate and refresh
- expected backend codes:
  - `LABEL_NOT_FOUND`
  - `LABEL_ALREADY_EXISTS`
  - `LABEL_INVALID_COLOR`
  - `ISSUE_NOT_FOUND`
  - `FORBIDDEN`
  - `VALIDATION_ERROR`

## Visual System Notes

- shared chip component: `LabelChip`
- deterministic color identity by label name hash when color metadata isn’t available
- restrained palette and low-saturation treatment to match existing dark/light UI

## Manual Testing Guide

## A) Create Issue label flow

1. Open `/issues/create`.
2. Open Labels dropdown.
3. Verify labels load from backend.
4. Search for an existing label by partial query.
5. Select 2+ labels.
6. Submit issue.
7. Open created issue and verify all selected labels are attached.

Expected:
- no hardcoded labels shown
- selected chips persist after issue creation

## B) Inline label create

1. In create page label dropdown, enter a unique label name not present.
2. Click `Create "<name>"`.
3. Verify label is created and immediately selected.
4. Submit issue.

Expected:
- label exists in backend catalog afterwards
- issue contains the new label

## C) Issue Detail add/remove labels

1. Open `/issues/:id`.
2. In labels card, add an existing label.
3. Remove one attached label.

Expected:
- updates persist after page reload
- no duplicate label assignment

## D) Side Panel label parity

1. Open issue in side panel.
2. Add label.
3. Remove label.
4. Open same issue full page.

Expected:
- full page and side panel show identical labels

## E) Permission checks

1. Test as role without label mutation permission (if environment supports).
2. Attempt create/attach/remove.

Expected:
- backend returns forbidden
- UI shows clear error toast
- no local stale optimistic state

## F) Legacy compatibility safety

1. Validate issue lists still render chips if API returns `labels: string[]` only.
2. Validate detail editor works when `labelObjects` is present.

Expected:
- no crashes in either payload shape

## G) Regression checks

- comments/attachments still work
- issue status/priority/assignee updates unaffected
- create issue complexity dialog unaffected
- dark/light theme label chips readable in both modes

## Done Criteria

- [ ] Create page uses backend labels, not static constants
- [ ] Full page issue labels are add/remove/create capable
- [ ] Side panel labels are add/remove/create capable
- [ ] Label chips are visually consistent and professional
- [ ] Label mutations survive refresh and navigation
- [ ] Error/permission cases handled cleanly
- [ ] Manual test checklist passes
