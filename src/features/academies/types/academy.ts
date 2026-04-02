import { Athlete, normalizeAthlete } from '@/features/athletes/types/athlete';

export type Academy = {
  id: string;
  name: string;
  athletes: Athlete[];
  athleteCount: number;
};

export type AcademyPayload = {
  name: string;
};

export type AcademyApiResponse =
  | unknown[]
  | {
      data?: unknown[] | { items?: unknown[] };
      items?: unknown[];
      academies?: unknown[];
      teams?: unknown[];
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

function readArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
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

export function normalizeAcademy(input: unknown): Academy {
  const record = isObject(input) ? input : {};
  const athletes = readArray(record, ['athletes', 'members', 'participants']).map(
    normalizeAthlete,
  );
  const athleteCount =
    readNumber(record, ['athleteCount', 'totalAthletes', 'membersCount']) ??
    athletes.length;

  return {
    id: readIdentifier(record, ['id', '_id']) || crypto.randomUUID(),
    name:
      readString(record, ['name', 'academyName', 'teamName', 'equipe']) ||
      'Academia sem nome',
    athletes,
    athleteCount,
  };
}

export function normalizeAcademiesResponse(response: AcademyApiResponse): Academy[] {
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.data?.items)
    ? response.data.items
    : Array.isArray(response?.items)
    ? response.items
    : Array.isArray(response?.academies)
    ? response.academies
    : Array.isArray(response?.teams)
    ? response.teams
    : [];

  return items.map(normalizeAcademy);
}
