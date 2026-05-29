import { create } from 'zustand';

import type { AppUser } from '../types/models';

type AuthState = {
  initializing: boolean;
  user: AppUser | null;
  setInitializing: (initializing: boolean) => void;
  setUser: (user: AppUser | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  initializing: true,
  user: null,
  setInitializing: (initializing) => set({ initializing }),
  setUser: (user) => set({ user }),
}));
