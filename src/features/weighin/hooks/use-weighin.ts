'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { athletesQueryKey } from '@/features/athletes/hooks/use-athletes';
import {
  confirmWeighIn,
  resetWeighIn,
} from '@/features/weighin/api/weighin-client';

export function useConfirmWeighIn(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      athleteId,
      realWeightGrams,
      weighInStatus,
    }: {
      athleteId: string;
      realWeightGrams: number;
      weighInStatus: 'APPROVED' | 'REJECTED';
    }) =>
      confirmWeighIn(competitionId!, {
        athleteId,
        realWeightGrams,
        weighInStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...athletesQueryKey, competitionId],
      });
    },
  });
}

export function useResetWeighIn(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (athleteId: string) => resetWeighIn(competitionId!, athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...athletesQueryKey, competitionId],
      });
    },
  });
}
