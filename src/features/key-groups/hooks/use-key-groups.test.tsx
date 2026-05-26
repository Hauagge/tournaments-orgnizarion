import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { areaQueueQueryKey, areasQueryKey } from '@/features/areas/hooks/use-areas';
import { createKeyGroupFight } from '@/features/key-groups/api/key-groups-client';
import {
  keyGroupsQueryKey,
  useCreateKeyGroupFight,
} from '@/features/key-groups/hooks/use-key-groups';

vi.mock('@/features/key-groups/api/key-groups-client', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/key-groups/api/key-groups-client')
  >('@/features/key-groups/api/key-groups-client');

  return {
    ...actual,
    createKeyGroupFight: vi.fn(),
  };
});

describe('useCreateKeyGroupFight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invalida chave, lutas, areas e filas após sucesso', async () => {
    vi.mocked(createKeyGroupFight).mockResolvedValue({ success: true });

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
      () => useCreateKeyGroupFight('comp-1', 'group-1'),
      { wrapper },
    );

    await result.current.mutateAsync({
      athleteAId: 101,
      athleteBId: 102,
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [...keyGroupsQueryKey, 'comp-1'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [...keyGroupsQueryKey, 'comp-1', 'group-1'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['fights', 'comp-1'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [...areasQueryKey, 'comp-1'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: areaQueueQueryKey,
    });
  });
});
