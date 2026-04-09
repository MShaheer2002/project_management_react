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
  { id: 'LIN-101', title: 'Implement OAuth2 authentication', description: 'Need to add support for Google and GitHub login.', status: 'in-progress', priority: 'high', type: 'issue', assigneeId: 'u1', creatorId: 'u2', projectId: 'p1', teamId: 't1', labels: ['auth', 'security'], createdAt: '2024-03-01T08:00:00Z', updatedAt: '2024-03-05T12:00:00Z', dueDate: '2024-03-10T18:00:00Z', subtasks: [
    { id: 'st1', title: 'Setup Google Cloud Console project', completed: true, order: 0 },
    { id: 'st2', title: 'Implement passport-google-oauth20 strategy', completed: true, order: 1 },
    { id: 'st3', title: 'Create login UI with social buttons', completed: false, order: 2 },
    { id: 'st4', title: 'Handle callback and session creation', completed: false, order: 3 },
  ] },
  { id: 'LIN-102', title: 'Fix navigation bug on mobile', description: 'The hamburger menu doesn\'t close on click.', status: 'todo', priority: 'urgent', type: 'bug', assigneeId: 'u2', creatorId: 'u1', projectId: 'p1', teamId: 't1', labels: ['bug', 'ui'], createdAt: '2024-03-02T10:00:00Z', updatedAt: '2024-03-02T10:00:00Z', dueDate: '2024-03-09T12:00:00Z', subtasks: [
    { id: 'st5', title: 'Reproduce issue on iOS Safari', completed: true, order: 0 },
    { id: 'st6', title: 'Check event listener for menu toggle', completed: false, order: 1 },
  ] },
  { id: 'LIN-103', title: 'Update documentation for API v2', description: 'Add examples for the new endpoints.', status: 'review', priority: 'medium', type: 'task', assigneeId: 'u3', creatorId: 'u1', projectId: 'p2', teamId: 't1', labels: ['docs'], createdAt: '2024-03-03T14:00:00Z', updatedAt: '2024-03-06T11:00:00Z', dueDate: '2024-03-15T09:00:00Z', subtasks: [
    { id: 'st7', title: 'Document /users/profile endpoint', completed: true, order: 0 },
    { id: 'st8', title: 'Document /auth/refresh endpoint', completed: true, order: 1 },
    { id: 'st9', title: 'Add code examples in Python and JS', completed: true, order: 2 },
  ] },
  { id: 'LIN-104', title: 'Design system audit', description: 'Review all components for accessibility.', status: 'backlog', priority: 'low', type: 'task', creatorId: 'u2', projectId: 'p3', teamId: 't2', labels: ['design'], createdAt: '2024-03-04T09:00:00Z', updatedAt: '2024-03-04T09:00:00Z', subtasks: [] },
  { id: 'LIN-105', title: 'Database migration to PostgreSQL', description: 'Move from MySQL to Postgres for better performance.', status: 'todo', priority: 'high', type: 'issue', assigneeId: 'u1', creatorId: 'u1', projectId: 'p2', teamId: 't1', labels: ['backend', 'database'], createdAt: '2024-03-05T10:00:00Z', updatedAt: '2024-03-05T10:00:00Z', subtasks: [
    { id: 'st10', title: 'Setup Postgres instance on AWS RDS', completed: false, order: 0 },
    { id: 'st11', title: 'Export data from MySQL', completed: false, order: 1 },
    { id: 'st12', title: 'Run migration scripts', completed: false, order: 2 },
  ] },
  { id: 'LIN-106', title: 'Login screen layout shift', description: 'The login button jumps when the page loads.', status: 'in-progress', priority: 'medium', type: 'bug', assigneeId: 'u4', creatorId: 'u2', projectId: 'p1', teamId: 't1', labels: ['bug', 'ui'], createdAt: '2024-03-06T11:00:00Z', updatedAt: '2024-03-06T11:00:00Z', subtasks: [
    { id: 'st13', title: 'Identify shifting element', completed: true, order: 0 },
    { id: 'st14', title: 'Add min-height to container', completed: false, order: 1 },
  ] },
  { id: 'LIN-107', title: 'Research new icon set', description: 'Explore Lucide vs Phosphor icons.', status: 'todo', priority: 'low', type: 'task', assigneeId: 'u3', creatorId: 'u3', projectId: 'p3', teamId: 't2', labels: ['design'], createdAt: '2024-03-07T12:00:00Z', updatedAt: '2024-03-07T12:00:00Z', subtasks: [
    { id: 'st15', title: 'Compare Lucide icon count', completed: false, order: 0 },
    { id: 'st16', title: 'Compare Phosphor icon styles', completed: false, order: 1 },
  ] },
  { id: 'LIN-108', title: 'API performance bottleneck', description: 'The /users endpoint is taking > 2s.', status: 'backlog', priority: 'urgent', type: 'bug', assigneeId: 'u2', creatorId: 'u4', projectId: 'p2', teamId: 't1', labels: ['bug', 'performance'], createdAt: '2024-03-08T13:00:00Z', updatedAt: '2024-03-08T13:00:00Z', subtasks: [] },
  { id: 'LIN-109', title: 'Dark mode contrast issues', description: 'Some text is unreadable in dark mode.', status: 'todo', priority: 'high', type: 'bug', assigneeId: 'u4', creatorId: 'u3', projectId: 'p1', teamId: 't1', labels: ['bug', 'ui'], createdAt: '2024-03-09T14:00:00Z', updatedAt: '2024-03-09T14:00:00Z', subtasks: [
    { id: 'st17', title: 'Check contrast on primary buttons', completed: true, order: 0 },
    { id: 'st18', title: 'Check contrast on secondary text', completed: true, order: 1 },
  ] },
  { id: 'LIN-110', title: 'Setup CI/CD pipeline', description: 'Use GitHub Actions for automated testing and deployment.', status: 'in-progress', priority: 'high', type: 'issue', assigneeId: 'u1', creatorId: 'u2', projectId: 'p2', teamId: 't1', labels: ['devops'], createdAt: '2024-03-10T15:00:00Z', updatedAt: '2024-03-10T15:00:00Z', subtasks: [
    { id: 'st19', title: 'Create .github/workflows/main.yml', completed: true, order: 0 },
    { id: 'st20', title: 'Add build and test steps', completed: false, order: 1 },
    { id: 'st21', title: 'Setup deployment to staging', completed: false, order: 2 },
  ] },
  { id: 'LIN-111', title: 'User profile page refactor', description: 'Clean up the profile page code and improve UI.', status: 'todo', priority: 'medium', type: 'task', assigneeId: 'u2', creatorId: 'u1', projectId: 'p1', teamId: 't1', labels: ['ui', 'refactor'], createdAt: '2024-03-11T16:00:00Z', updatedAt: '2024-03-11T16:00:00Z', subtasks: [] },
  { id: 'LIN-112', title: 'Mobile app crash on logout', description: 'App crashes when user tries to logout on iOS.', status: 'backlog', priority: 'urgent', type: 'bug', assigneeId: 'u3', creatorId: 'u4', projectId: 'p1', teamId: 't1', labels: ['bug', 'mobile'], createdAt: '2024-03-12T17:00:00Z', updatedAt: '2024-03-12T17:00:00Z', subtasks: [] },
  { id: 'LIN-113', title: 'Implement dark mode for charts', description: 'Make sure Recharts look good in dark theme.', status: 'in-progress', priority: 'medium', type: 'issue', assigneeId: 'u4', creatorId: 'u3', projectId: 'p3', teamId: 't2', labels: ['ui', 'charts'], createdAt: '2024-03-13T18:00:00Z', updatedAt: '2024-03-13T18:00:00Z', subtasks: [] },
  { id: 'LIN-114', title: 'Fix broken links in footer', description: 'The "Terms of Service" link is 404.', status: 'done', priority: 'low', type: 'bug', assigneeId: 'u1', creatorId: 'u2', projectId: 'p1', teamId: 't1', labels: ['bug'], createdAt: '2024-03-14T19:00:00Z', updatedAt: '2024-03-15T10:00:00Z', subtasks: [] },
  { id: 'LIN-115', title: 'Optimize image loading', description: 'Use WebP and lazy loading for faster page loads.', status: 'todo', priority: 'medium', type: 'task', assigneeId: 'u2', creatorId: 'u1', projectId: 'p1', teamId: 't1', labels: ['performance'], createdAt: '2024-03-15T20:00:00Z', updatedAt: '2024-03-15T20:00:00Z', subtasks: [] },
  { id: 'LIN-116', title: 'Add search to teams page', description: 'Allow users to search for teams by name.', status: 'backlog', priority: 'low', type: 'issue', assigneeId: 'u3', creatorId: 'u2', projectId: 'p3', teamId: 't2', labels: ['feature'], createdAt: '2024-03-16T21:00:00Z', updatedAt: '2024-03-16T21:00:00Z', subtasks: [] },
  { id: 'LIN-117', title: 'Security audit of API keys', description: 'Ensure API keys are stored securely.', status: 'review', priority: 'high', type: 'task', assigneeId: 'u4', creatorId: 'u1', projectId: 'p2', teamId: 't1', labels: ['security'], createdAt: '2024-03-17T22:00:00Z', updatedAt: '2024-03-17T22:00:00Z', subtasks: [] },
];

export const ISSUE_TYPE_CONFIG = {
  task: { label: 'Task', color: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
  bug: { label: 'Bug', color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
  issue: { label: 'Issue', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
};

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
