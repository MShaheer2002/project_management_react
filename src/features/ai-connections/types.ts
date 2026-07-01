export interface AiConnection {
  id: string;
  name: string;
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
