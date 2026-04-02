'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Building2, Plus, Users } from 'lucide-react';
import { AcademyFormDrawer } from '@/features/academies/components/academy-form-drawer';
import { AcademyFormValues } from '@/features/academies/schemas/academy-form-schema';
import {
  useAcademies,
  useCreateAcademy,
} from '@/features/academies/hooks/use-academies';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/ui/use-toast';

export default function AcademiesPage() {
  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);

  const { toast } = useToast();
  const academiesQuery = useAcademies(activeCompetitionId);
  const createMutation = useCreateAcademy(activeCompetitionId);
  const academies = useMemo(() => academiesQuery.data ?? [], [academiesQuery.data]);
  const filteredAcademies = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    if (!normalizedQuery) {
      return academies;
    }

    return academies.filter((academy) =>
      academy.name.toLowerCase().includes(normalizedQuery),
    );
  }, [search, academies]);

  async function handleCreateAcademy(values: AcademyFormValues) {
    if (!activeCompetitionId) return;

    try {
      await createMutation.mutateAsync(values);
      setIsDrawerOpen(false);
      toast({
        title: 'Academia criada',
        description: `${values.name} foi adicionada à competição.`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao criar academia',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Academias
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Organize as academias da competição ativa
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Cadastre academias, acompanhe o total de atletas vinculados e abra o detalhe para gerenciar a filiação.
          </p>
        </div>
        <Button
          onClick={() => setIsDrawerOpen(true)}
          disabled={!activeCompetitionId || !hasHydrated}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova academia
        </Button>
      </header>

      {!hasHydrated && (
        <Card>
          <CardContent className="p-6 text-slate-600">
            Carregando competição ativa...
          </CardContent>
        </Card>
      )}

      {hasHydrated && !activeCompetitionId && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-amber-900">
            Selecione uma competição no switcher superior para listar as academias.
          </CardContent>
        </Card>
      )}

      {activeCompetitionId && (
        <>
          <Card className="p-0">
            <CardContent className="p-4">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar academia por nome"
              />
            </CardContent>
          </Card>

          {academiesQuery.isLoading && (
            <Card>
              <CardContent className="p-6 text-slate-600">
                Carregando academias...
              </CardContent>
            </Card>
          )}

          {academiesQuery.isError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-red-700">
                {academiesQuery.error instanceof Error
                  ? academiesQuery.error.message
                  : 'Falha ao carregar academias.'}
              </CardContent>
            </Card>
          )}

          {!academiesQuery.isLoading && !academiesQuery.isError && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredAcademies.length === 0 ? (
                <Card className="md:col-span-2 xl:col-span-3">
                  <CardContent className="p-8 text-center text-slate-500">
                    Nenhuma academia encontrada para esta busca.
                  </CardContent>
                </Card>
              ) : (
                filteredAcademies.map((academy) => (
                  <Link key={academy.id} href={`/academies/${academy.id}`}>
                    <Card className="h-full border-slate-200 p-0 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                      <CardContent className="flex h-full flex-col gap-5 p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                            Academia
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                            {academy.name}
                          </h2>
                          <p className="text-sm text-slate-600">
                            Abra o detalhe para vincular ou desvincular atletas.
                          </p>
                        </div>

                        <div className="mt-auto flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          <Users className="h-4 w-4" />
                          <span>
                            {academy.athleteCount}{' '}
                            {academy.athleteCount === 1 ? 'atleta' : 'atletas'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          )}
        </>
      )}

      <AcademyFormDrawer
        isOpen={isDrawerOpen}
        isSubmitting={createMutation.isPending}
        submitLabel="Criar academia"
        title="Criar academia"
        description="Cadastre uma nova academia na competição ativa."
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleCreateAcademy}
      />
    </div>
  );
}
