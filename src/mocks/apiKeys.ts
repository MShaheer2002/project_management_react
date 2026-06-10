import type { ApiKey } from '@/types';

export const MOCK_API_KEYS: ApiKey[] = [
  {
    id: 'k1',
    name: 'Production API Key',
    keyPrefix: 'lin_live_a8f3bc91',
    createdAt: '2026-01-15T10:30:00Z',
    lastUsedAt: '2026-06-09T08:15:00Z',
    expiresAt: null,
    isExpired: false,
    createdBy: { id: 'u1', name: 'Shaheer', email: 'shaheer@example.com' },
  },
  {
    id: 'k2',
    name: 'Development Key',
    keyPrefix: 'lin_test_b7e2cd40',
    createdAt: '2026-02-20T14:00:00Z',
    lastUsedAt: '2026-06-08T16:30:00Z',
    expiresAt: null,
    isExpired: false,
    createdBy: { id: 'u1', name: 'Shaheer', email: 'shaheer@example.com' },
  },
  {
    id: 'k3',
    name: 'Old CI Key',
    keyPrefix: 'lin_live_c3d4e5f6',
    createdAt: '2025-11-01T09:00:00Z',
    lastUsedAt: '2025-12-20T12:00:00Z',
    expiresAt: '2025-12-31T00:00:00Z',
    isExpired: true,
    createdBy: { id: 'u2', name: 'Ali Khan', email: 'ali@example.com' },
  },
];
