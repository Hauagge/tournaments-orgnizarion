import { z } from 'zod';
import { competitionModes } from '@/features/competitions/types/competition';

export const competitionFormSchema = z.object({
  name: z.string().trim().min(3, 'Informe pelo menos 3 caracteres.'),
  mode: z.enum(competitionModes, {
    errorMap: () => ({ message: 'Selecione um modo valido.' }),
  }),
  fightDurationSeconds: z.coerce
    .number()
    .int('Use um valor inteiro.')
    .min(30, 'Use no minimo 30 segundos.'),
  weighInMarginGrams: z.coerce
    .number()
    .int('Use um valor inteiro.')
    .min(0, 'Nao use valores negativos.'),
  ageSplitYears: z.coerce
    .number()
    .int('Use um valor inteiro.')
    .min(0, 'Nao use valores negativos.')
    .max(99, 'Use um valor menor que 100.'),
});

export type CompetitionFormValues = z.infer<typeof competitionFormSchema>;
