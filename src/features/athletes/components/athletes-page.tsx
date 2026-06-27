'use client';

import { ReactNode, useMemo, useState } from 'react';
import { FileUp, Plus, Search, SquarePen, Upload } from 'lucide-react';
import { AthleteFormDialog } from '@/features/athletes/components/athlete-form-dialog';
import {
  useAthletes,
  useCreateAthlete,
  useUpdateAthlete,
} from '@/features/athletes/hooks/use-athletes';
import { AthleteFormValues } from '@/features/athletes/schemas/athlete-form-schema';
import { Athlete } from '@/features/athletes/types/athlete';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [beltFilter, setBeltFilter] = useState('ALL');
  const [weightFilter, setWeightFilter] = useState('ALL');
  const [ageFilter, setAgeFilter] = useState('ALL');

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
  const athletes = useMemo(() => {
    return (athletesQuery.data ?? []).filter((athlete) => {
      if (beltFilter !== 'ALL' && athlete.belt !== beltFilter) return false;
      if (weightFilter !== 'ALL') {
        const weight = athlete.declaredWeight ?? 0;
        if (weightFilter === 'LIGHT' && weight > 70) return false;
        if (weightFilter === 'MIDDLE' && (weight <= 70 || weight > 85)) return false;
        if (weightFilter === 'HEAVY' && weight <= 85) return false;
      }
      if (ageFilter !== 'ALL') {
        const age = athlete.age ?? 0;
        if (ageFilter === 'KIDS' && age >= 16) return false;
        if (ageFilter === 'ADULT' && (age < 18 || age >= 30)) return false;
        if (ageFilter === 'MASTER' && age < 30) return false;
      }
      return true;
    });
  }, [ageFilter, athletesQuery.data, beltFilter, weightFilter]);

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
      <header className="flex flex-col gap-4 rounded-xl border border-slate-200/70 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Atletas
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight">
            Gerencie os atletas da competição ativa
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Busque por nome, acompanhe a pesagem e faça cadastros manuais sem
            sair da listagem.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            disabled={!activeCompetitionId || !hasHydrated}
          >
            <FileUp className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button
            onClick={openCreateDialog}
            disabled={!activeCompetitionId || !hasHydrated}
          >
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar atleta
          </Button>
        </div>
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
          <Card className="rounded-xl border border-slate-200/70 p-0 shadow-none">
            <CardContent className="space-y-4 p-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome ou academia"
                  className="pl-9"
                />
              </label>
              <div className="grid gap-3 md:grid-cols-3">
                <FilterSelect label="Faixa" value={beltFilter} onChange={setBeltFilter}>
                  <option value="ALL">Todas as faixas</option>
                  <option value="Branca">Branca</option>
                  <option value="Azul">Azul</option>
                  <option value="Roxa">Roxa</option>
                  <option value="Marrom">Marrom</option>
                  <option value="Preta">Preta</option>
                </FilterSelect>
                <FilterSelect label="Categoria de peso" value={weightFilter} onChange={setWeightFilter}>
                  <option value="ALL">Todas</option>
                  <option value="LIGHT">Até 70 kg</option>
                  <option value="MIDDLE">70 a 85 kg</option>
                  <option value="HEAVY">Acima de 85 kg</option>
                </FilterSelect>
                <FilterSelect label="Faixa etária" value={ageFilter} onChange={setAgeFilter}>
                  <option value="ALL">Todas</option>
                  <option value="KIDS">Infantil/Juvenil</option>
                  <option value="ADULT">Adulto</option>
                  <option value="MASTER">Máster</option>
                </FilterSelect>
              </div>
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
            <Card className="overflow-hidden rounded-xl border border-slate-200/70 p-0 shadow-none">
              <div className="overflow-x-auto">
                <Table className="rounded-none border-0">
                  <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-slate-50">
                      <TableHead>Atleta</TableHead>
                      <TableHead>Faixa</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {athletes.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center text-slate-500"
                        >
                          Nenhum atleta encontrado para esta busca.
                        </TableCell>
                      </TableRow>
                    ) : (
                      athletes.map((athlete) => (
                        <TableRow key={athlete.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p className="font-medium text-slate-950">{athlete.name}</p>
                              <p className="text-sm text-slate-500">{athlete.academy || 'Sem academia'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={beltBadgeClassName(athlete.belt)}>
                              {athlete.belt || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {athlete.declaredWeight !== null
                              ? `${athlete.declaredWeight} kg`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {athlete.age !== null ? `${athlete.age} anos` : '-'}
                          </TableCell>
                          <TableCell>
                            {getCategoryLabel(athlete)}
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
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="rounded-xl border border-slate-200 shadow-none">
          <DialogHeader>
            <DialogTitle className="font-medium">Importar atletas por CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <Upload className="h-8 w-8 text-slate-400" />
              <p className="mt-3 font-medium text-slate-900">Solte o arquivo CSV aqui</p>
              <p className="mt-1 text-sm text-slate-500">ou selecione um arquivo para mapear as colunas antes de confirmar.</p>
              <Input type="file" accept=".csv,text/csv" className="mt-4 max-w-sm bg-white" />
            </div>
            <div className="rounded-xl border border-slate-200/70">
              <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                <span>Coluna CSV</span>
                <span>Campo</span>
                <span>Status</span>
              </div>
              {[
                ['nome', 'Atleta', 'Mapeado'],
                ['academia', 'Academia', 'Mapeado'],
                ['faixa', 'Faixa', 'Mapeado'],
              ].map(([column, field, status]) => (
                <div key={column} className="grid grid-cols-3 px-3 py-2 text-sm">
                  <span>{column}</span>
                  <span>{field}</span>
                  <span className="text-emerald-700">{status}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => setIsImportOpen(false)}>
              Confirmar importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
      >
        {children}
      </select>
    </label>
  );
}

function beltBadgeClassName(belt: string) {
  const base = 'inline-flex rounded-full border px-3 py-1 text-xs';
  const normalized = belt.toLowerCase();

  if (normalized.includes('azul')) return `${base} border-blue-200 bg-blue-50 text-blue-700`;
  if (normalized.includes('roxa')) return `${base} border-purple-200 bg-purple-50 text-purple-700`;
  if (normalized.includes('marrom')) return `${base} border-amber-300 bg-amber-50 text-amber-900`;
  if (normalized.includes('preta')) return `${base} border-slate-700 bg-slate-900 text-white`;

  return `${base} border-slate-200 bg-slate-50 text-slate-700`;
}

function getCategoryLabel(athlete: Athlete) {
  const weight = athlete.declaredWeight;
  if (weight === null) return 'Sem categoria';
  if (weight <= 70) return 'Leve';
  if (weight <= 85) return 'Médio';
  return 'Pesado';
}
