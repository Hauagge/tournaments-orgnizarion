'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  addAthleteToTeam,
  createTeam,
  listTeams,
  removeAthleteFromTeam,
} from '@/features/teams/api/teams-client';
import { TeamPayload } from '@/features/teams/types/team';

export const teamsQueryKey = ['teams'] as const;

export function useTeams(competitionId: string | null) {
  return useQuery({
    queryKey: [...teamsQueryKey, competitionId],
    queryFn: () => listTeams(competitionId!),
    enabled: Boolean(competitionId),
  });
}

export function useTeam(competitionId: string | null, teamId: string) {
  return useQuery({
    queryKey: [...teamsQueryKey, competitionId, teamId],
    queryFn: async () => {
      const teams = await listTeams(competitionId!);
      return teams.find((team) => team.id === teamId) ?? null;
    },
    enabled: Boolean(competitionId && teamId),
  });
}

export function useCreateTeam(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TeamPayload) => createTeam(competitionId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...teamsQueryKey, competitionId],
      });
    },
  });
}

export function useAddAthleteToTeam(
  competitionId: string | null,
  teamId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (athleteId: string) => addAthleteToTeam(teamId, athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...teamsQueryKey, competitionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['athletes', competitionId],
      });
    },
  });
}

export function useRemoveAthleteFromTeam(
  competitionId: string | null,
  teamId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (athleteId: string) => removeAthleteFromTeam(teamId, athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...teamsQueryKey, competitionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['athletes', competitionId],
      });
    },
  });
}
