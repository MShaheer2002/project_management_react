# Auth — Frontend Integration Guide (Clerk + Custom UI)

> How the Trussen frontend integrates with Clerk using **custom UI only** — no Clerk prebuilt components.
> This doc is the blueprint. Read it fully before touching code.

---

## 1. Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                            │
│                                                                    │
│  Custom Auth Pages ──→ Clerk Headless SDK ──→ Session Token        │
│  (LoginPage.tsx, etc.)  (useSignIn, useSignUp)   (via getToken())  │
│                                                    │               │
│  useAuthStore (Zustand) ◄──── syncs from ────► Clerk useUser()     │
│  (currentUser, org, role)                                          │
│                                                    │               │
│  shared/services/api.ts ◄──── Bearer token ◄───────┘               │
│        │                                                           │
│        ▼                                                           │
│  TanStack Query hooks ──→ Backend API (/me, /workspaces, etc.)     │
└────────────────────────────────────────────────────────────────────┘
```

**Key principles:**
- Clerk owns auth state (passwords, OAuth, sessions, 2FA, email verification)
- Our custom UI forms call Clerk's **headless hooks** (`useSignIn`, `useSignUp`)
- We do NOT use any `<SignIn />`, `<SignUp />`, or `<UserButton />` Clerk components
- `useAuthStore` (Zustand) mirrors Clerk state for use across the app
- The backend only stores user profile data synced via Clerk webhooks
- Every API call uses `getToken()` from Clerk, injected via Axios interceptor

---

## 2. Dependencies

```bash
npm install @clerk/clerk-react
```

**Environment variable (already in `.env.example`):**
```env
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

Accessed as `process.env.CLERK_PUBLISHABLE_KEY` (injected via `vite.config.ts` `define`).

---

## 3. Provider Setup

### 3.1 — Wrap app in ClerkProvider

```
src/main.tsx
```

```tsx
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@shared/lib/query-client';
import App from './App';

const CLERK_KEY = process.env.CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_KEY}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>
);
```

**ClerkProvider must be the outermost provider** (before BrowserRouter, QueryClient, etc.) so Clerk hooks work everywhere.

---

## 4. Auth Store Changes

### 4.1 — Rewrite `useAuthStore` to sync from Clerk

The store no longer holds mock data. It syncs from Clerk's `useUser()` and our backend's `/me` endpoint.

```
src/app/stores/useAuthStore.ts
```

```ts
import { create } from 'zustand';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
}

interface AuthState {
  // Synced from Clerk + backend
  currentUser: AuthUser | null;
  workspace: Workspace | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: AuthUser, workspace: Workspace) => void;
  setWorkspace: (workspace: Workspace) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  currentUser: null,
  workspace: null,
  isAuthenticated: false,

  setAuth: (currentUser, workspace) =>
    set({ currentUser, workspace, isAuthenticated: true }),
  setWorkspace: (workspace) => set({ workspace }),
  clear: () =>
    set({ currentUser: null, workspace: null, isAuthenticated: false }),
}));
```

### 4.2 — Auth sync component

A component placed inside `ClerkProvider` that syncs Clerk state → Zustand store → backend.

```
src/app/providers/AuthSync.tsx
```

```tsx
import { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { api } from '@shared/services/api';

export const AuthSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      clear();
      return;
    }

    // Sync Clerk user → backend /me → Zustand
    (async () => {
      try {
        const token = await getToken();
        const { data } = await api.get('/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuth(
          {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            avatar: data.user.avatar,
          },
          data.workspace // may be null for new users
        );
      } catch {
        // User exists in Clerk but not yet in backend (webhook delay)
        // Set basic info from Clerk directly
        setAuth(
          {
            id: user.id,
            name: user.fullName || user.firstName || '',
            email: user.primaryEmailAddress?.emailAddress || '',
            avatar: user.imageUrl,
          },
          null // no workspace yet
        );
      }
    })();
  }, [isLoaded, isSignedIn, user?.id]);

  return <>{children}</>;
};
```

---

## 5. API Client Setup

### 5.1 — Axios interceptor with Clerk token

```
src/shared/services/api.ts
```

```ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Token is injected per-request from Clerk
// See: useApi hook below or AuthSync
```

### 5.2 — `useApi` hook for authenticated calls

```
src/shared/hooks/useApi.ts
```

```ts
import { useAuth } from '@clerk/clerk-react';
import { api } from '@shared/services/api';
import { useMemo } from 'react';

export function useApi() {
  const { getToken } = useAuth();

  return useMemo(() => {
    const instance = axios.create({ ...api.defaults });

    instance.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    return instance;
  }, [getToken]);
}
```

---

## 6. Page-by-Page Integration

