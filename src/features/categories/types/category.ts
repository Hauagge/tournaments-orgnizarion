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
