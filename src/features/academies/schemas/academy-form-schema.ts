import { z } from 'zod';

export const academyFormSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da academia.'),
});

export type AcademyFormValues = z.infer<typeof academyFormSchema>;
