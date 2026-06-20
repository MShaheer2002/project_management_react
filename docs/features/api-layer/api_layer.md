# API Layer — Frontend HTTP Infrastructure

> Complete guide for the Axios-based API client, interceptors, error handling middleware,
> and the public vs private API separation used across the Trussen frontend.

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                     │
│                                                                      │
│  Component ──→ Hook (TanStack Query) ──→ Service ──→ API Client      │
│                                                          │           │
│                                          ┌───────────────┤           │
│                                          │               │           │
│                                    ┌─────▼─────┐  ┌─────▼─────┐     │
│                                    │ publicApi  │  │ privateApi │     │
│                                    │ (no auth)  │  │ (+ token)  │     │
│                                    └─────┬─────┘  └─────┬─────┘     │
│                                          │               │           │
│                              Request Interceptors:       │           │
│                              - Workspace header          │           │
│                              - Auth token (Clerk)        │           │
│                                          │               │           │
│                              Response Interceptors:      │           │
│                              - 401 → token refresh/logout│           │
│                              - 403 → toast + redirect    │           │
│                              - 422 → validation errors   │           │
│                              - 429 → rate limit toast    │           │
│                              - 500 → generic error toast │           │
│                              - Network error → offline   │           │
│                                          │               │           │
└──────────────────────────────────────────┼───────────────┼───────────┘
                                           │               │
                                           ▼               ▼
                                    ┌─────────────────────────┐
                                    │    Backend API Server    │
                                    │  http://localhost:8000   │
                                    └─────────────────────────┘
```

---

## 2. Two API Instances

The app uses **two** Axios instances — one for unauthenticated calls, one for authenticated calls. This is cleaner than a single instance with conditional logic.

| Instance     | File                              | Auth Header | Use Case                              |
|--------------|-----------------------------------|-------------|---------------------------------------|
| `publicApi`  | `shared/services/publicApi.ts`    | Never       | Login, signup, password reset, health  |
| `privateApi` | `shared/services/privateApi.ts`   | Always      | All authenticated endpoints (/me, /issues, /workspaces, etc.) |

**Why two instances instead of one?**
- Public endpoints must NEVER accidentally send a token (security)
- Private endpoints must ALWAYS have a token (no silent failures)
- Interceptor logic is simpler — no "if token exists" branches
- Easier to test and mock independently

---

## 3. File Structure

```
src/shared/services/
├── publicApi.ts          # Axios instance for unauthenticated endpoints
├── privateApi.ts         # Axios instance for authenticated endpoints (Clerk token)
├── interceptors/
│   ├── authInterceptor.ts        # Injects Bearer token from Clerk
│   ├── workspaceInterceptor.ts   # Injects X-Workspace-Id header
│   ├── errorInterceptor.ts       # Handles all error responses globally
│   └── index.ts                  # Attaches all interceptors to an instance
└── types.ts              # ApiError, ApiResponse shared types
```

---

## 4. Shared Types

```
src/shared/services/types.ts
```

```ts
// Standard backend response wrapper
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

// Standard backend error response
export interface ApiError {
  success: false;
  error: {
    code: string;      // Machine-readable: "UNAUTHORIZED", "VALIDATION_ERROR", etc.
    message: string;   // Human-readable: "Email already exists"
    details?: Record<string, string[]>;  // Field-level validation errors
  };
}

// Axios error with typed response
export type ApiAxiosError = import('axios').AxiosError<ApiError>;
```

---

## 5. Public API Instance

```
src/shared/services/publicApi.ts
```

```ts
import axios from 'axios';
import { attachErrorInterceptor } from './interceptors';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Only error interceptor — no auth, no workspace
attachErrorInterceptor(publicApi);

export { publicApi };
```

**Used by:** `authService` (login, signup, forgot-password, etc.)

---

## 6. Private API Instance

```
src/shared/services/privateApi.ts
```

```ts
import axios from 'axios';
import { attachAllInterceptors } from './interceptors';

const privateApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// All interceptors: auth token, workspace header, error handling
attachAllInterceptors(privateApi);

export { privateApi };
```

**Used by:** All feature services (issueService, projectService, workspaceService, etc.)

---

## 7. Interceptors

### 7.1 — Auth Interceptor (Request)

Injects the Clerk session token into every private API request.

```
src/shared/services/interceptors/authInterceptor.ts
```

```ts
import { AxiosInstance } from 'axios';

// Clerk's getToken will be set by the ClerkTokenProvider at app startup
let _getToken: (() => Promise<string | null>) | null = null;

export function setClerkTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

