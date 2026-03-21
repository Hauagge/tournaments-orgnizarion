'use client';

import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { LoaderCircle, Scale, Search, X } from 'lucide-react';
import { useAthletes } from '@/features/athletes/hooks/use-athletes';
import {
  Athlete,
  getWeighInStatusLabel,
} from '@/features/athletes/types/athlete';
import {
  useConfirmWeighIn,
  useResetWeighIn,
} from '@/features/weighin/hooks/use-weighin';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/ui/use-toast';

type ActionFeedback = {
  tone: 'success' | 'error';
  text: string;
} | null;

const SEARCH_RESULTS_LIMIT = 8;

export default function WeighInTab() {
  const [search, setSearch] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [realWeightInput, setRealWeightInput] = useState('');
  const [feedback, setFeedback] = useState<ActionFeedback>(null);

  const debouncedSearch = useDebouncedValue(search, 250);
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const { toast } = useToast();

  const athletesQuery = useAthletes(activeCompetitionId, debouncedSearch);
  const confirmMutation = useConfirmWeighIn(activeCompetitionId);
  const resetMutation = useResetWeighIn(activeCompetitionId);

  const athletes = useMemo(() => athletesQuery.data ?? [], [athletesQuery.data]);
  const quickResults = useMemo(
    () => athletes.slice(0, SEARCH_RESULTS_LIMIT),
    [athletes],
  );

  useEffect(() => {
    if (!selectedAthlete) return;

    const updatedAthlete = athletes.find((athlete) => athlete.id === selectedAthlete.id);
    if (updatedAthlete) {
      setSelectedAthlete(updatedAthlete);
    }
  }, [athletes, selectedAthlete]);

  function formatWeightKg(value: number | null) {
    if (value === null || Number.isNaN(value)) return '-';
    return `${value.toFixed(2)} kg`;
  }

  function formatRealWeight(grams: number | null) {
    if (grams === null || Number.isNaN(grams)) return 'Nao aferido';
    return `${(grams / 1000).toFixed(3)} kg`;
  }

  function normalizeDecimalInput(value: string) {
    return value.replace(',', '.').replace(/[^\d.]/g, '');
  }

  function parseWeightToGrams(value: string) {
    const parsed = Number(normalizeDecimalInput(value));
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.round(parsed * 1000);
  }

  function handleSelectAthlete(athlete: Athlete) {
    setSelectedAthlete(athlete);
    setSearch(athlete.name);
    setFeedback(null);
    setRealWeightInput(
      athlete.realWeightGrams !== null
        ? (athlete.realWeightGrams / 1000).toFixed(3)
        : '',
    );
  }

  const parsedWeightGrams = parseWeightToGrams(realWeightInput);
  const canConfirm = Boolean(
    activeCompetitionId && selectedAthlete && parsedWeightGrams !== null,
  );
  const isMutating = confirmMutation.isPending || resetMutation.isPending;

  async function handleConfirm() {
    if (!selectedAthlete || !activeCompetitionId || parsedWeightGrams === null) {
      return;
    }

    try {
      const updatedAthlete = await confirmMutation.mutateAsync({
        athleteId: selectedAthlete.id,
        realWeightGrams: parsedWeightGrams,
      });

      setSelectedAthlete(updatedAthlete);
      setRealWeightInput((parsedWeightGrams / 1000).toFixed(3));
      setFeedback({ tone: 'success', text: 'Pesagem confirmada.' });
      toast({
        title: 'Pesagem confirmada',
        description: `${updatedAthlete.name} foi homologado com sucesso.`,
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tente novamente.';
      setFeedback({ tone: 'error', text: 'Falha ao confirmar a pesagem.' });
      toast({
        title: 'Falha ao confirmar pesagem',
        description: message,
        variant: 'destructive',
      });
    }
  }

  async function handleReset() {
    if (!selectedAthlete || !activeCompetitionId) {
      return;
    }

    try {
      const updatedAthlete = await resetMutation.mutateAsync(selectedAthlete.id);
      setSelectedAthlete(updatedAthlete);
      setRealWeightInput('');
      setFeedback({ tone: 'success', text: 'Pesagem resetada.' });
      toast({
        title: 'Pesagem resetada',
        description: `${updatedAthlete.name} voltou para pendente.`,
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tente novamente.';
      setFeedback({ tone: 'error', text: 'Falha ao resetar a pesagem.' });
      toast({
        title: 'Falha ao resetar pesagem',
        description: message,
        variant: 'destructive',
      });
    }
  }

  function handleWeightKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || !canConfirm || isMutating) {
      return;
    }

    event.preventDefault();
    void handleConfirm();
  }

  return (
    <div className="space-y-6">
      <header className="rounded-[28px] border-4 border-slate-900 bg-white p-6 shadow-[8px_8px_0_0_rgba(15,23,42,0.95)]">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
          Weigh-In
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
          Pesagem rapida da competicao ativa
        </h1>
        <p className="mt-3 max-w-3xl text-base text-slate-600">
          Busque pelo nome ou ID, selecione o atleta e confirme a pesagem em poucos toques.
        </p>
      </header>

      {!hasHydrated && (
        <Card className="border-4 border-slate-300 p-0">
          <CardContent className="p-6 text-slate-600">
            Carregando competicao ativa...
          </CardContent>
        </Card>
      )}

      {hasHydrated && !activeCompetitionId && (
        <Card className="border-4 border-amber-400 bg-amber-50 p-0">
          <CardContent className="p-6 text-amber-950">
            Selecione uma competicao no topo para iniciar a pesagem.
          </CardContent>
        </Card>
      )}

      {activeCompetitionId && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <Card className="border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
              <CardContent className="p-5">
                <label className="block space-y-3">
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                    Buscar atleta
                  </span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Digite nome ou ID"
                      className="h-16 rounded-2xl border-4 border-slate-900 bg-slate-50 pl-14 pr-14 text-lg font-semibold shadow-none focus:border-blue-600 focus:ring-0"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900 bg-white p-1 text-slate-700 transition hover:bg-slate-100"
                        aria-label="Limpar busca"
                        title="Limpar busca"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </label>
              </CardContent>
            </Card>

            <Card className="border-4 border-slate-900 p-0">
              <CardContent className="p-0">
                <div className="border-b-4 border-slate-900 bg-slate-100 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-slate-600">
                  Lista rapida
                </div>

                {athletesQuery.isLoading ? (
                  <div className="flex items-center gap-3 px-5 py-6 text-slate-600">
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Carregando atletas...
                  </div>
                ) : athletesQuery.isError ? (
                  <div className="px-5 py-6 text-red-700">
                    {athletesQuery.error instanceof Error
                      ? athletesQuery.error.message
                      : 'Falha ao carregar atletas.'}
                  </div>
                ) : quickResults.length === 0 ? (
                  <div className="px-5 py-8 text-slate-500">
                    Nenhum atleta encontrado para esta busca.
                  </div>
                ) : (
                  <div className="divide-y-2 divide-slate-200">
                    {quickResults.map((athlete) => {
                      const isActive = athlete.id === selectedAthlete?.id;

                      return (
                        <button
                          key={athlete.id}
                          type="button"
                          onClick={() => handleSelectAthlete(athlete)}
                          className={`flex w-full items-center justify-between px-5 py-4 text-left transition ${
                            isActive ? 'bg-amber-100' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <p className="text-base font-black text-slate-950">
                              {athlete.name}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              ID {athlete.id} • {athlete.team || 'Sem equipe'}
                            </p>
                          </div>
                          <span className={statusBadgeClassName(athlete.weighInStatus)}>
                            {getWeighInStatusLabel(athlete.weighInStatus)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <Card className="border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
              <CardContent className="space-y-5 p-5">
                <div className="flex items-start justify-between gap-4 border-b-4 border-slate-900 pb-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                      Atleta selecionado
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">
                      {selectedAthlete?.name || 'Selecione na lista'}
                    </h2>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {selectedAthlete && (
                      <span className={statusBadgeClassName(selectedAthlete.weighInStatus)}>
                        {getWeighInStatusLabel(selectedAthlete.weighInStatus)}
                      </span>
                    )}
                    {feedback && (
                      <span className={feedbackBadgeClassName(feedback.tone)}>
                        {feedback.text}
                      </span>
                    )}
                  </div>
                </div>

                {selectedAthlete ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoBox label="Equipe" value={selectedAthlete.team || '-'} />
                      <InfoBox label="Faixa" value={selectedAthlete.belt || '-'} />
                      <InfoBox
                        label="Peso declarado"
                        value={formatWeightKg(selectedAthlete.declaredWeight)}
                      />
                      <InfoBox
                        label="Peso aferido"
                        value={formatRealWeight(selectedAthlete.realWeightGrams)}
                      />
                    </div>

                    <label className="block space-y-2">
                      <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                        Peso real (kg)
                      </span>
                      <div className="relative">
                        <Scale className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <Input
                          inputMode="decimal"
                          value={realWeightInput}
                          onChange={(event) => setRealWeightInput(normalizeDecimalInput(event.target.value))}
                          onKeyDown={handleWeightKeyDown}
                          placeholder="Ex.: 72.350"
                          className="h-14 rounded-2xl border-4 border-slate-900 pl-12 text-lg font-semibold shadow-none focus:border-blue-600 focus:ring-0"
                        />
                      </div>
                      <p className="text-sm text-slate-500">
                        {parsedWeightGrams !== null
                          ? `${parsedWeightGrams} g prontos para envio.`
                          : 'Digite um peso valido para confirmar.'}
                      </p>
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        onClick={() => void handleConfirm()}
                        disabled={!canConfirm || isMutating}
                        className="h-14 flex-1 rounded-2xl border-4 border-emerald-900 bg-emerald-600 text-base font-black uppercase tracking-[0.12em] hover:bg-emerald-700"
                      >
                        {confirmMutation.isPending ? 'Confirmando...' : 'Confirmar pesagem'}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => void handleReset()}
                        disabled={!selectedAthlete || isMutating}
                        className="h-14 flex-1 rounded-2xl border-4 border-red-900 text-base font-black uppercase tracking-[0.12em]"
                      >
                        {resetMutation.isPending ? 'Resetando...' : 'Resetar pesagem'}
                      </Button>
                    </div>

                    <p className="text-sm text-slate-500">
                      Pressione Enter no campo de peso para confirmar quando o valor estiver valido.
                    </p>
                  </>
                ) : (
                  <div className="rounded-3xl border-4 border-dashed border-slate-300 bg-slate-50 p-8 text-slate-500">
                    Escolha um atleta na lista para abrir o painel de pesagem.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-4 border-slate-900 bg-slate-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
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

function feedbackBadgeClassName(tone: 'success' | 'error') {
  if (tone === 'success') {
    return 'inline-flex rounded-full border-2 border-emerald-900 bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-900';
  }

  return 'inline-flex rounded-full border-2 border-red-900 bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-red-900';
}
