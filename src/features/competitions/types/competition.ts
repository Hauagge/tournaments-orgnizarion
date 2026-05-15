export const competitionModes = ['KEYS', 'ABSOLUTE_GP'] as const;

export type CompetitionMode = (typeof competitionModes)[number];

export const competitionModeLabels: Record<CompetitionMode, string> = {
  KEYS: 'Chaves',
  ABSOLUTE_GP: 'GP absoluto',
};

export type Competition = {
  id: string;
  name: string;
  mode: CompetitionMode;
  fightDurationSeconds: number;
  weighInMarginGrams: number;
  ageSplitYears: number;
  maxGroupSize: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CompetitionPayload = Omit<
  Competition,
  'id' | 'createdAt' | 'updatedAt' | 'maxGroupSize'
> & {
  maxGroupSize?: number | null;
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

function readMode(record: Record<string, unknown>): CompetitionMode {
  const mode = readString(record, ['mode']).toUpperCase();
  if (mode === 'ABSOLUTE_GP') {
    return 'ABSOLUTE_GP';
  }
  if (mode === 'TEAM' || mode === 'KEYS') {
    return 'KEYS';
  }
  return 'KEYS';
}

export function normalizeCompetition(input: unknown): Competition {
  const record = isObject(input) ? input : {};

  return {
    id: readIdentifier(record, ['id', '_id']) || '',
    name: readString(record, ['name']) || 'Competição sem nome',
    mode: readMode(record),
    fightDurationSeconds:
      readNumber(record, ['fightDurationSeconds', 'fightDuration']) ?? 300,
    weighInMarginGrams:
      readNumber(record, ['weighInMarginGrams', 'weighInMargin']) ?? 500,
    ageSplitYears: readNumber(record, ['ageSplitYears', 'ageSplit']) ?? 2,
    maxGroupSize: readNumber(record, [
      'maxGroupSize',
      'keyGroupSize',
      'maxAthletesPerKeyGroup',
      'podSize',
      'teamSize',
      'athletesPerTeam',
      'membersPerTeam',
      'teamAthleteCount',
      'teamMembersCount',
    ]),
    createdAt: readString(record, ['createdAt']) || undefined,
    updatedAt: readString(record, ['updatedAt']) || undefined,
  };
}
