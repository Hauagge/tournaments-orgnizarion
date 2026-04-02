import { apiFetch } from '@/shared/api/fetch-client';
import {
  Competition,
  CompetitionPayload,
  normalizeCompetition,
} from '@/features/competitions/types/competition';

const COMPETITIONS_PATH = '/competitions';

type CompetitionListResponse =
  | Competition[]
  | {
      data?: {
        items: unknown[];
        page?: number;
        pageSize?: number;
        total?: number;
        totalItems?: number;
        totalPages?: number;
      };
      competitions?: unknown[];
      items?: unknown[];
      error?: unknown;
    };

function normalizeCompetitionListResponse(
  response: CompetitionListResponse,
): Competition[] {
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data?.items)
    ? response.data.items
    : Array.isArray(response?.competitions)
    ? response.competitions
    : Array.isArray(response?.items)
    ? response.items
    : [];

  return items.map(normalizeCompetition);
}

export function listCompetitions() {
  return apiFetch<CompetitionListResponse>(COMPETITIONS_PATH, {
    method: 'GET',
    cache: 'no-store',
  }).then(normalizeCompetitionListResponse);
}

export function getCompetition(id: string) {
  return apiFetch<unknown>(`${COMPETITIONS_PATH}/${id}`, {
    method: 'GET',
    cache: 'no-store',
  }).then((response) => normalizeCompetition(response) as Competition);
}

export function createCompetition(payload: CompetitionPayload) {
  return apiFetch<unknown>(COMPETITIONS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => normalizeCompetition(response) as Competition);
}

export function updateCompetition(id: string, payload: CompetitionPayload) {
  return apiFetch<unknown>(`${COMPETITIONS_PATH}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }).then((response) => normalizeCompetition(response) as Competition);
}
