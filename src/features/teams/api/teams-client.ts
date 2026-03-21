import { apiFetch } from '@/shared/api/fetch-client';
import {
  TeamApiResponse,
  Team,
  TeamPayload,
  normalizeTeam,
  normalizeTeamsResponse,
} from '@/features/teams/types/team';

export function listTeams(competitionId: string) {
  return apiFetch<TeamApiResponse>(`/competitions/${competitionId}/teams`, {
    method: 'GET',
    cache: 'no-store',
  }).then(normalizeTeamsResponse);
}

export function createTeam(competitionId: string, payload: TeamPayload) {
  return apiFetch<unknown>(`/competitions/${competitionId}/teams`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => normalizeTeam(response) as Team);
}

export function addAthleteToTeam(teamId: string, athleteId: string) {
  return apiFetch<unknown>(`/teams/${teamId}/athletes/${athleteId}`, {
    method: 'POST',
  });
}

export function removeAthleteFromTeam(teamId: string, athleteId: string) {
  return apiFetch<unknown>(`/teams/${teamId}/athletes/${athleteId}`, {
    method: 'DELETE',
  });
}
