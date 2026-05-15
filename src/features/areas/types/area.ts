import { Fight, normalizeFight } from '@/features/fights/types/fight';

export type Area = {
  id: string;
  name: string;
  queueCount: number;
  competitionId?: number;
  order?: number;
  nextFight: Fight | null;
  queue: Fight[];
};

export type AreaQueue = {
  area: Area | null;
  nextFight: Fight | null;
  queue: Fight[];
};

export type AreaQueueApiResponse =
  | {
      data?: AreaQueueApiPayload;
      error?: unknown;
    }
  | AreaQueueApiPayload;

export type CreateAreasPayload = {
  count: number;
  names: string[];
};

export type AreasApiResponse =
  | AreaApiItem[]
  | {
      data?: AreaApiItem[] | { items?: AreaApiItem[] };
      areas?: AreaApiItem[];
      items?: AreaApiItem[];
      error?: unknown;
    };

type AreaFightApiItem = {
  id?: string | number | null;
  fightId?: string | number | null;
  queueItemId?: string | number | null;
  position?: number | string | null;
  status?: string | null;
  fightStatus?: string | null;
  queueStatus?: string | null;
  areaId?: string | number | null;
  areaName?: string | null;
  categoryName?: string | null;
  categoryId?: string | number | null;
  athleteAId?: string | number | null;
  athleteAName?: string | null;
  athleteBId?: string | number | null;
  athleteBName?: string | null;
  keyGroupId?: string | number | null;
  keyGroupName?: string | null;
  order?: number | string | null;
  orderIndex?: number | string | null;
  sequence?: number | string | null;
};

type AreaApiItem = {
  id?: string | number | null;
  competitionId?: string | number | null;
  name?: string | null;
  areaName?: string | null;
  order?: number | string | null;
  queueCount?: number | string | null;
  queuedFights?: number | string | null;
  fightCount?: number | string | null;
  nextFight?: AreaFightApiItem | null;
  next?: AreaFightApiItem | null;
  currentFight?: AreaFightApiItem | null;
  highlightedFight?: AreaFightApiItem | null;
  queue?: AreaFightApiItem[];
  fights?: AreaFightApiItem[];
};

type AreaQueueApiPayload = {
  area?: AreaApiItem | null;
  highlightedFight?: AreaFightApiItem | null;
  nextFight?: AreaFightApiItem | null;
  next?: AreaFightApiItem | null;
  currentFight?: AreaFightApiItem | null;
  queue?: AreaFightApiItem[];
  fights?: AreaFightApiItem[];
  items?: AreaFightApiItem[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return '';
}

function readIdentifier(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function readObject(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (isObject(value)) {
      return value;
    }
  }

  return null;
}

function normalizeAreaFight(input: unknown): Fight {
  const record = isObject(input) ? input : {};

  return normalizeFight({
    ...record,
    id: readIdentifier(record, ['id', 'fightId', '_id']) || crypto.randomUUID(),
    status: readString(record, ['status', 'fightStatus', 'queueStatus']),
    order: readNumber(record, ['order', 'orderIndex', 'fightOrder', 'sequence']),
  });
}

export function normalizeArea(input: unknown): Area {
  const record = isObject(input) ? input : {};
  const queue = readArray(record, ['queue', 'fights']);
  const nextFightObject = readObject(record, [
    'currentFight',
    'highlightedFight',
    'nextFight',
    'next',
  ]);

  return {
    id: readIdentifier(record, ['id', '_id']) || crypto.randomUUID(),
    name: readString(record, ['name', 'areaName']) || 'Area sem nome',
    queueCount:
      readNumber(record, ['queueCount', 'queuedFights', 'fightCount']) ??
      queue.length,
    competitionId: readNumber(record, ['competitionId']) ?? undefined,
    order: readNumber(record, ['order']) ?? undefined,
    nextFight: nextFightObject
      ? normalizeAreaFight(nextFightObject)
      : queue[0]
        ? normalizeAreaFight(queue[0])
        : null,
    queue: queue.map(normalizeAreaFight),
  };
}

export function normalizeAreasResponse(response: AreasApiResponse): Area[] {
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.items)
        ? response.data.items
        : Array.isArray(response?.areas)
          ? response.areas
          : Array.isArray(response?.items)
            ? response.items
            : [];

  return items.map(normalizeArea);
}

export function normalizeAreaQueueResponse(input: AreaQueueApiResponse): AreaQueue {
  const root =
    isObject(input) && 'data' in input && isObject(input.data) ? input.data : input;
  const record = isObject(root) ? root : {};
  const areaObject = readObject(record, ['area']);
  const queueRaw = readArray(record, ['queue', 'fights', 'items']);
  const nextFightObject = readObject(record, [
    'currentFight',
    'highlightedFight',
    'nextFight',
    'next',
  ]);
  const queue = queueRaw.map(normalizeAreaFight);
  const nextFight = nextFightObject
    ? normalizeAreaFight(nextFightObject)
    : queue[0] ?? null;

  return {
    area: areaObject
      ? normalizeArea({
          ...areaObject,
          highlightedFight: nextFight,
          queueCount: queue.length + (nextFight ? 1 : 0),
          queue,
        })
      : null,
    nextFight,
    queue,
  };
}
