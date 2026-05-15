import { User } from '@/types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alex Rivera', email: 'alex@example.com', role: 'owner', avatar: 'https://picsum.photos/seed/alex/100/100', lastActive: '2 mins ago', teamId: 't1', departmentId: 'd1' },
  { id: 'u2', name: 'Sarah Chen', email: 'sarah@example.com', role: 'admin', avatar: 'https://picsum.photos/seed/sarah/100/100', lastActive: '1 hour ago', teamId: 't1', departmentId: 'd1' },
  { id: 'u3', name: 'Jordan Smith', email: 'jordan@example.com', role: 'member', avatar: 'https://picsum.photos/seed/jordan/100/100', lastActive: 'Active now', teamId: 't2', departmentId: 'd2' },
  { id: 'u4', name: 'Taylor Otwell', email: 'taylor@example.com', role: 'guest', avatar: 'https://picsum.photos/seed/taylor/100/100', lastActive: 'Yesterday', teamId: 't1', departmentId: 'd1' },
];
