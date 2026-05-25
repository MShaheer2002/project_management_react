# Phase 6 Backend Contract (Comments + Collaboration)

This document translates Phase 6 from [build-phases.md](./build-phases.md) into a production-grade backend contract that matches the current frontend UI and the expected Linear/Jira-style collaboration behavior.

Phase 0 through Phase 5 are assumed complete.

## Goal

Deliver the collaboration layer for issues:

- issue comments
- threaded replies
- `@mention` in comments
- issue-level activity timeline entries for collaboration events
- permission-safe edit/delete flows
- reliable pagination and optimistic UI support

This phase should make the Comments and Activity tabs in issue detail and side panel fully backend-driven.

## Frontend Surfaces Covered

Phase 6 backend must support all current UI surfaces that show comment/collaboration placeholders:

- full page issue detail: [IssueDetailPage.tsx](/Users/admin/Documents/project_management/project_management_react/src/pages/IssueDetailPage.tsx)
- issue side drawer: [ContextPanel.tsx](/Users/admin/Documents/project_management/project_management_react/src/components/ContextPanel.tsx)
- shared layout variant: [ContextPanel.tsx](/Users/admin/Documents/project_management/project_management_react/src/shared/components/layout/ContextPanel.tsx)

## In Scope (Phase 6)

- Create/list/edit/delete comments on issues
- Nested replies via `parentId`
- Mention parsing and mention notifications (`@displayName` or editor tokenized mention format)
- Issue activity items for comment created/edited/deleted and mention events
- Soft delete behavior for auditability
- Cursor pagination for comments and activity

## Out Of Scope (Phase 6)

- Realtime push (Socket.IO): Phase 9
- Global notifications inbox endpoints: Phase 8
- Emoji reactions, comment pinning, comment resolution status
- Full-text global comment search

## API Conventions

Reuse existing app conventions from Phase 5:

- authenticated routes
- workspace scoping via `X-Workspace-Id`
- standard success/error envelopes
- cursor pagination shape with `meta.cursor` and `meta.hasMore`

## Data Model

## `Comment`

Required fields:

- `id` (UUID, internal)
- `publicId` (optional external ID if needed by FE; FE can also use `id`)
- `workspaceId`
- `issueId`
- `authorId`
- `parentId` (nullable, self-reference)
- `body` (stored HTML or structured rich text payload)
- `bodyText` (plain text snapshot for mention parsing/search indexing)
- `mentionsCount` (denormalized optional)
- `isEdited` (boolean)
- `editedAt` (nullable)
- `deletedAt` (nullable for soft delete)
- `createdAt`
- `updatedAt`

Indexes:

- `(workspaceId, issueId, createdAt)`
- `(workspaceId, issueId, parentId, createdAt)`
- `(authorId, createdAt)`

## `CommentMention`

- `id`
- `workspaceId`
- `commentId`
- `issueId`
- `mentionedUserId`
- `mentionedByUserId`
- `createdAt`

Unique constraint:

- `(commentId, mentionedUserId)` to avoid duplicates from repeated parsing.

## `IssueActivity` (or unified `Activity`)

For issue timeline tab, must support these event types at minimum:

- `COMMENT_CREATED`
- `COMMENT_EDITED`
- `COMMENT_DELETED`
- `COMMENT_MENTIONED`

Payload fields should include:

- actor info
- issue identity
- comment identity
- optional `parentId`
- optional short excerpt

## Permissions

- `GUEST`, `MEMBER`, `ADMIN`, `OWNER` can create comments (as already planned in build phases)
- Author can edit own comment
- Author can delete own comment
- `ADMIN`/`OWNER` can delete any comment
- Non-author cannot edit others' comments
- Reply creation must obey same permission as top-level comments

## Business Rules (Production)

- Comment must belong to target issue and workspace
- `parentId` must reference a comment in same issue/workspace
- Maximum depth: recommended `3` (configurable) to avoid unbounded nesting abuse
- Empty comment is invalid after trimming plain text
- Mentioned users must be workspace members
- Mentioning self should not create notification
- Editing comment should recompute mentions:
  - newly added mentions create mention notifications/events
  - removed mentions should not retro-delete historical notifications
- Deleting parent comment should not hard-delete children by default
  - keep children attached to parent
  - return parent as `deleted` tombstone in list
- Soft-delete comment body replacement:
  - return placeholder text like `"This comment was deleted."`
  - preserve timestamps and author references for timeline integrity

## Endpoints

## 1) Create comment

`POST /issues/:issueId/comments`

Body:

```ts
type CreateCommentInput = {
  body: string;              // rich text html or serialized document
  bodyText?: string;         // optional plain text sent by FE
  parentId?: string | null;  // reply target
  clientRequestId?: string;  // idempotency for retry-safe UX
};
```

Response:

```ts
type CommentRow = {
  id: string;
  issueId: string;
  parentId?: string | null;
  body: string;
  bodyText?: string;
  isEdited: boolean;
  editedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  };
  mentions: Array<{ userId: string; name: string }>;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canReply: boolean;
  };
};
```

