import { BracketCategory } from '../components/Cards';

export const useSeparateBracketByAgeGroup = (brackets: BracketCategory[]) => {
  const getAgeGroup = (bracket: BracketCategory) => {
    if (!bracket.category) return 'ADULTO'; // Default to ADULTO if no category
    if (bracket?.category?.ageDivision.max <= 10) return 'INFANTIL';
    if (bracket?.category?.ageDivision.max <= 18) return 'JUVENIL';
    return 'ADULTO';
  };

  const orderedByAge = (brackets: BracketCategory[]) => {
    return brackets.sort((a, b) => {
      const ageA = getAgeGroup(a);
      const ageB = getAgeGroup(b);
      if (ageA === ageB)
        return a.category?.ageDivision.max - b.category?.ageDivision.max; // Sort by maxAge if age groups are the same

      const ageOrder = {
        INFANTIL: 1,
        JUVENIL: 2,
        ADULTO: 3,
      };
      return ageOrder[ageA] - ageOrder[ageB];
    });
  };
  const infantil = orderedByAge(
    brackets.filter((b) => getAgeGroup(b) === 'INFANTIL'),
  );
  const juvenil = orderedByAge(
    brackets.filter((b) => getAgeGroup(b) === 'JUVENIL'),
  );
  const adulto = orderedByAge(
    brackets.filter((b) => getAgeGroup(b) === 'ADULTO'),
  );
  return { infantil, juvenil, adulto };
};