export function attachAuthInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use(async (config) => {
    if (_getToken) {
      const token = await _getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });
}
```

**Why a setter instead of importing Clerk directly?**
- Axios instances are created at module level (before React renders)
- Clerk hooks only work inside React components
- The setter bridges the gap: a React component calls `setClerkTokenGetter` once at mount

### 7.2 — Workspace Interceptor (Request)

Injects the active workspace ID into every private API request.

```
src/shared/services/interceptors/workspaceInterceptor.ts
```

```ts
import { AxiosInstance } from 'axios';
import { useAuthStore } from '@/app/stores/useAuthStore';

export function attachWorkspaceInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const workspace = useAuthStore.getState().workspace;
    if (workspace?.id) {
      config.headers['X-Workspace-Id'] = workspace.id;
    }
    return config;
  });
}
```

**Reads from Zustand at call time** (not at mount time) — so switching workspaces is instant.

### 7.3 — Error Interceptor (Response)

Handles all backend error responses in one place. Individual services/hooks do NOT need try/catch for common errors.

```
src/shared/services/interceptors/errorInterceptor.ts
```

```ts
import { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import type { ApiError } from '../types';

export function attachErrorInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    // Success — pass through
    (response) => response,

    // Error — handle globally
    (error: AxiosError<ApiError>) => {
      const showToast = useToastStore.getState().showToast;

      // ── Network error (no response at all) ──
      if (!error.response) {
        showToast('Network error. Check your connection.', 'error');
        return Promise.reject(error);
      }

      const { status, data } = error.response;
      const errorCode = data?.error?.code;
      const errorMessage = data?.error?.message || 'Something went wrong';

      switch (status) {
        // ── 401 Unauthorized ──
        case 401:
          // Token expired or invalid → clear auth and redirect
          useAuthStore.getState().clear();
          // Don't toast on 401 — the redirect to /login is enough
          // But if this was a token refresh that failed, signOut via Clerk
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
          break;

        // ── 403 Forbidden ──
        case 403:
          if (errorCode === 'USER_NOT_SYNCED') {
            // Clerk user exists but backend hasn't received webhook yet
            // Don't toast — the caller will retry
          } else {
            showToast('You don\'t have permission to do that.', 'error');
          }
          break;

        // ── 404 Not Found ──
        case 404:
          // Let the caller handle this — might be expected (e.g., checking if slug exists)
          break;

        // ── 409 Conflict ──
        case 409:
          showToast(errorMessage, 'error');
          break;

        // ── 422 Validation Error ──
        case 422:
          // Don't toast — let the form display field-level errors
          // The error.response.data.error.details has per-field messages
          break;

        // ── 429 Rate Limited ──
        case 429:
          showToast('Too many requests. Please wait a moment.', 'error');
          break;

        // ── 500+ Server Error ──
        default:
          if (status >= 500) {
            showToast('Server error. Please try again later.', 'error');
          }
          break;
      }

      return Promise.reject(error);
    }
  );
}
```

### 7.4 — Barrel Export + Attach All

```
src/shared/services/interceptors/index.ts
```

```ts
import { AxiosInstance } from 'axios';
import { attachAuthInterceptor } from './authInterceptor';
import { attachWorkspaceInterceptor } from './workspaceInterceptor';
import { attachErrorInterceptor } from './errorInterceptor';

export { setClerkTokenGetter } from './authInterceptor';
export { attachErrorInterceptor };

export function attachAllInterceptors(instance: AxiosInstance) {
  // Order matters:
  // 1. Auth token (must be first — adds Authorization header)
  attachAuthInterceptor(instance);
  // 2. Workspace header (needs auth to be set first conceptually)
  attachWorkspaceInterceptor(instance);
  // 3. Error handling (response interceptor — runs on every error)
  attachErrorInterceptor(instance);
}
```

---

## 8. Clerk Token Bridge

Since Clerk hooks only work inside React, we need a small component that bridges
Clerk's `getToken` into the Axios interceptor system.

```
src/app/providers/ClerkTokenBridge.tsx
```

```tsx
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setClerkTokenGetter } from '@shared/services/interceptors';

export const ClerkTokenBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken } = useAuth();

  useEffect(() => {
    setClerkTokenGetter(getToken);
  }, [getToken]);

  return <>{children}</>;
};
```

**Placement in main.tsx:**
```tsx
<ClerkProvider publishableKey={CLERK_KEY}>
  <ClerkTokenBridge>          {/* ← bridges Clerk → Axios */}
    <QueryClientProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </ClerkTokenBridge>
</ClerkProvider>
```

---

## 9. How Feature Services Use the API

### 9.1 — Auth Service (public endpoints — no token)

```ts
// features/auth/services/authService.ts
import { publicApi } from '@shared/services/publicApi';

