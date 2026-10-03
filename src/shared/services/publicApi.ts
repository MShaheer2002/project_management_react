import axios from 'axios';
import { tunnelHeaders } from '@shared/services/tunnelHeaders';
import { attachErrorInterceptor, attachPathGuard } from './interceptors';

/**
 * Public API instance — for unauthenticated endpoints.
 * No auth token, no workspace header.
 * Used by: auth service (slug check, etc.)
 */
export const publicApi = axios.create({
  baseURL: process.env.BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    ...tunnelHeaders,
  },
  timeout: 15000,
});

attachPathGuard(publicApi);
attachErrorInterceptor(publicApi);
