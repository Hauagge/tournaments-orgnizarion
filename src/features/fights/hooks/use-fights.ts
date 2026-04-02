'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  finishFight,
  generateFights,
  listFights,
  startFight,
} from '@/features/fights/api/fights-client';
import { FinishFightPayload } from '@/features/fights/types/fight';

export const fightsQueryKey = ['fights'] as const;

export function useFights(
  competitionId: string | null,
  options?: { refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: [...fightsQueryKey, competitionId],
    queryFn: () => listFights(competitionId!),
    enabled: Boolean(competitionId),
    refetchInterval: options?.refetchInterval,
  });
}

export function useGenerateFights(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateFights(competitionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...fightsQueryKey, competitionId],
      });
    },
  });
}

export function useStartFight(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fightId: string) => startFight(fightId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...fightsQueryKey, competitionId],
      });
    },
  });
}

export function useFinishFight(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fightId,
      payload,
    }: {
      fightId: string;
      payload: FinishFightPayload;
    }) => finishFight(fightId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...fightsQueryKey, competitionId],
      });
    },
  });
}
