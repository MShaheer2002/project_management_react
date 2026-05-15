import { Integration } from '@/types';

export const MOCK_INTEGRATIONS: Integration[] = [
  { id: 'i1', name: 'GitHub', description: 'Sync your pull requests and issues.', logo: 'https://cdn-icons-png.flaticon.com/512/25/25231.png', connected: true },
  { id: 'i2', name: 'Slack', description: 'Get notifications in your channels.', logo: 'https://cdn-icons-png.flaticon.com/512/3800/3800024.png', connected: false },
  { id: 'i3', name: 'Discord', description: 'Connect your community server.', logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968756.png', connected: false },
  { id: 'i4', name: 'Figma', description: 'Embed designs in your issues.', logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png', connected: true },
];
