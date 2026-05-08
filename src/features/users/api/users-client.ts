import { ApiError, apiFetch } from '@/shared/api/fetch-client';
import {
  normalizeUsersResponse,
  SystemUser,
} from '@/features/users/types/user';

function buildSearchParams(query: string) {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set('search', query.trim());
  }

  return params.toString();
}

async function tryRequest<T>(requests: Array<() => Promise<T>>) {
  let lastError: unknown = null;

  for (const request of requests) {
    try {
      return await request();
    } catch (error) {
      lastError = error;

      if (!(error instanceof ApiError) || error.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError;
}

export function listCompetitionUsers(competitionId: string) {
  return apiFetch<unknown>(`/competitions/${competitionId}/users`, {
    method: 'GET',
    cache: 'no-store',
  }).then(normalizeUsersResponse);
}

export function searchSystemUsers(query: string): Promise<SystemUser[]> {
  const queryString = buildSearchParams(query);
  const path = `/users${queryString ? `?${queryString}` : ''}`;

  return apiFetch<unknown>(path, {
    method: 'GET',
    cache: 'no-store',
  }).then(normalizeUsersResponse);
}

export function addUserToCompetition(competitionId: string, userId: string) {
  return tryRequest([
    () =>
      apiFetch<unknown>(`/competitions/${competitionId}/users`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    () =>
      apiFetch<unknown>(`/competitions/${competitionId}/users/${userId}`, {
        method: 'POST',
      }),
  ]);
}

export function removeUserFromCompetition(
  competitionId: string,
  userId: string,
) {
  return tryRequest([
    () =>
      apiFetch<unknown>(`/competitions/${competitionId}/users/${userId}`, {
        method: 'DELETE',
      }),
    () =>
      apiFetch<unknown>(`/competitions/${competitionId}/users`, {
        method: 'DELETE',
        body: JSON.stringify({ userId }),
      }),
  ]);
}
