import { Athlete } from '../dashboard';
import { Category } from '../types';
import { generateFights } from './generate-fight';
import { groupAthletesByCategory } from './group-athlete-by-category';

export function updateBracketsWithFights(athletes: Athlete[]) {
  const stored = localStorage.getItem('all-brackets');
  if (!stored) return;

  const categories = JSON.parse(stored);
  const groupedAthletes = groupAthletesByCategory(athletes);

  const updated = categories.map((bracket: Category) => {
    const athletesInCategory = groupedAthletes[bracket.name] || [];
    return {
      ...bracket,
      fights: generateFights(athletesInCategory),
    };
  });

  localStorage.setItem('all-brackets', JSON.stringify(updated));
}
