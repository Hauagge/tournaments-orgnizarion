import {
  Athlete,
  normalizeAthlete,
} from '@/features/athletes/types/athlete';

export type CategorySummary = {
  id: string;
  name: string;
  belt: string;
  ageMin: number | null;
  ageMax: number | null;
  weightMin: number | null;
  weightMax: number | null;
  totalAthletes: number;
};

export type CategoryDetail = CategorySummary & {
  athletes: Athlete[];
};

export type CreateCategoryPayload = {
  name?: string;
  ageMin: number | null;
  ageMax: number | null;
  weightMin: number | null;
  weightMax: number | null;
  belt: string;
  canMerge: boolean;
  mergeBelt: string | null;
};

export type DistributedCategoryMatchRules = {
  belt: boolean;
  weight: boolean;
  age: boolean;
  beltMix: boolean;
};

export type AllocatedAthleteDistribution = {
  athleteId: string;
  athleteName: string;
  categoryId: string;
  categoryName: string;
  matchedRules: DistributedCategoryMatchRules;
};

export type NotAllocatedAthleteDistribution = {
  athleteId: string;
  athleteName: string;
  reasons: string[];
};

export type DistributeAthletesSummary = {
  totalAthletes: number;
  allocatedCount: number;
  notAllocatedCount: number;
};

export type DistributeAthletesResponse = {
  success: boolean;
  competitionId: string;
  allocated: AllocatedAthleteDistribution[];
  notAllocated: NotAllocatedAthleteDistribution[];
  summary: DistributeAthletesSummary;
};

export type AddAthleteToCategoryPayload = {
  athleteId: string;
};

export type AddAthleteToCategoryResponse = {
  success: boolean;
  message: string;
  data: {
    competitionId: string;
    categoryId: string;
    athleteId: string;
  };
};

export type CategoriesListResponse =
  | unknown[]
  | {
      data?: unknown[];
      categories?: unknown[];
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

function readArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
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

function readStringArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
  }

  return [];
}

function readObject(
  record: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const value = record[key];
    if (isObject(value)) {
      return value;
    }
  }

  return {};
}

function gramsToKilograms(value: number | null) {
  if (value === null) return null;
  return value / 1000;
}

function readWeightValue(
  record: Record<string, unknown>,
  kilogramKeys: string[],
  gramKeys: string[],
) {
  const kilograms = readNumber(record, kilogramKeys);
  if (kilograms !== null) {
    return kilograms;
  }

  return gramsToKilograms(readNumber(record, gramKeys));
}

export function normalizeCategorySummary(input: unknown): CategorySummary {
  const record = isObject(input) ? input : {};
  const athletes = readArray(record, ['athletes', 'competitors']);

  return {
    id: readIdentifier(record, ['id', '_id']) || crypto.randomUUID(),
    name: readString(record, ['name', 'categoryName', 'nome']),
    belt: readString(record, ['belt', 'faixa']),
    ageMin: readNumber(record, ['ageMin', 'minAge', 'idadeMinima']),
    ageMax: readNumber(record, ['ageMax', 'maxAge', 'idadeMaxima']),
    weightMin: readWeightValue(
      record,
      ['weightMin', 'minWeight', 'pesoMinimo'],
      ['weightMinGrams', 'minWeightGrams', 'pesoMinimoGramas'],
    ),
    weightMax: readWeightValue(
      record,
      ['weightMax', 'maxWeight', 'pesoMaximo'],
      ['weightMaxGrams', 'maxWeightGrams', 'pesoMaximoGramas'],
    ),
    totalAthletes:
      readNumber(record, ['totalAthletes', 'athletesCount', 'totalCompetitors']) ??
      athletes.length,
  };
}

export function normalizeCategoryDetail(input: unknown): CategoryDetail {
  const record = isObject(input) ? input : {};
  const athletes = readArray(record, ['athletes', 'competitors']).map(normalizeAthlete);

  return {
    ...normalizeCategorySummary(record),
    athletes,
    totalAthletes:
      readNumber(record, ['totalAthletes', 'athletesCount', 'totalCompetitors']) ??
      athletes.length,
  };
}

export function normalizeCategoriesResponse(
  response: CategoriesListResponse,
): CategorySummary[] {
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.categories)
    ? response.categories
    : Array.isArray(response?.items)
    ? response.items
    : [];

  return items.map(normalizeCategorySummary);
}

function normalizeDistributedCategoryMatchRules(
  input: unknown,
): DistributedCategoryMatchRules {
  const record = isObject(input) ? input : {};

  return {
    belt: readBoolean(record, ['belt']),
    weight: readBoolean(record, ['weight']),
    age: readBoolean(record, ['age']),
    beltMix: readBoolean(record, ['beltMix']),
  };
}

function normalizeAllocatedAthleteDistribution(
  input: unknown,
): AllocatedAthleteDistribution {
  const record = isObject(input) ? input : {};

  return {
    athleteId: readIdentifier(record, ['athleteId', 'athlete_id', 'id']) || '',
    athleteName: readString(record, ['athleteName', 'athlete_name', 'name']),
    categoryId:
      readIdentifier(record, ['categoryId', 'category_id']) || '',
    categoryName: readString(record, ['categoryName', 'category_name']),
    matchedRules: normalizeDistributedCategoryMatchRules(record.matchedRules),
  };
}

function normalizeNotAllocatedAthleteDistribution(
  input: unknown,
): NotAllocatedAthleteDistribution {
  const record = isObject(input) ? input : {};

  return {
    athleteId: readIdentifier(record, ['athleteId', 'athlete_id', 'id']) || '',
    athleteName: readString(record, ['athleteName', 'athlete_name', 'name']),
    reasons: readStringArray(record, ['reasons']),
  };
}

function normalizeDistributeAthletesSummary(
  input: unknown,
): DistributeAthletesSummary {
  const record = isObject(input) ? input : {};

  return {
    totalAthletes: readNumber(record, ['totalAthletes']) ?? 0,
    allocatedCount: readNumber(record, ['allocatedCount']) ?? 0,
    notAllocatedCount: readNumber(record, ['notAllocatedCount']) ?? 0,
  };
}

export function normalizeDistributeAthletesResponse(
  input: unknown,
): DistributeAthletesResponse {
  const record = isObject(input) ? input : {};
  const allocated = readArray(record, ['allocated']).map(
    normalizeAllocatedAthleteDistribution,
  );
  const notAllocated = readArray(record, ['notAllocated']).map(
    normalizeNotAllocatedAthleteDistribution,
  );

  return {
    success: readBoolean(record, ['success']),
    competitionId:
      readIdentifier(record, ['competitionId', 'competition_id']) || '',
    allocated,
    notAllocated,
    summary: normalizeDistributeAthletesSummary(record.summary),
  };
}

export function normalizeAddAthleteToCategoryResponse(
  input: unknown,
): AddAthleteToCategoryResponse {
  const record = isObject(input) ? input : {};
  const data = readObject(record, ['data']);

  return {
    success: readBoolean(record, ['success']),
    message:
      readString(record, ['message']) ||
      'Atleta adicionado à categoria com sucesso.',
    data: {
      competitionId:
        readIdentifier(data, ['competitionId', 'competition_id']) || '',
      categoryId: readIdentifier(data, ['categoryId', 'category_id']) || '',
      athleteId: readIdentifier(data, ['athleteId', 'athlete_id']) || '',
    },
  };
}
