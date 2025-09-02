import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Athlete } from '@/app/dashboard';

type AthleteStore = {
  athletes: Athlete[];
  addAthlete: (athlete: Athlete) => void;
  setAthletes: (list: Athlete[]) => void;
  clearAthletes: () => void;
  updateAthlete: (athlete: Athlete) => void;
};

export const useAthleteStore = create<AthleteStore>()(
  persist(
    (set, get) => ({
      athletes: [],
      addAthlete: (athlete) =>
        set((state) => ({
          athletes: [...state.athletes, athlete],
        })),
      setAthletes: (list) => set({ athletes: list }),
      clearAthletes: () => set({ athletes: [] }),
      updateAthlete: (updatedAthlete) =>
        set({
          athletes: get().athletes.map((a) =>
            a.id === updatedAthlete.id ? updatedAthlete : a,
          ),
        }),
    }),
    {
      name: 'athletes-storage', // nome da chave no localStorage
    },
  ),
);
