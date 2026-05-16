import axios from 'axios';
import { attachAllInterceptors } from './interceptors';

/**
 * Private API instance — for authenticated endpoints.
 * Auto-injects: Bearer token (Clerk), X-Workspace-Id header.
 * Handles: 401 redirect, 403 permission, 429 rate limit, 500 server errors.
 * Used by: all feature services (issues, projects, teams, etc.)
 */
export const privateApi = axios.create({
  baseURL: process.env.BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

attachAllInterceptors(privateApi);
