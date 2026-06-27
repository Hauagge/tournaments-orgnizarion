'use client';

import { useMemo, useState } from 'react';
import { Check, RefreshCcw, Search, X } from 'lucide-react';
import { useAthletes } from '@/features/athletes/hooks/use-athletes';
import {
  Athlete,
  WeighInStatus,
  getWeighInStatusLabel,
} from '@/features/athletes/types/athlete';
import {
  useConfirmWeighIn,
  useResetWeighIn,
} from '@/features/weighin/hooks/use-weighin';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
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

type ModalAction = 'APPROVED' | 'REJECTED';

export default function WeighInTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WeighInStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [realWeightInput, setRealWeightInput] = useState('');
  const [observation, setObservation] = useState('');

  const debouncedSearch = useDebouncedValue(search, 250);
  const activeCompetitionId = useCompetitionStore((state) => state.activeCompetitionId);
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const username = useAuthStore((state) => state.username);
  const athletesQuery = useAthletes(activeCompetitionId, debouncedSearch);
  const confirmMutation = useConfirmWeighIn(activeCompetitionId);
  const resetMutation = useResetWeighIn(activeCompetitionId);
  const { toast } = useToast();

  const athletes = useMemo(() => {
    return (athletesQuery.data ?? []).filter((athlete) => {
      if (statusFilter !== 'ALL' && athlete.weighInStatus !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'ALL' && getCategoryLabel(athlete) !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [athletesQuery.data, categoryFilter, statusFilter]);

  const metrics = useMemo(() => {
    const rows = athletesQuery.data ?? [];
    return {
      total: rows.length,
      approved: rows.filter((athlete) => athlete.weighInStatus === 'APPROVED').length,
      rejected: rows.filter((athlete) => athlete.weighInStatus === 'REJECTED').length,
      pending: rows.filter((athlete) => athlete.weighInStatus === 'PENDING').length,
    };
  }, [athletesQuery.data]);

  const parsedWeightGrams = parseWeightToGrams(realWeightInput);
  const selectedLimit = selectedAthlete?.declaredWeight ?? null;
  const selectedWeightKg = parsedWeightGrams === null ? null : parsedWeightGrams / 1000;
  const selectedDelta = selectedWeightKg !== null && selectedLimit !== null
    ? selectedWeightKg - selectedLimit
    : null;

  function openDecisionModal(athlete: Athlete, action: ModalAction) {
    setSelectedAthlete(athlete);
    setRealWeightInput(
      athlete.realWeightGrams !== null
        ? (athlete.realWeightGrams / 1000).toFixed(3)
        : athlete.declaredWeight?.toFixed(3) ?? '',
    );
    setObservation('');
  }

  async function handleConfirm(action: ModalAction) {
    if (!selectedAthlete || parsedWeightGrams === null) return;

    try {
      await confirmMutation.mutateAsync({
        athleteId: selectedAthlete.id,
        realWeightGrams: parsedWeightGrams,
        weighInStatus: action,
      });
      toast({
        title: action === 'APPROVED' ? 'Pesagem aprovada' : 'Pesagem reprovada',
        description: `${selectedAthlete.name} foi avaliado por ${username || 'colaborador'}.`,
        variant: 'success',
      });
      setSelectedAthlete(null);
    } catch (error) {
      toast({
        title: 'Falha ao confirmar pesagem',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  async function handleReset(athlete: Athlete) {
    try {
      await resetMutation.mutateAsync(athlete.id);
      toast({
        title: 'Avaliação resetada',
        description: `${athlete.name} voltou para aguardando.`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao resetar avaliação',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-xl border border-slate-200/70 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">Validação de peso</p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-slate-950">
            Campeonato ativo
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-sm font-medium text-blue-800">
            {getInitials(username || 'Colaborador')}
          </span>
          <span className="text-sm text-slate-700">{username || 'Colaborador logado'}</span>
        </div>
      </header>

      {!hasHydrated ? <StateCard message="Carregando competição ativa..." /> : null}
      {hasHydrated && !activeCompetitionId ? (
        <StateCard message="Selecione uma competição no topo para iniciar a pesagem." tone="warning" />
      ) : null}

      {activeCompetitionId ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total de atletas" value={metrics.total} />
            <MetricCard label="Aprovados" value={metrics.approved} tone="success" />
            <MetricCard label="Reprovados" value={metrics.rejected} tone="error" />
            <MetricCard label="Aguardando" value={metrics.pending} tone="warning" />
          </section>

          <Card className="rounded-xl border border-slate-200/70 p-0 shadow-none">
            <CardContent className="space-y-4 p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto_220px]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar atleta ou academia"
                    className="pl-9"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['ALL', 'Todos'],
                    ['PENDING', 'Aguardando'],
                    ['APPROVED', 'Aprovados'],
                    ['REJECTED', 'Reprovados'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value as 'ALL' | WeighInStatus)}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        statusFilter === value
                          ? 'border-blue-300 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                >
                  <option value="ALL">Todas as categorias</option>
                  <option value="Leve">Leve</option>
                  <option value="Médio">Médio</option>
                  <option value="Pesado">Pesado</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-xl border border-slate-200/70 p-0 shadow-none">
            <div className="overflow-x-auto">
              <Table className="rounded-none border-0">
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-slate-50">
                    <TableHead>Atleta</TableHead>
                    <TableHead>Peso aferido</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Faixa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {athletes.map((athlete) => (
                    <TableRow key={athlete.id}>
                      <TableCell>
                        <p className="font-medium text-slate-950">{athlete.name}</p>
                        <p className="text-sm text-slate-500">{athlete.academy || 'Sem academia'}</p>
                      </TableCell>
                      <TableCell>{formatMeasuredWeight(athlete)}</TableCell>
                      <TableCell>{getCategoryLabel(athlete)}</TableCell>
                      <TableCell>{athlete.belt || '-'}</TableCell>
                      <TableCell>
                        <span className={statusBadgeClassName(athlete.weighInStatus)}>
                          {getWeighInStatusLabel(athlete.weighInStatus)}
                        </span>
                        {athlete.weighInStatus !== 'PENDING' ? (
                          <p className="mt-1 text-xs text-slate-500">
                            por {username || 'colaborador'}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell align="right">
                        {athlete.weighInStatus === 'PENDING' ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="px-2 text-emerald-700"
                              aria-label={`Aprovar ${athlete.name}`}
                              onClick={() => openDecisionModal(athlete, 'APPROVED')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="px-2 text-red-700"
                              aria-label={`Reprovar ${athlete.name}`}
                              onClick={() => openDecisionModal(athlete, 'REJECTED')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            aria-label={`Resetar avaliação de ${athlete.name}`}
                            onClick={() => void handleReset(athlete)}
                          >
                            <RefreshCcw className="mr-2 h-4 w-4 text-amber-600" />
                            Resetar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      ) : null}

      <Dialog open={Boolean(selectedAthlete)} onOpenChange={(open) => !open && setSelectedAthlete(null)}>
        <DialogContent className="rounded-xl border border-slate-200 shadow-none">
          <DialogHeader>
            <DialogTitle className="font-medium">
              {selectedAthlete?.name || 'Atleta'}
            </DialogTitle>
            <p className="text-sm text-slate-500">
              {selectedAthlete?.academy || 'Sem academia'} · {selectedAthlete?.belt || 'Sem faixa'}
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Peso aferido</span>
              <Input
                inputMode="decimal"
                value={realWeightInput}
                onChange={(event) => setRealWeightInput(normalizeDecimalInput(event.target.value))}
                placeholder="Ex.: 72.350"
              />
            </label>
            <div className={`rounded-xl border p-3 text-sm ${selectedDelta !== null && selectedDelta > 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {selectedDelta === null
                ? 'Digite um peso válido para receber feedback.'
                : selectedDelta > 0
                  ? `Fora do limite: +${selectedDelta.toFixed(1)} kg`
                  : '✓ dentro do limite'}
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Observação opcional</span>
              <textarea
                value={observation}
                onChange={(event) => setObservation(event.target.value)}
                className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedAthlete(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={parsedWeightGrams === null || confirmMutation.isPending}
              onClick={() => {
                void handleConfirm('REJECTED');
              }}
            >
              Reprovar
            </Button>
            <Button
              type="button"
              disabled={parsedWeightGrams === null || confirmMutation.isPending}
              onClick={() => {
                void handleConfirm('APPROVED');
              }}
            >
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StateCard({ message, tone = 'default' }: { message: string; tone?: 'default' | 'warning' }) {
  const className =
    tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-slate-200 bg-white text-slate-600';

  return (
    <Card className={`rounded-xl border p-0 shadow-none ${className}`}>
      <CardContent className="p-6">{message}</CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'success' | 'error' | 'warning';
}) {
  const className =
    tone === 'success'
      ? 'text-emerald-700'
      : tone === 'error'
        ? 'text-red-700'
        : tone === 'warning'
          ? 'text-amber-700'
          : 'text-slate-950';

  return (
    <Card className="rounded-xl border border-slate-200/70 p-0 shadow-none">
      <CardContent className="p-4">
        <p className={`text-3xl font-medium ${className}`}>{value}</p>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
      </CardContent>
    </Card>
  );
}

function normalizeDecimalInput(value: string) {
  return value.replace(',', '.').replace(/[^\d.]/g, '');
}

function parseWeightToGrams(value: string) {
  const parsed = Number(normalizeDecimalInput(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 1000);
}

function formatMeasuredWeight(athlete: Athlete) {
  if (athlete.realWeightGrams === null) {
    return <span className="text-slate-500">Aguardando</span>;
  }

  const measured = athlete.realWeightGrams / 1000;
  const limit = athlete.declaredWeight;
  const delta = limit === null ? null : measured - limit;

  if (delta !== null && delta > 0) {
    return (
      <span className="text-red-700">
        {measured.toFixed(2)} kg <span className="text-xs">+{delta.toFixed(1)} kg</span>
      </span>
    );
  }

  return (
    <span className="text-slate-700">
      {measured.toFixed(2)} kg <span className="text-xs text-emerald-700">✓ dentro do limite</span>
    </span>
  );
}

function getCategoryLabel(athlete: Athlete) {
  const weight = athlete.declaredWeight;
  if (weight === null) return 'Sem categoria';
  if (weight <= 70) return 'Leve';
  if (weight <= 85) return 'Médio';
  return 'Pesado';
}

function statusBadgeClassName(status: string) {
  const base = 'inline-flex rounded-full border px-3 py-1 text-xs';
  if (status === 'APPROVED') return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
  if (status === 'REJECTED') return `${base} border-red-200 bg-red-50 text-red-700`;
  return `${base} border-amber-200 bg-amber-50 text-amber-800`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
