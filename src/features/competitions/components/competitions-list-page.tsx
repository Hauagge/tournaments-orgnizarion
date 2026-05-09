'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CompetitionCard } from '@/features/competitions/components/competition-card';
import { CompetitionUsersPanel } from '@/features/competitions/components/competition-users-panel';
import { useCompetitions } from '@/features/competitions/hooks/use-competitions';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

export default function CompetitionsListPage() {
  const { data, isLoading, isError, error } = useCompetitions();
  const competitions = Array.isArray(data) ? data : [];
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const setActiveCompetitionId = useCompetitionStore(
    (state) => state.setActiveCompetitionId,
  );
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (selectedCompetitionId) {
      return;
    }

    if (activeCompetitionId) {
      setSelectedCompetitionId(activeCompetitionId);
      return;
    }

    if (competitions.length > 0) {
      setSelectedCompetitionId(competitions[0].id);
    }
  }, [activeCompetitionId, competitions, selectedCompetitionId]);

  const selectedCompetition = useMemo(
    () =>
      competitions.find((competition) => competition.id === selectedCompetitionId) ??
      null,
    [competitions, selectedCompetitionId],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Competições
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Gerencie as competicoes do evento
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Cadastre formatos de torneio, duracao das lutas e regras de pesagem
            e divisao etaria.
          </p>
        </div>
        <Link href="/competitions/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova competição
          </Button>
        </Link>
      </header>

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-slate-600">
            Carregando competicoes...
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-red-700">
            {'message' in (error as object)
              ? String((error as { message?: string }).message)
              : 'Falha ao carregar competições.'}
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && competitions.length === 0 && (
        <Card className="border-dashed border-slate-300">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold">
              Nenhuma competição cadastrada
            </h2>
            <p className="mt-2 text-slate-600">
              Crie a primeira competição para habilitar o switcher global.
            </p>
            <Link href="/competitions/new" className="mt-4 inline-block">
              <Button>Criar competição</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 xl:grid-cols-2">
        {competitions.map((competition) => (
          <CompetitionCard
            key={competition.id}
            competition={competition}
            isActive={competition.id === activeCompetitionId}
            isSelected={competition.id === selectedCompetitionId}
            onSetActive={setActiveCompetitionId}
            onSelect={setSelectedCompetitionId}
          />
        ))}
      </section>

      {selectedCompetition && (
        <CompetitionUsersPanel competition={selectedCompetition} />
      )}
    </div>
  );
}
