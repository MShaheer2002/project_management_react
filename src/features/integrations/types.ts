/** Backend integration status returned by GET /integrations */
export interface IntegrationItem {
  provider: IntegrationProvider;
  connected: boolean;
  connectedAt: string | null;
  connectedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export type IntegrationProvider = 'github' | 'slack' | 'discord' | 'figma';

export interface GitHubConnectResponse {
  authUrl: string;
}

export interface GitHubSettings {
  autoCompleteOnMerge: boolean;
  autoMoveToReviewOnPr: boolean;
  notifyOnPrOpen: boolean;
  notifyOnPrReview: boolean;
  notifyOnPrMerge: boolean;
  showCommits: boolean;
  showBranches: boolean;
}

export type UpdateGitHubSettingsInput = Partial<GitHubSettings>;

/** A single channel mapping (id + display name) */
export interface SlackChannelMapping {
  channelId: string;
  channelName: string;
}

/** Channel routing config stored in the integration */
export interface SlackChannelRouting {
  projects: Record<string, SlackChannelMapping[]>;
  teams: Record<string, SlackChannelMapping[]>;
  urgent: SlackChannelMapping | null;
}

export interface SlackSettings {
  // Channel notifications
  notifyOnIssueCreatedUrgent: boolean;
  notifyOnIssueCompleted: boolean;
  notifyOnIssueAssigned: boolean;
  notifyOnStatusChange: boolean;
  notifyOnCycleStarted: boolean;
  notifyOnCycleCompleted: boolean;
  notifyOnProjectCompleted: boolean;
  // Direct messages
  dmOnAssigned: boolean;
  dmOnMentioned: boolean;
  dmOnPrActivity: boolean;
  dmOnDueDateReminder: boolean;
  dmOnAllStatusChanges: boolean;
  // Slash commands
  slashCreate: boolean;
  slashStatus: boolean;
  slashMyIssues: boolean;
  slashCycle: boolean;
  // Channel config
  defaultChannelId: string | null;
  defaultChannelName: string | null;
  // Channel routing
  channelRouting: SlackChannelRouting | null;
}

export type UpdateSlackSettingsInput = Partial<SlackSettings>;

/** Slack channel returned by GET /integrations/slack/channels */
export interface SlackChannel {
  id: string;
  name: string;
  memberCount: number;
}

/** Union of all provider settings for the generic updateSettings service */
export type UpdateIntegrationSettingsInput =
  | UpdateGitHubSettingsInput
  | UpdateSlackSettingsInput;

/** Static provider display metadata — not from API */
export interface ProviderMeta {
  id: IntegrationProvider;
  name: string;
  description: string;
  logo: string;
  available: boolean;
}

export const PROVIDER_META: Record<IntegrationProvider, ProviderMeta> = {
  github: {
    id: 'github',
    name: 'GitHub',
    description:
      'Link branches, commits, and pull requests to issues. Auto-complete issues when PRs merge.',
    logo: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
    available: true,
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    description:
      'Get issue updates in your channels. Create issues with slash commands.',
    logo: 'https://cdn-icons-png.flaticon.com/512/3800/3800024.png',
    available: true,
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    description: 'Post workspace events to your Discord channels.',
    logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968756.png',
    available: false,
  },
  figma: {
    id: 'figma',
    name: 'Figma',
    description: 'Link design files to issues and projects.',
    logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
    available: false,
  },
};

/** GitHub activity types present in the activity feed */
export const GITHUB_ACTIVITY_TYPES = [
  'GITHUB_BRANCH_LINKED',
  'GITHUB_COMMIT_LINKED',
  'GITHUB_PR_OPENED',
  'GITHUB_PR_MERGED',
  'GITHUB_PR_CLOSED',
  'GITHUB_PR_REVIEW',
] as const;

export type GitHubActivityType = (typeof GITHUB_ACTIVITY_TYPES)[number];

export interface GitHubActivityMetadata {
  provider: 'github';
  repo: string;
  entityId: string;
  entityTitle: string;
  branch?: string;
  sha?: string;
  shortSha?: string;
  message?: string;
  url?: string;
  author?: string;
  prNumber?: number;
  prTitle?: string;
  prUrl?: string;
  prBranch?: string;
  prUser?: string;
  mergedAt?: string;
  reviewState?: 'approved' | 'changes_requested' | 'commented';
  reviewUser?: string;
  trigger?: string;
  fromStatus?: string;
  toStatus?: string;
}
