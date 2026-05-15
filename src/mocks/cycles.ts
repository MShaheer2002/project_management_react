import { Cycle } from '@/types';

export const MOCK_CYCLES: Cycle[] = [
  { id: 'c1', name: 'Cycle 12', startDate: '2024-03-01', endDate: '2024-03-14', issueCount: 18, progress: 75, status: 'current' },
  { id: 'c2', name: 'Cycle 13', startDate: '2024-03-15', endDate: '2024-03-28', issueCount: 0, progress: 0, status: 'upcoming' },
  { id: 'c3', name: 'Cycle 11', startDate: '2024-02-15', endDate: '2024-02-28', issueCount: 22, progress: 100, status: 'completed' },
];
