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
  updateCategoryBounds: (c: Category) => void;
  removeFromCategory: (athleteId: number) => void;
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
      updateCategoryBounds: (c: Category) => {
        const ws = c.athletes.map((x: Athlete) => Number(x.weight));
        c.minWeight = ws.length ? Math.min(...ws) : 0;
        c.maxWeight = ws.length ? Math.max(...ws) : 0;
        c.weightName =
          c.minWeight === c.maxWeight
            ? `${c.minWeight}kg`
            : `${c.minWeight}–${c.maxWeight}kg`;
        const ages = c.athletes.map((x: Athlete) => Number(x.age));
        if (ages.length) {
          c.ageDivision.min = Math.min(c.ageDivision.min, ...ages);
          c.ageDivision.max = Math.max(c.ageDivision.max, ...ages);
        }
      },
      removeFromCategory: (athleteId: number) => {
        const next = get().categories.map((c: Category) => ({
          ...c,
          athletes: [...c.athletes],
        }));
        let touched = false;
        for (const c of next) {
          const before = c.athletes.length;
          c.athletes = c.athletes.filter((a: Athlete) => a.id !== athleteId);
          if (c.athletes.length !== before) {
            touched = true;
            get().updateCategoryBounds(c);
          }
        }
        if (touched && get().setCategories) get().setCategories(next);
      },
    }),
    { name: 'categories-storage' },
  ),
);
