'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  addAthleteToAcademy,
  createAcademy,
  listAcademies,
  removeAthleteFromAcademy,
  updateAcademy,
} from '@/features/academies/api/academies-client';
import { AcademyPayload } from '@/features/academies/types/academy';

export const academiesQueryKey = ['academies'] as const;

export function useAcademies(competitionId: string | null) {
  return useQuery({
    queryKey: [...academiesQueryKey, competitionId],
    queryFn: () => listAcademies(competitionId!),
    enabled: Boolean(competitionId),
  });
}

export function useAcademy(competitionId: string | null, academyId: string) {
  return useQuery({
    queryKey: [...academiesQueryKey, competitionId, academyId],
    queryFn: async () => {
      const academies = await listAcademies(competitionId!);
      return academies.find((academy) => academy.id === academyId) ?? null;
    },
    enabled: Boolean(competitionId && academyId),
  });
}

export function useCreateAcademy(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AcademyPayload) => createAcademy(competitionId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...academiesQueryKey, competitionId],
      });
    },
  });
}

export function useUpdateAcademy(competitionId: string | null, academyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AcademyPayload) => updateAcademy(academyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...academiesQueryKey, competitionId],
      });
    },
  });
}

export function useAddAthleteToAcademy(
  competitionId: string | null,
  academyId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (athleteId: string) => addAthleteToAcademy(academyId, athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...academiesQueryKey, competitionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['athletes', competitionId],
      });
    },
  });
}

export function useRemoveAthleteFromAcademy(
  competitionId: string | null,
  academyId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (athleteId: string) => removeAthleteFromAcademy(academyId, athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...academiesQueryKey, competitionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['athletes', competitionId],
      });
    },
  });
}