### 6.1 — Sign Up (`/signup` → SignupPage.tsx)

**Clerk hooks used:** `useSignUp`

```tsx
import { useSignUp } from '@clerk/clerk-react';

const { signUp, isLoaded } = useSignUp();

// Step 1: Create sign-up attempt
await signUp.create({
  emailAddress: email,
  password,
  firstName: fullName.split(' ')[0],
  lastName: fullName.split(' ').slice(1).join(' '),
});

// Step 2: Send email verification code
await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

// Step 3: Navigate to /email-verification
navigate('/email-verification');
```

**Error handling:**
| Clerk Error | User-facing message |
|---|---|
| `form_identifier_exists` | An account with this email already exists |
| `form_password_pwned` | This password has been compromised, choose another |
| `form_password_too_short` | Password must be at least 8 characters |

### 6.2 — Email Verification (`/email-verification` → VerifyEmailPage.tsx)

**Clerk hooks used:** `useSignUp`

```tsx
const { signUp, setActive } = useSignUp();

// Verify the 6-digit code
const result = await signUp.attemptEmailAddressVerification({ code });

if (result.status === 'complete') {
  await setActive({ session: result.createdSessionId });
  navigate('/org-creation'); // New user → create workspace
}
```

**Resend code:**
```tsx
await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
showToast('Code resent', 'success');
```

### 6.3 — Login (`/login` → LoginPage.tsx)

**Clerk hooks used:** `useSignIn`

```tsx
import { useSignIn } from '@clerk/clerk-react';

const { signIn, setActive } = useSignIn();

const result = await signIn.create({
  identifier: email,
  password,
});

if (result.status === 'complete') {
  await setActive({ session: result.createdSessionId });
  navigate('/'); // AuthSync will populate the store
}
```

**Error handling:**
| Clerk Error | User-facing message |
|---|---|
| `form_identifier_not_found` | No account found with this email |
| `form_password_incorrect` | Incorrect password |
| `strategy_for_user_invalid` | This account uses social login |

### 6.4 — OAuth (Google / GitHub buttons)

**Clerk hooks used:** `useSignIn` (for existing users) or `useSignUp` (either works)

```tsx
const { signIn } = useSignIn();

async function handleOAuth(provider: 'oauth_google' | 'oauth_github') {
  await signIn.authenticateWithRedirect({
    strategy: provider,
    redirectUrl: '/sso-callback',
    redirectUrlComplete: '/',
  });
}
```

**SSO Callback route** (`/sso-callback`):
```tsx
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';

export const SSOCallbackPage = () => <AuthenticateWithRedirectCallback />;
```

This route MUST be added to `routes.tsx`.

### 6.5 — Forgot Password (`/forgot-password` → ForgotPasswordPage.tsx)

**Clerk hooks used:** `useSignIn`

```tsx
const { signIn } = useSignIn();

// Step 1: Request reset code
await signIn.create({
  strategy: 'reset_password_email_code',
  identifier: email,
});

navigate('/reset-password');
```

### 6.6 — Reset Password (`/reset-password` → ResetPasswordPage.tsx)

**Clerk hooks used:** `useSignIn`

```tsx
const { signIn, setActive } = useSignIn();

// Verify code + set new password in one step
const result = await signIn.attemptFirstFactor({
  strategy: 'reset_password_email_code',
  code,
  password: newPassword,
});

if (result.status === 'complete') {
  await setActive({ session: result.createdSessionId });
  navigate('/');
}
```

### 6.7 — Workspace Creation (`/org-creation` → CreateWorkspacePage.tsx)

**Clerk hooks:** Not used — this calls our backend directly.

```tsx
const { getToken } = useAuth();

const token = await getToken();
const { data } = await api.post('/workspaces', {
  name: orgName,
  slug: workspaceUrl,
}, {
  headers: { Authorization: `Bearer ${token}` },
});

useAuthStore.getState().setWorkspace(data.workspace);
navigate('/');
```

### 6.8 — Logout

```tsx
import { useAuth } from '@clerk/clerk-react';

const { signOut } = useAuth();

async function handleLogout() {
  useAuthStore.getState().clear();
  await signOut({ redirectUrl: '/login' });
}
```

---

## 7. Route Guards

### 7.1 — AuthGuard (protect authenticated routes)

```
src/shared/guards/AuthGuard.tsx
```

```tsx
import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet } from 'react-router-dom';

export const AuthGuard = () => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Navigate to="/login" replace />;

  return <Outlet />;
};
```

### 7.2 — GuestGuard (protect public routes from logged-in users)

```
src/shared/guards/GuestGuard.tsx
```

