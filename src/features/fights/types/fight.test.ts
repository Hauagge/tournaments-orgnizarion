import { describe, expect, it } from 'vitest';
import { normalizeFightsResponse } from '@/features/fights/types/fight';

describe('normalizeFightsResponse', () => {
  it('preserva os nomes dos atletas no formato atual do endpoint de lutas', () => {
    const fights = normalizeFightsResponse({
      data: [
        {
          id: 123,
          competitionId: 10,
          categoryId: 4,
          keyGroupId: 8,
          areaId: 2,
          areaName: 'Área 2',
          status: 'WAITING',
          round: 1,
          order: 5,
          athleteAId: 101,
          athleteAName: 'João Silva',
          academyAName: 'Alliance',
          athleteBId: 102,
          athleteBName: 'Carlos Souza',
          academyBName: 'Gracie Barra',
          winnerId: null,
          winnerName: null,
          loserId: null,
          nextFightId: 130,
          nextFightSlot: 'A',
          createdManually: false,
          isWo: false,
          winType: null,
          startedAt: null,
          finishedAt: null,
          orderIndex: 5,
        },
      ],
      error: null,
    } as any);

    expect(fights).toHaveLength(1);
    expect(fights[0]).toMatchObject({
      id: '123',
      competitionId: '10',
      status: 'PENDING',
      athleteA: {
        id: '101',
        name: 'João Silva',
        academy: 'Alliance',
      },
      athleteB: {
        id: '102',
        name: 'Carlos Souza',
        academy: 'Gracie Barra',
      },
      areaId: '2',
      areaName: 'Área 2',
      nextFightId: '130',
      nextFightSlot: 'A',
    });
  });
});
