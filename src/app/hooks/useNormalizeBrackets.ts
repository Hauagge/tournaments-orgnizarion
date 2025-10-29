import { Athlete } from '../types';

export const useBalanceBrackets = (brackets: Athlete[][]) => {
  const mergeSingleAthleteBrackets = (brackets: Athlete[][]) => {
    for (const bracket of brackets) {
      if (bracket.length === 1) {
        const findClosestAthleteByAge = (age: number) => {
          let closestAthlete: Athlete | null = null;
          let smallestAgeDiff = Infinity;

          for (const candidateBracket of brackets) {
            if (candidateBracket.length > 1) {
              const diff = Math.abs(candidateBracket[0].age - age);
              if (diff < smallestAgeDiff) {
                smallestAgeDiff = diff;
                closestAthlete = candidateBracket[0];
              }
            }
          }
          return closestAthlete;
        };

        const matchedAthlete = findClosestAthleteByAge(bracket[0].age);
        if (!matchedAthlete) continue;

        // adiciona o atleta mais próximo
        bracket.push(matchedAthlete);

        // remove o atleta de onde ele estava originalmente
        const index = brackets.findIndex((b) => b.includes(matchedAthlete));
        if (index !== -1) {
          brackets.splice(index, 1);
        }
      }
    }
  };

  mergeSingleAthleteBrackets(brackets);
};
