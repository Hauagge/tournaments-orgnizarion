'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  callNextAreaFight,
  createAreas,
  distributeAreaFights,
  getAreaQueue,
  listAreas,
} from '@/features/areas/api/areas-client';
import {
  Area,
  AreaQueue,
  CreateAreasPayload,
} from '@/features/areas/types/area';

export const areasQueryKey = ['areas'] as const;
export const areaQueueQueryKey = ['area-queue'] as const;
type RefetchIntervalOption =
  | number
  | false
  | ((query: { state: { data?: unknown } }) => number | false | undefined);

export function useAreas(
  competitionId: string | null,
  options?: { refetchInterval?: RefetchIntervalOption },
) {
  return useQuery<Area[]>({
    queryKey: [...areasQueryKey, competitionId],
    queryFn: () => listAreas(competitionId!),
    enabled: Boolean(competitionId),
    refetchInterval: options?.refetchInterval,
  });
}

export function useAreaQueue(
  areaId: string | null,
  options?: { refetchInterval?: RefetchIntervalOption },
) {
  return useQuery<AreaQueue>({
    queryKey: [...areaQueueQueryKey, areaId],
    queryFn: () => getAreaQueue(areaId!),
    enabled: Boolean(areaId),
    refetchInterval: options?.refetchInterval,
  });
}

export function useCreateAreas(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAreasPayload) =>
      createAreas(competitionId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...areasQueryKey, competitionId],
      });
    },
  });
}

export function useDistributeAreaFights(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => distributeAreaFights(competitionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...areasQueryKey, competitionId],
      });
      queryClient.invalidateQueries({ queryKey: ['fights', competitionId] });
      queryClient.invalidateQueries({ queryKey: areaQueueQueryKey });
    },
  });
}

export function useCallNextAreaFight(
  competitionId: string | null,
  areaId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => callNextAreaFight(areaId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...areasQueryKey, competitionId],
      });
      queryClient.invalidateQueries({
        queryKey: [...areaQueueQueryKey, areaId],
      });
      queryClient.invalidateQueries({ queryKey: ['fights', competitionId] });
    },
  });
}
