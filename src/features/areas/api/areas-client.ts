import { apiFetch } from '@/shared/api/fetch-client';
import {
  AreaQueueApiResponse,
  AreasApiResponse,
  CreateAreasPayload,
  normalizeAreaQueueResponse,
  normalizeAreasResponse,
} from '@/features/areas/types/area';

export type DistributeFightsFullPayload = {
  restGapFights: number;
  ageSplitYears: number;
};

export type DistributeFightsIncrementalPayload = {
  restGapFights: number;
  fightIds: number[];
};

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

export function distributeFightsFull(
  competitionId: string,
  payload: DistributeFightsFullPayload,
) {
  return apiFetch<unknown>(`/competitions/${competitionId}/areas/distribute`, {
    method: 'POST',
    body: JSON.stringify({
      mode: 'FULL',
      restGapFights: payload.restGapFights,
      ageSplitYears: payload.ageSplitYears,
    }),
  });
}

export function distributeFightsIncremental(
  competitionId: string,
  payload: DistributeFightsIncrementalPayload,
) {
  return apiFetch<unknown>(`/competitions/${competitionId}/areas/distribute`, {
    method: 'POST',
    body: JSON.stringify({
      mode: 'INCREMENTAL',
      restGapFights: payload.restGapFights,
      fightIds: payload.fightIds,
    }),
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
