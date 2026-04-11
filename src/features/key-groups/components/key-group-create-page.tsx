'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useCompetition } from '@/features/competitions/hooks/use-competitions';
import { Athlete } from '@/features/athletes/types/athlete';
import { KeyGroupBuilder } from '@/features/key-groups/components/key-group-builder';
import { getKeyGroup } from '@/features/key-groups/api/key-groups-client';
import { useCreateKeyGroup, useKeyGroups } from '@/features/key-groups/hooks/use-key-groups';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/ui/use-toast';

export default function KeyGroupCreatePage() {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedAthletes, setSelectedAthletes] = useState<Athlete[]>([]);
  const router = useRouter();
  const activeCompetitionId = useCompetitionStore((state) => state.activeCompetitionId);
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const keyGroupsQuery = useKeyGroups(activeCompetitionId);
  const categoriesQuery = useCategories(activeCompetitionId);
  const competitionQuery = useCompetition(activeCompetitionId ?? '');
  const createMutation = useCreateKeyGroup(activeCompetitionId);
  const { toast } = useToast();
  const maxGroupSize = competitionQuery.data?.maxGroupSize ?? 4;

  const keyGroupDetailQueries = useQueries({
    queries: (keyGroupsQuery.data ?? []).map((group) => ({
      queryKey: ['key-group-builder-detail', group.id],
      queryFn: () => getKeyGroup(group.id),
      enabled: Boolean(activeCompetitionId) && group.athletes.length === 0,
    })),
  });

  const resolvedGroups = useMemo(() => {
    return (keyGroupsQuery.data ?? []).map((group, index) => {
      const detail = keyGroupDetailQueries[index]?.data;
      return group.athletes.length > 0 ? group : detail ?? group;
    });
  }, [keyGroupDetailQueries, keyGroupsQuery.data]);

  const athleteGroupMap = useMemo(() => {
    const map = new Map<string, { groupId: string; groupName: string }>();
    resolvedGroups.forEach((group) => {
      group.athletes.forEach((athlete) => {
        map.set(athlete.id, { groupId: group.id, groupName: group.name });
      });
    });
    return map;
  }, [resolvedGroups]);

  function handleAddAthlete(athlete: Athlete) {
    const membership = athleteGroupMap.get(athlete.id);
    if (membership) {
      toast({
        title: 'Atleta já vinculado',
        description: `${athlete.name} já está em ${membership.groupName}.`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedAthletes((current) => {
      if (current.some((item) => item.id === athlete.id) || current.length >= maxGroupSize) {
        return current;
      }
      return [...current, athlete];
    });
  }

  function handleRemoveAthlete(athleteId: string) {
    setSelectedAthletes((current) => current.filter((athlete) => athlete.id !== athleteId));
  }

  async function handleSave() {
    if (!activeCompetitionId) {
      return;
    }

    const uniqueIds = Array.from(new Set(selectedAthletes.map((athlete) => athlete.id)));

    if (uniqueIds.length > maxGroupSize) {
      toast({
        title: 'Chave excedeu o limite',
        description: `Cada chave aceita no máximo ${maxGroupSize} atletas.`,
        variant: 'warning',
      });
      return;
    }

    try {
      const createdGroup = await createMutation.mutateAsync({
        name: name.trim() || undefined,
        categoryId: categoryId || undefined,
        athleteIds: uniqueIds.map((id) => Number(id)),
      });
      toast({
        title: 'Chave criada',
        description: `${createdGroup.name} foi cadastrada com sucesso.`,
        variant: 'success',
      });
      router.push(`/key-groups/${createdGroup.id}`);
    } catch (error) {
      toast({
        title: 'Falha ao criar chave',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Nova chave
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">
          Monte a chave e salve rápido
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Escolha até {maxGroupSize} atletas, vincule a categoria se fizer sentido e
          prepare a geração automática de todos contra todos.
        </p>
      </header>

      {!hasHydrated && <StateCard message="Carregando competição ativa..." />}

      {hasHydrated && !activeCompetitionId ? (
        <StateCard
          message="Selecione uma competição no switcher superior para montar a chave."
          tone="warning"
        />
      ) : null}

      {activeCompetitionId ? (
        <>
          <Card className="border-4 border-slate-900 p-0">
            <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_280px_auto] lg:items-end">
              <label className="block space-y-2">
                <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                  Nome da chave
                </span>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Opcional. Se vazio, o backend ou a categoria define o nome."
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                  Categoria
                </span>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
                >
                  <option value="">Sem categoria</option>
                  {(categoriesQuery.data ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <Button onClick={() => void handleSave()} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvando...' : 'Salvar chave'}
              </Button>
            </CardContent>
          </Card>

          <KeyGroupBuilder
            competitionId={activeCompetitionId}
            selectedAthletes={selectedAthletes}
            athleteGroupMap={athleteGroupMap}
            maxSize={maxGroupSize}
            isBusy={createMutation.isPending}
            onAddAthlete={handleAddAthlete}
            onRemoveAthlete={handleRemoveAthlete}
          />
        </>
      ) : null}
    </div>
  );
}

function StateCard({
  message,
  tone = 'default',
}: {
  message: string;
  tone?: 'default' | 'warning';
}) {
  const toneClassName =
    tone === 'warning'
      ? 'border-amber-300 bg-amber-50 text-amber-950'
      : 'border-slate-300 bg-white text-slate-600';

  return (
    <Card className={`border-4 p-0 ${toneClassName}`}>
      <CardContent className="p-6">{message}</CardContent>
    </Card>
  );
}
