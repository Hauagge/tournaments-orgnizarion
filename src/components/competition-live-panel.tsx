'use client';

import { useCompetitionSocket } from '@/hooks/useCompetitionSocket';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';

type CompetitionLivePanelProps = {
  competitionId: number | string | null;
};

export function CompetitionLivePanel({
  competitionId,
}: CompetitionLivePanelProps) {
  const token = useAuthStore((state) => state.token);
  const socketState = useCompetitionSocket({ token, competitionId });

  return (
    <section className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
      <h2 className="text-lg font-black text-slate-950">Competition Live Panel</h2>
      <div className="mt-3 space-y-1 text-sm text-slate-700">
        <p>
          <span className="font-semibold">connected:</span>{' '}
          {socketState.connected ? 'true' : 'false'}
        </p>
        <p>
          <span className="font-semibold">joining:</span>{' '}
          {socketState.joining ? 'true' : 'false'}
        </p>
        <p>
          <span className="font-semibold">joinError:</span>{' '}
          {socketState.joinError ?? 'none'}
        </p>
      </div>

      <pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
        {JSON.stringify(socketState.lastEvent, null, 2)}
      </pre>
    </section>
  );
}
