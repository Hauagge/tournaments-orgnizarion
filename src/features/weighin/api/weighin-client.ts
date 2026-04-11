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
// TODO Tirar a validação do peso da pagina da pesagem

//TODO adicionar numero de documento na inscrição do atleta, para facilitar a conferência na pesagem
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
