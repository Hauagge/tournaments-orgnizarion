/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback } from 'react';
import Papa from 'papaparse';
import {
  CATEGORIES_BY_AGE_WEIGHT,
  getDivisionByAge,
} from '@/features/categories/lib/category';
import { Athlete, BeltsEnum, CategoryMap, GenderEnum } from '@/shared/lib/types';
import { useAthleteStore } from '@/shared/stores/useAthleteStore';

export type AthletePropsCSV = {
  Nome: string;
  Faixa: string;
  Peso: string;
  Equipe: string;
  categoria?: CategoryMap;
  Idade: string;
  isApto?: boolean;
  status: 'Aguardando' | 'Avaliado';
  Sexo: GenderEnum | '';
  'Data de Nasc': string;
};

export const useImportAthletes = () => {
  const setAthletes = useAthleteStore((state) => state.setAthletes);
  const parseCsv = useCallback((csvData: string): Athlete[] => {
    const result = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
    });
    if (result.errors.length > 0) {
      console.error('Erro ao processar CSV:', result.errors);
      return [];
    }
    console.log('CSV parsed successfully:', result.data);
    const athletes: Athlete[] = (result.data as AthletePropsCSV[]).map(
      (row, idx) => {
        const age = parseInt(row.Idade, 10);
        const weight = parseFloat(row.Peso.replace(',', '.'));

        const ageDivision = getDivisionByAge(age);
        const weightMap = ageDivision
          ? CATEGORIES_BY_AGE_WEIGHT[ageDivision.division]
          : undefined;

        const sortedCategories = weightMap
          ? Object.entries(weightMap)
              .filter(([_, maxWeight]) => typeof maxWeight === 'number')
              .sort(([_, a], [__, b]) => +a - +b)
          : [];

        const matchingCategory = sortedCategories.find(
          ([_, limits]) => weight >= Number(limits.min) && weight <= Number(limits.max),
        );

        const category: CategoryMap | null = matchingCategory
          ? {
              name: matchingCategory[0],
              minWeight: parseFloat(String(matchingCategory[1].min)),
              maxWeight: matchingCategory[1].max
                ? parseFloat(String(matchingCategory[1].max))
                : Infinity,
              maxAge: ageDivision?.max,
              minAge: ageDivision?.min,
              belt:
                BeltsEnum[row.Faixa.toUpperCase() as keyof typeof BeltsEnum] ||
                '',
              gender:
                GenderEnum[
                  row.Sexo.toLocaleUpperCase() as keyof typeof GenderEnum
                ] || '',
            }
          : null;

        return {
          id: idx + 1, // Use index as ID for simplicity
          name: row.Nome,
          belt:
            BeltsEnum[row.Faixa.toUpperCase() as keyof typeof BeltsEnum] || '',
          weight,
          academy: row.Equipe,
          age,
          category: category || null,
          isApto: undefined,
          status: 'Aguardando',
          gender:
            GenderEnum[row.Sexo.toUpperCase() as keyof typeof GenderEnum] ||
            row.Sexo.toUpperCase(),
        };
      },
    );
    setAthletes(athletes);
    return athletes;
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result;
        if (typeof text === 'string') {
          parseCsv(text);
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
