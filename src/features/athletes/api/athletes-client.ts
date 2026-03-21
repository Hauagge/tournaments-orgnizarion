import { apiFetch } from '@/shared/api/fetch-client';
import {
  Athlete,
  AthletePayload,
  AthleteUpdatePayload,
  normalizeAthlete,
  normalizeAthletesResponse,
} from '@/features/athletes/types/athlete';

type AthleteListParams = {
  competitionId: string;
  query?: string;
};

export function listAthletes({ competitionId, query }: AthleteListParams) {
  const search = new URLSearchParams();
  if (query) {
    search.set('query', query);
  }

  const queryString = search.toString();
  const path = `/competitions/${competitionId}/athletes${
    queryString ? `?${queryString}` : ''
  }`;

  return apiFetch<
    | unknown[]
    | {
        data?: unknown[];
        athletes?: unknown[];
        items?: unknown[];
      }
  >(path, {
    method: 'GET',
    cache: 'no-store',
  }).then(normalizeAthletesResponse);
}

export function createAthlete(
  competitionId: string,
  payload: AthletePayload,
) {
  return apiFetch<unknown>(`/competitions/${competitionId}/athletes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => normalizeAthlete(response) as Athlete);
}

export function updateAthlete(id: string, payload: AthleteUpdatePayload) {
  return apiFetch<unknown>(`/athletes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then((response) => normalizeAthlete(response) as Athlete);
}
