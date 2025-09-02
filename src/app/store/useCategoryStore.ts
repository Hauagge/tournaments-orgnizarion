import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Athlete, Category, Fight } from '../types';
import { updateBracketsWithFights } from '../utils/udpate-brackets';

type CategoryStore = {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  updateCategoryFights: (name: string, fights: Array<Fight>) => void;
  updateFightsFromAthletes: (athletes: Athlete[]) => void;
};

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      categories: [],
      setCategories: (categories) => set({ categories }),
      updateCategoryFights: (name, fights) => {
        const updated = get().categories.map((cat) =>
          cat.name === name ? { ...cat, fights } : cat,
        );
        set({ categories: updated });
      },
      updateFightsFromAthletes: (athletes) =>
        updateBracketsWithFights(athletes),
    }),
    { name: 'categories-storage' },
  ),
);
