import { describe, expect, it } from 'vitest';
import {
  buildFightOrderItems,
  canPersistFightOrder,
  moveFightBeforeVisibleTarget,
  moveFightToEndOfVisibleList,
  normalizeFightOrders,
  sortFightsByOrder,
} from '@/features/fights/lib/reorder-fights';
import { Fight } from '@/features/fights/types/fight';

function createFight(id: string, order: number | null, areaId: string | null = null): Fight {
  return {
    id,
    competitionId: 'comp-1',
    status: 'PENDING',
    categoryId: 'cat-1',
    categoryName: 'Categoria',
    keyGroupId: null,
    keyGroupName: '',
    round: 1,
    areaId,
    areaName: areaId ? `Area ${areaId}` : '',
    order,
    queuePosition: null,
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
    teamMatchId: null,
    teamMatchName: '',
    teamAName: '-',
    teamBName: '-',
    scheduledAt: null,
    startedAt: null,
    finishedAt: null,
  };
}

describe('reorder-fights', () => {
  it('ordena por orderIndex e joga valores nulos para o final', () => {
    const fights = sortFightsByOrder([
      createFight('3', null),
      createFight('2', 2),
      createFight('1', 1),
    ]);

    expect(fights.map((fight) => fight.id)).toEqual(['1', '2', '3']);
  });

  it('move a luta apenas dentro do subconjunto visivel e renormaliza a ordem', () => {
    const fights = normalizeFightOrders([
      createFight('1', 1, 'A'),
      createFight('2', 2, 'B'),
      createFight('3', 3, 'A'),
      createFight('4', 4, 'B'),
    ]);

    const reordered = moveFightBeforeVisibleTarget(
      fights,
      ['1', '3'],
      '3',
      '1',
    );

    expect(reordered.map((fight) => fight.id)).toEqual(['3', '1', '2', '4']);
    expect(reordered.map((fight) => fight.order)).toEqual([1, 2, 3, 4]);
  });

  it('insere antes do alvo visivel sem atravessar itens ocultos pelo filtro', () => {
    const fights = normalizeFightOrders([
      createFight('1', 1, 'A'),
      createFight('2', 2, 'B'),
      createFight('3', 3, 'A'),
      createFight('4', 4, 'B'),
    ]);

    const reordered = moveFightBeforeVisibleTarget(
      fights,
      ['1', '3'],
      '1',
      '3',
    );

    expect(reordered.map((fight) => fight.id)).toEqual(['2', '1', '3', '4']);
    expect(reordered.map((fight) => fight.order)).toEqual([1, 2, 3, 4]);
  });

  it('permite mover uma luta visivel para o final da lista filtrada', () => {
    const fights = normalizeFightOrders([
      createFight('1', 1, 'A'),
      createFight('2', 2, 'B'),
      createFight('3', 3, 'A'),
      createFight('4', 4, 'B'),
    ]);

    const reordered = moveFightToEndOfVisibleList(fights, ['1', '3'], '1');

    expect(reordered.map((fight) => fight.id)).toEqual(['2', '3', '4', '1']);
    expect(reordered.map((fight) => fight.order)).toEqual([1, 2, 3, 4]);
  });

  it('gera payload sequencial sem orderIndex duplicado', () => {
    const items = buildFightOrderItems([
      createFight('10', 4),
      createFight('11', 9),
    ]);

    expect(items).toEqual([
      { fightId: 10, orderIndex: 1 },
      { fightId: 11, orderIndex: 2 },
    ]);
  });

  it('detecta ids nao numericos e bloqueia persistencia', () => {
    expect(
      canPersistFightOrder([createFight('abc', 1), createFight('11', 2)]),
    ).toBe(false);
  });
});
