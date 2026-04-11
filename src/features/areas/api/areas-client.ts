import { apiFetch } from '@/shared/api/fetch-client';
import {
  AreaQueueApiResponse,
  AreasApiResponse,
  CreateAreasPayload,
  normalizeAreaQueueResponse,
  normalizeAreasResponse,
} from '@/features/areas/types/area';

export function listAreas(competitionId: string) {
  return apiFetch<AreasApiResponse>(`/competitions/${competitionId}/areas`, {
    method: 'GET',
  }).then(normalizeAreasResponse);
}

export function createAreas(
  competitionId: string,
  payload: CreateAreasPayload,
) {
  const names = payload.names.filter((name) => name.trim().length > 0);

  return apiFetch<unknown>(`/competitions/${competitionId}/areas`, {
    method: 'POST',
    body: JSON.stringify({
      count: payload.count,
      names,
      areaNames: names,
      areas: names.map((name) => ({ name })),
    }),
  });
}

export function distributeAreaFights(competitionId: string) {
  return apiFetch<unknown>(`/competitions/${competitionId}/areas/distribute`, {
    method: 'POST',
  });
}

export function getAreaQueue(areaId: string) {
  return apiFetch<AreaQueueApiResponse>(`/areas/${areaId}/queue`, {
    method: 'GET',
  }).then(normalizeAreaQueueResponse);
}

export function callNextAreaFight(areaId: string) {
  return apiFetch<unknown>(`/areas/${areaId}/call-next`, {
    method: 'POST',
  });
}
