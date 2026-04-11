'use client';

import { useMemo, useState } from 'react';
import { Plus, Search, SquarePen } from 'lucide-react';
import { AthleteFormDialog } from '@/features/athletes/components/athlete-form-dialog';
import {
  useAthletes,
  useCreateAthlete,
  useUpdateAthlete,
} from '@/features/athletes/hooks/use-athletes';
import { AthleteFormValues } from '@/features/athletes/schemas/athlete-form-schema';
import {
  Athlete,
  getWeighInStatusLabel,
} from '@/features/athletes/types/athlete';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { useToast } from '@/shared/ui/use-toast';

export default function AthletesPage() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  const debouncedSearch = useDebouncedValue(search, 400);
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);

  const { toast } = useToast();
  const athletesQuery = useAthletes(activeCompetitionId, debouncedSearch);
  const createMutation = useCreateAthlete(activeCompetitionId);
  const updateMutation = useUpdateAthlete(activeCompetitionId);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const athletes = useMemo(
    () => athletesQuery.data ?? [],
    [athletesQuery.data],
  );

  async function handleSubmit(values: AthleteFormValues) {
    if (!activeCompetitionId) return;

    try {
      if (selectedAthlete) {
        await updateMutation.mutateAsync({
          id: selectedAthlete.id,
          payload: values,
        });

        toast({
          title: 'Atleta atualizado',
          description: `${values.fullName} foi atualizado com sucesso.`,
          variant: 'success',
        });
      } else {
        await createMutation.mutateAsync(values);

        toast({
          title: 'Atleta cadastrado',
          description: `${values.fullName} foi adicionado à competição.`,
          variant: 'success',
        });
      }

      setIsDialogOpen(false);
      setSelectedAthlete(null);
    } catch (error) {
      toast({
        title: 'Falha ao salvar atleta',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  function openCreateDialog() {
    setSelectedAthlete(null);
    setIsDialogOpen(true);
  }

  function openEditDialog(athlete: Athlete) {
    setSelectedAthlete(athlete);
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
    setSelectedAthlete(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Atletas
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Gerencie os atletas da competição ativa
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Busque por nome, acompanhe a pesagem e faça cadastros manuais sem
            sair da listagem.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          disabled={!activeCompetitionId || !hasHydrated}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo atleta
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
            Selecione uma competição no switcher superior para listar os
            atletas.
          </CardContent>
        </Card>
      )}

      {activeCompetitionId && (
        <>
          <Card className="p-0">
            <CardContent className="p-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar atleta por nome"
                  className="pl-9"
                />
              </label>
            </CardContent>
          </Card>

          {athletesQuery.isLoading && (
            <Card>
              <CardContent className="p-6 text-slate-600">
                Carregando atletas...
              </CardContent>
            </Card>
          )}

          {athletesQuery.isError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-red-700">
                {athletesQuery.error instanceof Error
                  ? athletesQuery.error.message
                  : 'Falha ao carregar atletas.'}
              </CardContent>
            </Card>
          )}

          {!athletesQuery.isLoading && !athletesQuery.isError && (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <Table className="rounded-none border-0">
                  <TableHeader className="bg-slate-100">
                    <TableRow className="hover:bg-slate-100">
                      <TableHead>Nome</TableHead>
                      <TableHead>Faixa</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Peso declarado</TableHead>
                      <TableHead>Academia</TableHead>
                      <TableHead>Status pesagem</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {athletes.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-10 text-center text-slate-500"
                        >
                          Nenhum atleta encontrado para esta busca.
                        </TableCell>
                      </TableRow>
                    ) : (
                      athletes.map((athlete) => (
                        <TableRow key={athlete.id}>
                          <TableCell className="font-medium">
                            {athlete.name}
                          </TableCell>
                          <TableCell>{athlete.belt || '-'}</TableCell>
                          <TableCell>
                            {athlete.age !== null ? `${athlete.age} anos` : '-'}
                          </TableCell>
                          <TableCell>
                            {athlete.declaredWeight !== null
                              ? `${athlete.declaredWeight} kg`
                              : '-'}
                          </TableCell>
                          <TableCell>{athlete.academy || '-'}</TableCell>
                          <TableCell>
                            <span
                              className={statusBadgeClassName(
                                athlete.weighInStatus,
                              )}
                            >
                              {getWeighInStatusLabel(athlete.weighInStatus)}
                            </span>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              variant="ghost"
                              className="px-2"
                              onClick={() => openEditDialog(athlete)}
                            >
                              <SquarePen className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </>
      )}

      <AthleteFormDialog
        athlete={selectedAthlete}
        isOpen={isDialogOpen}
        isSubmitting={isSubmitting}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function statusBadgeClassName(status: string) {
  if (status === 'APPROVED') {
    return 'inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800';
  }

  if (status === 'REJECTED') {
    return 'inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800';
  }

  return 'inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800';
}
