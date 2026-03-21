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
    }: {
      athleteId: string;
      realWeightGrams: number;
    }) => confirmWeighIn(competitionId!, { athleteId, realWeightGrams }),
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
