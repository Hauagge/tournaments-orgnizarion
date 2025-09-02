'use client';

import { useEffect } from 'react';
import { Athlete } from '../dashboard';
import { useCategoryStore } from '../store/useCategoryStore';
import { generateFights } from '../utils/generate-fight';

export const useCategorizeAthletesToBrackets = (athletes: Athlete[]) => {
  const { categories, setCategories } = useCategoryStore();
  useEffect(() => {
    const updated = categories.map((category) => {
      const filtered = athletes.filter((a) => {
        const ageOk =
          a.age >= category.ageDivision.min &&
          a.age <= category.ageDivision.max;
        const weightOk =
          a.weight >= (category.minWeight || 0) &&
          a.weight <= category.maxWeight;
        const beltOk = a.belt === category.belt;

        return ageOk && weightOk && beltOk;
      });

      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      const fights = generateFights(shuffled);

      return {
        ...category,
        fights,
      };
    });

    setCategories(updated);
  }, [athletes]);
};
