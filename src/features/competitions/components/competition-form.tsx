'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
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
  const [mergeGroups, setMergeGroups] = useState(['Branca + Cinza']);
  const [priority, setPriority] = useState<'Peso' | 'Faixa' | 'Idade'>('Peso');
  const [rules, setRules] = useState({
    belt: true,
    weight: true,
    age: true,
    absolute: false,
  });
  const form = useForm<CompetitionFormValues>({
    resolver: zodResolver(competitionFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      mode: defaultValues?.mode === 'ABSOLUTE_GP' ? 'ABSOLUTE_GP' : 'KEYS',
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
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-xl border border-slate-200/70 bg-white p-4 lg:sticky lg:top-6">
        <div className="space-y-3">
          {['Dados gerais', 'Regras de separação', 'Áreas de luta', 'Atletas', 'Gerar chaves'].map((step, index) => {
            const done = index === 0;
            const current = index === 1;

            return (
              <div
                key={step}
                className={`flex items-center gap-3 rounded-lg border px-3 py-3 ${
                  current
                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                    : done
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-transparent text-slate-500'
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current text-sm">
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="text-sm font-medium">{step}</span>
              </div>
            );
          })}
        </div>
      </aside>

      <Card className="rounded-xl border border-slate-200/70 p-0 shadow-none">
        <CardContent className="p-6">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <p className="text-sm text-slate-500">Etapa atual</p>
              <h2 className="mt-1 text-2xl font-medium text-slate-950">
                Regras de separação
              </h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="Nome da competição" error={errors.name?.message}>
                <Input placeholder="Ex.: Copa Estadual 2026" {...register('name')} />
              </Field>

              <Field label="Modo" error={errors.mode?.message}>
                <select
                  {...register('mode')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                >
                  {competitionModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {competitionModeLabels[mode]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="space-y-4">
              <RulePanel
                title="Separar por faixa"
                enabled={rules.belt}
                onToggle={() => setRules((current) => ({ ...current, belt: !current.belt }))}
              >
                <div className="space-y-2">
                  {mergeGroups.map((group, index) => (
                    <Input
                      key={`${group}-${index}`}
                      value={group}
                      onChange={(event) =>
                        setMergeGroups((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item,
                          ),
                        )
                      }
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMergeGroups((current) => [...current, ''])}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar combinação
                  </Button>
                </div>
              </RulePanel>

              <RulePanel
                title="Separar por peso"
                enabled={rules.weight}
                onToggle={() => setRules((current) => ({ ...current, weight: !current.weight }))}
              >
                <div className="flex flex-wrap gap-2">
                  {(['Peso', 'Faixa', 'Idade'] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPriority(item)}
                      className={`rounded-lg border px-4 py-2 text-sm ${
                        priority === item
                          ? 'border-blue-300 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </RulePanel>

              <RulePanel
                title="Separar por idade"
                enabled={rules.age}
                onToggle={() => setRules((current) => ({ ...current, age: !current.age }))}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {['Infantil', 'Juvenil', 'Adulto', 'Máster'].map((label) => (
                    <Input key={label} defaultValue={label} />
                  ))}
                </div>
              </RulePanel>

              <RulePanel
                title="Permitir absoluto"
                enabled={rules.absolute}
                onToggle={() => setRules((current) => ({ ...current, absolute: !current.absolute }))}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Field label="Duração da luta (segundos)" error={errors.fightDurationSeconds?.message}>
                <Input type="number" min={30} step={1} {...register('fightDurationSeconds')} />
              </Field>
              <Field label="Margem da pesagem (gramas)" error={errors.weighInMarginGrams?.message}>
                <Input type="number" min={0} step={1} {...register('weighInMarginGrams')} />
              </Field>
              <Field label="Divisão etária (anos)" error={errors.ageSplitYears?.message}>
                <Input type="number" min={0} step={1} {...register('ageSplitYears')} />
              </Field>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline">
                Voltar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : `${submitLabel} →`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
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
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </label>
  );
}

function RulePanel({
  title,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium text-slate-950">{title}</h3>
        <button
          type="button"
          onClick={onToggle}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            enabled
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
          aria-label={`${enabled ? 'Desativar' : 'Ativar'} ${title}`}
        >
          {enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
          {enabled ? 'Ativo' : 'Inativo'}
        </button>
      </div>
      {enabled && children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
