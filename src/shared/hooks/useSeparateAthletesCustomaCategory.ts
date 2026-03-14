import { Category } from '../types';

export const useSeparateBracketByAgeGroup = (categories: Category[]) => {
  type AgeGroup = 'INFANTIL' | 'JUVENIL';

  const orderByAge = (a: Category, b: Category) =>
    a.ageDivision.max - b.ageDivision.max;

  const athletesSorted = categories.slice().sort(orderByAge);

  const grouped = athletesSorted.reduce<Record<AgeGroup, Category[]>>(
    (acc, cat) => {
      const age = cat.ageDivision.max;
      const group: AgeGroup = age <= 10 ? 'INFANTIL' : 'JUVENIL';
      acc[group].push(cat);
      return acc;
    },
    { INFANTIL: [], JUVENIL: [] },
  );

  return {
    infantil: grouped.INFANTIL,
    juvenil: grouped.JUVENIL,
  };
};
