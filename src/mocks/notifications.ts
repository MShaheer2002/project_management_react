import { Notification } from '@/types';

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'mention', userId: 'u1', actorId: 'u2', issueId: 'LIN-101', description: 'mentioned you in a comment', timestamp: '10 mins ago', read: false },
  { id: 'n2', type: 'assignment', userId: 'u1', actorId: 'u3', issueId: 'LIN-103', description: 'assigned an issue to you', timestamp: '1 hour ago', read: true },
  { id: 'n3', type: 'update', userId: 'u1', actorId: 'u2', issueId: 'LIN-102', description: 'updated the status to In Progress', timestamp: '2 hours ago', read: false },
];
