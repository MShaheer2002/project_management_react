import { create } from 'zustand';
import { User, Organization } from '@/types';

interface AuthState {
  currentUser: User | null;
  organization: Organization | null;
  setCurrentUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  currentUser: null,
  organization: null,
  setCurrentUser: (currentUser) => set({ currentUser }),
  setOrganization: (organization) => set({ organization }),
  logout: () => set({ currentUser: null, organization: null }),
}));
