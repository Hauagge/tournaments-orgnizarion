import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Athlete, Category, Fight } from '../types';
import { groupAthletes } from '../utils/group-athlete-by-category';
import { exportAllBracketsPdf } from '../utils/export-brackets-pdf';

type CategoryStore = {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  updateCategoryFights: (name: string, fights: Array<Fight>) => void;
  updateFightsFromAthletes: (athletes: Athlete[]) => void;
  exportAll: () => void;
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
      updateFightsFromAthletes: (athletes) => {
        const updatedCategories = groupAthletes(athletes);
        if (updatedCategories) {
          set({ categories: updatedCategories.categories });
        }
      },

      exportAll: () => {
        const { categories } = get();
        if (!categories || categories.length === 0) return;
        exportAllBracketsPdf(categories, { landscape: false });
      },
    }),
    { name: 'categories-storage' },
  ),
);
