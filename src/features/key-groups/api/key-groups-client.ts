import { apiFetch } from '@/shared/api/fetch-client';
import {
  KeyGroupApiResponse,
  KeyGroupPayload,
  normalizeKeyGroupDetail,
  normalizeKeyGroupsResponse,
} from '@/features/key-groups/types/key-group';

export function listKeyGroups(competitionId: string) {
  return apiFetch<KeyGroupApiResponse>(`/competitions/${competitionId}/key-groups`, {
    method: 'GET',
    cache: 'no-store',
  }).then(normalizeKeyGroupsResponse);
}

export function createKeyGroup(competitionId: string, payload: KeyGroupPayload) {
  return apiFetch<unknown>(`/competitions/${competitionId}/key-groups`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => normalizeKeyGroupDetail(response as KeyGroupApiResponse));
}

export function getKeyGroup(keyGroupId: string) {
  return apiFetch<KeyGroupApiResponse>(`/key-groups/${keyGroupId}`, {
    method: 'GET',
    cache: 'no-store',
  }).then(normalizeKeyGroupDetail);
}

export function updateKeyGroup(keyGroupId: string, payload: KeyGroupPayload) {
  return apiFetch<unknown>(`/key-groups/${keyGroupId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then((response) => normalizeKeyGroupDetail(response as KeyGroupApiResponse));
}

export function addAthleteToKeyGroup(keyGroupId: string, athleteId: string) {
  return apiFetch<unknown>(`/key-groups/${keyGroupId}/athletes/${athleteId}`, {
    method: 'POST',
  }).then((response) => normalizeKeyGroupDetail(response as KeyGroupApiResponse));
}

export function removeAthleteFromKeyGroup(keyGroupId: string, athleteId: string) {
  return apiFetch<unknown>(`/key-groups/${keyGroupId}/athletes/${athleteId}`, {
    method: 'DELETE',
  }).then((response) => normalizeKeyGroupDetail(response as KeyGroupApiResponse));
}

export function generateKeyGroupFights(keyGroupId: string) {
  return apiFetch<unknown>(`/key-groups/${keyGroupId}/generate-fights`, {
    method: 'POST',
  }).then((response) => normalizeKeyGroupDetail(response as KeyGroupApiResponse));
}

export function createKeyGroupFight(
  keyGroupId: string,
  payload: {
    athleteAId: number;
    athleteBId: number;
  },
) {
  return apiFetch<unknown>(`/key-groups/${keyGroupId}/fights`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function lockKeyGroup(keyGroupId: string) {
  return apiFetch<unknown>(`/key-groups/${keyGroupId}/lock`, {
    method: 'POST',
  }).then((response) => normalizeKeyGroupDetail(response as KeyGroupApiResponse));
}

export function getBracketsPdfUrl(competitionId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
  return `${baseUrl}/competitions/${competitionId}/brackets/pdf`;
}
