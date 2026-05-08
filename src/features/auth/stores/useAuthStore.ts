import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const AUTH_STORAGE_KEY = 'auth-session-storage';
export const AUTH_TOKEN_STORAGE_KEY = 'auth-token';

type AuthStore = {
  token: string | null;
  username: string | null;
  hasHydrated: boolean;
  setSession: (input: { token: string; username: string }) => void;
  clearSession: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      hasHydrated: false,
      setSession: ({ token, username }) => set({ token, username }),
      clearSession: () => set({ token: null, username: null }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        token: state.token,
        username: state.username,
      }),
    },
  ),
);
