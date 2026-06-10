export { integrationService } from './services/integrationService';
export { useIntegrations, integrationQueryKeys } from './hooks/useIntegrationData';
export {
  useConnectIntegration,
  useDisconnectIntegration,
  useUpdateIntegrationSettings,
} from './hooks/useIntegrationMutations';
export { GitHubSettingsPanel } from './components/GitHubSettingsPanel';
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
  ProviderMeta,
  GitHubActivityType,
  GitHubActivityMetadata,
} from './types';
