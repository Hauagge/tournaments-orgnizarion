import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateFightOrder } from '@/features/fights/api/fights-client';
import {
  fightsQueryKey,
  useUpdateFightOrder,
} from '@/features/fights/hooks/use-fights';
import { areaQueueQueryKey, areasQueryKey } from '@/features/areas/hooks/use-areas';

vi.mock('@/features/fights/api/fights-client', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/fights/api/fights-client')
  >('@/features/fights/api/fights-client');

  return {
    ...actual,
    updateFightOrder: vi.fn(),
  };
});

describe('useUpdateFightOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invalida lutas, areas e filas apos sucesso', async () => {
    vi.mocked(updateFightOrder).mockResolvedValue({
      competitionId: '1',
      totalUpdated: 2,
      items: [
        { fightId: 10, orderIndex: 1 },
        { fightId: 11, orderIndex: 2 },
      ],
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

    const { result } = renderHook(() => useUpdateFightOrder('comp-1'), {
      wrapper,
    });

    await result.current.mutateAsync({
      items: [
        { fightId: 10, orderIndex: 1 },
        { fightId: 11, orderIndex: 2 },
      ],
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [...fightsQueryKey, 'comp-1'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [...areasQueryKey, 'comp-1'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: areaQueueQueryKey,
    });
  });
});
