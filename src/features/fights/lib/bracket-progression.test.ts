import { describe, expect, it } from 'vitest';
import { advanceWinnerThroughBracket } from '@/features/fights/lib/bracket-progression';
import { Fight } from '@/features/fights/types/fight';

function buildFight(partial: Partial<Fight>): Fight {
  return {
    id: partial.id ?? crypto.randomUUID(),
    competitionId: 'comp-1',
    status: 'PENDING',
    categoryId: 'cat-1',
    categoryName: 'Adulto Leve',
    keyGroupId: 'kg-1',
    keyGroupName: 'Chave 1',
    round: 1,
    order: 1,
    queuePosition: null,
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
    ...partial,
  };
}

describe('advanceWinnerThroughBracket', () => {
  it('avança vencedores para a luta seguinte existente', () => {
    const fights = [
      buildFight({
        id: 'fight-1',
        order: 1,
        athleteA: { id: 'a', name: 'Atleta A' } as Fight['athleteA'],
        athleteB: { id: 'b', name: 'Atleta B' } as Fight['athleteB'],
        nextFightId: 'fight-3',
        nextFightSlot: 'A',
      }),
      buildFight({
        id: 'fight-2',
        order: 2,
        athleteA: { id: 'c', name: 'Atleta C' } as Fight['athleteA'],
        athleteB: { id: 'd', name: 'Atleta D' } as Fight['athleteB'],
        nextFightId: 'fight-3',
        nextFightSlot: 'B',
      }),
      buildFight({
        id: 'fight-3',
        round: 2,
        order: 1,
      }),
    ];

    const firstAdvance = advanceWinnerThroughBracket(fights, {
      fightId: 'fight-1',
      winnerId: 'a',
      winType: 'POINTS',
    });
    expect(firstAdvance.find((fight) => fight.id === 'fight-3')?.athleteA?.id).toBe('a');
    expect(firstAdvance.find((fight) => fight.id === 'fight-3')?.athleteB).toBeNull();

    const secondAdvance = advanceWinnerThroughBracket(firstAdvance, {
      fightId: 'fight-2',
      winnerId: 'd',
      winType: 'POINTS',
    });
    const finalFight = secondAdvance.find((fight) => fight.id === 'fight-3');

    expect(finalFight?.athleteA?.id).toBe('a');
    expect(finalFight?.athleteB?.id).toBe('d');
  });

  it('cria automaticamente a próxima luta quando ela não existe', () => {
    const fights = [
      buildFight({
        id: 'fight-1',
        round: 1,
        order: 1,
        athleteA: { id: 'a', name: 'Atleta A' } as Fight['athleteA'],
        athleteB: { id: 'b', name: 'Atleta B' } as Fight['athleteB'],
      }),
      buildFight({
        id: 'fight-2',
        round: 1,
        order: 2,
        athleteA: { id: 'c', name: 'Atleta C' } as Fight['athleteA'],
        athleteB: { id: 'd', name: 'Atleta D' } as Fight['athleteB'],
      }),
    ];

    const advanced = advanceWinnerThroughBracket(fights, {
      fightId: 'fight-1',
      winnerId: 'a',
      winType: 'POINTS',
    });

    const createdFight = advanced.find(
      (fight) => fight.round === 2 && fight.order === 1,
    );

    expect(createdFight).toBeTruthy();
    expect(createdFight?.athleteA?.id).toBe('a');
  });

  it('remove o vencedor antigo da próxima luta ao trocar o resultado', () => {
    const fights = [
      buildFight({
        id: 'fight-1',
        athleteA: { id: 'a', name: 'Atleta A' } as Fight['athleteA'],
        athleteB: { id: 'b', name: 'Atleta B' } as Fight['athleteB'],
        winnerId: 'a',
        winner: { id: 'a', name: 'Atleta A' } as Fight['winner'],
        status: 'FINISHED',
        nextFightId: 'fight-3',
        nextFightSlot: 'A',
      }),
      buildFight({
        id: 'fight-3',
        round: 2,
        order: 1,
        athleteA: { id: 'a', name: 'Atleta A' } as Fight['athleteA'],
        athleteB: { id: 'd', name: 'Atleta D' } as Fight['athleteB'],
      }),
    ];

    const advanced = advanceWinnerThroughBracket(fights, {
      fightId: 'fight-1',
      winnerId: 'b',
      winType: 'POINTS',
      allowOverride: true,
    });
    const nextFight = advanced.find((fight) => fight.id === 'fight-3');

    expect(nextFight?.athleteA?.id).toBe('b');
    expect(nextFight?.athleteB?.id).toBe('d');
  });
});
