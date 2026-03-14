import { Athlete, Fight } from '../types';

export function generateFights(athletes: Athlete[]): Array<Fight> {
  const shuffled = [...athletes].sort(() => Math.random() - 0.5);
  const fights: Array<Fight> = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    const a = shuffled[i].name;
    const b = shuffled[i + 1]?.name || 'W.O.';
    fights.push({
      id: `${a}-vs-${b}`,
      athletes: [a, b],
      winner: '',
    });
  }
  return fights;
}
