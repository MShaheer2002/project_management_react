export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  duration?: number;
}

export type ModalType =
  | 'create-issue'
  | 'create-project'
  | 'create-cycle'
  | 'create-team'
  | 'create-department'
  | 'invite-member'
  | null;
