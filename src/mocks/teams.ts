import { Team } from '@/types';

export const MOCK_TEAMS: Team[] = [
  { id: 't1', name: 'Engineering', leadId: 'u1', memberIds: ['u1', 'u2', 'u4'], projectIds: ['p1', 'p2'], departmentId: 'd1' },
  { id: 't2', name: 'Product', leadId: 'u2', memberIds: ['u2', 'u3'], projectIds: ['p3'], departmentId: 'd2' },
];
