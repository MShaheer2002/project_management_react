export interface AiConnection {
  id: string;
  name: string;
  client: 'codex' | 'claude_desktop' | 'cursor' | 'generic_mcp';
  authType: 'pat';
  status: 'active' | 'expired' | 'revoked';
  scopes: string[];
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateAiConnectionInput {
  name: string;
  expiresAt?: string;
  primaryClient?: 'codex' | 'claude_desktop' | 'cursor' | 'generic_mcp';
  authType?: 'pat' | 'oauth';
}

export interface AiConnectionSetupBlock {
  client: string;
  format: 'toml' | 'json' | 'guide';
  title: string;
  config?: string;
  endpoint?: string;
  authHeaderName?: string;
  authHeaderValue?: string;
  steps?: string[];
}

export interface AiConnectionCreateResponse {
  connection: AiConnection;
  token: string;
  primaryClient: string | null;
  setup: {
    codex: AiConnectionSetupBlock;
    claudeDesktop: AiConnectionSetupBlock;
    cursor: AiConnectionSetupBlock;
    genericMcp: AiConnectionSetupBlock;
  };
}

export interface AiConnectionCatalogClient {
  id: 'codex' | 'claude_desktop' | 'cursor' | 'generic_mcp';
  label: string;
  availableAuthMethods: Array<'pat' | 'oauth'>;
  supportsStreaming: boolean;
  supportsResources: boolean;
  supportsPrompts: boolean;
  supportsSampling: boolean;
  supportsNotifications: boolean;
  setupMode: 'copy_config';
}

export interface AiConnectionCatalogAuthMethod {
  type: 'pat' | 'oauth';
  label: string;
  status: 'available' | 'planned';
  implemented: boolean;
  summary: string;
  requirements: string[];
}

export interface AiConnectionCatalog {
  clients: AiConnectionCatalogClient[];
  authMethods: AiConnectionCatalogAuthMethod[];
}
