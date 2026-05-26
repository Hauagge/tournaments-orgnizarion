'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { areaQueueQueryKey, areasQueryKey } from '@/features/areas/hooks/use-areas';
import { fightsQueryKey } from '@/features/fights/hooks/use-fights';
import {
  getSocketSingleton,
  joinAreaRoom,
  onLiveEvents,
  type LiveEventEnvelope,
  type LiveEventName,
  type LiveEventPayload,
} from '@/lib/socket';

type UseAreaSocketParams = {
  token: string | null;
  areaId: number | string | null;
};

type UseAreaSocketResult = {
  connected: boolean;
  joining: boolean;
  joinError: string | null;
  lastEvent: LiveEventEnvelope | null;
};

function normalizeAreaId(areaId: number | string | null) {
  if (areaId == null) {
    return null;
  }

  const normalized = Number(areaId);
  return Number.isFinite(normalized) ? normalized : null;
}

export function useAreaSocket({
  token,
  areaId,
}: UseAreaSocketParams): UseAreaSocketResult {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<LiveEventEnvelope | null>(null);

  useEffect(() => {
    const normalizedAreaId = normalizeAreaId(areaId);
    const normalizedToken = token?.trim() ?? '';

    if (!normalizedToken || normalizedAreaId === null) {
      setConnected(false);
      setJoining(false);
      setJoinError(null);
      setLastEvent(null);
      return;
    }

    let isMounted = true;
    let socket;

    try {
      socket = getSocketSingleton(normalizedToken);
    } catch (error) {
      setConnected(false);
      setJoining(false);
      setJoinError(error instanceof Error ? error.message : 'Falha ao iniciar o Socket.IO.');
      return;
    }

    const applyEvent = (name: LiveEventName, payload: LiveEventPayload) => {
      if (!isMounted) {
        return;
      }

      setLastEvent({
        name,
        payload,
        receivedAt: new Date().toISOString(),
      });

      queryClient.invalidateQueries({
        queryKey: ['dashboard-area-queue', String(normalizedAreaId)],
      });
      queryClient.invalidateQueries({
        queryKey: [...areaQueueQueryKey, String(normalizedAreaId)],
      });
      queryClient.invalidateQueries({
        queryKey: areasQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: fightsQueryKey,
      });
    };

    const handleConnect = async () => {
      if (!isMounted) {
        return;
      }

      setConnected(true);
      setJoining(true);
      const response = await joinAreaRoom(socket, {
        areaId: normalizedAreaId,
      });

      if (!isMounted) {
        return;
      }

      setJoining(false);
      setJoinError(response.ok ? null : response.message ?? 'Erro ao entrar na room da área.');
    };

    const handleDisconnect = () => {
      if (!isMounted) {
        return;
      }

      setConnected(false);
      setJoining(false);
    };

    const handleConnectError = (error: Error) => {
      if (!isMounted) {
        return;
      }

      setConnected(false);
      setJoining(false);
      setJoinError(error.message || 'Falha ao conectar no Socket.IO.');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    const unsubscribeLiveEvents = onLiveEvents(socket, {
      'fight.started': (payload) => applyEvent('fight.started', payload),
      'fight.finished': (payload) => applyEvent('fight.finished', payload),
      'fights.order.updated': (payload) =>
        applyEvent('fights.order.updated', payload),
      'queue.updated': (payload) => applyEvent('queue.updated', payload),
      'nextfight.updated': (payload) => applyEvent('nextfight.updated', payload),
    });

    if (socket.connected) {
      void handleConnect();
    }

    return () => {
      isMounted = false;
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      unsubscribeLiveEvents();
    };
  }, [areaId, queryClient, token]);

  return {
    connected,
    joining,
    joinError,
    lastEvent,
  };
}
