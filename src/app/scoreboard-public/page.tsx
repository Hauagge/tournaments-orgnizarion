'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FightScoreboardScreen } from '@/features/fights/components/fight-scoreboard-screen';

export default function FightScoreboardPublicPage() {
  return (
    <Suspense
      fallback={
        <main className="h-screen w-screen overflow-hidden bg-[#f7f1e8]" />
      }
    >
      <ScoreboardPublicContent />
    </Suspense>
  );
}

function ScoreboardPublicContent() {
  const searchParams = useSearchParams();
  const areaId = searchParams.get('areaId');

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#f7f1e8]">
      <FightScoreboardScreen
        fight={null}
        areaId={areaId}
        mode="public"
        initialDurationSeconds={300}
      />
    </main>
  );
}
