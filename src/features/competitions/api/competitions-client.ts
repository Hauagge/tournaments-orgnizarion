import { apiFetch } from '@/shared/api/fetch-client';
import {
  Competition,
  CompetitionPayload,
} from '@/features/competitions/types/competition';

const COMPETITIONS_PATH = '/competitions';

type CompetitionListResponse =
  | Competition[]
  | {
      data?: {
        items: Competition[];
        page?: number;
        pageSize?: number;
        totalItems?: number;
        totalPages?: number;
      };
      competitions?: Competition[];
      items?: Competition[];
    };

function normalizeCompetitionListResponse(
  response: CompetitionListResponse,
): Competition[] {
  console.log('Raw response from listCompetitions:', response);
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.competitions)) return response.competitions;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

export function listCompetitions() {
  return apiFetch<CompetitionListResponse>(COMPETITIONS_PATH, {
    method: 'GET',
    cache: 'no-store',
  }).then(normalizeCompetitionListResponse);
}

export function getCompetition(id: string) {
  return apiFetch<Competition>(`${COMPETITIONS_PATH}/${id}`, {
    method: 'GET',
    cache: 'no-store',
  });
}

export function createCompetition(payload: CompetitionPayload) {
  return apiFetch<Competition>(COMPETITIONS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateCompetition(id: string, payload: CompetitionPayload) {
  return apiFetch<Competition>(`${COMPETITIONS_PATH}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
