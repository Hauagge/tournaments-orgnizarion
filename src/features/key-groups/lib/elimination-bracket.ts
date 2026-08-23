import { Fight } from '@/features/fights/types/fight';

const PHASE_LABELS_BY_REMAINING_ROUNDS = new Map<number, string>([
  [1, 'Final'],
  [2, 'Semifinal'],
  [3, 'Quartas'],
  [4, 'Oitavas'],
]);

export function getEliminationPhaseLabel(
  roundIndex: number,
  totalRounds: number,
) {
  const remainingRounds = totalRounds - roundIndex;
  return (
    PHASE_LABELS_BY_REMAINING_ROUNDS.get(remainingRounds) ??
    `Fase ${roundIndex + 1}`
  );
}

export function getFightAdvanceState(fight: Fight) {
  const hasWinner = Boolean(fight.winnerId);
  const advancesToNextFight = Boolean(fight.winnerId && fight.nextFightId);
  const nextFightLabel =
    advancesToNextFight && fight.nextFightId
      ? `Avança para luta ${fight.nextFightId}${
          fight.nextFightSlot ? ` · slot ${fight.nextFightSlot}` : ''
        }`
      : hasWinner
        ? 'Campeão da chave'
        : 'Aguardando resultado';

  return {
    hasWinner,
    advancesToNextFight,
    nextFightLabel,
  };
}
