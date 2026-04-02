import { Athlete, normalizeAthlete } from '@/features/athletes/types/athlete';
import { Fight, normalizeFight } from '@/features/fights/types/fight';

export type KeyGroup = {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string;
  locked: boolean;
  athletes: Athlete[];
  fights: Fight[];
};

export type KeyGroupPayload = {
  name?: string;
  categoryId?: string | null;
  athleteIds?: number[];
};

export type KeyGroupApiResponse =
  | unknown[]
  | {
      data?: unknown[] | { items?: unknown[] } | unknown;
      items?: unknown[];
      keyGroups?: unknown[];
      groups?: unknown[];
      brackets?: unknown[];
      group?: unknown;
      keyGroup?: unknown;
      bracket?: unknown;
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

function readBoolean(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return false;
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

export function normalizeKeyGroup(input: unknown): KeyGroup {
  const record = isObject(input) ? input : {};
  const athletes = readArray(record, ['athletes', 'members', 'participants']).map(
    normalizeAthlete,
  );
  const fights = readArray(record, ['fights', 'generatedFights']).map(normalizeFight);
  const id = readIdentifier(record, ['id', '_id']) || crypto.randomUUID();
  const status = readString(record, ['status']).toUpperCase();

  return {
    id,
    name:
      readString(record, ['name', 'keyGroupName', 'groupName', 'label']) ||
      `Chave ${id}`,
    categoryId: readIdentifier(record, ['categoryId']),
    categoryName: readString(record, ['categoryName']),
    locked: readBoolean(record, ['locked', 'isLocked']) || status === 'LOCKED',
    athletes,
    fights,
  };
}

export function normalizeKeyGroupsResponse(response: KeyGroupApiResponse): KeyGroup[] {
  const data =
    !Array.isArray(response) && response && typeof response === 'object'
      ? response.data
      : undefined;
  const items = Array.isArray(response)
    ? response
    : Array.isArray(data)
      ? data
      : data && typeof data === 'object' && Array.isArray((data as { items?: unknown[] }).items)
        ? (data as { items?: unknown[] }).items!
        : Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.keyGroups)
            ? response.keyGroups
            : Array.isArray(response?.groups)
              ? response.groups
              : Array.isArray(response?.brackets)
                ? response.brackets
                : [];

  return items.map(normalizeKeyGroup);
}

export function normalizeKeyGroupDetail(response: KeyGroupApiResponse): KeyGroup {
  if (Array.isArray(response)) {
    return normalizeKeyGroup(response[0]);
  }

  if (isObject(response?.data)) {
    return normalizeKeyGroup(response.data);
  }

  if (isObject(response?.group)) {
    return normalizeKeyGroup(response.group);
  }

  if (isObject(response?.keyGroup)) {
    return normalizeKeyGroup(response.keyGroup);
  }

  if (isObject(response?.bracket)) {
    return normalizeKeyGroup(response.bracket);
  }

  return normalizeKeyGroup(response);
}
