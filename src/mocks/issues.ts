import { Issue } from '@/types';

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
