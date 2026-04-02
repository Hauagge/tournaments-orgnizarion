import { apiFetch } from '@/shared/api/fetch-client';
import {
  CategoriesListResponse,
  CategoryDetail,
  CategorySummary,
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
