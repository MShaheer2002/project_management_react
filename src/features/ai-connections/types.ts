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
  rotatedAt: string | null;
  requestCount: number;
  toolCallCount: number;
  createdBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  endpoint: string;
  verification: {
    lastVerifiedAt: string | null;
    status: 'ready' | 'warning' | 'error' | null;
    message: string | null;
    checks: Array<{
      key: string;
      label: string;
      status: 'pass' | 'warn' | 'fail';
      message: string;
    }>;
  };
  health: {
    status: 'ready' | 'warning' | 'error';
    canConnect: boolean;
    checks: Array<{
      key: string;
      label: string;
      status: 'pass' | 'warn' | 'fail';
      message: string;
    }>;
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
  supportsPAT: boolean;
  supportsOAuth: boolean;
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

export interface AiConnectionHealthResponse {
  connection: AiConnection;
  diagnostics: {
    endpoint: string;
    canConnect: boolean;
    status: 'ready' | 'warning' | 'error';
    checks: Array<{
      key: string;
      label: string;
      status: 'pass' | 'warn' | 'fail';
      message: string;
    }>;
    verificationPrompt: string;
  };
}

export interface AiConnectionSession {
  id: string;
  client: 'codex' | 'claude_desktop' | 'cursor' | 'generic_mcp';
  authType: 'pat';
  transport: string;
  status: 'active' | 'succeeded' | 'failed' | 'rejected';
  requestCount: number;
  toolCallCount: number;
  startedAt: string;
  lastActivityAt: string;
  completedAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  steps: Array<{
    id: string;
    toolName: string;
    status: string;
    errorMessage: string | null;
    startedAt: string;
    completedAt: string | null;
  }>;
}
