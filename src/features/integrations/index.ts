// Services
export {
  integrationService,
  githubService,
  slackService,
  discordService,
  figmaService,
} from './services/integrationService';

// Query hooks
export {
  integrationQueryKeys,
  useIntegrations,
  useGitHubSettings,
  useSlackSettings,
  useSlackAvailableChannels,
  useDiscordSettings,
  useFigmaSettings,
  useFigmaPreview,
  useFigmaBatchPreview,
} from './hooks/useIntegrationData';

// Mutation hooks
export {
  useDisconnectIntegration,
  useConnectGitHub,
  useUpdateGitHubSettings,
  useConnectSlack,
  useUpdateSlackSettings,
  useAddSlackChannel,
  useRemoveSlackChannel,
  useConnectDiscord,
  useUpdateDiscordSettings,
  useAddDiscordWebhook,
  useRemoveDiscordWebhook,
  useConnectFigma,
  useUpdateFigmaSettings,
} from './hooks/useIntegrationMutations';

// Components
export { GitHubSettingsPanel } from './components/GitHubSettingsPanel';
export { SlackSettingsPanel } from './components/SlackSettingsPanel';
export { DiscordConnectModal } from './components/DiscordConnectModal';
export { DiscordSettingsPanel } from './components/DiscordSettingsPanel';
export { FigmaConnectModal } from './components/FigmaConnectModal';
export { FigmaSettingsPanel } from './components/FigmaSettingsPanel';
export { IssueFigmaDesigns } from './components/IssueFigmaDesigns';
export { IssueGitHubActivity } from './components/IssueGitHubActivity';

// Constants
export {
  PROVIDER_META,
  GITHUB_ACTIVITY_TYPES,
  DISCORD_WEBHOOK_REGEX,
  FIGMA_URL_REGEX,
  isFigmaUrl,
} from './types';

// Types
export type {
  IntegrationItem,
  IntegrationProvider,
  ProviderMeta,
  // GitHub
  GitHubConnectResponse,
  GitHubSettings,
  GitHubSettingsResponse,
  GitHubActivityType,
  GitHubActivityMetadata,
  // Slack
  SlackSettings,
  SlackSettingsResponse,
  SlackChannelMapping,
  SlackAvailableChannel,
  AddSlackChannelInput,
  ChannelScope,
  // Discord
  DiscordSettings,
  DiscordSettingsResponse,
  DiscordWebhookMapping,
  AddDiscordWebhookInput,
  ConnectDiscordInput,
  ConnectDiscordResponse,
  // Figma
  FigmaSettings,
  FigmaSettingsResponse,
  FigmaPreview,
  ConnectFigmaInput,
  ConnectFigmaResponse,
} from './types';
