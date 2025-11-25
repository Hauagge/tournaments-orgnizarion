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
    4: 1,
    5: 1,
    6: 1,
    7: 1,
    8: 1,
    9: 1,
    10: 1,
    11: 1,
    12: 1,
    13: 1,
    14: 1,
    15: 1,
    16: 1,
    17: 1,
  };

  const differenceByAgeThirdTry: Record<string, number> = {
    4: 2,
    5: 2,
    6: 2,
    7: 2,
    8: 2,
    9: 2,
    10: 2,
    11: 2,
    12: 2,
    13: 2,
    14: 2,
    15: 2,
    16: 2,
    17: 2,
  };

  const differenceByWeightThirdTry: Record<string, number> = {
    4: 3,
    5: 3,
    6: 3,
    7: 3,
    8: 3,
    9: 3,
    10: 4,
    11: 4,
    12: 4,
    13: 4,
    14: 4,
    15: 4,
    16: 4,
    17: 4,
  };

  // helper para ver se pode casar faixas
  const canMixBelts = (belt1: string, belt2: string): boolean => {
    const allowedMixes: [string, string][] = [
      [BeltsEnum.BRANCA, BeltsEnum.BRANCA],
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

  const randomizedAthletes = [...athletes.sort(() => Math.random() - 0.5)];
  for (const athlete of randomizedAthletes) {
    if (!athlete.id) continue;
    const maxWeightDiff = getMaxWeightDiff(athlete.age);
    const ageDifferenceAthlete = getMaxDifferenceByAge[athlete.age] ?? 5;

    if (globallyAssigned.has(athlete.id)) continue;

    // tenta achar uma chave existente
    let assigned = false;
    for (const category of categories) {
      if (category.athletes.length >= 4) continue;
      const categoryMinAge = category.ageDivision.min || Infinity;
      const ageDifferenceCategory = getMaxDifferenceByAge[categoryMinAge] ?? 5;

      const ageTol = Math.min(ageDifferenceCategory, ageDifferenceAthlete);

      // const smallerAgeFromCategory = Math.min(
      //   category.ageDivision.max,
      //   athlete.age,
      // );

      const biggerWeightFromCategory = Math.max(
        ...category.athletes.map((a) => a.weight),
      );

      const smallerWeightFromCategory = Math.min(
        ...category.athletes.map((a) => a.weight),
      );

      const sample = category.athletes[0];
      if (!sample) continue;

      const ageOk =
        Math.abs(category.ageDivision.max - athlete.age) <= ageTol &&
        Math.abs(category.ageDivision.min - athlete.age) <= ageTol; // mesma faixa etária aproximada
      const weightOk =
        Math.abs(biggerWeightFromCategory - athlete.weight) <= maxWeightDiff &&
        Math.abs(smallerWeightFromCategory - athlete.weight) <= maxWeightDiff; // mesma faixa de peso aproximada
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

  const removeAthleteFromCategory = (athleteId: number) => {
    for (const category of categories) {
      const index = category.athletes.findIndex((a) => a.id === athleteId);
      if (index > -1) {
        category.athletes.splice(index, 1);
        break;
      }
    }
  };
  const findCandidatesForCategoryWithOneAthlete = (category: Category) => {
    if (category.athletes.length !== 1) return;

    const athleteInCategory = category.athletes[0];
    const ageTol = getMaxDifferenceByAge[athleteInCategory.age] ?? 5;
    const maxWeightDiff = getMaxWeightDiff(athleteInCategory.age);
    let bestMatch: Athlete | null = null;
    for (const athlete of randomizedAthletes) {
      if (!athlete.id || athlete.id === athleteInCategory.id) continue;

      const ageOk = Math.abs(athleteInCategory.age - athlete.age) <= ageTol;
      const weightOk =
        Math.abs(athleteInCategory.weight - athlete.weight) <= maxWeightDiff;
      const genderOk = athleteInCategory.gender === athlete.gender;
      const beltOk = canMixBelts(athleteInCategory.belt, athlete.belt);

      if (ageOk && weightOk && genderOk && beltOk) {
        const currentCategory = categories.find((cat) =>
          cat.athletes.some((a) => a.id === athlete.id),
        );

        if (currentCategory && currentCategory.athletes.length <= 2) {
          continue; //categoria com quantidade minima de atletas
        }

        if (bestMatch) {
          const bestDiff =
            Math.abs(athleteInCategory.weight - bestMatch.weight) +
            Math.abs(athleteInCategory.age - bestMatch.age);
          const currentDiff =
            Math.abs(athleteInCategory.weight - athlete.weight) +
            Math.abs(athleteInCategory.age - athlete.age);
          if (currentDiff < bestDiff) {
            bestMatch = athlete;
          }
        } else {
          bestMatch = athlete;
        }
      }
    }
    if (bestMatch) {
      removeAthleteFromCategory(bestMatch.id!);
      category.athletes.push(bestMatch!);
      category.minWeight = Math.min(
        category?.minWeight || Infinity,
        bestMatch.weight,
      );
      category.maxWeight = Math.max(category.maxWeight, bestMatch.weight);
      category.weightName =
        category.minWeight === category.maxWeight
          ? `${category.minWeight}kg`
          : `${category.minWeight}–${category.maxWeight}kg`;
      globallyAssigned.add(bestMatch.id!);
      category.ageDivision.min = Math.min(
        category.ageDivision.min,
        bestMatch.age,
      );
      category.ageDivision.max = Math.max(
        category.ageDivision.max,
        bestMatch.age,
      );
    }
  };

  const removeCategoryIfEmpty = (category: Category) => {
    if (category.athletes.length === 0) {
      const index = categories.indexOf(category);
      if (index > -1) {
        categories.splice(index, 1);
      }
    }
  };

  const thirdTryToFindCandidatesForCategoryWithOneAthlete = (
    category: Category,
  ) => {
    if (category.athletes.length !== 1) return;

    const athleteInCategory = category.athletes[0];
    const ageTol = differenceByAgeThirdTry[athleteInCategory.age] ?? 5;
    const maxWeightDiff = differenceByWeightThirdTry[athleteInCategory.age];
    const MAX_EXTRA_TOL = 10;
    const STEP = 1;

    const candidateCategories = categories.filter((cat) => {
      if (cat.id === category.id) return false;
      if (cat.athletes.length >= 4) return false;
      const sample = cat.athletes[0];
      if (!sample) return false;

      const genderOk = sample.gender === athleteInCategory.gender;
      const beltOk = canMixBelts(sample.belt, athleteInCategory.belt);
      const ageOk =
        athleteInCategory.age >= cat.ageDivision.min - ageTol &&
        athleteInCategory.age <= cat.ageDivision.max + ageTol;

      return ageOk && genderOk && beltOk;
    });

    if (!candidateCategories.length) return;

    const distToInterval = (w: number, min: number, max: number) => {
      if (w < min) return min - w;
      if (w > max) return w - max;
      return 0;
    };

    for (let extra = 0; extra <= MAX_EXTRA_TOL; extra += STEP) {
      const tol = maxWeightDiff + extra;
      let bestMatch: { category: Category; dist: number } | null = null;

      for (const cat of candidateCategories) {
        const biggerWeightFromCategory = Math.max(
          ...cat.athletes.map((a) => a.weight),
        );

        const smallerWeightFromCategory = Math.min(
          ...cat.athletes.map((a) => a.weight),
        );

        const distance = distToInterval(
          athleteInCategory.weight,
          smallerWeightFromCategory,
          biggerWeightFromCategory,
        );

        if (distance <= tol) {
          if (!bestMatch || distance < bestMatch.dist) {
            bestMatch = { category: cat, dist: distance };
          }
        }
      }

      if (bestMatch) {
        const target = bestMatch.category;
        removeAthleteFromCategory(athleteInCategory.id!);
        target.athletes.push(athleteInCategory);
        target.minWeight = Math.min(
          target?.minWeight || Infinity,
          athleteInCategory.weight,
        );
        target.maxWeight = Math.max(target.maxWeight, athleteInCategory.weight);
        target.weightName =
          target.minWeight === target.maxWeight
            ? `${target.minWeight}kg`
            : `${target.minWeight}–${target.maxWeight}kg`;
        globallyAssigned.add(athleteInCategory.id!);
        target.ageDivision.min = Math.min(
          target.ageDivision.min,
          athleteInCategory.age,
        );
        target.ageDivision.max = Math.max(
          target.ageDivision.max,
          athleteInCategory.age,
        );
        removeCategoryIfEmpty(category);
      }
    }
  };

  categories.forEach(findCandidatesForCategoryWithOneAthlete);
  categories.forEach(thirdTryToFindCandidatesForCategoryWithOneAthlete);
  categories.forEach(removeCategoryIfEmpty);

  return { categories, disqualified };
}
