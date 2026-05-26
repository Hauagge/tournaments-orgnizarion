'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  addAthleteToCategory,
  createCategory,
  distributeAthletesInCategories,
  generateCategories,
  getCategory,
  listCategories,
} from '@/features/categories/api/categories-client';
import {
  AddAthleteToCategoryResponse,
  CreateCategoryPayload,
  DistributeAthletesResponse,
} from '@/features/categories/types/category';
import { athletesQueryKey } from '@/features/athletes/hooks/use-athletes';
import { fightsQueryKey } from '@/features/fights/hooks/use-fights';
import { competitionsQueryKey } from '@/features/competitions/hooks/use-competitions';

export const categoriesQueryKey = ['categories'] as const;
export const categoryDetailQueryKey = ['category-detail'] as const;

export function useCategories(competitionId: string | null) {
  return useQuery({
    queryKey: [...categoriesQueryKey, competitionId],
    queryFn: () => listCategories(competitionId!),
    enabled: Boolean(competitionId),
  });
}

export function useCategory(id: string | null) {
  return useQuery({
    queryKey: [...categoryDetailQueryKey, id],
    queryFn: () => getCategory(id!),
    enabled: Boolean(id),
  });
}

export function useGenerateCategories(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateCategories(competitionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...categoriesQueryKey, competitionId],
      });
      queryClient.invalidateQueries({
        queryKey: categoryDetailQueryKey,
      });
    },
  });
}

export function useCreateCategory(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      createCategory(competitionId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...categoriesQueryKey, competitionId],
      });
      queryClient.invalidateQueries({
        queryKey: categoryDetailQueryKey,
      });
    },
  });
}

export function useDistributeAthletesInCategories(
  competitionId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation<
    DistributeAthletesResponse,
    Error,
    boolean | undefined
  >({
    mutationFn: (dryRun: boolean = false) =>
      distributeAthletesInCategories(competitionId!, dryRun),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...categoriesQueryKey, competitionId],
      });
      queryClient.invalidateQueries({
        queryKey: categoryDetailQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: [...athletesQueryKey, competitionId],
      });
      queryClient.invalidateQueries({
        queryKey: [...fightsQueryKey, competitionId],
      });
      queryClient.invalidateQueries({
        queryKey: competitionsQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: [...competitionsQueryKey, competitionId],
      });
    },
  });
}

export function useAddAthleteToCategory(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<
    AddAthleteToCategoryResponse,
    Error,
    {
      categoryId: string;
      athleteId: string;
    }
  >({
    mutationFn: ({ categoryId, athleteId }) =>
      addAthleteToCategory({
        competitionId: competitionId!,
        categoryId,
        athleteId,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...categoriesQueryKey, competitionId],
      });
      queryClient.invalidateQueries({
        queryKey: [...categoryDetailQueryKey, variables.categoryId],
      });
      queryClient.invalidateQueries({
        queryKey: categoryDetailQueryKey,
      });
    },
  });
}
