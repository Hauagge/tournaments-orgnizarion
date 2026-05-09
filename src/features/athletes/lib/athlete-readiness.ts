import { Athlete } from '@/features/athletes/types/athlete';

export type AthleteReadinessSummary = {
  totalAthletes: number;
  approvedAthletes: number;
  pendingWeighIn: number;
  rejectedWeighIn: number;
  canGenerateCompetitionFights: boolean;
};

export function buildAthleteReadinessSummary(
  athletes: Athlete[],
): AthleteReadinessSummary {
  const totalAthletes = athletes.length;
  const approvedAthletes = athletes.filter(
    (athlete) => athlete.weighInStatus === 'APPROVED',
  ).length;
  const pendingWeighIn = athletes.filter(
    (athlete) => athlete.weighInStatus === 'PENDING',
  ).length;
  const rejectedWeighIn = athletes.filter(
    (athlete) => athlete.weighInStatus === 'REJECTED',
  ).length;

  return {
    totalAthletes,
    approvedAthletes,
    pendingWeighIn,
    rejectedWeighIn,
    canGenerateCompetitionFights:
      approvedAthletes >= 2 && pendingWeighIn === 0,
  };
}
