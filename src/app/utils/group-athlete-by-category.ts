import { getDivisionByAge } from '../components/enums/category';
import { Athlete, BeltsEnum, Category } from '../types';

export function groupAthletes(athletes: Athlete[]): {
  categories: Category[];
  disqualified: Athlete[];
} {
  const categories: Category[] = [];
  const disqualified: Athlete[] = [];

  // helper para definir a diferença máxima de peso
  const getMaxWeightDiff = (age: number): number => {
    if (age >= 4 && age <= 7) return 3;
    if (age >= 8 && age <= 14) return 4;
    if (age >= 15 && age <= 17) return 5;
    return 5; // default
  };

  const getMaxDifferenceByAge: Record<string, number> = {
    4: 3,
    5: 3,
    6: 3,
    7: 3,
    8: 4,
    9: 4,
    10: 4,
    11: 4,
    12: 4,
    13: 4,
    14: 4,
  };

  // helper para ver se pode casar faixas
  const canMixBelts = (belt1: string, belt2: string): boolean => {
    const allowedMixes: [string, string][] = [
      [BeltsEnum.BRANCA, BeltsEnum.CINZA],
      [BeltsEnum.CINZA, BeltsEnum.AMARELA],
      [BeltsEnum.AMARELA, BeltsEnum.LARANJA],
      [BeltsEnum.LARANJA, BeltsEnum.VERDE],
      [BeltsEnum.VERDE, BeltsEnum.AZUL],
      [BeltsEnum.AZUL, BeltsEnum.ROXA],
    ];
    return (
      belt1 === belt2 ||
      allowedMixes.some(
        ([a, b]) =>
          (a === belt1 && b === belt2) || (a === belt2 && b === belt1),
      )
    );
  };

  for (const athlete of athletes) {
    const maxWeightDiff = getMaxWeightDiff(athlete.age);

    // tenta achar uma chave existente
    let assigned = false;
    for (const category of categories) {
      if (category.athletes.length >= 4) continue;

      const sample = category.athletes[0];

      const maxDiff = getMaxDifferenceByAge[athlete.age] || 5;
      const ageOk = Math.abs(sample.age - athlete.age) <= maxDiff; // mesma faixa etária aproximada
      const weightOk =
        Math.abs(sample.weight - athlete.weight) <= maxWeightDiff;
      const genderOk = sample.gender === athlete.gender; // ou pode liberar se for inclusivo
      const beltOk = canMixBelts(sample.belt, athlete.belt);

      if (ageOk && weightOk && genderOk && beltOk) {
        category.athletes.push(athlete);
        assigned = true;
        break;
      }
    }

    // se não conseguiu colocar em nenhum bracket, cria um novo
    if (!assigned) {
      if (athlete.age < 4 || athlete.age > 17) {
        disqualified.push(athlete);
      } else {
        categories.push({
          id: categories.length + 1,
          name: `Categoria ${athlete.age} anos - ${athlete.gender} - ${athlete.belt}`,
          belt: athlete.belt,
          ageDivision: {
            min: athlete.age,
            max: athlete.age,
            division: getDivisionByAge(athlete.age)!.division,
          },
          weightName: `${athlete.weight}kg`,
          minWeight: athlete.weight,
          maxWeight: athlete.weight,
          athletes: [athlete],
        });
      }
    }
  }

  return { categories, disqualified };
}
