import type { ApiKey } from '@/types';

/** POST /api-keys response — includes full raw key (shown ONCE) */
export interface ApiKeyCreateResponse extends ApiKey {
  key: string;
}

/** POST /api-keys request body */
export interface CreateApiKeyInput {
  name: string;
  expiresAt?: string;
}
