import { Athlete } from '../dashboard';

export function sortCategories(categories: string[], athletes: Array<Athlete>) {
  return categories.sort((a, b) => {
    const athletesA = athletes.filter((at) => at.category?.name === a);
    const athletesB = athletes.filter((at) => at.category?.name === b);

    const avgAgeA =
      athletesA.reduce((acc, curr) => acc + curr.age, 0) /
      (athletesA.length || 1);
    const avgAgeB =
      athletesB.reduce((acc, curr) => acc + curr.age, 0) /
      (athletesB.length || 1);

    if (avgAgeA !== avgAgeB) {
      return avgAgeA - avgAgeB; // Ordena por idade crescente
    }

    const avgWeightA =
      athletesA.reduce((acc, curr) => acc + curr.weight, 0) /
      (athletesA.length || 1);
    const avgWeightB =
      athletesB.reduce((acc, curr) => acc + curr.weight, 0) /
      (athletesB.length || 1);

    return avgWeightA - avgWeightB; // Se idade igual, ordena por peso crescente
  });
}
