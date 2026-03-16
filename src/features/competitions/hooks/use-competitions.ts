'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createCompetition,
  getCompetition,
  listCompetitions,
  updateCompetition,
} from '@/features/competitions/api/competitions-client';
import { CompetitionPayload } from '@/features/competitions/types/competition';

export const competitionsQueryKey = ['competitions'] as const;

export function useCompetitions() {
  return useQuery({
    queryKey: competitionsQueryKey,
    queryFn: listCompetitions,
  });
}

export function useCompetition(id: string) {
  return useQuery({
    queryKey: [...competitionsQueryKey, id],
    queryFn: () => getCompetition(id),
    enabled: Boolean(id),
  });
}

export function useCreateCompetition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompetitionPayload) => createCompetition(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: competitionsQueryKey });
    },
  });
}

export function useUpdateCompetition(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompetitionPayload) => updateCompetition(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: competitionsQueryKey });
      queryClient.invalidateQueries({ queryKey: [...competitionsQueryKey, id] });
    },
  });
}
