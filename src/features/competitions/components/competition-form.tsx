'use client';

import type { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CompetitionFormValues, competitionFormSchema } from '@/features/competitions/schemas/competition-form-schema';
import {
  Competition,
  competitionModeLabels,
  competitionModes,
} from '@/features/competitions/types/competition';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

type CompetitionFormProps = {
  defaultValues?: Partial<Competition>;
  isSubmitting?: boolean;
  submitLabel: string;
  onSubmit: (values: CompetitionFormValues) => void | Promise<void>;
};

export function CompetitionForm({
  defaultValues,
  isSubmitting = false,
  submitLabel,
  onSubmit,
}: CompetitionFormProps) {
  const form = useForm<CompetitionFormValues>({
    resolver: zodResolver(competitionFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      mode: defaultValues?.mode ?? 'TEAM',
      fightDurationSeconds: defaultValues?.fightDurationSeconds ?? 300,
      weighInMarginGrams: defaultValues?.weighInMarginGrams ?? 500,
      ageSplitYears: defaultValues?.ageSplitYears ?? 2,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Card className="p-0">
      <CardContent className="p-6">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Nome da competição" error={errors.name?.message}>
              <Input
                placeholder="Ex.: Copa Estadual 2026"
                {...register('name')}
              />
            </Field>

            <Field label="Modo" error={errors.mode?.message}>
              <select
                {...register('mode')}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {competitionModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {competitionModeLabels[mode]}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Duração da luta (segundos)"
              error={errors.fightDurationSeconds?.message}
            >
              <Input
                type="number"
                min={30}
                step={1}
                {...register('fightDurationSeconds')}
              />
            </Field>

            <Field
              label="Margem da pesagem (gramas)"
              error={errors.weighInMarginGrams?.message}
            >
              <Input
                type="number"
                min={0}
                step={1}
                {...register('weighInMarginGrams')}
              />
            </Field>

            <Field
              label="Divisão etária (anos)"
              error={errors.ageSplitYears?.message}
            >
              <Input
                type="number"
                min={0}
                step={1}
                {...register('ageSplitYears')}
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </label>
  );
}
