import { Project } from '@/types';

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Mobile App Redesign', description: 'Complete overhaul of the iOS and Android applications.', teamId: 't1', departmentId: 'd1', status: 'active', progress: 65, issueCount: 24, updatedAt: '2024-03-05T10:00:00Z' },
  { id: 'p2', name: 'API V2', description: 'Developing the next generation of our public API.', teamId: 't1', departmentId: 'd1', status: 'active', progress: 30, issueCount: 12, updatedAt: '2024-03-04T15:30:00Z' },
  { id: 'p3', name: 'Q1 Roadmap', description: 'Planning and execution for the first quarter.', teamId: 't2', departmentId: 'd2', status: 'active', progress: 90, issueCount: 8, updatedAt: '2024-03-06T09:00:00Z' },
];
