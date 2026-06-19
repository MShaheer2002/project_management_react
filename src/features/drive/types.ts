// ── Google Drive Integration Types ──────────────────────────────

/** Connection status returned by GET /me/drive */
export interface DriveConnectionStatus {
  connected: boolean;
  email: string | null;
  provider: string | null;
  connectedAt?: string;
}

/** Response from POST /me/drive/connect */
export interface DriveConnectResponse {
  authUrl: string;
}

/** Folder hierarchy context for organizing uploads in the user's Drive */
export interface DriveFolderContext {
  workspaceName?: string;
  teamName?: string;
  projectName?: string;
  issueIdentifier?: string;
}

/** Result of a completed Drive upload (metadata to pass to backend) */
export interface DriveUploadResult {
  driveFileId: string;
  driveUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}
