'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { areaQueueQueryKey, areasQueryKey } from '@/features/areas/hooks/use-areas';
import {
  createFight,
  exportFightsByAreaPdf,
  finishFight,
  generateFights,
  listFights,
  startFight,
  updateFight,
  updateFightOrder,
} from '@/features/fights/api/fights-client';
import {
  CreateFightPayload,
  Fight,
  FightFilters,
  FinishFightPayload,
  UpdateFightOrderPayload,
  UpdateFightPayload,
} from '@/features/fights/types/fight';
import { keyGroupsQueryKey } from '@/features/key-groups/hooks/use-key-groups';

export const fightsQueryKey = ['fights'] as const;
type RefetchIntervalOption =
  | number
  | false
  | ((query: { state: { data?: unknown } }) => number | false | undefined);

export function useFights(
  competitionId: string | null,
  filtersOrOptions?: FightFilters | { refetchInterval?: RefetchIntervalOption },
  maybeOptions?: { refetchInterval?: RefetchIntervalOption },
) {
  const filters =
    filtersOrOptions && 'refetchInterval' in filtersOrOptions
      ? undefined
      : (filtersOrOptions as FightFilters | undefined);
  const options =
    filtersOrOptions && 'refetchInterval' in filtersOrOptions
      ? filtersOrOptions
      : maybeOptions;

  return useQuery({
    queryKey: [...fightsQueryKey, competitionId, filters ?? {}],
    queryFn: () => listFights(competitionId!, filters),
    enabled: Boolean(competitionId),
    refetchInterval: options?.refetchInterval,
  });
}

export function useGenerateFights(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateFights(competitionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...fightsQueryKey, competitionId] });
      queryClient.invalidateQueries({ queryKey: [...areasQueryKey, competitionId] });
      queryClient.invalidateQueries({ queryKey: areaQueueQueryKey });
    },
  });
}

export function useCreateFight(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFightPayload) => createFight(competitionId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...fightsQueryKey, competitionId] });
      queryClient.invalidateQueries({ queryKey: [...areasQueryKey, competitionId] });
      queryClient.invalidateQueries({ queryKey: areaQueueQueryKey });
      queryClient.invalidateQueries({ queryKey: [...keyGroupsQueryKey, competitionId] });
    },
  });
}

export function useUpdateFight(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fightId,
      payload,
    }: {
      fightId: string;
      payload: UpdateFightPayload;
    }) => updateFight(fightId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...fightsQueryKey, competitionId] });
      queryClient.invalidateQueries({ queryKey: [...areasQueryKey, competitionId] });
      queryClient.invalidateQueries({ queryKey: areaQueueQueryKey });
      queryClient.invalidateQueries({ queryKey: [...keyGroupsQueryKey, competitionId] });
    },
  });
}

export function useStartFight(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fightId: string) => startFight(fightId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...fightsQueryKey, competitionId] });
      queryClient.invalidateQueries({ queryKey: [...areasQueryKey, competitionId] });
      queryClient.invalidateQueries({ queryKey: areaQueueQueryKey });
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
      queryClient.invalidateQueries({ queryKey: [...fightsQueryKey, competitionId] });
      queryClient.invalidateQueries({ queryKey: [...areasQueryKey, competitionId] });
      queryClient.invalidateQueries({ queryKey: areaQueueQueryKey });
      queryClient.invalidateQueries({ queryKey: [...keyGroupsQueryKey, competitionId] });
    },
  });
}

export function useUpdateFightOrder(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateFightOrderPayload) =>
      updateFightOrder(competitionId!, payload),
    onMutate: async (payload) => {
      const queryKey = [...fightsQueryKey, competitionId] as const;

      await queryClient.cancelQueries({ queryKey });

      const previousQueries = queryClient.getQueriesData<Fight[]>({
        queryKey,
      });
      const orderMap = new Map(
        payload.items.map((item) => [String(item.fightId), item.orderIndex]),
      );

      previousQueries.forEach(([currentKey]) => {
        queryClient.setQueryData<Fight[]>(currentKey, (current) => {
          if (!Array.isArray(current)) {
            return current;
          }

          return [...current]
            .map((fight) => ({
              ...fight,
              order: orderMap.get(fight.id) ?? fight.order,
            }))
            .sort((fightA, fightB) => {
              const orderA = fightA.order ?? Number.MAX_SAFE_INTEGER;
              const orderB = fightB.order ?? Number.MAX_SAFE_INTEGER;
              return orderA - orderB;
            });
        });
      });

      return { previousQueries, queryKey };
    },
    onError: (_error, _payload, context) => {
      context?.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...fightsQueryKey, competitionId] });
      queryClient.invalidateQueries({ queryKey: [...areasQueryKey, competitionId] });
      queryClient.invalidateQueries({ queryKey: areaQueueQueryKey });
    },
  });
}

export function useExportFightsByAreaPdf(competitionId: string | null) {
  return useMutation({
    mutationFn: () => exportFightsByAreaPdf(competitionId!),
  });
}
