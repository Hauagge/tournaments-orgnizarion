'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  generateCategories,
  getCategory,
  listCategories,
} from '@/features/categories/api/categories-client';

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
