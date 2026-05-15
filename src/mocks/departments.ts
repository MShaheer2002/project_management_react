import { Department } from '@/types';

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Engineering', description: 'Building the future of our product.', headId: 'u1', color: '#5f72ea', icon: 'Terminal', memberIds: ['u1', 'u2', 'u4'], teamIds: ['t1'], projectIds: ['p1', 'p2'], visibility: 'public', isDefault: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'd2', name: 'Design', description: 'Crafting beautiful user experiences.', headId: 'u3', color: '#ea5fba', icon: 'Palette', memberIds: ['u3'], teamIds: ['t2'], projectIds: ['p3'], visibility: 'public', isDefault: false, createdAt: '2024-01-15T00:00:00Z' },
];
