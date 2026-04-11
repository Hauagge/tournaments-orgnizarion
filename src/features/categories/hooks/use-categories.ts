'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createCategory,
  generateCategories,
  getCategory,
  listCategories,
} from '@/features/categories/api/categories-client';
import { CreateCategoryPayload } from '@/features/categories/types/category';

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
