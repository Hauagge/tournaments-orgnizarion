import { useMemo } from 'react';
import {
  CATEGORIES_BY_AGE_WEIGHT,
  getAgeDivisionByName,
  getBeltsForCategory,
} from '../components/enums/category';
import { AgeDivision } from '../components/enums/category';
import { Category } from '../types';

export const useGenerateCategories = () => {
  const categories = useMemo(() => {
    const result: Category[] = [];

    (Object.keys(CATEGORIES_BY_AGE_WEIGHT) as Array<AgeDivision>).forEach(
      (ageDivision) => {
        const belts = getBeltsForCategory(ageDivision);
        belts.forEach((belt) => {
          const weights = CATEGORIES_BY_AGE_WEIGHT[ageDivision];
          const division = getAgeDivisionByName(ageDivision);

          Object.entries(weights).forEach(([weightName, maxWeight]) => {
            const categoryName = `${belt} - ${ageDivision} - ${weightName}`;
            result.push({
              id: result.length + 1, // Simple ID generation
              name: categoryName,
              belt,
              ageDivision: {
                division: ageDivision,
                min: division?.min || 0,
                max: division?.max || 0,
              },
              weightName,
              maxWeight: Number(maxWeight),
              fights: [],
            });
          });
        });
      },
    );

    return result;
  }, []);
  return {
    categories,
  };
};
