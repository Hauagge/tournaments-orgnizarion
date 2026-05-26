import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addAthleteToCategory,
  distributeAthletesInCategories,
} from '@/features/categories/api/categories-client';
import {
  categoriesQueryKey,
  categoryDetailQueryKey,
  useAddAthleteToCategory,
  useDistributeAthletesInCategories,
} from '@/features/categories/hooks/use-categories';
import { athletesQueryKey } from '@/features/athletes/hooks/use-athletes';
import { fightsQueryKey } from '@/features/fights/hooks/use-fights';
import { competitionsQueryKey } from '@/features/competitions/hooks/use-competitions';

vi.mock('@/features/categories/api/categories-client', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/categories/api/categories-client')
  >('@/features/categories/api/categories-client');

  return {
    ...actual,
    addAthleteToCategory: vi.fn(),
    distributeAthletesInCategories: vi.fn(),
  };
});

describe('useDistributeAthletesInCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invalida categorias, atletas, lutas e competição após sucesso', async () => {
    vi.mocked(distributeAthletesInCategories).mockResolvedValue({
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

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    function wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(
      () => useDistributeAthletesInCategories('comp-1'),
      { wrapper },
    );

    await result.current.mutateAsync(false);

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: [...categoriesQueryKey, 'comp-1'],
      });
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: categoryDetailQueryKey,
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [...athletesQueryKey, 'comp-1'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [...fightsQueryKey, 'comp-1'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: competitionsQueryKey,
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [...competitionsQueryKey, 'comp-1'],
    });
  });

  it('invalida categorias e detalhe da categoria após adicionar atleta manualmente', async () => {
    vi.mocked(addAthleteToCategory).mockResolvedValue({
      success: true,
      message: 'Atleta adicionado à categoria com sucesso.',
      data: {
        competitionId: 'comp-1',
        categoryId: 'cat-1',
        athleteId: 'ath-1',
      },
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    function wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(
      () => useAddAthleteToCategory('comp-1'),
      { wrapper },
    );

    await result.current.mutateAsync({
      categoryId: 'cat-1',
      athleteId: 'ath-1',
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [...categoriesQueryKey, 'comp-1'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [...categoryDetailQueryKey, 'cat-1'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: categoryDetailQueryKey,
    });
  });
});
