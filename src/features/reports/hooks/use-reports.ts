'use client';

import { useQuery } from '@tanstack/react-query';
import { getChampionAcademiesReport } from '@/features/reports/api/reports-client';
import { ChampionAcademiesReportFilters } from '@/features/reports/types/champion-academies-report';

export const championAcademiesReportQueryKey = [
  'reports',
  'champion-academies',
] as const;

export function useChampionAcademiesReport(
  competitionId: string | null,
  filters?: ChampionAcademiesReportFilters,
) {
  return useQuery({
    queryKey: [...championAcademiesReportQueryKey, competitionId, filters ?? {}],
    queryFn: () => getChampionAcademiesReport(competitionId!, filters),
    enabled: Boolean(competitionId),
  });
}
