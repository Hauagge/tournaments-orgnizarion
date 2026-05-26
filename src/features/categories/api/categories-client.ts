import { apiFetch } from '@/shared/api/fetch-client';
import {
  AddAthleteToCategoryPayload,
  AddAthleteToCategoryResponse,
  CategoriesListResponse,
  CategoryDetail,
  CategorySummary,
  CreateCategoryPayload,
  DistributeAthletesResponse,
  normalizeAddAthleteToCategoryResponse,
  normalizeDistributeAthletesResponse,
  normalizeCategoriesResponse,
  normalizeCategoryDetail,
} from '@/features/categories/types/category';

function unwrapData<T>(response: T | { data?: T }) {
  if (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    response.data !== undefined
  ) {
    return response.data;
  }

  return response as T;
}

export function listCategories(competitionId: string) {
  return apiFetch<CategoriesListResponse>(
    `/competitions/${competitionId}/categories`,
    {
      method: 'GET',
      cache: 'no-store',
    },
  ).then(normalizeCategoriesResponse) as Promise<CategorySummary[]>;
}

export function getCategory(id: string) {
  return apiFetch<unknown>(`/categories/${id}`, {
    method: 'GET',
    cache: 'no-store',
  }).then(
    (response) =>
      normalizeCategoryDetail(unwrapData(response)) as CategoryDetail,
  );
}

export function generateCategories(competitionId: string) {
  return apiFetch<unknown>(
    `/competitions/${competitionId}/categories/generate`,
    {
      method: 'POST',
    },
  );
}

export function distributeAthletesInCategories(
  competitionId: string,
  dryRun = false,
) {
  return apiFetch<unknown>(
    `/competitions/${competitionId}/categories/distribute-athletes`,
    {
      method: 'POST',
      body: JSON.stringify({ dryRun }),
    },
  ).then(
    (response) =>
      normalizeDistributeAthletesResponse(response) as DistributeAthletesResponse,
  );
}

export function createCategory(
  competitionId: string,
  payload: CreateCategoryPayload,
) {
  const normalizedName = payload.name?.trim() || undefined;
  const normalizedMergeBelt = payload.canMerge ? payload.mergeBelt : null;

  return apiFetch<unknown>(`/competitions/${competitionId}/categories`, {
    method: 'POST',
    body: JSON.stringify({
      name: normalizedName,
      belt: payload.belt,
      ageMin: payload.ageMin,
      ageMax: payload.ageMax,
      maxAge: payload.ageMax,
      weightMinGrams: payload.weightMin,
      weightMaxGrams: payload.weightMax,
      allowMerge: payload.canMerge,
      mergeWithBelt: normalizedMergeBelt,
    }),
  });
}

export function addAthleteToCategory({
  competitionId,
  categoryId,
  athleteId,
}: {
  competitionId: string;
  categoryId: string;
  athleteId: string;
}) {
  const payload: AddAthleteToCategoryPayload = {
    athleteId,
  };

  return apiFetch<unknown>(
    `/competitions/${competitionId}/categories/${categoryId}/athletes`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  ).then(
    (response) =>
      normalizeAddAthleteToCategoryResponse(response) as AddAthleteToCategoryResponse,
  );
}
