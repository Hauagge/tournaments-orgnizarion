'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  addUserToCompetition,
  listCompetitionUsers,
  removeUserFromCompetition,
  searchSystemUsers,
} from '@/features/users/api/users-client';

export const competitionUsersQueryKey = ['competition-users'] as const;
export const systemUsersQueryKey = ['system-users'] as const;

export function useCompetitionUsers(competitionId: string | null) {
  return useQuery({
    queryKey: [...competitionUsersQueryKey, competitionId],
    queryFn: () => listCompetitionUsers(competitionId!),
    enabled: Boolean(competitionId),
  });
}

export function useSystemUsers(query: string) {
  return useQuery({
    queryKey: [...systemUsersQueryKey, query],
    queryFn: () => searchSystemUsers(query),
    enabled: query.trim().length >= 2,
  });
}

export function useAddUserToCompetition(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => addUserToCompetition(competitionId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...competitionUsersQueryKey, competitionId],
      });
    },
  });
}

export function useRemoveUserFromCompetition(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      removeUserFromCompetition(competitionId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...competitionUsersQueryKey, competitionId],
      });
    },
  });
}
