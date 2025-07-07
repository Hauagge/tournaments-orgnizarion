import { BracketCategory } from '../components/Cards';
import { Athlete } from '../dashboard';

export const useCategorizeAthletesToBrackets = (
  brackets: BracketCategory[],
  athletes: Athlete[],
): Array<BracketCategory> => {
  return brackets
    .map((bracket) => {
      const { category } = bracket;
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

      const fights: Array<[string, string]> = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        const a = shuffled[i];
        const b = shuffled[i + 1] || { name: 'W.O.' };
        fights.push([a.name, b.name]);
      }

      return {
        ...bracket,
        fights,
      };
    })
    .filter((bracket) => bracket !== undefined);
};
