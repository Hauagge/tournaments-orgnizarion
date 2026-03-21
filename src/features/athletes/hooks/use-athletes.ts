'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createAthlete,
  listAthletes,
  updateAthlete,
} from '@/features/athletes/api/athletes-client';
import {
  AthletePayload,
  AthleteUpdatePayload,
} from '@/features/athletes/types/athlete';

export const athletesQueryKey = ['athletes'] as const;

export function useAthletes(competitionId: string | null, query: string) {
  return useQuery({
    queryKey: [...athletesQueryKey, competitionId, query],
    queryFn: () => listAthletes({ competitionId: competitionId!, query }),
    enabled: Boolean(competitionId),
  });
}

export function useCreateAthlete(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AthletePayload) => createAthlete(competitionId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...athletesQueryKey, competitionId],
      });
    },
  });
}

export function useUpdateAthlete(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AthleteUpdatePayload;
    }) => updateAthlete(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...athletesQueryKey, competitionId],
      });
    },
  });
}
