export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type ModalType =
  | 'create-issue'
  | 'create-project'
  | 'create-cycle'
  | 'create-team'
  | 'create-department'
  | 'invite-member'
  | 'generate-api-key'
  | null;
