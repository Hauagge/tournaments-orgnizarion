'use client';

import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client';

export const LIVE_EVENT_NAMES = [
  'fight.started',
  'fight.finished',
  'fights.order.updated',
  'queue.updated',
  'nextfight.updated',
] as const;

export type LiveEventName = (typeof LIVE_EVENT_NAMES)[number];

export type JoinCompetitionRoomPayload = {
  competitionId: number;
};

export type JoinAreaRoomPayload = {
  areaId: number;
};

export type JoinRoomResponse = {
  ok: boolean;
  message?: string;
};

export type LiveEventPayload = {
  fightId?: number | string | null;
  competitionId?: number | string | null;
  areaId?: number | string | null;
  payload?: unknown;
  [key: string]: unknown;
};

export type LiveEventEnvelope = {
  name: LiveEventName;
  payload: LiveEventPayload;
  receivedAt: string;
};

type ServerToClientEvents = {
  [K in LiveEventName]: (payload: LiveEventPayload) => void;
} & {
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
};

type ClientToServerEvents = {
  joinCompetitionRoom: (
    payload: JoinCompetitionRoomPayload,
    callback: (response: JoinRoomResponse) => void,
  ) => void;
  joinAreaRoom: (
    payload: JoinAreaRoomPayload,
    callback: (response: JoinRoomResponse) => void,
  ) => void;
};

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type LiveEventHandlers = Partial<{
  [K in LiveEventName]: (payload: LiveEventPayload) => void;
}>;

let socketSingleton: AppSocket | null = null;
let socketToken: string | null = null;

function getSocketUrl() {
  const url = process.env.NEXT_PUBLIC_FIGHT_UPDATES_WS_URL?.trim();
  if (!url) {
    throw new Error('NEXT_PUBLIC_FIGHT_UPDATES_WS_URL não está configurada.');
  }

  return url.replace(/\/+$/, '');
}

function getSocketPath() {
  const configuredPath = process.env.NEXT_PUBLIC_FIGHT_UPDATES_WS_PATH?.trim();

  if (!configuredPath) {
    return '/socket.io';
  }

  const normalizedPath = configuredPath.startsWith('/')
    ? configuredPath
    : `/${configuredPath}`;

  return normalizedPath.replace(/\/+$/, '');
}

function createSocket(token: string) {
  const options: Partial<ManagerOptions & SocketOptions> = {
    autoConnect: false,
    auth: { token },
    path: getSocketPath(),
    transports: ['websocket'],
  };

  return io(getSocketUrl(), {
    ...options,
  });
}

export function getSocketSingleton(token: string) {
  if (typeof window === 'undefined') {
    throw new Error('Socket.IO deve ser inicializado apenas no client.');
  }

  const normalizedToken = token.trim();
  if (!normalizedToken) {
    throw new Error('JWT ausente para conectar ao Socket.IO.');
  }

  if (socketSingleton && socketToken === normalizedToken) {
    socketSingleton.auth = { token: normalizedToken };
    if (!socketSingleton.connected) {
      socketSingleton.connect();
    }
    return socketSingleton;
  }

  resetSocketSingleton();
  socketSingleton = createSocket(normalizedToken);
  socketToken = normalizedToken;
  socketSingleton.connect();
  return socketSingleton;
}

export function disconnectSocketSingleton() {
  if (!socketSingleton) {
    return;
  }

  socketSingleton.disconnect();
}

export function resetSocketSingleton() {
  if (!socketSingleton) {
    socketToken = null;
    return;
  }

  socketSingleton.removeAllListeners();
  socketSingleton.disconnect();
  socketSingleton = null;
  socketToken = null;
}

export function onLiveEvents(socket: AppSocket, handlers: LiveEventHandlers) {
  const cleanups = Object.entries(handlers).map(([eventName, handler]) => {
    if (!handler) {
      return () => undefined;
    }

    const typedEventName = eventName as LiveEventName;
    socket.on(typedEventName, handler);

    return () => {
      socket.off(typedEventName, handler);
    };
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

function emitWithAck<TPayload>(
  socket: AppSocket,
  eventName: 'joinCompetitionRoom' | 'joinAreaRoom',
  payload: TPayload,
) {
  return new Promise<JoinRoomResponse>((resolve) => {
    socket.emit(
      eventName,
      payload as JoinCompetitionRoomPayload & JoinAreaRoomPayload,
      (response) => resolve(response),
    );
  });
}

export function joinCompetitionRoom(
  socket: AppSocket,
  payload: JoinCompetitionRoomPayload,
) {
  return emitWithAck(socket, 'joinCompetitionRoom', payload);
}

export function joinAreaRoom(socket: AppSocket, payload: JoinAreaRoomPayload) {
  return emitWithAck(socket, 'joinAreaRoom', payload);
}
