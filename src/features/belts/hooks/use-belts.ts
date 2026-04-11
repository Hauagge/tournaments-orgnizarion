'use client';

import { useQuery } from '@tanstack/react-query';
import { listBelts } from '@/features/belts/api/belts-client';

export const beltsQueryKey = ['belts'] as const;

export function useBelts() {
  return useQuery({
    queryKey: beltsQueryKey,
    queryFn: listBelts,
  });
}
