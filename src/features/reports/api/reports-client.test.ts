import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getChampionAcademiesReport } from '@/features/reports/api/reports-client';
import { apiFetch } from '@/shared/api/fetch-client';

vi.mock('@/shared/api/fetch-client', () => ({
  apiFetch: vi.fn(),
}));

describe('getChampionAcademiesReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('busca o ranking de academias campeãs no endpoint correto', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      data: {
        competitionId: 'comp-1',
        totalChampionAthletes: 2,
        academies: [
          {
            position: 1,
            academyId: 'academy-1',
            academyName: 'Academia A',
            totalChampions: 2,
            champions: [
              {
                athleteId: 'ath-1',
                athleteName: 'João Silva',
                categoryId: 'cat-1',
                categoryName: 'Adulto / Azul / Médio',
              },
            ],
          },
        ],
      },
    });

    const response = await getChampionAcademiesReport('comp-1');

    expect(apiFetch).toHaveBeenCalledWith(
      '/competitions/comp-1/reports/champion-academies',
      {
        method: 'GET',
        cache: 'no-store',
      },
    );
    expect(response.totalChampionAthletes).toBe(2);
    expect(response.academies[0]?.academyName).toBe('Academia A');
  });

  it('aceita ids numericos vindos do backend', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      data: {
        competitionId: 1,
        totalChampionAthletes: 1,
        academies: [
          {
            position: 1,
            academyId: 7,
            academyName: 'Academia A',
            totalChampions: 1,
            champions: [
              {
                athleteId: 10,
                athleteName: 'João Silva',
                categoryId: 3,
                categoryName: 'Adulto / Azul / Médio',
              },
            ],
          },
        ],
      },
    });

    const response = await getChampionAcademiesReport('1');

    expect(response.competitionId).toBe('1');
    expect(response.academies[0]?.academyId).toBe('7');
    expect(response.academies[0]?.champions[0]).toEqual(
      expect.objectContaining({ athleteId: '10', categoryId: '3' }),
    );
  });

  it('envia filtros na query string quando informados', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      data: {
        competitionId: 'comp-1',
        totalChampionAthletes: 0,
        academies: [],
      },
    });

    await getChampionAcademiesReport('comp-1', {
      belt: 'Azul',
      ageDivision: 'Adulto',
      categoryId: 'cat-1',
    });

    expect(apiFetch).toHaveBeenCalledWith(
      '/competitions/comp-1/reports/champion-academies?belt=Azul&ageDivision=Adulto&categoryId=cat-1',
      {
        method: 'GET',
        cache: 'no-store',
      },
    );
  });
});
