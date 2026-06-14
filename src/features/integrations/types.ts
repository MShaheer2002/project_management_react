// ── Shared ──────────────────────────────────────────────────────

export type IntegrationProvider = 'github' | 'slack' | 'discord' | 'figma';

/** Returned by GET /integrations */
export interface IntegrationItem {
  provider: IntegrationProvider;
  connected: boolean;
  connectedAt: string | null;
  connectedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  providerMeta: Record<string, unknown> | null;
}

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
    description:
      'Post issue and project updates to your Discord channels via webhook.',
    logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968756.png',
    available: true,
  },
  figma: {
    id: 'figma',
    name: 'Figma',
    description:
      'Link design files to issues. See thumbnails and metadata inline.',
    logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
    available: true,
  },
};

// ── GitHub ──────────────────────────────────────────────────────

export interface GitHubSettings {
  autoCompleteOnMerge: boolean;
  autoMoveToReviewOnPr: boolean;
  notifyOnPrOpen: boolean;
  notifyOnPrReview: boolean;
  notifyOnPrMerge: boolean;
  showCommits: boolean;
  showBranches: boolean;
}

export interface GitHubSettingsResponse {
  settings: GitHubSettings;
  githubUser: { login: string; id: number; avatarUrl: string } | null;
  repos: string[];
}

export interface GitHubConnectResponse {
  authUrl: string;
}

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

// ── Slack ───────────────────────────────────────────────────────

export interface SlackSettings {
  notifyOnIssueCreatedUrgent: boolean;
  notifyOnIssueCompleted: boolean;
  notifyOnIssueAssigned: boolean;
  notifyOnCycleStarted: boolean;
  notifyOnCycleCompleted: boolean;
  dmOnAssignment: boolean;
  dmOnMention: boolean;
  dmOnDueDateApproaching: boolean;
  slashCommandsEnabled: boolean;
}

export type ChannelScope = 'default' | 'project' | 'team' | 'urgent';

export interface SlackChannelMapping {
  id: string;
  channelId: string;
  channelName: string;
  scope: ChannelScope;
  scopeId: string | null;
}

export interface AddSlackChannelInput {
  channelId: string;
  channelName: string;
  scope: ChannelScope;
  scopeId?: string;
}

export interface SlackAvailableChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
}

export interface SlackSettingsResponse {
  settings: SlackSettings;
  channels: SlackChannelMapping[];
  team: { id: string; name: string } | null;
}

// ── Discord ────────────────────────────────────────────────────

export interface DiscordSettings {
  notifyOnIssueCreatedUrgent: boolean;
  notifyOnIssueCompleted: boolean;
  notifyOnIssueAssigned: boolean;
  notifyOnStatusChange: boolean;
  notifyOnCycleStarted: boolean;
  notifyOnCycleCompleted: boolean;
  notifyOnProjectCompleted: boolean;
}

export interface DiscordWebhookMapping {
  id: string;
  url: string;
  label: string;
  scope: ChannelScope;
  scopeId: string | null;
}

export interface AddDiscordWebhookInput {
  url: string;
  label: string;
  scope: ChannelScope;
  scopeId?: string;
}

export interface ConnectDiscordInput {
  webhookUrl: string;
  label?: string;
}

export interface ConnectDiscordResponse {
  provider: 'discord';
  label: string;
}

export interface DiscordSettingsResponse {
  settings: DiscordSettings;
  webhooks: DiscordWebhookMapping[];
}

/** Validates Discord webhook URL */
export const DISCORD_WEBHOOK_REGEX =
  /^https:\/\/(?:discord\.com|discordapp\.com|discordptb\.com)\/api\/webhooks\/\d+\/.+$/;

// ── Figma ──────────────────────────────────────────────────────

export interface FigmaSettings {
  showThumbnails: boolean;
  showLastModified: boolean;
}

export interface FigmaSettingsResponse {
  settings: FigmaSettings;
  figmaUser: { handle: string; email: string } | null;
}

export interface FigmaPreview {
  fileKey: string;
  name: string;
  thumbnailUrl: string;
  lastModified: string;
  version?: string;
  editorType?: string;
  nodeId?: string | null;
  url: string;
}

export interface ConnectFigmaInput {
  accessToken: string;
}

export interface ConnectFigmaResponse {
  provider: 'figma';
  figmaUser: { handle: string; email: string };
}

/** Detects Figma file/design/proto/board URLs */
export const FIGMA_URL_REGEX =
  /https?:\/\/(www\.)?figma\.com\/(file|design|proto|board)\/[a-zA-Z0-9]+/g;

export const isFigmaUrl = (url: string): boolean =>
  /^https?:\/\/(www\.)?figma\.com\/(file|design|proto|board)\/[a-zA-Z0-9]+/.test(url);
