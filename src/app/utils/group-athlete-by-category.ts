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
    15: 5,
    16: 5,
    17: 5,
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
  const globallyAssigned = new Set<number>();

  const randomizedAthletes = athletes.sort(() => Math.random() - 0.5);
  for (const athlete of randomizedAthletes) {
    if (!athlete.id) continue;

    const ageTol = getMaxDifferenceByAge[athlete.age] ?? 5;
    const maxWeightDiff = getMaxWeightDiff(athlete.age);

    if (globallyAssigned.has(athlete.id)) continue;

    // tenta achar uma chave existente
    let assigned = false;
    for (const category of categories) {
      if (category.athletes.length >= 4) continue;

      const sample = category.athletes[0];

      const ageOk = Math.abs(sample.age - athlete.age) <= ageTol; // mesma faixa etária aproximada
      const weightOk =
        Math.abs(sample.weight - athlete.weight) <= maxWeightDiff;
      const genderOk = sample.gender === athlete.gender; // ou pode liberar se for inclusivo
      const beltOk = canMixBelts(sample.belt, athlete.belt);

      if (!(ageOk && weightOk && genderOk && beltOk)) continue;
      const alreadyInCategory = category.athletes.some(
        (a) => a.id === athlete.id,
      );
      if (alreadyInCategory) {
        assigned = true; // já estava nessa categoria
        break;
      }

      category.athletes.push(athlete);
      category.minWeight = Math.min(
        category?.minWeight || Infinity,
        athlete.weight,
      );
      category.maxWeight = Math.max(category.maxWeight, athlete.weight);
      category.weightName =
        category.minWeight === category.maxWeight
          ? `${category.minWeight}kg`
          : `${category.minWeight}–${category.maxWeight}kg`;
      globallyAssigned.add(athlete.id);
      category.ageDivision.min = Math.min(
        category.ageDivision.min,
        athlete.age,
      );
      category.ageDivision.max = Math.max(
        category.ageDivision.max,
        athlete.age,
      );
      assigned = true;
      break;
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

        globallyAssigned.add(athlete.id);
      }
    }

    const removeCategoryIfEmpty = (category: Category) => {
      if (category.athletes.length === 0) {
        const index = categories.indexOf(category);
        if (index > -1) {
          categories.splice(index, 1);
        }
      }
    };

    // limpa categorias vazias (caso tenha removido algum atleta no futuro)
    categories.forEach(removeCategoryIfEmpty);
  }

  return { categories, disqualified };
}
