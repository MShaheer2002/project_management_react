import type { AxiosInstance } from 'axios';

/**
 * Services build paths like `/issues/${id}` from values that can come from the
 * address bar. Refuse any path a value could bend to another endpoint
 * (`..`, `.`, backslashes, encoded slashes or dots) instead of encoding every call (H-FE-10).
 */
const BENT_PATH = /(^|\/)\.{1,2}(\/|$)|\\|%2e|%2f|%5c/i;

export const isBentPath = (url: string | undefined) => BENT_PATH.test((url ?? '').split(/[?#]/)[0]);

export function attachPathGuard(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    if (isBentPath(config.url)) throw new Error('Blocked a request with an unsafe path.');
    return config;
  });
}
