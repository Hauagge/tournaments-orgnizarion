import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addAthleteToCategory,
  distributeAthletesInCategories,
} from '@/features/categories/api/categories-client';
import { apiFetch } from '@/shared/api/fetch-client';

vi.mock('@/shared/api/fetch-client', () => ({
  apiFetch: vi.fn(),
}));

describe('distributeAthletesInCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia a requisição para o endpoint correto com dryRun=false', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      success: true,
      competitionId: 'comp-1',
      allocated: [],
      notAllocated: [],
      summary: {
        totalAthletes: 20,
        allocatedCount: 16,
        notAllocatedCount: 4,
      },
    });

    const response = await distributeAthletesInCategories('comp-1');

    expect(apiFetch).toHaveBeenCalledWith(
      '/competitions/comp-1/categories/distribute-athletes',
      {
        method: 'POST',
        body: JSON.stringify({ dryRun: false }),
      },
    );
    expect(response.summary.allocatedCount).toBe(16);
    expect(response.summary.notAllocatedCount).toBe(4);
  });
});

describe('addAthleteToCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia a requisição para o endpoint correto com competitionId, categoryId e athleteId', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      success: true,
      message: 'Atleta adicionado à categoria com sucesso.',
      data: {
        competitionId: 'comp-1',
        categoryId: 'cat-1',
        athleteId: 'ath-1',
      },
    });

    const response = await addAthleteToCategory({
      competitionId: 'comp-1',
      categoryId: 'cat-1',
      athleteId: 'ath-1',
    });

    expect(apiFetch).toHaveBeenCalledWith(
      '/competitions/comp-1/categories/cat-1/athletes',
      {
        method: 'POST',
        body: JSON.stringify({ athleteId: 'ath-1' }),
      },
    );
    expect(response.data.athleteId).toBe('ath-1');
  });
});
