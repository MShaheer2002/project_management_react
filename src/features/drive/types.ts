// ── Google Drive Integration Types ──────────────────────────────

/** Where a Drive upload goes: the uploader's own Drive, or the Workspace Drive */
export type DriveTarget = 'PERSONAL' | 'WORKSPACE';

/** Status returned by GET /me/drive, for this user in the active workspace */
export interface DriveConnectionStatus {
  /** Can this user upload to some Drive here */
  connected: boolean;
  email: string | null;
  provider: string | null;
  /** Where uploads go right now, or null when no Drive is available */
  uploadTarget: DriveTarget | null;
  /** The member's own choice when both Drives exist */
  preferredTarget: DriveTarget;
  /** Owner or admin, and no Workspace Drive yet */
  canConnectWorkspace: boolean;
  personal:
    | { connected: false }
    | { connected: true; email: string; sharing: DriveSharing; sharingOptions: DriveSharing[] };
  workspace:
    | { connected: false }
    /** What members see: only that a company Drive exists */
    | { connected: true; canManage: false }
    /** Owners and admins */
    | {
        connected: true;
        canManage: true;
        email: string;
        connectedBy: { id: string; name: string };
        connectedAt: string;
        sharing: DriveSharing;
        sharingOptions: DriveSharing[];
      };
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

/**
 * Who can open a file Trussen put in someone's Google Drive (F-39).
 * PRIVATE: only the uploader · COMPANY: their Google Workspace domain · PUBLIC: anyone with the link.
 */
export type DriveSharing = 'PRIVATE' | 'COMPANY' | 'PUBLIC';

/** Sharing badge data for a Drive attachment (GET /me/drive/files?ids=) */
export interface DriveFileRecord {
  driveFileId: string;
  sharing: DriveSharing;
  target: DriveTarget;
}

/** Result of a completed Drive upload (metadata to pass to backend) */
export interface DriveUploadResult {
  driveFileId: string;
  driveUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  target: DriveTarget;
  /** What Google actually applied; PRIVATE when a share was refused */
  sharing: DriveSharing;
  sharingNotice: string | null;
}
