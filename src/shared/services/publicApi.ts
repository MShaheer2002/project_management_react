import axios from 'axios';
import { attachErrorInterceptor } from './interceptors';

/**
 * Public API instance — for unauthenticated endpoints.
 * No auth token, no workspace header.
 * Used by: auth service (slug check, etc.)
 */
export const publicApi = axios.create({
  baseURL: process.env.BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Required for ngrok free tier to avoid CORS/interstitial
  },
  timeout: 15000,
});

attachErrorInterceptor(publicApi);
