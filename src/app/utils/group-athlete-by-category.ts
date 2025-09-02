import { Athlete } from '../dashboard';

export function groupAthletesByCategory(athletes: Athlete[]) {
  const grouped: Record<string, Athlete[]> = {};
  for (const athlete of athletes) {
    if (!athlete.category) continue; // Skip athletes without a category
    if (!grouped[athlete.category?.name]) grouped[athlete.category.name] = [];
    grouped[athlete.category.name].push(athlete);
  }
  return grouped;
}
