'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Athlete,
  getWeighInStatusLabel,
  weighInStatusOptions,
} from '@/features/athletes/types/athlete';
import { useBelts } from '@/features/belts/hooks/use-belts';
import {
  AthleteFormValues,
  athleteFormSchema,
} from '@/features/athletes/schemas/athlete-form-schema';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

type AthleteFormDialogProps = {
  athlete?: Athlete | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: AthleteFormValues) => void | Promise<void>;
};

export function AthleteFormDialog({
  athlete,
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: AthleteFormDialogProps) {
  const beltsQuery = useBelts();
  const beltOptions = beltsQuery.data ?? [];
  const form = useForm<AthleteFormValues>({
    resolver: zodResolver(athleteFormSchema),
    defaultValues: {
      fullName: athlete?.name ?? '',
      belt: athlete?.belt ?? '',
      birthDate: athlete?.birthDate?.slice(0, 10) ?? '',
      declaredWeight: athlete?.declaredWeight ?? 0,
      team: athlete?.team ?? '',
      weighInStatus:
        athlete?.weighInStatus === 'APPROVED' ||
        athlete?.weighInStatus === 'REJECTED'
          ? athlete.weighInStatus
          : 'PENDING',
    },
  });

  useEffect(() => {
    form.reset({
      fullName: athlete?.name ?? '',
      belt: athlete?.belt ?? '',
      birthDate: athlete?.birthDate?.slice(0, 10) ?? '',
      declaredWeight: athlete?.declaredWeight ?? 0,
      team: athlete?.team ?? '',
      weighInStatus:
        athlete?.weighInStatus === 'APPROVED' ||
        athlete?.weighInStatus === 'REJECTED'
          ? athlete.weighInStatus
          : 'PENDING',
    });
  }, [athlete, form, isOpen]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {athlete ? 'Editar atleta' : 'Cadastrar atleta'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do atleta para a competição ativa.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome" error={errors.fullName?.message}>
              <Input
                placeholder="Ex.: Gabriel Silva"
                {...register('fullName')}
              />
            </Field>

            <Field label="Academia" error={errors.team?.message}>
              <Input
                placeholder="Ex.: Checkmat Campinas"
                {...register('team')}
              />
            </Field>

            <Field label="Faixa" error={errors.belt?.message}>
              <select
                {...register('belt')}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Selecione</option>
                {beltOptions.map((belt) => (
                  <option key={belt} value={belt}>
                    {belt}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Data de nascimento" error={errors.birthDate?.message}>
              <Input type="date" {...register('birthDate')} />
            </Field>

            <Field
              label="Peso declarado (kg)"
              error={errors.declaredWeight?.message}
            >
              <Input
                type="number"
                min="0"
                step="0.1"
                {...register('declaredWeight')}
              />
            </Field>

            <Field label="Status pesagem" error={errors.weighInStatus?.message}>
              <select
                {...register('weighInStatus')}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {weighInStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getWeighInStatusLabel(status)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : athlete ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
