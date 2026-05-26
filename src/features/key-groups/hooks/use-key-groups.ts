'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { areaQueueQueryKey, areasQueryKey } from '@/features/areas/hooks/use-areas';
import {
  addAthleteToKeyGroup,
  createKeyGroupFight,
  createKeyGroup,
  generateKeyGroupFights,
  getKeyGroup,
  listKeyGroups,
  lockKeyGroup,
  removeAthleteFromKeyGroup,
  updateKeyGroup,
} from '@/features/key-groups/api/key-groups-client';
import { KeyGroupPayload } from '@/features/key-groups/types/key-group';

export const keyGroupsQueryKey = ['key-groups'] as const;

export function useKeyGroups(competitionId: string | null) {
  return useQuery({
    queryKey: [...keyGroupsQueryKey, competitionId],
    queryFn: () => listKeyGroups(competitionId!),
    enabled: Boolean(competitionId),
  });
}

export function useKeyGroup(competitionId: string | null, keyGroupId: string) {
  return useQuery({
    queryKey: [...keyGroupsQueryKey, competitionId, keyGroupId],
    queryFn: () => getKeyGroup(keyGroupId),
    enabled: Boolean(competitionId && keyGroupId),
  });
}

export function useCreateKeyGroup(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: KeyGroupPayload) => createKeyGroup(competitionId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...keyGroupsQueryKey, competitionId] });
    },
  });
}

export function useUpdateKeyGroup(competitionId: string | null, keyGroupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: KeyGroupPayload) => updateKeyGroup(keyGroupId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...keyGroupsQueryKey, competitionId] });
      queryClient.invalidateQueries({
        queryKey: [...keyGroupsQueryKey, competitionId, keyGroupId],
      });
    },
  });
}

export function useAddAthleteToKeyGroup(competitionId: string | null, keyGroupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (athleteId: string) => addAthleteToKeyGroup(keyGroupId, athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...keyGroupsQueryKey, competitionId] });
      queryClient.invalidateQueries({
        queryKey: [...keyGroupsQueryKey, competitionId, keyGroupId],
      });
      queryClient.invalidateQueries({ queryKey: ['athletes', competitionId] });
      queryClient.invalidateQueries({ queryKey: ['fights', competitionId] });
    },
  });
}

export function useRemoveAthleteFromKeyGroup(
  competitionId: string | null,
  keyGroupId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (athleteId: string) => removeAthleteFromKeyGroup(keyGroupId, athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...keyGroupsQueryKey, competitionId] });
      queryClient.invalidateQueries({
        queryKey: [...keyGroupsQueryKey, competitionId, keyGroupId],
      });
      queryClient.invalidateQueries({ queryKey: ['athletes', competitionId] });
      queryClient.invalidateQueries({ queryKey: ['fights', competitionId] });
    },
  });
}

export function useGenerateKeyGroupFights(
  competitionId: string | null,
  keyGroupId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateKeyGroupFights(keyGroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...keyGroupsQueryKey, competitionId] });
      queryClient.invalidateQueries({
        queryKey: [...keyGroupsQueryKey, competitionId, keyGroupId],
      });
      queryClient.invalidateQueries({ queryKey: ['fights', competitionId] });
      queryClient.invalidateQueries({ queryKey: [...areasQueryKey, competitionId] });
      queryClient.invalidateQueries({ queryKey: areaQueueQueryKey });
    },
  });
}

export function useLockKeyGroup(competitionId: string | null, keyGroupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => lockKeyGroup(keyGroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...keyGroupsQueryKey, competitionId] });
      queryClient.invalidateQueries({
        queryKey: [...keyGroupsQueryKey, competitionId, keyGroupId],
      });
    },
  });
}

export function useCreateKeyGroupFight(
  competitionId: string | null,
  keyGroupId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { athleteAId: number; athleteBId: number }) =>
      createKeyGroupFight(keyGroupId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...keyGroupsQueryKey, competitionId] });
      queryClient.invalidateQueries({
        queryKey: [...keyGroupsQueryKey, competitionId, keyGroupId],
      });
      queryClient.invalidateQueries({ queryKey: ['fights', competitionId] });
      queryClient.invalidateQueries({ queryKey: [...areasQueryKey, competitionId] });
      queryClient.invalidateQueries({ queryKey: areaQueueQueryKey });
    },
  });
}
