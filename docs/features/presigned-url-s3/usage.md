# Presigned Uploads — Frontend Usage Guide

> This doc explains how to use the reusable upload feature that wraps the presigned S3 flow in this frontend.
> Read this together with [frontend-integration.md](./frontend-integration.md), which describes the backend contract.

---

## 1. Where the Upload Feature Lives

The reusable upload domain is implemented as its own feature:

```text
src/features/upload/
├── hooks/
│   └── useUploadMutations.ts
├── services/
│   └── uploadService.ts
├── index.ts
└── types.ts
```

Public API:

```ts
import {
  uploadKindAccept,
  uploadService,
  usePresignUploadFile,
  usePresignUploadFiles,
  useUploadFile,
  useUploadFiles,
  useUploadPreparedFile,
} from '@features/upload';
```

---

## 2. Architecture Rules

This feature is designed to follow `docs/architecture/rules.md`.

### Use this from components

Components should use the exported hooks:

- `useUploadFile()`
- `useUploadFiles()`
- `usePresignUploadFile()`
- `usePresignUploadFiles()`
- `useUploadPreparedFile()`

### Use this from hooks or service orchestration

If a feature needs a composed flow like:

1. upload file
2. call another mutation
3. map errors into feature-specific UI

that logic should live in that feature's hook or service layer, not inline in the page.

In those cases, use:

- `uploadService`

### Do not do this

- do not import `src/features/upload/services/uploadService.ts` directly by path
- do not call the upload backend from page components with raw Axios
- do not send files directly to `/uploads/presigned-url`

Only import from:

```ts
import { ... } from '@features/upload';
```

---

## 3. Exported Types and Helpers

### Upload kinds

```ts
type UploadKind = 'workspace-logo' | 'avatar' | 'attachment' | 'video';
```

### File input helper

Use `uploadKindAccept` for file inputs:

```ts
import { uploadKindAccept } from '@features/upload';
```

Examples:

- `uploadKindAccept['workspace-logo']` -> `image/*`
- `uploadKindAccept.avatar` -> `image/*`
- `uploadKindAccept.attachment` -> `image/*,video/*`
- `uploadKindAccept.video` -> `video/*`

### Final upload result

Successful uploads return:

```ts
interface UploadedFileReference {
  clientId: string;
  fileName: string;
  contentType: string;
  size: number;
  kind: UploadKind;
  key: string;
  assetUrl: string | null;
  reference: string; // assetUrl ?? key
}
```

Use:

- `assetUrl` when the next feature needs a public URL
- `key` when the backend stores internal object references
- `reference` when the feature can accept either

---

## 4. Main APIs

### `useUploadFile()`

Use when the UI uploads one file and wants the full flow:

1. presign
2. direct S3 upload
3. final uploaded reference

```ts
const uploadFile = useUploadFile();
```

Input:

```ts
{
  file: File;
  kind: 'workspace-logo' | 'avatar' | 'attachment' | 'video';
  clientId?: string;
  signal?: AbortSignal;
  onProgress?: (progress) => void;
}
```

### `useUploadFiles()`

Use when the UI uploads multiple selected files in one action.

```ts
const uploadFiles = useUploadFiles();
```

Input:

```ts
{
  files: Array<{
    file: File;
    kind: UploadKind;
    clientId?: string;
  }>;
  signal?: AbortSignal;
  onFileProgress?: ({ clientId, loaded, total, percent }) => void;
}
```

### `usePresignUploadFile()` and `usePresignUploadFiles()`

Use these only when the flow needs two separate steps in the UI:

1. prepare uploads first
2. upload later

That is useful when the app needs to:

- show a review step after presign
- keep upload instructions temporarily in local state
- upload only a subset of prepared files

### `useUploadPreparedFile()`

Use when a file is already presigned and should now be uploaded.

---

## 5. Recommended Usage Pattern

For most screens, use this pattern:

1. keep selected `File` in local component state
2. call `useUploadFile()` or `useUploadFiles()`
3. on success, send the returned `key` or `assetUrl` to the feature's real mutation
4. if that follow-up mutation fails, keep the upload result in state for retry

This matches the backend guide and keeps upload state local to the owning screen.

---

## 6. Single File Example

Example: workspace logo upload flow.

