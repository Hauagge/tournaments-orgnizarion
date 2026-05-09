'use client';

import { useSearchParams } from 'next/navigation';
import { FightScoreboardScreen } from '@/features/fights/components/fight-scoreboard-screen';

export default function FightScoreboardPublicPage() {
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
