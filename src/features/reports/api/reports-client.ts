import { apiFetch } from '@/shared/api/fetch-client';
import {
  ChampionAcademiesReportFilters,
  normalizeChampionAcademiesReport,
} from '@/features/reports/types/champion-academies-report';

function buildSearchParams(filters?: ChampionAcademiesReportFilters) {
  const params = new URLSearchParams();

  if (!filters) {
    return params.toString();
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim().length > 0) {
      params.set(key, value);
    }
  });

  return params.toString();
}

export async function getChampionAcademiesReport(
  competitionId: string,
  filters?: ChampionAcademiesReportFilters,
) {
  const query = buildSearchParams(filters);
  const path = query
    ? `/competitions/${competitionId}/reports/champion-academies?${query}`
    : `/competitions/${competitionId}/reports/champion-academies`;

  const response = await apiFetch<unknown>(path, {
    method: 'GET',
    cache: 'no-store',
  });

  return normalizeChampionAcademiesReport(response);
}
