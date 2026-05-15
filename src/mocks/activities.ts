import { Activity } from '@/types';

export const MOCK_ACTIVITIES: Activity[] = [
  { id: 'a1', type: 'issue_created', actorId: 'u1', targetId: 'LIN-105', targetType: 'issue', description: 'created issue LIN-105', timestamp: '5 mins ago' },
  { id: 'a2', type: 'comment_added', actorId: 'u2', targetId: 'LIN-101', targetType: 'issue', description: 'commented on LIN-101', timestamp: '15 mins ago' },
  { id: 'a3', type: 'member_joined', actorId: 'u3', targetId: 't1', targetType: 'team', description: 'joined the Engineering team', timestamp: '1 day ago' },
];
