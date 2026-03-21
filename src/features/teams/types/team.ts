import { Athlete, normalizeAthlete } from '@/features/athletes/types/athlete';

export type Team = {
  id: string;
  name: string;
  athletes: Athlete[];
  athleteCount: number;
};

export type TeamPayload = {
  name: string;
};

export type TeamApiResponse =
  | unknown[]
  | {
      data?: unknown[] | { items?: unknown[] };
      items?: unknown[];
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

export function normalizeTeam(input: unknown): Team {
  const record = isObject(input) ? input : {};
  const athletes = readArray(record, ['athletes', 'members', 'participants']).map(
    normalizeAthlete,
  );
  const athleteCount =
    readNumber(record, ['athleteCount', 'totalAthletes', 'membersCount']) ??
    athletes.length;

  return {
    id: readString(record, ['id', '_id']) || crypto.randomUUID(),
    name: readString(record, ['name', 'teamName', 'academy', 'equipe']) || 'Equipe sem nome',
    athletes,
    athleteCount,
  };
}

export function normalizeTeamsResponse(response: TeamApiResponse): Team[] {
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.data?.items)
    ? response.data.items
    : Array.isArray(response?.items)
    ? response.items
    : Array.isArray(response?.teams)
    ? response.teams
    : [];

  return items.map(normalizeTeam);
}
