import { apiFetch } from '@/shared/api/fetch-client';
import {
  FightApiResponse,
  FinishFightPayload,
  normalizeFightsResponse,
} from '@/features/fights/types/fight';

export function listFights(competitionId: string) {
  return apiFetch<FightApiResponse>(`/competitions/${competitionId}/fights`, {
    method: 'GET',
  }).then(normalizeFightsResponse);
}

export function generateFights(competitionId: string) {
  return apiFetch<unknown>(`/competitions/${competitionId}/fights/generate`, {
    method: 'POST',
  });
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
    }),
  });
}
