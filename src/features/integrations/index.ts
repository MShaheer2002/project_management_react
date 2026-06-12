export { integrationService } from './services/integrationService';
export { useIntegrations, useIntegrationSettings, useSlackChannels, integrationQueryKeys } from './hooks/useIntegrationData';
export {
  useConnectIntegration,
  useDisconnectIntegration,
  useUpdateIntegrationSettings,
} from './hooks/useIntegrationMutations';
export { GitHubSettingsPanel } from './components/GitHubSettingsPanel';
export { SlackSettingsPanel } from './components/SlackSettingsPanel';
export { IssueGitHubActivity } from './components/IssueGitHubActivity';
export {
  PROVIDER_META,
  GITHUB_ACTIVITY_TYPES,
} from './types';
export type {
  IntegrationItem,
  IntegrationProvider,
  GitHubConnectResponse,
  GitHubSettings,
  UpdateGitHubSettingsInput,
  SlackChannel,
  SlackChannelMapping,
  SlackChannelRouting,
  SlackSettings,
  UpdateSlackSettingsInput,
  UpdateIntegrationSettingsInput,
  ProviderMeta,
  GitHubActivityType,
  GitHubActivityMetadata,
} from './types';
