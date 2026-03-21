import { apiFetch } from '@/shared/api/fetch-client';
import {
  AthleteImportPreviewRow,
  AthleteImportSummary,
  normalizeImportSummary,
  normalizePreviewResponse,
} from '@/features/imports/types/athlete-import';

type PreviewResponse =
  | {
      rows?: unknown[];
      data?: unknown[];
      preview?: unknown[];
      validCount?: number;
      invalidCount?: number;
    }
  | unknown[];

type ImportResponse = {
  imported?: number;
  successCount?: number;
  created?: number;
  failed?: number;
  failureCount?: number;
  rejected?: number;
  reasons?: unknown[];
  errors?: unknown[];
  failures?: unknown[];
};

function buildPayload(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
}

export function previewAthleteImport(
  competitionId: string,
  csvText: string,
): Promise<AthleteImportPreviewRow[]> {
  return apiFetch<PreviewResponse>(
    `/competitions/${competitionId}/import/athletes/preview`,
    {
      method: 'POST',
      body: JSON.stringify({ csvText }),
    },
  ).then(normalizePreviewResponse);
}

export function importAthletes(
  competitionId: string,
  file: File,
): Promise<AthleteImportSummary> {
  return apiFetch<ImportResponse>(
    `/competitions/${competitionId}/import/athletes`,
    {
      method: 'POST',
      body: buildPayload(file),
    },
  ).then(normalizeImportSummary);
}
