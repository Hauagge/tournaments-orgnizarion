import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Athlete } from '../types';
import { DeepPartial } from '../utils/buildAthletePatch';

type AthleteStore = {
  athletes: Athlete[];
  addAthlete: (athlete: Athlete) => void;
  setAthletes: (list: Athlete[]) => void;
  clearAthletes: () => void;
  updateAthlete: (athlete: Athlete) => void;
  updateAthletePartial: (id: number, updates: DeepPartial<Athlete>) => void;
  deleteAthlete: (id: number) => void;
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
      updateAthletePartial: (id: number, updates: DeepPartial<Athlete>) =>
        set((s) => {
          const next = s.athletes.map((a) => {
            if (a.id !== id) return a;

            const merged: Athlete = {
              ...a,
              ...updates,
              category: updates.category
                ? { ...a.category, ...updates.category }
                : a.category,
            };

            return merged;
          });
          return { athletes: next };
        }),
      deleteAthlete: (id: number) =>
        set((s) => ({
          athletes: s.athletes.filter((a) => a.id !== id),
        })),
    }),

    {
      name: 'athletes-storage',
    },
  ),
);