```tsx
import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet } from 'react-router-dom';

export const GuestGuard = () => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return <LoadingScreen />;
  if (isSignedIn) return <Navigate to="/" replace />;

  return <Outlet />;
};
```

### 7.3 — Updated routes.tsx

```tsx
<Routes>
  {/* SSO callback — must be outside guards */}
  <Route path="/sso-callback" element={<SSOCallbackPage />} />

  {/* Public routes — redirect to / if already signed in */}
  <Route element={<GuestGuard />}>
    <Route path="/marketing" element={<MarketingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/email-verification" element={<VerifyEmailPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
  </Route>

  {/* Authenticated routes */}
  <Route element={<AuthGuard />}>
    <Route path="/org-creation" element={<CreateWorkspacePage />} />
    <Route element={<MainLayout />}>
      <Route path="/" element={<DashboardPage />} />
      {/* ... all other app routes */}
    </Route>
  </Route>
</Routes>
```

---

## 8. What Gets Deleted

| File / Code | Why |
|---|---|
| `AppContext.tsx` | Fully replaced by Zustand stores + Clerk hooks |
| `useApp()` usage in auth pages | Replaced by `useSignIn`, `useSignUp`, `useAuth` from Clerk |
| `MOCK_USERS` imports in auth pages | No more mock login — real Clerk auth |
| Demo user login cards | Remove from production (keep behind dev flag if needed) |
| `setCurrentUser()` / `setOrganization()` direct calls | Replaced by `AuthSync` auto-population |

---

## 9. What Stays the Same

| Element | Why |
|---|---|
| All custom UI (pages, inputs, animations) | Clerk headless = our UI, their auth logic |
| `useAuthStore` (Zustand) | Still the app-wide source for user/workspace — just synced from Clerk now |
| `shared/services/api.ts` | Still the single Axios instance — just uses Clerk token |
| Route structure | Same paths, just wrapped with proper guards |
| `useThemeStore`, `useUIStore`, `useToastStore` | Completely unaffected |

---

## 10. Migration Checklist

```
Phase 1: Setup
  [ ] npm install @clerk/clerk-react
  [ ] Add VITE_CLERK_PUBLISHABLE_KEY to .env
  [ ] Wrap main.tsx in ClerkProvider
  [ ] Create AuthSync component
  [ ] Create SSOCallbackPage

Phase 2: Store + API
  [ ] Rewrite useAuthStore to new shape (no mock data)
  [ ] Update api.ts with useApi hook or interceptor
  [ ] Remove AppContext.tsx dependency from auth pages

Phase 3: Pages (one at a time)
  [ ] SignupPage → useSignUp
  [ ] VerifyEmailPage → signUp.attemptEmailAddressVerification
  [ ] LoginPage → useSignIn
  [ ] ForgotPasswordPage → signIn.create (reset_password_email_code)
  [ ] ResetPasswordPage → signIn.attemptFirstFactor
  [ ] CreateWorkspacePage → backend POST /workspaces
  [ ] OAuth buttons → authenticateWithRedirect
  [ ] Logout → useAuth().signOut

Phase 4: Guards + Routes
  [ ] Create AuthGuard
  [ ] Create GuestGuard
  [ ] Add /sso-callback route
  [ ] Wrap routes with guards
  [ ] Remove inline isAdmin/isLead checks from routes

Phase 5: Cleanup
  [ ] Delete AppContext.tsx
  [ ] Remove all MOCK_USERS from auth pages
  [ ] Remove demo login cards (or gate behind VITE_DEMO_MODE)
  [ ] Verify: npm run build passes
  [ ] Verify: all auth flows work end-to-end
```

---

## 11. Error Handling Pattern

Every Clerk call wraps in try/catch. Clerk errors have a specific shape:

```ts
try {
  await signIn.create({ identifier: email, password });
} catch (err: any) {
  // Clerk error shape
  const clerkError = err.errors?.[0];
  const message = clerkError?.longMessage || clerkError?.message || 'Something went wrong';
  showToast(message, 'error');
}
```

For backend errors (workspace creation, /me):

```ts
try {
  const { data } = await api.post('/workspaces', payload);
} catch (err: any) {
  const message = err.response?.data?.error?.message || 'Failed to create workspace';
  showToast(message, 'error');
}
```

---

## 12. Environment Variables Summary

Env vars are injected via `vite.config.ts` `define` — access as `process.env.VAR_NAME`.

| Variable                 | Required | Where  | Description                          |
|--------------------------|----------|--------|--------------------------------------|
| `CLERK_PUBLISHABLE_KEY`  | Yes      | `.env` | Clerk publishable key (starts with `pk_`) |
| `BASE_URL`               | Yes      | `.env` | Backend API URL (e.g., `https://api.trussen.app`) |