export const authService = {
  // These don't need auth — Clerk handles the actual auth
  // This is only for backend endpoints that are public
  checkSlugAvailable: (slug: string) =>
    publicApi.get<ApiResponse<{ available: boolean }>>(`/workspaces/check-slug/${slug}`).then(r => r.data.data),
};
```

### 9.2 — Workspace Service (private endpoints — token auto-injected)

```ts
// features/workspaces/services/workspaceService.ts
import { privateApi } from '@shared/services/privateApi';

export const workspaceService = {
  create: (data: { name: string; slug: string }) =>
    privateApi.post<ApiResponse<Workspace>>('/workspaces', data).then(r => r.data.data),

  getMyWorkspaces: () =>
    privateApi.get<ApiResponse<Workspace[]>>('/workspaces').then(r => r.data.data),
};
```

### 9.3 — Issue Service (private + workspace-scoped)

```ts
// features/issues/services/issueService.ts
import { privateApi } from '@shared/services/privateApi';

export const issueService = {
  // X-Workspace-Id header is auto-injected by workspace interceptor
  getAll: () =>
    privateApi.get<ApiResponse<Issue[]>>('/issues').then(r => r.data.data),

  getById: (id: string) =>
    privateApi.get<ApiResponse<Issue>>(`/issues/${id}`).then(r => r.data.data),

  create: (data: CreateIssueInput) =>
    privateApi.post<ApiResponse<Issue>>('/issues', data).then(r => r.data.data),
};
```

---

## 10. Error Handling in Hooks

The error interceptor handles global concerns (401 redirect, 429 toast, 500 toast).
Feature hooks handle **feature-specific** errors:

```ts
// features/issues/hooks/useCreateIssue.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueService } from '../services/issueService';
import { useToastStore } from '@/app/stores';
import type { ApiAxiosError } from '@shared/services/types';

export const useCreateIssue = () => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: issueService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      showToast('Issue created', 'success');
    },
    onError: (error: ApiAxiosError) => {
      // 422 validation errors — interceptor skipped the toast, so handle here
      if (error.response?.status === 422) {
        const details = error.response.data?.error?.details;
        if (details) {
          // Set form errors via React Hook Form
          return;
        }
      }
      // Other errors already toasted by interceptor — don't double-toast
    },
  });
};
```

**Rule: Never toast in both the interceptor AND the hook for the same error.**

---

## 11. Request/Response Flow Summary

### Public API call (e.g., check slug availability):
```
Component → Hook → authService.checkSlugAvailable('acme')
  → publicApi.get('/workspaces/check-slug/acme')
    → [NO auth interceptor]
    → [NO workspace interceptor]
    → [error interceptor handles network/500 errors]
  ← { success: true, data: { available: true } }
```

### Private API call (e.g., fetch issues):
```
Component → Hook → issueService.getAll()
  → privateApi.get('/issues')
    → [auth interceptor] adds: Authorization: Bearer eyJ...
    → [workspace interceptor] adds: X-Workspace-Id: ws_abc123
    → [error interceptor] ready to catch errors
  ← { success: true, data: [ ...issues ] }
```

### Private API error (e.g., expired token):
```
Component → Hook → issueService.getAll()
  → privateApi.get('/issues')
    → [auth interceptor] adds stale token
    → Backend returns 401
    → [error interceptor]:
        - Clears useAuthStore
        - Redirects to /login
    → Promise.reject(error)
  ← Hook receives error, but user is already redirected
```

---

## 12. Environment Variables

Env vars are injected via `vite.config.ts` `define` (not `VITE_` prefix). Access them as `process.env.VAR_NAME`.

| Variable                 | Required | Default                 | Access via                        | Description              |
|--------------------------|----------|-------------------------|-----------------------------------|--------------------------|
| `BASE_URL`               | Yes      | `http://localhost:8000` | `process.env.BASE_URL`            | Backend API base URL     |
| `CLERK_PUBLISHABLE_KEY`  | Yes      | —                       | `process.env.CLERK_PUBLISHABLE_KEY` | Clerk publishable key  |
| `GEMINI_API_KEY`         | No       | —                       | `process.env.GEMINI_API_KEY`      | Google Gemini AI key     |

---

## 13. Rules Recap

| Rule | Enforced by |
|---|---|
| Public endpoints never send tokens | `publicApi` has no auth interceptor |
| Private endpoints always send tokens | `privateApi` auth interceptor runs on every request |
| Workspace ID auto-injected | `workspaceInterceptor` reads from Zustand |
| 401 → redirect to login | `errorInterceptor` clears store + redirects |
| 422 → no global toast (form handles it) | `errorInterceptor` explicitly skips |
| 429 → rate limit toast | `errorInterceptor` shows toast |
| 500 → server error toast | `errorInterceptor` shows toast |
| No `fetch()` anywhere | Rule R4.5 — all calls go through Axios instances |
| No feature creates its own Axios instance | Rule R13.8 — use `publicApi` or `privateApi` |
