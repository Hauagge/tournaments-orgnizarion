import { useMemo } from 'react';
import {
  AgeDivisionRange,
  CATEGORIES_BY_AGE_WEIGHT,
  getAgeDivisionByName,
} from '../components/enums/category';
import { AgeDivision } from '../components/enums/category';

const belts = ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'];

export type Category = {
  name: string;
  belt: string;
  ageDivision: AgeDivisionRange;
  weightName: string;
  minWeight?: number;
  maxWeight: number;
  fights: Array<[string, string]>; // Inicialmente vazio
};

export const useGenerateCategories = () => {
  const categories = useMemo(() => {
    const result: Category[] = [];

    belts.forEach((belt) => {
      (Object.keys(CATEGORIES_BY_AGE_WEIGHT) as Array<AgeDivision>).forEach(
        (ageDivision) => {
          const weights = CATEGORIES_BY_AGE_WEIGHT[ageDivision];

          const division = getAgeDivisionByName(ageDivision);

          Object.entries(weights).forEach(([weightName, maxWeight]) => {
            const categoryName = `${belt} - ${ageDivision} - ${weightName}`;
            result.push({
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
        },
      );
    });

    return result;
  }, []);

  return {
    categories,
  };
};
