'use client';

import React, { useMemo, useState } from 'react';
import { ApiError } from '@/shared/api/fetch-client';
import { Athlete } from '@/features/athletes/types/athlete';
import { useAddAthleteToCategory } from '@/features/categories/hooks/use-categories';
import { CategoryDetail } from '@/features/categories/types/category';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/use-toast';

type AddAthleteToCategoryFormProps = {
  competitionId: string | null;
  category: CategoryDetail;
  athletes: Athlete[];
  onSuccess?: () => void | Promise<void>;
};

const genericAddAthleteErrorMessage =
  'Não foi possível adicionar o atleta à categoria. Tente novamente.';

export function AddAthleteToCategoryForm({
  competitionId,
  category,
  athletes,
  onSuccess,
}: AddAthleteToCategoryFormProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorState, setErrorState] = useState<{
    message: string;
    reasons: string[];
  } | null>(null);
  const mutation = useAddAthleteToCategory(competitionId);
  const { toast } = useToast();

  const categoryAthleteIds = useMemo(
    () => new Set(category.athletes.map((athlete) => athlete.id)),
    [category.athletes],
  );

  const availableAthletes = useMemo(
    () =>
      athletes.filter((athlete) => !categoryAthleteIds.has(athlete.id)),
    [athletes, categoryAthleteIds],
  );

  const selectedAthlete = useMemo(
    () =>
      availableAthletes.find((athlete) => athlete.id === selectedAthleteId) ?? null,
    [availableAthletes, selectedAthleteId],
  );

  const isBusy = mutation.isPending || isSubmitting;
  const canSubmit =
    Boolean(competitionId) &&
    category.id.trim().length > 0 &&
    selectedAthleteId.trim().length > 0 &&
    !isBusy;

  async function handleAddAthlete() {
    if (!canSubmit) {
      return;
    }

    setErrorState(null);
    setIsSubmitting(true);

    try {
      const response = await mutation.mutateAsync({
        categoryId: category.id,
        athleteId: selectedAthleteId,
      });
      setSelectedAthleteId('');
      toast({
        title: 'Atleta adicionado',
        description: response.message,
        variant: 'success',
      });
      await onSuccess?.();
    } catch (error) {
      const parsedError = parseAddAthleteError(error);
      setErrorState(parsedError);
      toast({
        title: 'Falha ao adicionar atleta',
        description: parsedError.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-4 border-slate-900 p-0">
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <h2 className="text-lg font-black tracking-tight text-slate-950">
            Adicionar atleta
          </h2>
          <p className="text-sm text-slate-600">
            Selecione um atleta já cadastrado na competição para vinculá-lo manualmente a esta categoria.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
            Selecionar atleta
          </span>
          <select
            value={selectedAthleteId}
            onChange={(event) => setSelectedAthleteId(event.target.value)}
            disabled={!competitionId || availableAthletes.length === 0 || isBusy}
            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">Selecione um atleta</option>
            {availableAthletes.map((athlete) => (
              <option key={athlete.id} value={athlete.id}>
                {formatAthleteOptionLabel(athlete)}
              </option>
            ))}
          </select>
        </label>

        {selectedAthlete ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {selectedAthlete.name} | Faixa: {selectedAthlete.belt || '-'} | Peso:{' '}
            {selectedAthlete.declaredWeight ?? '-'} kg | Idade:{' '}
            {selectedAthlete.age ?? '-'}
          </div>
        ) : null}

        {availableAthletes.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Todos os atletas disponíveis da competição já estão vinculados a esta categoria.
          </div>
        ) : null}

        {errorState ? (
          <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">{errorState.message}</p>
            {errorState.reasons.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {errorState.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void handleAddAthlete()}
            disabled={!canSubmit}
          >
            {isBusy ? 'Adicionando...' : 'Adicionar atleta'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatAthleteOptionLabel(athlete: Athlete) {
  const weight =
    athlete.declaredWeight !== null ? `${athlete.declaredWeight}kg` : 'peso -';
  const age = athlete.age !== null ? `${athlete.age} anos` : 'idade -';

  return `${athlete.name} | ${athlete.belt || '-'} | ${weight} | ${age}`;
}

function parseAddAthleteError(error: unknown) {
  if (error instanceof ApiError) {
    const payload =
      typeof error.payload === 'object' && error.payload !== null
        ? (error.payload as Record<string, unknown>)
        : null;
    const nestedError =
      payload &&
      typeof payload.error === 'object' &&
      payload.error !== null
        ? (payload.error as Record<string, unknown>)
        : null;
    const payloadDetails =
      payload &&
      typeof payload.details === 'object' &&
      payload.details !== null
        ? (payload.details as Record<string, unknown>)
        : null;
    const nestedDetails =
      nestedError &&
      typeof nestedError.details === 'object' &&
      nestedError.details !== null
        ? (nestedError.details as Record<string, unknown>)
        : null;
    const apiErrorDetails =
      typeof error.details === 'object' && error.details !== null
        ? (error.details as Record<string, unknown>)
        : null;
    const reasons =
      readReasons(payload?.reasons) ??
      readReasons(payloadDetails?.reasons) ??
      readReasons(nestedError?.reasons) ??
      readReasons(nestedDetails?.reasons) ??
      readReasons(apiErrorDetails?.reasons) ??
      [];

    return {
      message:
        (payload?.message as string | undefined) ||
        (nestedError?.message as string | undefined) ||
        error.message ||
        genericAddAthleteErrorMessage,
      reasons,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || genericAddAthleteErrorMessage,
      reasons: [] as string[],
    };
  }

  return {
    message: genericAddAthleteErrorMessage,
    reasons: [] as string[],
  };
}

function readReasons(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.filter((reason): reason is string => typeof reason === 'string');
}
