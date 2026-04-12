import {
  Athlete,
  WeighInStatus,
  normalizeAthleteDetail,
} from '@/features/athletes/types/athlete';
import { apiFetch } from '@/shared/api/fetch-client';

type ConfirmWeighInPayload = {
  athleteId: string;
  realWeightGrams: number;
  weighInStatus: Extract<WeighInStatus, 'APPROVED' | 'REJECTED'>;
};

export function confirmWeighIn(
  competitionId: string,
  payload: ConfirmWeighInPayload,
) {
  return apiFetch<unknown>(`/competitions/${competitionId}/weighin/confirm`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => normalizeAthleteDetail(response) as Athlete);
}

export function resetWeighIn(competitionId: string, athleteId: string) {
  return apiFetch<unknown>(`/competitions/${competitionId}/weighin/reset`, {
    method: 'POST',
    body: JSON.stringify({ athleteId }),
  }).then((response) => normalizeAthleteDetail(response) as Athlete);
}
