// COMPATIBILITY SHIM — import from @mocks/* or @shared/constants/* directly.
// Delete this file once all consumers are migrated.
export { MOCK_USERS } from '@mocks/users';
export { MOCK_DEPARTMENTS } from '@mocks/departments';
export { MOCK_TEAMS } from '@mocks/teams';
export { MOCK_PROJECTS } from '@mocks/projects';
export { MOCK_ISSUES } from '@mocks/issues';
export { MOCK_NOTIFICATIONS } from '@mocks/notifications';
export { MOCK_ACTIVITIES } from '@mocks/activities';
export { MOCK_CYCLES } from '@mocks/cycles';
export { MOCK_ORGANIZATIONS } from '@mocks/organizations';
export { PRIORITY_COLORS } from '@shared/constants/priorities';
export { STATUS_LABELS, DEFAULT_STATUSES, getStatusLabel, getStatusColor, isStatusFinal } from '@shared/constants/statuses';
export { ISSUE_TYPE_CONFIG } from '@shared/constants/issueTypes';