## 2) List issue comments

`GET /issues/:issueId/comments?cursor=<c>&limit=<n>&order=asc|desc`

Notes:

- Default `order=asc` for stable conversation rendering.
- Return flat list; frontend can build tree by `parentId`.
- Include deleted parent tombstones.

Response:

```ts
type ListCommentsResponse = {
  data: CommentRow[];
  meta: {
    total: number;
    cursor: string | null;
    hasMore: boolean;
  };
};
```

## 3) Update comment

`PATCH /comments/:commentId`

Body:

```ts
type UpdateCommentInput = {
  body: string;
  bodyText?: string;
};
```

Rules:

- author only
- set `isEdited=true`, `editedAt=now`
- recompute mentions diff

Response: updated `CommentRow`.

## 4) Delete comment

`DELETE /comments/:commentId`

Behavior:

- soft delete
- if parent has replies, keep row as deleted tombstone
- if leaf comment, still soft delete for audit consistency

Response:

```ts
{ success: true, data: { id: string; deletedAt: string } }
```

## 5) Issue activity for comments/collaboration

`GET /issues/:issueId/activity?cursor=<c>&limit=<n>`

This unblocks the issue Activity tab without waiting for full Phase 8 global activity.

Event shape:

```ts
type IssueActivityItem = {
  id: string;
  type: 'COMMENT_CREATED' | 'COMMENT_EDITED' | 'COMMENT_DELETED' | 'COMMENT_MENTIONED';
  actor: { id: string; name: string; avatar?: string | null };
  issueId: string;
  commentId?: string;
  targetUserId?: string; // for mention events
  message: string;       // preformatted timeline string
  createdAt: string;
};
```

## Mention Parsing Contract

Backend should not trust only frontend parsing.

Recommended approach:

1. FE sends rich content + optional structured mentions.
2. BE extracts mention tokens from canonical content.
3. BE validates mentioned users belong to workspace.
4. BE stores unique mention rows and emits notification records/events.

Supported mention inputs:

- `@username` plain text fallback
- structured editor nodes (preferred long-term)

## Validation and Errors

Codes to support:

- `COMMENT_NOT_FOUND`
- `COMMENT_PARENT_NOT_FOUND`
- `COMMENT_PARENT_CROSS_ISSUE`
- `COMMENT_TOO_DEEP`
- `COMMENT_EMPTY`
- `COMMENT_EDIT_FORBIDDEN`
- `COMMENT_DELETE_FORBIDDEN`
- `MENTION_USER_NOT_IN_WORKSPACE`
- `ISSUE_NOT_FOUND`
- `WORKSPACE_FORBIDDEN`

Use existing field error format for validation issues.

## Activity + Notification Integration

Phase 6 must emit domain events internally even if realtime is later:

- `comment.created`
- `comment.updated`
- `comment.deleted`
- `comment.mentioned`

Downstream usage:

- Phase 8 notification fanout (`MENTION`, `COMMENT_REPLY`, `COMMENT_ON_WATCHED_ISSUE`)
- Phase 9 socket broadcasting

## Performance and Reliability

- Limit comment body size (e.g. 20KB HTML payload, configurable)
- Cursor pagination required; avoid offset for large threads
- Idempotency support via `clientRequestId` for duplicate submit protection
- Sanitize HTML server-side (XSS-safe allowlist)
- Store plain-text projection for moderation/search

## Testing Requirements

Mandatory tests for Phase 6:

- create top-level comment
- create reply comment
- reject cross-issue parent
- author edit success, non-author edit forbidden
- author delete success, admin delete success, member delete forbidden (non-author)
- soft delete behavior with and without replies
- mention extraction and dedupe
- mention member validation
- comment list pagination + ordering
- issue activity includes comment events

## Done Criteria (Phase 6)

- [ ] Comments tab in full issue page is fully API-driven
- [ ] Comments tab in side/context panel is fully API-driven
- [ ] Threaded replies render correctly from API data
- [ ] Mentioning users in comments creates mention records and notification-ready events
- [ ] Edit/delete permissions enforced exactly
- [ ] Activity tab for issue loads collaboration events from backend
- [ ] APIs are paginated, validated, and workspace-safe
- [ ] All required tests pass

## Suggested Module Layout

```txt
modules/comment/
├── comment.routes.ts
├── comment.controller.ts
├── comment.service.ts
├── comment.schemas.ts
└── mention.service.ts

modules/issue/
└── issue-activity.routes.ts   # or extend existing issue routes for /issues/:id/activity
```

## Notes for Jira/Linear-Level Quality

- Keep immutable audit trail via soft delete + edited metadata.
- Enforce strict workspace isolation for every fetch and mutation.
- Use deterministic timeline ordering and stable IDs to avoid FE flicker.
- Keep permissions explicit in response (`canEdit`, `canDelete`, `canReply`) to simplify frontend correctness.
- Treat mentions as first-class collaboration entities, not regex-only UI sugar.
