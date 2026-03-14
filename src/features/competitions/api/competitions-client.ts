import { apiFetch } from '@/shared/api/fetch-client';
import {
  Competition,
  CompetitionPayload,
} from '@/features/competitions/types/competition';

const COMPETITIONS_PATH = '/competitions';

export function listCompetitions() {
  return apiFetch<Competition[]>(COMPETITIONS_PATH, {
    method: 'GET',
    cache: 'no-store',
  });
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
