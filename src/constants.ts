import { Issue, Project, Team, User, Notification, Activity, Integration, Cycle, ApiKey, Organization, Department } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alex Rivera', email: 'alex@example.com', role: 'owner', avatar: 'https://picsum.photos/seed/alex/100/100', lastActive: '2 mins ago', teamId: 't1', departmentId: 'd1' },
  { id: 'u2', name: 'Sarah Chen', email: 'sarah@example.com', role: 'admin', avatar: 'https://picsum.photos/seed/sarah/100/100', lastActive: '1 hour ago', teamId: 't1', departmentId: 'd1' },
  { id: 'u3', name: 'Jordan Smith', email: 'jordan@example.com', role: 'member', avatar: 'https://picsum.photos/seed/jordan/100/100', lastActive: 'Active now', teamId: 't2', departmentId: 'd2' },
  { id: 'u4', name: 'Taylor Otwell', email: 'taylor@example.com', role: 'guest', avatar: 'https://picsum.photos/seed/taylor/100/100', lastActive: 'Yesterday', teamId: 't1', departmentId: 'd1' },
];

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Engineering', description: 'Building the future of our product.', headId: 'u1', color: '#5f72ea', icon: 'Terminal', memberIds: ['u1', 'u2', 'u4'], teamIds: ['t1'], projectIds: ['p1', 'p2'], visibility: 'public', isDefault: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'd2', name: 'Design', description: 'Crafting beautiful user experiences.', headId: 'u3', color: '#ea5fba', icon: 'Palette', memberIds: ['u3'], teamIds: ['t2'], projectIds: ['p3'], visibility: 'public', isDefault: false, createdAt: '2024-01-15T00:00:00Z' },
];

export const MOCK_TEAMS: Team[] = [
  { id: 't1', name: 'Engineering', leadId: 'u1', memberIds: ['u1', 'u2', 'u4'], projectIds: ['p1', 'p2'], departmentId: 'd1' },
  { id: 't2', name: 'Product', leadId: 'u2', memberIds: ['u2', 'u3'], projectIds: ['p3'], departmentId: 'd2' },
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Mobile App Redesign', description: 'Complete overhaul of the iOS and Android applications.', teamId: 't1', departmentId: 'd1', status: 'active', progress: 65, issueCount: 24, updatedAt: '2024-03-05T10:00:00Z' },
  { id: 'p2', name: 'API V2', description: 'Developing the next generation of our public API.', teamId: 't1', departmentId: 'd1', status: 'active', progress: 30, issueCount: 12, updatedAt: '2024-03-04T15:30:00Z' },
  { id: 'p3', name: 'Q1 Roadmap', description: 'Planning and execution for the first quarter.', teamId: 't2', departmentId: 'd2', status: 'active', progress: 90, issueCount: 8, updatedAt: '2024-03-06T09:00:00Z' },
];