```tsx
import React, { useState } from 'react';
import { useUploadFile, uploadKindAccept } from '@features/upload';
import { useUpdateWorkspace } from '@features/workspace';

export const WorkspaceLogoField: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const uploadFile = useUploadFile();
  const updateWorkspace = useUpdateWorkspace();

  const handleSubmit = async () => {
    if (!file) return;

    const uploaded = await uploadFile.mutateAsync({
      file,
      kind: 'workspace-logo',
      onProgress: (event) => setProgress(event.percent),
    });

    if (!uploaded.assetUrl) {
      throw new Error('Workspace logo requires assetUrl but backend returned only key.');
    }

    await updateWorkspace.mutateAsync({
      logo: uploaded.assetUrl,
    });
  };

  return (
    <div>
      <input
        type="file"
        accept={uploadKindAccept['workspace-logo']}
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <button onClick={handleSubmit} disabled={!file || uploadFile.isPending || updateWorkspace.isPending}>
        Save logo
      </button>
      {progress !== null && <span>{progress}%</span>}
    </div>
  );
};
```

---

## 7. Multiple File Example

Example: issue attachments.

```tsx
import React, { useState } from 'react';
import { useUploadFiles, uploadKindAccept } from '@features/upload';

export const AttachmentUploader: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progressById, setProgressById] = useState<Record<string, number | null>>({});

  const uploadFiles = useUploadFiles();

  const handleUpload = async () => {
    const uploaded = await uploadFiles.mutateAsync({
      files: files.map((file, index) => ({
        file,
        kind: file.type.startsWith('video/') ? 'video' : 'attachment',
        clientId: `attachment-${index}`,
      })),
      onFileProgress: ({ clientId, percent }) => {
        setProgressById((current) => ({
          ...current,
          [clientId]: percent,
        }));
      },
    });

    // Next step:
    // send uploaded.map(item => ({ key: item.key, assetUrl: item.assetUrl })) to the real attachment endpoint
    console.log(uploaded);
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept={uploadKindAccept.attachment}
        onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
      />
      <button onClick={handleUpload} disabled={files.length === 0 || uploadFiles.isPending}>
        Upload files
      </button>
    </div>
  );
};
```

---

## 8. When to Use `assetUrl` vs `key`

This is the most important integration detail.

### Use `assetUrl`

Use `assetUrl` when the next backend mutation expects a public URL.

Example:

- workspace logo field stored as URL
- avatar field stored as URL

### Use `key`

Use `key` when the backend stores an internal upload reference and resolves the file later.

Example:

- attachment records
- future private-file flows

### Handle `assetUrl: null`

If `assetUrl` is `null`:

- the upload still succeeded
- the file exists in object storage
- only the public URL is unavailable

Do not treat that as an upload failure.

Instead:

- use `key` when the downstream API accepts it
- block only when the downstream API strictly requires a URL

---

## 9. Progress and Cancellation

### Progress

Single file:

```ts
onProgress: ({ loaded, total, percent }) => {
  // update local UI
}
```

Multi file:

```ts
onFileProgress: ({ clientId, loaded, total, percent }) => {
  // update local UI per file
}
```

### Cancellation

Use `AbortController` if the screen supports canceling an upload:

```ts
const controller = new AbortController();

await uploadFile.mutateAsync({
  file,
  kind: 'avatar',
  signal: controller.signal,
});

controller.abort();
```

Keep the controller in local component state or a feature-specific hook.
Do not put it in global stores.

---

## 10. Error Handling Guidance

### Presign endpoint errors

Use the normal backend error helpers already used elsewhere in the app:

```ts
import { getApiErrorCode, getApiErrorMessage } from '@shared/services';
```

Recommended handling:

- `UPLOAD_TYPE_NOT_ALLOWED` -> show file type validation message
- `UPLOAD_FILE_TOO_LARGE` -> show file size validation message
- `NOT_WORKSPACE_MEMBER` -> block the action
- `INSUFFICIENT_ROLE` -> show permission message
- `UNAUTHORIZED` -> trigger auth refresh flow

### Direct S3 upload errors

These are infrastructure or transport failures, not normal business validation.

Typical causes:

- expired presigned URL
- bucket CORS issue
- network interruption
- mismatched content type

Recommended handling:

1. show a retry message
2. request a fresh presigned URL
3. do not reuse the expired upload URL

---

## 11. Good Integration Boundaries

### Good

- `features/workspace` uses `useUploadFile()` for workspace logo UI
- `features/profile` uses `useUploadFile()` for avatar UI
- `features/issues` uses `useUploadFiles()` for attachments
- a feature-specific hook composes `uploadService` with another mutation

### Bad

- a page imports Axios and calls `/uploads/presigned-url` directly
- a component imports `features/upload/services/uploadService.ts` by path
- upload progress is stored in a global app store
- the app stores the temporary `uploadUrl` as the final file URL

---

## 12. Suggested Next Integrations

The upload feature is now reusable. The most natural next integrations are:

1. workspace logo in settings
2. user avatar/profile image
3. issue attachments
4. project attachments or video uploads

Use the same upload feature public API for each one.
