import { Fight, normalizeFight } from '@/features/fights/types/fight';

export type Area = {
  id: string;
  name: string;
  queueCount: number;
  nextFight: Fight | null;
};

export type AreaQueue = {
  area: Area | null;
  nextFight: Fight | null;
  queue: Fight[];
};

export type CreateAreasPayload = {
  count: number;
  names: string[];
};

export type AreasApiResponse =
  | unknown[]
  | {
      data?: unknown[] | { items?: unknown[] };
      areas?: unknown[];
      items?: unknown[];
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

export function normalizeArea(input: unknown): Area {
  const record = isObject(input) ? input : {};
  const queue = readArray(record, ['queue', 'fights']);
  const nextFightObject = readObject(record, ['nextFight', 'next', 'currentFight']);

  return {
    id: readIdentifier(record, ['id', '_id']) || crypto.randomUUID(),
    name: readString(record, ['name', 'areaName']) || 'Area sem nome',
    queueCount:
      readNumber(record, ['queueCount', 'queuedFights', 'fightCount']) ?? queue.length,
    nextFight: nextFightObject ? normalizeFight(nextFightObject) : queue[0] ? normalizeFight(queue[0]) : null,
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

export function normalizeAreaQueueResponse(input: unknown): AreaQueue {
  const record = isObject(input) ? input : {};
  const areaObject = readObject(record, ['area']);
  const queueRaw = readArray(record, ['queue', 'fights', 'items']);
  const nextFightObject = readObject(record, ['nextFight', 'next', 'currentFight']);
  const queue = queueRaw.map(normalizeFight);
  const nextFight = nextFightObject ? normalizeFight(nextFightObject) : queue[0] ?? null;

  return {
    area: areaObject ? normalizeArea({ ...areaObject, nextFight, queueCount: queue.length }) : null,
    nextFight,
    queue,
  };
}
