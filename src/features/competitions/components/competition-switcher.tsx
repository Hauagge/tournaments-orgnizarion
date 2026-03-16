'use client';

import { useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useCompetitions } from '@/features/competitions/hooks/use-competitions';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';

export function CompetitionSwitcher() {
  const { data, isLoading, isError } = useCompetitions();
  const competitions = Array.isArray(data) ? data : [];
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const setActiveCompetitionId = useCompetitionStore(
    (state) => state.setActiveCompetitionId,
  );

  useEffect(() => {
    if (!hasHydrated) return;
    if (competitions.length === 0) return;

    const hasActiveCompetition = competitions.some(
      (competition) => competition.id === activeCompetitionId,
    );

    if (!activeCompetitionId || !hasActiveCompetition) {
      setActiveCompetitionId(competitions[0].id);
    }
  }, [activeCompetitionId, competitions, hasHydrated, setActiveCompetitionId]);

  return (
    <div className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
        <Trophy className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Competição
        </p>
        {!hasHydrated ? (
          <p className="text-sm text-slate-500">Carregando competição...</p>
        ) : isLoading ? (
          <p className="text-sm text-slate-500">Carregando competições...</p>
        ) : isError ? (
          <p className="text-sm text-red-600">Falha ao carregar competições.</p>
        ) : (
          <select
            value={activeCompetitionId ?? ''}
            onChange={(event) => setActiveCompetitionId(event.target.value)}
            className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
          >
            <option value="" disabled>
              Selecione uma competição
            </option>
            {competitions.map((competition) => (
              <option key={competition.id} value={competition.id}>
                {competition.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
