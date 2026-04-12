'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Search, UserPlus, X } from 'lucide-react';
import { useAthletes } from '@/features/athletes/hooks/use-athletes';
import { Athlete, getWeighInStatusLabel } from '@/features/athletes/types/athlete';
import { useBelts } from '@/features/belts/hooks/use-belts';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

type KeyGroupBuilderProps = {
  competitionId: string;
  selectedAthletes: Athlete[];
  maxSize?: number;
  athleteGroupMap: Map<string, { groupId: string; groupName: string }>;
  currentGroupId?: string;
  isBusy?: boolean;
  isLocked?: boolean;
  onAddAthlete: (athlete: Athlete) => void;
  onRemoveAthlete: (athleteId: string) => void;
};

export function KeyGroupBuilder({
  competitionId,
  selectedAthletes,
  maxSize = 4,
  athleteGroupMap,
  currentGroupId,
  isBusy = false,
  isLocked = false,
  onAddAthlete,
  onRemoveAthlete,
}: KeyGroupBuilderProps) {
  const [search, setSearch] = useState('');
  const [academyFilter, setAcademyFilter] = useState('ALL');
  const [beltFilter, setBeltFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');

  const debouncedSearch = useDebouncedValue(search, 250);
  const athletesQuery = useAthletes(competitionId, debouncedSearch);
  const beltsQuery = useBelts();
  const athletes = useMemo(() => athletesQuery.data ?? [], [athletesQuery.data]);
  const hasSearchQuery = debouncedSearch.trim().length > 0;
  const selectedIds = useMemo(
    () => new Set(selectedAthletes.map((athlete) => athlete.id)),
    [selectedAthletes],
  );

  const academyOptions = useMemo(() => {
    const options = new Set<string>();
    athletes.forEach((athlete) => {
      if (athlete.academy) {
        options.add(athlete.academy);
      }
    });
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [athletes]);

  const beltOptions = useMemo(() => beltsQuery.data ?? [], [beltsQuery.data]);

  const filteredSuggestions = useMemo(() => {
    const minWeightNumber = minWeight ? Number(minWeight) : null;
    const maxWeightNumber = maxWeight ? Number(maxWeight) : null;
    const minAgeNumber = minAge ? Number(minAge) : null;
    const maxAgeNumber = maxAge ? Number(maxAge) : null;

    return athletes
      .filter((athlete) => !selectedIds.has(athlete.id))
      .filter((athlete) => {
        if (hasSearchQuery) {
          return true;
        }

        const membership = athleteGroupMap.get(athlete.id);
        return !membership || membership.groupId === currentGroupId;
      })
      .filter((athlete) => academyFilter === 'ALL' || athlete.academy === academyFilter)
      .filter((athlete) => beltFilter === 'ALL' || athlete.belt === beltFilter)
      .filter((athlete) => statusFilter === 'ALL' || athlete.weighInStatus === statusFilter)
      .filter(
        (athlete) =>
          minWeightNumber === null || (athlete.declaredWeight ?? 0) >= minWeightNumber,
      )
      .filter(
        (athlete) =>
          maxWeightNumber === null || (athlete.declaredWeight ?? 0) <= maxWeightNumber,
      )
      .filter((athlete) => minAgeNumber === null || (athlete.age ?? 0) >= minAgeNumber)
      .filter((athlete) => maxAgeNumber === null || (athlete.age ?? 0) <= maxAgeNumber)
      .slice(0, 12);
  }, [
    academyFilter,
    athleteGroupMap,
    athletes,
    beltFilter,
    currentGroupId,
    hasSearchQuery,
    maxAge,
    maxWeight,
    minAge,
    minWeight,
    selectedIds,
    statusFilter,
  ]);

  return (
    <div className="space-y-5">
      <Card className="overflow-visible border-4 border-slate-900 p-0">
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
            <label className="block space-y-2 lg:col-span-5 xl:col-span-2">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                Buscar atleta
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nome ou ID"
                  className="pl-9 pr-10"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-slate-300 bg-white p-1 text-slate-600 transition hover:bg-slate-100"
                    aria-label="Limpar busca"
                    title="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </label>

            <SelectField
              label="Academia"
              value={academyFilter}
              onChange={setAcademyFilter}
              options={academyOptions}
            />
            <SelectField
              label="Faixa"
              value={beltFilter}
              onChange={setBeltFilter}
              options={beltOptions}
            />
            <SelectField
              label="Pesagem"
              value={statusFilter}
              onChange={setStatusFilter}
              options={['APPROVED', 'PENDING', 'REJECTED']}
            />
            <NumberField
              label="Peso min"
              value={minWeight}
              onChange={setMinWeight}
              placeholder="Kg"
            />
            <NumberField
              label="Peso max"
              value={maxWeight}
              onChange={setMaxWeight}
              placeholder="Kg"
            />
            <NumberField
              label="Idade min"
              value={minAge}
              onChange={setMinAge}
              placeholder="Anos"
            />
            <NumberField
              label="Idade max"
              value={maxAge}
              onChange={setMaxAge}
              placeholder="Anos"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: maxSize }).map((_, index) => {
              const athlete = selectedAthletes[index] ?? null;

              return (
                <div
                  key={index}
                  className="rounded-2xl border-4 border-slate-900 bg-slate-50 p-4"
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Slot {index + 1}
                  </p>
                  {athlete ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="font-bold text-slate-950">{athlete.name}</p>
                        <p className="text-sm text-slate-500">
                          {athlete.academy || 'Sem academia'} · {athlete.belt || '-'}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {athlete.age ?? '-'} anos · {athlete.declaredWeight ?? '-'} kg
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onRemoveAthlete(athlete.id)}
                        disabled={isBusy || isLocked}
                        className="w-full"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-400">
                      Escolha um atleta na lista.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-4 border-slate-900 p-0">
        <CardContent className="p-0">
          <div className="border-b-4 border-slate-900 bg-slate-100 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-600">
            Sugestões
          </div>

          {athletesQuery.isLoading ? (
            <div className="px-5 py-6 text-slate-600">Carregando atletas...</div>
          ) : athletesQuery.isError ? (
            <div className="px-5 py-6 text-red-700">
              {athletesQuery.error instanceof Error
                ? athletesQuery.error.message
                : 'Falha ao carregar atletas.'}
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="px-5 py-6 text-slate-500">
              {hasSearchQuery
                ? 'Nenhum atleta encontrado para os filtros atuais.'
                : 'Nenhum atleta disponível fora de outras chaves para os filtros atuais.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredSuggestions.map((athlete) => {
                const membership = athleteGroupMap.get(athlete.id);
                const alreadyInAnotherGroup =
                  membership && membership.groupId !== currentGroupId;
                const hasInvalidWeighInStatus = athlete.weighInStatus !== 'APPROVED';

                return (
                  <div
                    key={athlete.id}
                    className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-950">{athlete.name}</p>
                      <p className="text-sm text-slate-500">
                        {athlete.academy || 'Sem academia'} · {athlete.belt || '-'} ·{' '}
                        {athlete.age ?? '-'} anos · {athlete.declaredWeight ?? '-'} kg
                      </p>
                      {alreadyInAnotherGroup ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Já está em {membership.groupName}
                          </p>
                          <p className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            Não pode entrar em outra chave
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={statusBadgeClassName(athlete.weighInStatus)}>
                        {getWeighInStatusLabel(athlete.weighInStatus)}
                      </span>
                      <Button
                        type="button"
                        onClick={() => onAddAthlete(athlete)}
                        disabled={
                          isBusy ||
                          isLocked ||
                          selectedAthletes.length >= maxSize ||
                          Boolean(alreadyInAnotherGroup) ||
                          hasInvalidWeighInStatus
                        }
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
      >
        <option value="ALL">Todos</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <Input
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function statusBadgeClassName(status: string) {
  if (status === 'APPROVED') {
    return 'inline-flex rounded-full border-2 border-emerald-900 bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-900';
  }

  if (status === 'REJECTED') {
    return 'inline-flex rounded-full border-2 border-red-900 bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-red-900';
  }

  return 'inline-flex rounded-full border-2 border-amber-900 bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-900';
}
