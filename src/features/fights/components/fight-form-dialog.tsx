'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Athlete } from '@/features/athletes/types/athlete';
import { CategorySummary } from '@/features/categories/types/category';
import { CreateFightPayload, Fight, FightStatus } from '@/features/fights/types/fight';

type FightFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateFightPayload & { status?: FightStatus }) => void;
  athletes: Athlete[];
  categories: CategorySummary[];
  areas: Array<{ id: string; name: string }>;
  fight?: Fight | null;
  defaultCategoryId?: string | null;
  defaultKeyGroupId?: string | null;
  isSubmitting?: boolean;
};

type FormState = {
  categoryId: string;
  athleteAId: string;
  athleteBId: string;
  round: string;
  order: string;
  areaId: string;
  status: FightStatus;
};

function buildInitialState({
  fight,
  defaultCategoryId,
}: {
  fight?: Fight | null;
  defaultCategoryId?: string | null;
}): FormState {
  return {
    categoryId: fight?.categoryId ?? defaultCategoryId ?? '',
    athleteAId: fight?.athleteA?.id ?? '',
    athleteBId: fight?.athleteB?.id ?? '',
    round: fight?.round ? String(fight.round) : '1',
    order: fight?.order ? String(fight.order) : '1',
    areaId: fight?.areaId ?? '',
    status: fight?.status ?? 'PENDING',
  };
}

export function FightFormDialog({
  isOpen,
  onClose,
  onSubmit,
  athletes,
  categories,
  areas,
  fight = null,
  defaultCategoryId = null,
  defaultKeyGroupId = null,
  isSubmitting = false,
}: FightFormDialogProps) {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState({ fight, defaultCategoryId }),
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(buildInitialState({ fight, defaultCategoryId }));
  }, [defaultCategoryId, fight, isOpen]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === form.categoryId) ?? null,
    [categories, form.categoryId],
  );

  const dialogTitle = fight ? 'Editar luta' : 'Criar luta manual';

  function handleSubmit() {
    onSubmit({
      categoryId: form.categoryId || null,
      categoryName: selectedCategory?.name,
      keyGroupId: fight?.keyGroupId ?? defaultKeyGroupId ?? null,
      athleteAId: form.athleteAId || null,
      athleteBId: form.athleteBId || null,
      round: Number(form.round) || null,
      order: Number(form.order) || null,
      areaId: form.areaId || null,
      createdManually: true,
      status: form.status,
      nextFightId: fight?.nextFightId ?? null,
      nextFightSlot: fight?.nextFightSlot ?? null,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl border-4 border-slate-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-slate-950">
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            Defina atletas, rodada, ordem e área para inserir a luta dentro da chave existente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-black uppercase tracking-[0.12em] text-slate-600">
              Categoria
            </span>
            <select
              value={form.categoryId}
              onChange={(event) =>
                setForm((current) => ({ ...current, categoryId: event.target.value }))
              }
              className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
            >
              <option value="">Selecione</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black uppercase tracking-[0.12em] text-slate-600">
              Área
            </span>
            <select
              value={form.areaId}
              onChange={(event) =>
                setForm((current) => ({ ...current, areaId: event.target.value }))
              }
              className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
            >
              <option value="">Sem área</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black uppercase tracking-[0.12em] text-slate-600">
              Atleta A
            </span>
            <select
              value={form.athleteAId}
              onChange={(event) =>
                setForm((current) => ({ ...current, athleteAId: event.target.value }))
              }
              className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
            >
              <option value="">A definir</option>
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black uppercase tracking-[0.12em] text-slate-600">
              Atleta B
            </span>
            <select
              value={form.athleteBId}
              onChange={(event) =>
                setForm((current) => ({ ...current, athleteBId: event.target.value }))
              }
              className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
            >
              <option value="">A definir</option>
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black uppercase tracking-[0.12em] text-slate-600">
              Rodada
            </span>
            <input
              type="number"
              min={1}
              value={form.round}
              onChange={(event) =>
                setForm((current) => ({ ...current, round: event.target.value }))
              }
              className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black uppercase tracking-[0.12em] text-slate-600">
              Ordem
            </span>
            <input
              type="number"
              min={1}
              value={form.order}
              onChange={(event) =>
                setForm((current) => ({ ...current, order: event.target.value }))
              }
              className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-black uppercase tracking-[0.12em] text-slate-600">
              Status
            </span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as FightStatus,
                }))
              }
              className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
            >
              <option value="PENDING">Pendente</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="FINISHED">Finalizada</option>
            </select>
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !form.categoryId || form.athleteAId === form.athleteBId}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar luta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
