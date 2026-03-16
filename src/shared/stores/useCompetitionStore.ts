import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CompetitionStore = {
  activeCompetitionId: string | null;
  hasHydrated: boolean;
  setActiveCompetitionId: (competitionId: string | null) => void;
  clearActiveCompetitionId: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useCompetitionStore = create<CompetitionStore>()(
  persist(
    (set) => ({
      activeCompetitionId: null,
      hasHydrated: false,
      setActiveCompetitionId: (competitionId) =>
        set({ activeCompetitionId: competitionId }),
      clearActiveCompetitionId: () => set({ activeCompetitionId: null }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'active-competition-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
