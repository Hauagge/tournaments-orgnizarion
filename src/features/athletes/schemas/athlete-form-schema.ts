import { z } from 'zod';
import { weighInStatusOptions } from '@/features/athletes/types/athlete';

export const athleteFormSchema = z.object({
  name: z.string().min(2, 'Informe o nome do atleta.'),
  belt: z.string().min(1, 'Selecione a faixa.'),
  birthDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Informe uma data de nascimento válida.',
  }),
  declaredWeight: z.coerce
    .number()
    .positive('Informe um peso maior que zero.'),
  team: z.string().min(2, 'Informe a equipe.'),
  weighInStatus: z.enum(weighInStatusOptions),
});

export type AthleteFormValues = z.infer<typeof athleteFormSchema>;
