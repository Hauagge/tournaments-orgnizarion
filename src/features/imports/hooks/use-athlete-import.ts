'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  importAthletes,
  previewAthleteImport,
} from '@/features/imports/api/athlete-import-client';
import { athletesQueryKey } from '@/features/athletes/hooks/use-athletes';

export function useAthleteImportPreview(competitionId: string | null) {
  return useMutation({
    mutationFn: (csvText: string) => previewAthleteImport(competitionId!, csvText),
  });
}

export function useImportAthletes(competitionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => importAthletes(competitionId!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...athletesQueryKey, competitionId],
      });
    },
  });
}
