import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { areaQueueQueryKey, areasQueryKey } from '@/features/areas/hooks/use-areas';
import { fightsQueryKey } from '@/features/fights/hooks/use-fights';
import { useCompetitionSocket } from '@/hooks/useCompetitionSocket';
import type { LiveEventName, LiveEventPayload } from '@/lib/socket';

const socketListeners = new Map<string, (...args: unknown[]) => void>();
let liveEventHandlers: Partial<Record<LiveEventName, (payload: LiveEventPayload) => void>> =
  {};

const socketMock = {
  connected: false,
  on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    socketListeners.set(event, handler);
  }),
  off: vi.fn((event: string) => {
    socketListeners.delete(event);
  }),
};

vi.mock('@/lib/socket', () => ({
  getSocketSingleton: vi.fn(() => socketMock),
  joinCompetitionRoom: vi.fn(async () => ({ ok: true })),
  onLiveEvents: vi.fn(
    (
      _socket: unknown,
      handlers: Partial<Record<LiveEventName, (payload: LiveEventPayload) => void>>,
    ) => {
      liveEventHandlers = handlers;
      return () => {
        liveEventHandlers = {};
      };
    },
  ),
}));

describe('useCompetitionSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socketListeners.clear();
    liveEventHandlers = {};
    socketMock.connected = false;
  });

  it('invalida caches quando recebe fights.order.updated', async () => {
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
      () => useCompetitionSocket({ token: 'jwt-token', competitionId: '1' }),
      { wrapper },
    );

    const connectHandler = socketListeners.get('connect');
    expect(connectHandler).toBeTypeOf('function');

    await act(async () => {
      await connectHandler?.();
    });

    act(() => {
      liveEventHandlers['fights.order.updated']?.({
        competitionId: 1,
        items: [{ fightId: 10, orderIndex: 1 }],
      });
    });

    await waitFor(() => {
      expect(result.current.lastEvent?.name).toBe('fights.order.updated');
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [...fightsQueryKey, '1'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [...areasQueryKey, '1'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: areaQueueQueryKey,
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['dashboard-area-queue'],
    });
  });
});
