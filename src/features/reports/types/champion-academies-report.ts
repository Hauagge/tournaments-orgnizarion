export type ChampionAcademiesReportFilters = {
  belt?: string;
  ageDivision?: string;
  gender?: string;
  modality?: string;
  categoryId?: string;
};

export type ChampionAthleteItem = {
  athleteId: string;
  athleteName: string;
  categoryId: string;
  categoryName: string;
  keyGroupId?: string;
  keyGroupName?: string;
  belt?: string;
  ageDivision?: string;
  weightDivision?: string;
};

export type ChampionAcademyRankingItem = {
  position: number;
  academyId?: string;
  academyName: string;
  totalChampions: number;
  champions: ChampionAthleteItem[];
};

export type ChampionAcademyReport = {
  competitionId: string;
  totalChampionAthletes: number;
  academies: ChampionAcademyRankingItem[];
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

  return '';
}

function readOptionalIdentifier(record: Record<string, unknown>, keys: string[]) {
  return readIdentifier(record, keys) || undefined;
}

function readOptionalString(record: Record<string, unknown>, keys: string[]) {
  const value = readString(record, keys);
  return value || undefined;
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

  return 0;
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

function normalizeChampionAthleteItem(input: unknown): ChampionAthleteItem {
  const record = isObject(input) ? input : {};

  return {
    athleteId: readIdentifier(record, ['athleteId', 'id']),
    athleteName: readString(record, ['athleteName', 'name']),
    categoryId: readIdentifier(record, ['categoryId']),
    categoryName: readString(record, ['categoryName']),
    keyGroupId: readOptionalIdentifier(record, ['keyGroupId']),
    keyGroupName: readOptionalString(record, ['keyGroupName']),
    belt: readOptionalString(record, ['belt']),
    ageDivision: readOptionalString(record, ['ageDivision']),
    weightDivision: readOptionalString(record, ['weightDivision']),
  };
}

function normalizeChampionAcademyRankingItem(
  input: unknown,
  fallbackPosition: number,
): ChampionAcademyRankingItem {
  const record = isObject(input) ? input : {};

  return {
    position: readNumber(record, ['position']) || fallbackPosition,
    academyId: readOptionalIdentifier(record, ['academyId']),
    academyName:
      readString(record, ['academyName', 'name']) || 'Academia não informada',
    totalChampions: readNumber(record, ['totalChampions', 'count']),
    champions: readArray(record, ['champions', 'athletes']).map(
      normalizeChampionAthleteItem,
    ),
  };
}

export function normalizeChampionAcademiesReport(
  input: unknown,
): ChampionAcademyReport {
  const record = isObject(input) ? input : {};
  const nestedData = isObject(record.data) ? record.data : record;
  const academies = readArray(nestedData, ['academies', 'items']).map(
    (item, index) => normalizeChampionAcademyRankingItem(item, index + 1),
  );

  return {
    competitionId: readIdentifier(nestedData, ['competitionId']),
    totalChampionAthletes: readNumber(nestedData, [
      'totalChampionAthletes',
      'totalChampions',
    ]),
    academies,
  };
}
