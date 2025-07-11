/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback } from 'react';
import Papa from 'papaparse';
import {
  CATEGORIES_BY_AGE_WEIGHT,
  getDivisionByAge,
} from '../components/enums/category';
import { Athlete } from '../dashboard';

export type CategoryMap = {
  name: string;
  minWeight: number;
  maxWeight: number;
  maxAge?: number;
  minAge?: number;
  belt: string;
};

export type AthletePropsCSV = {
  nome: string;
  faixa: string;
  peso: string;
  academia: string;
  categoria?: CategoryMap;
  idade: string;
  isApto?: boolean;
  status: 'Aguardando' | 'Avaliado';
};

export const useImportAthletes = () => {
  const parseCsv = useCallback((csvData: string): Athlete[] => {
    const result = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
    });
    // localStorage.removeItem('all-brackets');
    if (result.errors.length > 0) {
      console.error('Erro ao processar CSV:', result.errors);
      return [];
    }
    console.log('CSV parsed successfully:', result.data);
    const athletes: Athlete[] = (result.data as AthletePropsCSV[]).map(
      (row, idx) => {
        const age = parseInt(row.idade, 10);
        const weight = parseFloat(row.peso.replace(',', '.'));

        const ageDivision = getDivisionByAge(age);
        const weightMap = ageDivision
          ? CATEGORIES_BY_AGE_WEIGHT[ageDivision.division]
          : undefined;

        const matchingCategory = weightMap
          ? Object.entries(weightMap).find(
              ([_, maxWeight]) =>
                typeof maxWeight === 'number' && weight <= maxWeight,
            )
          : undefined;

        const category: CategoryMap | null = matchingCategory
          ? {
              name: matchingCategory[0],
              minWeight: parseFloat(matchingCategory[0]),
              maxWeight: matchingCategory[1]
                ? parseFloat(matchingCategory[1] as string)
                : 0,
              maxAge: ageDivision?.max,
              minAge: ageDivision?.min,
              belt: row.faixa,
            }
          : null;

        return {
          id: idx + 1, // Use index as ID for simplicity
          name: row.nome,
          belt: row.faixa,
          weight,
          academy: row.academia,
          age,
          category: category || null,
          isApto: undefined,
          status: 'Aguardando',
        };
      },
    );

    return athletes;
  }, []);

  const handleFileUpload = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      callback: (athletes: Athlete[]) => void,
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result;
        if (typeof text === 'string') {
          const importedAthletes = parseCsv(text);
          callback(importedAthletes);
        }
      };
      reader.readAsText(file);
    },
    [parseCsv],
  );

  return {
    handleFileUpload,
  };
};
