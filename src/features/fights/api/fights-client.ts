import { apiFetch } from '@/shared/api/fetch-client';
import { downloadBlob } from '@/shared/api/downloadBlob';
import {
  CreateFightPayload,
  Fight,
  FightApiResponse,
  FightFilters,
  FinishFightPayload,
  normalizeFight,
  normalizeFightsResponse,
  normalizeUpdateFightOrderResponse,
  UpdateFightOrderPayload,
  UpdateFightOrderResponse,
  UpdateFightPayload,
} from '@/features/fights/types/fight';

function buildFightSearchParams(filters?: FightFilters) {
  const params = new URLSearchParams();

  if (filters?.search) {
    params.set('search', filters.search);
  }

  if (filters?.categoryId && filters.categoryId !== 'ALL') {
    params.set('categoryId', filters.categoryId);
  }

  if (filters?.status) {
    params.set('status', filters.status);
  }

  if (typeof filters?.round === 'number') {
    params.set('round', String(filters.round));
  }

  if (filters?.areaId && filters.areaId !== 'ALL') {
    params.set('areaId', filters.areaId);
  }

  return params.toString();
}

export function listFights(competitionId: string, filters?: FightFilters) {
  const query = buildFightSearchParams(filters);
  const path = query
    ? `/competitions/${competitionId}/fights?${query}`
    : `/competitions/${competitionId}/fights`;

  return apiFetch<FightApiResponse>(path, {
    method: 'GET',
  }).then(normalizeFightsResponse);
}

export function generateFights(competitionId: string) {
  return apiFetch<unknown>(`/competitions/${competitionId}/fights/generate`, {
    method: 'POST',
  });
}

export function createFight(competitionId: string, payload: CreateFightPayload) {
  return apiFetch<unknown>(`/competitions/${competitionId}/fights/manual`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => normalizeFight(response) as Fight);
}

export function updateFight(fightId: string, payload: UpdateFightPayload) {
  return apiFetch<unknown>(`/fights/${fightId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then((response) => normalizeFight(response) as Fight);
}

export function startFight(fightId: string) {
  return apiFetch<unknown>(`/fights/${fightId}/start`, {
    method: 'POST',
  });
}

export function finishFight(fightId: string, payload: FinishFightPayload) {
  return apiFetch<unknown>(`/fights/${fightId}/finish`, {
    method: 'POST',
    body: JSON.stringify({
      winnerId: payload.winnerId,
      winnerAthleteId: payload.winnerId,
      winType: payload.winType,
      allowOverride: payload.allowOverride ?? false,
    }),
  });
}

export function updateFightOrder(
  competitionId: string,
  payload: UpdateFightOrderPayload,
) {
  return apiFetch<unknown>(`/competitions/${competitionId}/fights/order`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then(
    (response) =>
      normalizeUpdateFightOrderResponse(response) as UpdateFightOrderResponse,
  );
}

export function exportFightsByAreaPdf(competitionId: string) {
  return downloadBlob(
    `/competitions/${competitionId}/reports/pdf/fights-by-area`,
    {
      method: 'GET',
    },
    {
      defaultFilename: `fights-by-area-${competitionId}.pdf`,
      disposition: 'open',
    },
  );
}
