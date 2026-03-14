'use client';

import { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { useCategoryStore } from '@/app/store/useCategoryStore';
import { Athlete } from '@/app/types';
import Round from '@/app/components/Rounds';
import { exportAllBracketsPdf } from '@/app/utils/export-brackets-pdf';

export type WinnerMap = Record<number, string | null>;

export default function CategoryPage() {
  const router = useRouter();
  const { categoryName } = useParams<{ categoryName: string }>();
  const decoded = decodeURIComponent(categoryName);
  const { categories } = useCategoryStore();

  const bracket = useMemo(
    () => categories.find((cat) => cat.name === decoded),
    [categories, decoded],
  );

  const [winners, setWinners] = useState<WinnerMap>({});

  function handleSelectWinner(index: number, athlete: string) {
    setWinners((prev) => ({
      ...prev,
      [index]: prev[index] === athlete ? null : athlete,
    }));
  }

  const totalFights = bracket?.athletes?.length ?? 0;
  const finishedCount = Object.values(winners).filter(Boolean).length;

  if (!bracket) {
    return (
      <div className="p-6 flex flex-col items-center gap-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Chave não encontrada</h2>
          <p className="text-muted-foreground max-w-md">
            Verifique o nome da categoria ou retorne para a lista de chaves.
          </p>
        </div>
        <Button onClick={() => router.back()}>← Voltar</Button>
      </div>
    );
  }

  const athletesName = bracket.athletes.map((a: Athlete) => a.name);

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-stone-50 to-stone-100 min-h-screen">
      {/* Header */}
      <div className="rounded-2xl border p-6 shadow-lg bg-white">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-stone-950">
              {bracket.name}
            </h1>
            <p className="text-stone-950">
              Idade:{' '}
              <span className="font-medium">
                {bracket.ageDivision.min}–{bracket.ageDivision.max}
              </span>{' '}
              anos · Peso:{' '}
              <span className="font-medium">
                {bracket.minWeight}–{bracket.maxWeight}
              </span>{' '}
              kg
            </p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-3">
            <Stat value={totalFights} label="Lutas" />
            <Stat value={finishedCount} label="Definidas" />
            <Stat
              value={Math.max(totalFights - finishedCount, 0)}
              label="Pendentes"
            />
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-slate-700 hover:bg-slate-600 text-slate-100"
              variant="secondary"
              onClick={() => router.back()}
            >
              ← Voltar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-500 text-white"
              onClick={() =>
                exportAllBracketsPdf(categories, { landscape: false })
              }
            >
              Exportar PDF
            </Button>
            <Button>Salvar progresso</Button>
          </div>
        </div>
      </div>

      {/* Lutas */}
      <section className="space-y-3 bg-white p-4 md:p-6 rounded-2xl border shadow-lg">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Lutas</h2>
          <span className="text-sm text-muted-foreground">
            Exibindo {bracket?.athletes.length} de {totalFights}
          </span>
        </div>

        {bracket?.athletes.length === 0 ? (
          <EmptyState
            title="Sem lutas correspondentes"
            subtitle="Tente outro nome na busca."
          />
        ) : (
          <>
            {/* <Round
              athletes={athletesName}
              slots={16}
              onWinner={handleSelectWinner}
              winners={winners}
              density="compact"
            />
            <Round
              athletes={athletesName}
              slots={8}
              onWinner={handleSelectWinner}
              winners={winners}
              density="compact"
            />*/}
            <Round
              athletes={athletesName}
              slots={4}
              onWinner={handleSelectWinner}
              winners={winners}
              density="compact"
            />
            {/* <Round
              athletes={athletesName}
              slots={2}
              onWinner={handleSelectWinner}
              winners={winners}
              density="compact"
            /> */}
          </>
        )}
      </section>
    </div>
  );
}

/** ---------- UI helpers ---------- */

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-xl border bg-white px-3 py-2 text-center">
      <div className="text-xl font-bold leading-none">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center bg-white">
      <div className="text-base font-semibold">{title}</div>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
