import { describe, expect, it } from 'vitest';
import {
  getEliminationPhaseLabel,
  getFightAdvanceState,
} from '@/features/key-groups/lib/elimination-bracket';
import { Fight } from '@/features/fights/types/fight';

function fight(overrides: Partial<Fight>): Fight {
  return {
    id: '1',
    competitionId: '1',
    status: 'PENDING',
    categoryId: null,
    categoryName: '',
    keyGroupId: '1',
    keyGroupName: 'Adulto Azul Leve',
    round: 1,
    order: 1,
    areaId: null,
    areaName: '',
    athleteA: null,
    athleteB: null,
    winner: null,
    winnerId: null,
    loser: null,
    loserId: null,
    winType: '',
    nextFightId: null,
    nextFightSlot: null,
    createdManually: false,
    createdAt: null,
    updatedAt: null,
    scheduledAt: null,
    startedAt: null,
    finishedAt: null,
    teamMatchId: null,
    teamMatchName: '',
    teamAName: '-',
    teamBName: '-',
    ...overrides,
  };
}

describe('elimination bracket helpers', () => {
  it('nomeia fases eliminatórias a partir da distância até a final', () => {
    expect(getEliminationPhaseLabel(0, 4)).toBe('Oitavas');
    expect(getEliminationPhaseLabel(1, 4)).toBe('Quartas');
    expect(getEliminationPhaseLabel(2, 4)).toBe('Semifinal');
    expect(getEliminationPhaseLabel(3, 4)).toBe('Final');
    expect(getEliminationPhaseLabel(0, 2)).toBe('Semifinal');
    expect(getEliminationPhaseLabel(1, 2)).toBe('Final');
  });

  it('identifica avanço visual do vencedor para a próxima luta', () => {
    expect(
      getFightAdvanceState(
        fight({ winnerId: '101', nextFightId: '9', nextFightSlot: 'A' }),
      ),
    ).toEqual({
      hasWinner: true,
      advancesToNextFight: true,
      nextFightLabel: 'Avança para luta 9 · slot A',
    });
  });
});