export const MOCK_ISSUES: Issue[] = [
  { id: 'LIN-101', title: 'Implement OAuth2 authentication', description: 'Need to add support for Google and GitHub login.', status: 'in-progress', priority: 'high', assigneeId: 'u1', creatorId: 'u2', projectId: 'p1', teamId: 't1', labels: ['auth', 'security'], createdAt: '2024-03-01T08:00:00Z', updatedAt: '2024-03-05T12:00:00Z', dueDate: '2024-03-10T18:00:00Z' },
  { id: 'LIN-102', title: 'Fix navigation bug on mobile', description: 'The hamburger menu doesn\'t close on click.', status: 'todo', priority: 'urgent', assigneeId: 'u2', creatorId: 'u1', projectId: 'p1', teamId: 't1', labels: ['bug', 'ui'], createdAt: '2024-03-02T10:00:00Z', updatedAt: '2024-03-02T10:00:00Z', dueDate: '2024-03-09T12:00:00Z' },
  { id: 'LIN-103', title: 'Update documentation for API v2', description: 'Add examples for the new endpoints.', status: 'review', priority: 'medium', assigneeId: 'u3', creatorId: 'u1', projectId: 'p2', teamId: 't1', labels: ['docs'], createdAt: '2024-03-03T14:00:00Z', updatedAt: '2024-03-06T11:00:00Z', dueDate: '2024-03-15T09:00:00Z' },
  { id: 'LIN-104', title: 'Design system audit', description: 'Review all components for accessibility.', status: 'backlog', priority: 'low', creatorId: 'u2', projectId: 'p3', teamId: 't2', labels: ['design'], createdAt: '2024-03-04T09:00:00Z', updatedAt: '2024-03-04T09:00:00Z' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'mention', userId: 'u1', actorId: 'u2', issueId: 'LIN-101', description: 'mentioned you in a comment', timestamp: '10 mins ago', read: false },
  { id: 'n2', type: 'assignment', userId: 'u1', actorId: 'u3', issueId: 'LIN-103', description: 'assigned an issue to you', timestamp: '1 hour ago', read: true },
  { id: 'n3', type: 'update', userId: 'u1', actorId: 'u2', issueId: 'LIN-102', description: 'updated the status to In Progress', timestamp: '2 hours ago', read: false },
];

export const MOCK_ACTIVITIES: Activity[] = [
  { id: 'a1', type: 'issue_created', actorId: 'u1', targetId: 'LIN-105', targetType: 'issue', description: 'created issue LIN-105', timestamp: '5 mins ago' },
  { id: 'a2', type: 'comment_added', actorId: 'u2', targetId: 'LIN-101', targetType: 'issue', description: 'commented on LIN-101', timestamp: '15 mins ago' },
  { id: 'a3', type: 'member_joined', actorId: 'u3', targetId: 't1', targetType: 'team', description: 'joined the Engineering team', timestamp: '1 day ago' },
];

export const MOCK_INTEGRATIONS: Integration[] = [
  { id: 'i1', name: 'GitHub', description: 'Sync your pull requests and issues.', logo: 'https://cdn-icons-png.flaticon.com/512/25/25231.png', connected: true },
  { id: 'i2', name: 'Slack', description: 'Get notifications in your channels.', logo: 'https://cdn-icons-png.flaticon.com/512/3800/3800024.png', connected: false },
  { id: 'i3', name: 'Discord', description: 'Connect your community server.', logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968756.png', connected: false },
  { id: 'i4', name: 'Figma', description: 'Embed designs in your issues.', logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png', connected: true },
];

export const MOCK_CYCLES: Cycle[] = [
  { id: 'c1', name: 'Cycle 12', startDate: '2024-03-01', endDate: '2024-03-14', issueCount: 18, progress: 75, status: 'current' },
  { id: 'c2', name: 'Cycle 13', startDate: '2024-03-15', endDate: '2024-03-28', issueCount: 0, progress: 0, status: 'upcoming' },
  { id: 'c3', name: 'Cycle 11', startDate: '2024-02-15', endDate: '2024-02-28', issueCount: 22, progress: 100, status: 'completed' },
];

export const MOCK_API_KEYS: ApiKey[] = [
  { id: 'k1', name: 'Production API Key', key: 'lin_live_********************', createdAt: '2024-01-15', lastUsedAt: '2 hours ago' },
  { id: 'k2', name: 'Development Key', key: 'lin_test_********************', createdAt: '2024-02-20', lastUsedAt: '1 day ago' },
];

export const PRIORITY_COLORS = {
  low: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
  medium: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  high: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
  urgent: 'text-red-500 bg-red-100 dark:bg-red-900/30',
};

export const STATUS_LABELS = {
  backlog: 'Backlog',
  todo: 'Todo',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done',
};

export const MOCK_ORGANIZATIONS: Organization[] = [
  { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp', logo: 'https://picsum.photos/seed/acme/100/100' },
  { id: 'org-2', name: 'Stark Industries', slug: 'stark-ind', logo: 'https://picsum.photos/seed/stark/100/100' },
];
