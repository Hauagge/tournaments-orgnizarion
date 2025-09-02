import { Category } from '../types';

export const useSeparateBracketByAgeGroup = (
  categories: Category[] = [],
  showOnlyWithFights: boolean = false,
) => {
  type AgeGroup = 'INFANTIL' | 'JUVENIL' | 'ADULTO';

  const getAgeGroup = (category: Category): AgeGroup => {
    const max = category?.ageDivision?.max;
    if (typeof max !== 'number') return 'ADULTO';
    if (max <= 10) return 'INFANTIL';
    if (max <= 18) return 'JUVENIL';
    return 'ADULTO';
  };

  const grouped = categories.reduce<Record<AgeGroup, Category[]>>(
    (acc, bracket) => {
      const group = getAgeGroup(bracket);
      acc[group].push(bracket);
      return acc;
    },
    { INFANTIL: [], JUVENIL: [], ADULTO: [] },
  );

  const sortByMaxAge = (arr: Category[]) =>
    arr.slice().sort((a, b) => {
      const maxA = a?.ageDivision?.max ?? Infinity;
      const maxB = b?.ageDivision?.max ?? Infinity;
      return maxA - maxB;
    });

  const filterWithFights = (arr: Category[]) =>
    showOnlyWithFights ? arr.filter((b) => b.fights) : arr;

  return {
    infantil: sortByMaxAge(filterWithFights(grouped.INFANTIL)),
    juvenil: sortByMaxAge(filterWithFights(grouped.JUVENIL)),
    adulto: sortByMaxAge(filterWithFights(grouped.ADULTO)),
  };
};
