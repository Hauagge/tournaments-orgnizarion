import { apiFetch } from '@/shared/api/fetch-client';
import {
  Academy,
  AcademyApiResponse,
  AcademyPayload,
  normalizeAcademiesResponse,
  normalizeAcademy,
} from '@/features/academies/types/academy';

export function listAcademies(competitionId: string) {
  return apiFetch<AcademyApiResponse>(`/competitions/${competitionId}/academies`, {
    method: 'GET',
    cache: 'no-store',
  }).then(normalizeAcademiesResponse);
}

export function createAcademy(competitionId: string, payload: AcademyPayload) {
  return apiFetch<unknown>(`/competitions/${competitionId}/academies`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => normalizeAcademy(response) as Academy);
}

export function updateAcademy(id: string, payload: AcademyPayload) {
  return apiFetch<unknown>(`/academies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then((response) => normalizeAcademy(response) as Academy);
}

export function addAthleteToAcademy(academyId: string, athleteId: string) {
  return apiFetch<unknown>(`/academies/${academyId}/athletes/${athleteId}`, {
    method: 'POST',
  });
}

export function removeAthleteFromAcademy(academyId: string, athleteId: string) {
  return apiFetch<unknown>(`/academies/${academyId}/athletes/${athleteId}`, {
    method: 'DELETE',
  });
}
