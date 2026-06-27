'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, RotateCcw, Trophy, Monitor } from 'lucide-react';
import { Fight } from '@/features/fights/types/fight';
import {
  type AreaScoreboardPayload,
  type FightSnapshot,
  type PlayerScore,
  type ScoreboardState,
  type StoredScoreboardPayload,
  type WinnerAnnouncement,
  buildEmptyPlayerScore,
  buildFightSnapshot,
  buildInitialScoreboardState,
  readAreaStorageKey,
  readFightStorageKey,
  SCOREBOARD_CHANNEL_NAME,
} from '@/features/fights/lib/scoreboard-sync';
import { Button } from '@/shared/ui/button';

type FightScoreboardScreenProps = {
  fight: Fight | null;
  fightId?: string | null;
  areaId?: string | null;
  mode: 'operator' | 'public';
  initialDurationSeconds?: number;
  autoStartToken?: number;
  onSubmissionFinishSelection?: (fightId: string, winnerId: string) => void;
  onFinish?: (fightId: string) => void;
};

// TODO: Adicionar novas etapaas quando chave olimpica
// ADicionar funcionalidade para  inicar lutar para iniciar a luta, e para finalizar a luta, com opção de escolher o vencedor por pontos ou finalização. Essa funcionalidade deve ser para os chamadores.
// Implementar funcionalidade que conta as vitórias por academia,
type ScoreKey = keyof PlayerScore;

type ShortcutSpec = {
  label: string;
  description: string;
  key: string;
  side?: 'A' | 'B';
  scoreKey?: ScoreKey;
  delta?: number;
};

const pointRules: Array<{
  key: ScoreKey;
  label: string;
  description: string;
  points: number;
}> = [
  {
    key: 'mounted',
    label: 'Montada',
    description: 'Montada ou pegada nas costas',
    points: 4,
  },
  {
    key: 'guard',
    label: 'Guarda',
    description: 'Passagem de guarda',
    points: 3,
  },
  {
    key: 'overthrow',
    label: 'Queda',
    description: 'Queda, raspagem ou joelho na barriga',
    points: 2,
  },
  {
    key: 'advantage',
    label: 'Vantagem',
    description: 'Critério de desempate',
    points: 1,
  },
  {
    key: 'punishment',
    label: 'Punição',
    description: 'Menor total vence no desempate',
    points: 1,
  },
];

const durationOptionsInMinutes = [2, 3, 4, 5, 6, 7, 8, 10] as const;
const publicTopSponsors: Array<{ title: string; imageUrl?: string }> = [];
const publicCenterSponsor: { title: string; imageUrl?: string } | null = null;
const publicBottomSponsors: Array<{ title: string; imageUrl?: string }> = [];
const operatorScoreShortcuts: ShortcutSpec[] = [
  {
    key: '1',
    label: '1',
    description: 'A Montada',
    side: 'A',
    scoreKey: 'mounted',
    delta: 4,
  },
  {
    key: '2',
    label: '2',
    description: 'A Guarda',
    side: 'A',
    scoreKey: 'guard',
    delta: 3,
  },
  {
    key: '3',
    label: '3',
    description: 'A Queda',
    side: 'A',
    scoreKey: 'overthrow',
    delta: 2,
  },
  {
    key: '4',
    label: '4',
    description: 'A Vantagem',
    side: 'A',
    scoreKey: 'advantage',
    delta: 1,
  },
  {
    key: '5',
    label: '5',
    description: 'A Punição',
    side: 'A',
    scoreKey: 'punishment',
    delta: 1,
  },
  {
    key: '6',
    label: '6',
    description: 'B Montada',
    side: 'B',
    scoreKey: 'mounted',
    delta: 4,
  },
  {
    key: '7',
    label: '7',
    description: 'B Guarda',
    side: 'B',
    scoreKey: 'guard',
    delta: 3,
  },
  {
    key: '8',
    label: '8',
    description: 'B Queda',
    side: 'B',
    scoreKey: 'overthrow',
    delta: 2,
  },
  {
    key: '9',
    label: '9',
    description: 'B Vantagem',
    side: 'B',
    scoreKey: 'advantage',
    delta: 1,
  },
  {
    key: '0',
    label: '0',
    description: 'B Punição',
    side: 'B',
    scoreKey: 'punishment',
    delta: 1,
  },
];
const operatorActionShortcuts: ShortcutSpec[] = [
  { key: 'Space', label: 'Espaço', description: 'Iniciar/Pausar' },
  { key: 'r', label: 'R', description: 'Reiniciar tempo' },
  { key: 'q', label: 'Q', description: 'A finalizou' },
  { key: 'p', label: 'P', description: 'B finalizou' },
];

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function totalPoints(score: PlayerScore) {
  return score.mounted + score.guard + score.overthrow;
}

function decideWinner(playerA: PlayerScore, playerB: PlayerScore) {
  const totalA = totalPoints(playerA);
  const totalB = totalPoints(playerB);

  if (totalA !== totalB) {
    return totalA > totalB
      ? {
          winner: 'A' as const,
          reason: `Vitória por pontos: ${totalA} x ${totalB}.`,
        }
      : {
          winner: 'B' as const,
          reason: `Vitória por pontos: ${totalB} x ${totalA}.`,
        };
  }

  if (playerA.advantage !== playerB.advantage) {
    return playerA.advantage > playerB.advantage
      ? {
          winner: 'A' as const,
          reason: `Empate em pontos. Vitória por vantagens: ${playerA.advantage} x ${playerB.advantage}.`,
        }
      : {
          winner: 'B' as const,
          reason: `Empate em pontos. Vitória por vantagens: ${playerB.advantage} x ${playerA.advantage}.`,
        };
  }

  if (playerA.punishment !== playerB.punishment) {
    return playerA.punishment < playerB.punishment
      ? {
          winner: 'A' as const,
          reason: `Empate em pontos e vantagens. Vitória por menos punições: ${playerA.punishment} x ${playerB.punishment}.`,
        }
      : {
          winner: 'B' as const,
          reason: `Empate em pontos e vantagens. Vitória por menos punições: ${playerB.punishment} x ${playerA.punishment}.`,
        };
  }

  return {
    winner: null,
    reason:
      'Empate em pontos, vantagens e punições. O árbitro deve definir o vencedor.',
  };
}

function normalizeStoredPayload(
  input: Partial<StoredScoreboardPayload> | null | undefined,
  initialDurationSeconds: number,
): StoredScoreboardPayload | null {
  if (!input?.scoreboard) {
    return null;
  }

  return {
    version: typeof input.version === 'number' ? input.version : Date.now(),
    fight: input.fight ?? null,
    scoreboard: {
      durationSeconds:
        typeof input.scoreboard.durationSeconds === 'number'
          ? input.scoreboard.durationSeconds
          : initialDurationSeconds,
      remainingSeconds:
        typeof input.scoreboard.remainingSeconds === 'number'
          ? Math.max(0, input.scoreboard.remainingSeconds)
          : initialDurationSeconds,
      running: Boolean(input.scoreboard.running),
      playerA: {
        ...buildEmptyPlayerScore(),
        ...input.scoreboard.playerA,
      },
      playerB: {
        ...buildEmptyPlayerScore(),
        ...input.scoreboard.playerB,
      },
    },
  };
}

function normalizeAreaPayload(
  input: Partial<AreaScoreboardPayload> | null | undefined,
  initialDurationSeconds: number,
): AreaScoreboardPayload | null {
  if (!input?.areaId || !input.status) {
    return null;
  }

  if (input.status === 'IDLE') {
    return {
      version: typeof input.version === 'number' ? input.version : Date.now(),
      areaId: input.areaId,
      status: 'IDLE',
      fight: null,
      scoreboard: null,
      announcement: null,
    };
  }

  const normalizedFightPayload = normalizeStoredPayload(
    {
      version: input.version,
      fight: input.fight,
      scoreboard: input.scoreboard ?? undefined,
    },
    initialDurationSeconds,
  );

  if (!normalizedFightPayload) {
    return {
      version: typeof input.version === 'number' ? input.version : Date.now(),
      areaId: input.areaId,
      status: 'IDLE',
      fight: null,
      scoreboard: null,
    };
  }

  return {
    version: normalizedFightPayload.version,
    areaId: input.areaId,
    status: 'ACTIVE',
    fight: normalizedFightPayload.fight,
    scoreboard: normalizedFightPayload.scoreboard,
    announcement: input.announcement ?? null,
  };
}

export function FightScoreboardScreen({
  fight,
  fightId,
  areaId,
  mode,
  initialDurationSeconds = 300,
  autoStartToken = 0,
  onSubmissionFinishSelection,
  onFinish,
}: FightScoreboardScreenProps) {
  const resolvedFightId = fight?.id ?? fightId ?? null;
  const resolvedAreaId = fight?.areaId ?? areaId ?? null;
  const fightStorageKey = resolvedFightId
    ? readFightStorageKey(resolvedFightId)
    : null;
  const areaStorageKey = resolvedAreaId
    ? readAreaStorageKey(resolvedAreaId)
    : null;
  const isPublicMode = mode === 'public';
  const [scoreboard, setScoreboard] = useState<ScoreboardState>(() =>
    buildInitialScoreboardState(initialDurationSeconds),
  );
  const [fightSnapshot, setFightSnapshot] = useState<FightSnapshot | null>(() =>
    buildFightSnapshot(fight),
  );
  const [areaStatus, setAreaStatus] = useState<'IDLE' | 'ACTIVE'>(
    isPublicMode ? 'IDLE' : 'ACTIVE',
  );
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const [forcedWinnerOverlay, setForcedWinnerOverlay] =
    useState<WinnerAnnouncement | null>(null);
  const [areaAnnouncement, setAreaAnnouncement] =
    useState<WinnerAnnouncement | null>(null);
  const [lastScoreChange, setLastScoreChange] = useState<{
    side: 'A' | 'B';
    key: ScoreKey;
    delta: number;
  } | null>(null);

  useEffect(() => {
    if (!fight) {
      return;
    }
    setFightSnapshot(buildFightSnapshot(fight));
    if (!isPublicMode) {
      setAreaAnnouncement(null);
    }
  }, [fight, isPublicMode]);

  useEffect(() => {
    const targetStorageKey = isPublicMode ? areaStorageKey : fightStorageKey;
    if (!targetStorageKey) {
      return;
    }

    const fallbackState = buildInitialScoreboardState(initialDurationSeconds);

    try {
      const rawState = window.localStorage.getItem(targetStorageKey);
      if (!rawState) {
        if (!isPublicMode) {
          setScoreboard(fallbackState);
        }
        return;
      }

      if (isPublicMode) {
        const parsedAreaPayload = JSON.parse(
          rawState,
        ) as Partial<AreaScoreboardPayload>;
        const normalizedAreaPayload = normalizeAreaPayload(
          parsedAreaPayload,
          initialDurationSeconds,
        );

        if (!normalizedAreaPayload) {
          return;
        }

        setAreaStatus(normalizedAreaPayload.status);

        if (normalizedAreaPayload.fight) {
          setFightSnapshot(normalizedAreaPayload.fight);
        }

        if (normalizedAreaPayload.scoreboard) {
          setScoreboard(normalizedAreaPayload.scoreboard);
        }
        return;
      }

      const parsedFightState = JSON.parse(
        rawState,
      ) as Partial<StoredScoreboardPayload>;
      const normalizedFightPayload = normalizeStoredPayload(
        parsedFightState,
        initialDurationSeconds,
      );

      if (normalizedFightPayload?.fight) {
        setFightSnapshot(normalizedFightPayload.fight);
      }

      if (normalizedFightPayload) {
        setScoreboard(normalizedFightPayload.scoreboard);
      } else {
        setScoreboard(fallbackState);
      }
    } catch {
      if (!isPublicMode) {
        setScoreboard(fallbackState);
      }
    }
  }, [areaStorageKey, fightStorageKey, initialDurationSeconds, isPublicMode]);

  useEffect(() => {
    if (
      !fightStorageKey ||
      !areaStorageKey ||
      isPublicMode ||
      !resolvedFightId ||
      !resolvedAreaId
    ) {
      return;
    }

    const fightPayload: StoredScoreboardPayload = {
      version: Date.now(),
      fight: buildFightSnapshot(fight) ?? fightSnapshot,
      scoreboard,
    };
    const areaPayload: AreaScoreboardPayload = {
      version: fightPayload.version,
      areaId: resolvedAreaId,
      status: 'ACTIVE',
      fight: fightPayload.fight,
      scoreboard: fightPayload.scoreboard,
      announcement: areaAnnouncement,
    };

    window.localStorage.setItem(fightStorageKey, JSON.stringify(fightPayload));
    window.localStorage.setItem(areaStorageKey, JSON.stringify(areaPayload));

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(SCOREBOARD_CHANNEL_NAME);
      channel.postMessage({
        source: 'operator',
        fightId: resolvedFightId,
        areaId: resolvedAreaId,
        payload: areaPayload,
      });
      channel.close();
    }
  }, [
    areaStorageKey,
    fight,
    fightSnapshot,
    fightStorageKey,
    isPublicMode,
    areaAnnouncement,
    resolvedAreaId,
    resolvedFightId,
    scoreboard,
  ]);

  useEffect(() => {
    if (!areaStorageKey || !isPublicMode || !resolvedAreaId) {
      return;
    }

    const applyPayload = (
      payload: Partial<AreaScoreboardPayload> | null | undefined,
    ) => {
      const normalized = normalizeAreaPayload(payload, initialDurationSeconds);
      if (!normalized) {
        return;
      }

      setAreaStatus(normalized.status);
      setForcedWinnerOverlay(normalized.announcement ?? null);

      if (normalized.fight) {
        setFightSnapshot(normalized.fight);
      }

      if (normalized.scoreboard) {
        setScoreboard(normalized.scoreboard);
      }
    };

    const channel =
      'BroadcastChannel' in window
        ? new BroadcastChannel(SCOREBOARD_CHANNEL_NAME)
        : null;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== areaStorageKey || !event.newValue) {
        return;
      }

      try {
        applyPayload(JSON.parse(event.newValue) as AreaScoreboardPayload);
      } catch {
        return;
      }
    };

    const handleChannel = (event: MessageEvent) => {
      const message = event.data as
        | { areaId?: string; payload?: AreaScoreboardPayload }
        | undefined;

      if (!message || message.areaId !== resolvedAreaId || !message.payload) {
        return;
      }

      applyPayload(message.payload);
    };

    const pollStorage = window.setInterval(() => {
      try {
        const rawState = window.localStorage.getItem(areaStorageKey);
        if (!rawState) {
          return;
        }

        applyPayload(JSON.parse(rawState) as Partial<AreaScoreboardPayload>);
      } catch {
        return;
      }
    }, 500);

    window.addEventListener('storage', handleStorage);
    channel?.addEventListener('message', handleChannel);

    return () => {
      window.clearInterval(pollStorage);
      window.removeEventListener('storage', handleStorage);
      channel?.removeEventListener('message', handleChannel);
      channel?.close();
    };
  }, [areaStorageKey, initialDurationSeconds, isPublicMode, resolvedAreaId]);

  useEffect(() => {
    if (isPublicMode || !scoreboard.running) {
      return;
    }

    const interval = window.setInterval(() => {
      setScoreboard((current) => {
        if (current.remainingSeconds <= 1) {
          return {
            ...current,
            remainingSeconds: 0,
            running: false,
          };
        }

        return {
          ...current,
          remainingSeconds: current.remainingSeconds - 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isPublicMode, scoreboard.running]);

  useEffect(() => {
    if (isPublicMode || !fight || autoStartToken === 0) {
      return;
    }

    setScoreboard((current) => {
      if (
        current.remainingSeconds === current.durationSeconds &&
        !current.running
      ) {
        return { ...current, running: true };
      }
      return current;
    });
  }, [autoStartToken, fight, isPublicMode]);

  const result = useMemo(
    () => decideWinner(scoreboard.playerA, scoreboard.playerB),
    [scoreboard.playerA, scoreboard.playerB],
  );

  useEffect(() => {
    if (!isPublicMode) {
      setShowWinnerOverlay(false);
      return;
    }

    if (areaStatus !== 'ACTIVE') {
      setShowWinnerOverlay(false);
      return;
    }

    if (forcedWinnerOverlay) {
      setShowWinnerOverlay(true);
      return;
    }

    if (scoreboard.remainingSeconds <= 0) {
      setShowWinnerOverlay(true);
      return;
    }

    setShowWinnerOverlay(false);
  }, [
    areaStatus,
    forcedWinnerOverlay,
    isPublicMode,
    scoreboard.remainingSeconds,
  ]);

  function updateScore(side: 'A' | 'B', key: ScoreKey, delta: number) {
    if (isPublicMode) {
      return;
    }

    setScoreboard((current) => {
      const playerKey = side === 'A' ? 'playerA' : 'playerB';
      const currentValue = current[playerKey][key];
      const nextValue = Math.max(0, currentValue + delta);

      return {
        ...current,
        [playerKey]: {
          ...current[playerKey],
          [key]: nextValue,
        },
      };
    });
    setLastScoreChange({ side, key, delta });
  }

  useEffect(() => {
    if (!lastScoreChange) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setLastScoreChange((current) =>
        current === lastScoreChange ? null : current,
      );
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [lastScoreChange]);

  function toggleTimer() {
    if (isPublicMode) {
      return;
    }

    setScoreboard((current) => {
      if (current.remainingSeconds <= 0) {
        return current;
      }

      return {
        ...current,
        running: !current.running,
      };
    });
  }

  function resetTimer() {
    if (isPublicMode) {
      return;
    }

    setScoreboard((current) => ({
      ...current,
      running: false,
      remainingSeconds: current.durationSeconds,
    }));
  }

  function resetScoreboard() {
    if (isPublicMode) {
      return;
    }

    setScoreboard(buildInitialScoreboardState(scoreboard.durationSeconds));
  }

  function updateDuration(durationMinutes: number) {
    if (isPublicMode) {
      return;
    }

    const durationSeconds = durationMinutes * 60;
    setScoreboard((current) => ({
      ...current,
      durationSeconds,
      remainingSeconds: durationSeconds,
      running: false,
    }));
  }

  function openPublicMode() {
    if (!resolvedAreaId) {
      return;
    }

    window.open(
      `/scoreboard-public?areaId=${encodeURIComponent(resolvedAreaId)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  const displayFight = fightSnapshot ?? buildFightSnapshot(fight);
  const displayResult = forcedWinnerOverlay ?? result;

  function publishAreaAnnouncement(announcement: WinnerAnnouncement) {
    setAreaAnnouncement(announcement);
  }

  function triggerSubmissionSelection(side: 'A' | 'B') {
    if (
      !fight?.athleteA?.id ||
      !fight?.athleteB?.id ||
      !onSubmissionFinishSelection
    ) {
      return;
    }

    const announcement: WinnerAnnouncement = {
      winner: side,
      reason: 'Vitória por finalização.',
    };
    publishAreaAnnouncement(announcement);

    const winnerId = side === 'A' ? fight.athleteA.id : fight.athleteB.id;

    window.setTimeout(() => {
      onSubmissionFinishSelection(fight.id, winnerId);
    }, 1400);
  }

  useEffect(() => {
    if (isPublicMode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName ?? '';
      if (
        target?.isContentEditable ||
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT'
      ) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        toggleTimer();
        return;
      }

      const key = event.key.toLowerCase();

      if (key === 'r') {
        event.preventDefault();
        resetTimer();
        return;
      }

      if (key === 'q') {
        event.preventDefault();
        triggerSubmissionSelection('A');
        return;
      }

      if (key === 'p') {
        event.preventDefault();
        triggerSubmissionSelection('B');
        return;
      }

      const scoreShortcut = operatorScoreShortcuts.find(
        (shortcut) => shortcut.key === event.key,
      );

      if (
        scoreShortcut?.side &&
        scoreShortcut.scoreKey &&
        scoreShortcut.delta
      ) {
        event.preventDefault();
        updateScore(
          scoreShortcut.side,
          scoreShortcut.scoreKey,
          scoreShortcut.delta,
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    fight?.athleteA?.id,
    fight?.athleteB?.id,
    isPublicMode,
    onSubmissionFinishSelection,
    scoreboard.remainingSeconds,
  ]);

  const overlayToneClassName =
    displayResult.winner === 'A'
      ? 'bg-[radial-gradient(circle_at_top,#fecaca_0%,#dc2626_45%,#7f1d1d_100%)]'
      : displayResult.winner === 'B'
        ? 'bg-[radial-gradient(circle_at_top,#dbeafe_0%,#2563eb_45%,#0f172a_100%)]'
        : 'bg-[radial-gradient(circle_at_top,#e2e8f0_0%,#475569_45%,#020617_100%)]';

  const overlayWinnerName =
    displayResult.winner === 'A'
      ? displayFight?.athleteAName || 'Atleta A'
      : displayResult.winner === 'B'
        ? displayFight?.athleteBName || 'Atleta B'
        : 'Decisão do árbitro';
  const hasTopSponsors = publicTopSponsors.length > 0;
  const hasCenterSponsor = Boolean(publicCenterSponsor);
  const hasBottomSponsors = publicBottomSponsors.length > 0;

  if (isPublicMode) {
    return (
      <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)]">
        <header className="shrink-0 border-b-4 border-slate-900 bg-white/90 px-6 py-4 backdrop-blur">
          <div
            className={`grid gap-4 xl:items-center ${
              hasTopSponsors
                ? 'xl:grid-cols-[1fr_minmax(0,2.2fr)_1fr]'
                : 'xl:grid-cols-1'
            }`}
          >
            {hasTopSponsors ? (
              <SponsorSlot sponsor={publicTopSponsors[0]} variant="left" />
            ) : null}
            <div className="rounded-[28px] border-4 border-slate-900 bg-slate-950 px-6 py-5 text-center text-white shadow-[8px_8px_0_0_rgba(15,23,42,0.95)]">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                Modo Público
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Placar da luta
              </h1>
              <p className="mt-2 text-sm text-slate-300 sm:text-base">
                {displayFight?.categoryName || 'Categoria não informada'} ·{' '}
                {displayFight?.areaName || 'Área não informada'}
              </p>
            </div>
            {hasTopSponsors ? (
              <SponsorSlot sponsor={publicTopSponsors[1]} variant="right" />
            ) : null}
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col px-6 py-5">
          {areaStatus === 'IDLE' ? (
            <PublicIdleState />
          ) : (
            <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[1.15fr_0.9fr_1.15fr]">
              <ScorePanel
                side="A"
                name={displayFight?.athleteAName || 'Atleta A'}
                academy={displayFight?.athleteAAcademy || 'Sem academia'}
                score={scoreboard.playerA}
                onChangeScore={updateScore}
                interactive={false}
                publicMode
              />

              <section className="flex min-h-0 flex-col rounded-[32px] border-4 border-slate-900 bg-slate-950 px-5 py-6 text-white shadow-[8px_8px_0_0_rgba(15,23,42,0.95)]">
                <TimerHero
                  remainingSeconds={scoreboard.remainingSeconds}
                  durationSeconds={scoreboard.durationSeconds}
                />

                {hasCenterSponsor ? (
                  <div className="mt-5">
                    <SponsorSlot
                      sponsor={publicCenterSponsor ?? undefined}
                      variant="center"
                    />
                  </div>
                ) : null}
              </section>

              <ScorePanel
                side="B"
                name={displayFight?.athleteBName || 'Atleta B'}
                academy={displayFight?.athleteBAcademy || 'Sem academia'}
                score={scoreboard.playerB}
                onChangeScore={updateScore}
                interactive={false}
                publicMode
              />
            </div>
          )}
        </main>

        {hasBottomSponsors ? (
          <footer className="shrink-0 border-t-4 border-slate-900 bg-white/90 px-6 py-4 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-3">
              {publicBottomSponsors.slice(0, 3).map((sponsor, index) => (
                <SponsorSlot
                  key={`${sponsor.title}-${index}`}
                  sponsor={sponsor}
                  variant={
                    index === 0 ? 'left' : index === 1 ? 'center' : 'right'
                  }
                  compact
                />
              ))}
            </div>
          </footer>
        ) : null}

        <WinnerOverlay
          isVisible={showWinnerOverlay}
          toneClassName={overlayToneClassName}
          winnerName={overlayWinnerName}
          reason={displayResult.reason}
        />

        <WinnerOverlayStyles />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,1fr)_minmax(22rem,32rem)_minmax(0,1fr)]">
      <ScorePanel
        side="A"
        name={displayFight?.athleteAName || 'Atleta A'}
        academy={displayFight?.athleteAAcademy || 'Sem academia'}
        score={scoreboard.playerA}
        onChangeScore={updateScore}
        interactive={!isPublicMode}
        publicMode={false}
        lastScoreChange={lastScoreChange}
      />

      <section className="order-first overflow-y-auto border-b-4 border-slate-900 bg-slate-950 px-4 py-5 text-white sm:px-5 sm:py-6 xl:order-none xl:border-x-4 xl:border-y-0">
        <div className="text-center">
          <div className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-300">
            {isPublicMode ? 'Modo Público' : 'Modo Operador'}
          </div>
          <h1 className="mt-4 text-xl font-black uppercase tracking-[0.14em] sm:text-2xl">
            Placar da luta
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {displayFight?.categoryName || 'Categoria não informada'} ·{' '}
            {displayFight?.areaName || 'Área não informada'}
          </p>
        </div>

        <div className="mt-6 rounded-[28px] border-4 border-amber-300 bg-amber-50 px-4 py-5 text-center text-slate-950 sm:mt-8 sm:py-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Tempo restante
          </p>
          <p className="mt-3 font-mono text-5xl font-black tracking-tight sm:text-6xl 2xl:text-7xl">
            {formatTime(scoreboard.remainingSeconds)}
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Duração configurada: {formatTime(scoreboard.durationSeconds)}
          </p>
        </div>

        {!isPublicMode ? (
          <>
            <div className="mt-5 rounded-[24px] border-2 border-slate-700 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Tempo da luta
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-700 bg-transparent text-white hover:bg-slate-800 hover:text-white"
                  onClick={openPublicMode}
                  disabled={!resolvedAreaId}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  Modo público
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {durationOptionsInMinutes.map((minutes) => {
                  const isActive = scoreboard.durationSeconds === minutes * 60;

                  return (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => updateDuration(minutes)}
                      className={`rounded-xl border-2 px-3 py-2 text-sm font-black transition ${
                        isActive
                          ? 'border-amber-300 bg-amber-300 text-slate-950'
                          : 'border-slate-700 bg-slate-900 text-white hover:border-slate-500'
                      }`}
                    >
                      {minutes}m
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                A troca de tempo reinicia o cronômetro desta luta. Padrão: 5
                minutos.
              </p>
            </div>

            <div className="mt-5 rounded-[24px] border-2 border-slate-700 bg-slate-900/60 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Operação rápida
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <QuickActionCard
                  title={
                    scoreboard.running ? 'Pausar relógio' : 'Iniciar relógio'
                  }
                  subtitle="Cronômetro principal"
                  shortcut="Espaço"
                  onClick={toggleTimer}
                />
                <QuickActionCard
                  title="Reiniciar tempo"
                  subtitle="Volta ao tempo configurado"
                  shortcut="R"
                  onClick={resetTimer}
                />
                <QuickActionCard
                  title={`${displayFight?.athleteAName || 'Atleta A'} finalizou`}
                  subtitle="Encerrar por submission"
                  shortcut="Q"
                  onClick={() => triggerSubmissionSelection('A')}
                  disabled={
                    !fight?.athleteA?.id ||
                    !fight?.athleteB?.id ||
                    !onSubmissionFinishSelection
                  }
                />
                <QuickActionCard
                  title={`${displayFight?.athleteBName || 'Atleta B'} finalizou`}
                  subtitle="Encerrar por submission"
                  shortcut="P"
                  onClick={() => triggerSubmissionSelection('B')}
                  disabled={
                    !fight?.athleteA?.id ||
                    !fight?.athleteB?.id ||
                    !onSubmissionFinishSelection
                  }
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300 lg:grid-cols-4">
                {operatorActionShortcuts.map((shortcut) => (
                  <ShortcutLegend
                    key={shortcut.label}
                    shortcut={shortcut.label}
                    description={shortcut.description}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                className="h-12 text-base font-black"
                onClick={toggleTimer}
                disabled={scoreboard.remainingSeconds <= 0}
              >
                {scoreboard.running ? (
                  <Pause className="mr-2 h-4 w-4" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {scoreboard.running ? 'Pausar' : 'Iniciar'}
                <ShortcutPill className="ml-3" label="Espaço" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 border-2 border-slate-700 bg-transparent text-base font-black text-white hover:bg-slate-800 hover:text-white"
                onClick={resetTimer}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reiniciar tempo
                <ShortcutPill className="ml-3" label="R" />
              </Button>
            </div>
          </>
        ) : null}

        {!isPublicMode ? (
          <div className="mt-5 space-y-3">
            {fight?.athleteA?.id && fight?.athleteB?.id ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 border-2 border-amber-300 bg-amber-50 font-black text-slate-950 hover:bg-amber-100"
                  onClick={() => {
                    if (!onSubmissionFinishSelection) {
                      return;
                    }

                    const announcement: WinnerAnnouncement = {
                      winner: 'A',
                      reason: 'Vitória por finalização.',
                    };
                    publishAreaAnnouncement(announcement);

                    window.setTimeout(() => {
                      onSubmissionFinishSelection(fight.id, fight.athleteA!.id);
                    }, 1400);
                  }}
                  disabled={!onSubmissionFinishSelection}
                >
                  {displayFight?.athleteAName || 'Atleta A'} finalizou
                  <ShortcutPill className="ml-3" label="Q" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 border-2 border-sky-300 bg-sky-50 font-black text-slate-950 hover:bg-sky-100"
                  onClick={() => {
                    if (!onSubmissionFinishSelection) {
                      return;
                    }

                    const announcement: WinnerAnnouncement = {
                      winner: 'B',
                      reason: 'Vitória por finalização.',
                    };
                    publishAreaAnnouncement(announcement);

                    window.setTimeout(() => {
                      onSubmissionFinishSelection(fight.id, fight.athleteB!.id);
                    }, 1400);
                  }}
                  disabled={!onSubmissionFinishSelection}
                >
                  {displayFight?.athleteBName || 'Atleta B'} finalizou
                  <ShortcutPill className="ml-3" label="P" />
                </Button>
              </div>
            ) : null}
            <Button
              type="button"
              className="h-12 w-full bg-emerald-500 text-base font-black text-slate-950 hover:bg-emerald-400"
              onClick={() => {
                if (resolvedFightId && onFinish) {
                  onFinish(resolvedFightId);
                }
              }}
              disabled={!resolvedFightId || !onFinish}
            >
              <Trophy className="mr-2 h-4 w-4" />
              Encerrar e definir vencedor
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full border-2 border-slate-700 bg-transparent font-black text-white hover:bg-slate-800 hover:text-white"
              onClick={resetScoreboard}
            >
              Reiniciar placar
            </Button>
          </div>
        ) : null}
      </section>

      <ScorePanel
        side="B"
        name={displayFight?.athleteBName || 'Atleta B'}
        academy={displayFight?.athleteBAcademy || 'Sem academia'}
        score={scoreboard.playerB}
        onChangeScore={updateScore}
        interactive={!isPublicMode}
        publicMode={false}
        lastScoreChange={lastScoreChange}
      />

      <WinnerOverlay
        isVisible={showWinnerOverlay}
        toneClassName={overlayToneClassName}
        winnerName={overlayWinnerName}
        reason={displayResult.reason}
      />

      <WinnerOverlayStyles />
    </div>
  );
}

function ScorePanel({
  side,
  name,
  academy,
  score,
  onChangeScore,
  interactive,
  publicMode = false,
  lastScoreChange = null,
}: {
  side: 'A' | 'B';
  name: string;
  academy: string;
  score: PlayerScore;
  onChangeScore: (side: 'A' | 'B', key: ScoreKey, delta: number) => void;
  interactive: boolean;
  publicMode?: boolean;
  lastScoreChange?: {
    side: 'A' | 'B';
    key: ScoreKey;
    delta: number;
  } | null;
}) {
  const themeClassName =
    side === 'A'
      ? 'bg-[linear-gradient(180deg,#fef2f2_0%,#fee2e2_100%)]'
      : 'bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_100%)]';
  const heroCardClassName =
    side === 'A'
      ? 'bg-[radial-gradient(circle_at_top,#fecaca_0%,#dc2626_45%,#7f1d1d_100%)] text-white'
      : 'bg-[radial-gradient(circle_at_top,#dbeafe_0%,#2563eb_45%,#0f172a_100%)] text-white';
  const shellClassName = publicMode
    ? 'px-6 py-7 2xl:px-8 2xl:py-8'
    : 'px-4 py-4 sm:px-5 sm:py-5';
  const heroPaddingClassName = publicMode
    ? 'px-6 py-6 2xl:px-7 2xl:py-7'
    : 'px-4 py-4 sm:px-5 sm:py-5';
  const athleteTitleClassName = publicMode
    ? 'mt-3 text-4xl font-black leading-tight text-white xl:text-5xl 2xl:text-6xl'
    : 'mt-2 text-2xl font-black leading-tight text-white sm:text-3xl';
  const academyClassName = publicMode
    ? 'mt-3 text-lg font-semibold text-white/85 xl:text-xl'
    : 'mt-2 text-sm font-semibold text-white/80';
  const scoreCardPaddingClassName = publicMode
    ? 'mt-6 px-6 py-6 2xl:px-7 2xl:py-7'
    : 'mt-4 px-4 py-4 sm:mt-5 sm:px-5';
  const totalPointsClassName = publicMode
    ? 'mt-3 text-8xl font-black leading-none xl:text-[7rem] 2xl:text-[8.5rem]'
    : 'mt-2 text-5xl font-black sm:text-6xl';
  const statsGridClassName = publicMode ? 'mt-5 gap-4' : 'mt-4 gap-3';
  const statCardClassName = publicMode
    ? 'px-4 py-4 2xl:px-5 2xl:py-5'
    : 'px-3 py-3';
  const statLabelClassName = publicMode
    ? 'text-sm font-black uppercase tracking-[0.18em] text-white/70 xl:text-base'
    : 'text-[11px] font-black uppercase tracking-[0.16em] text-white/65';
  const statValueClassName = publicMode
    ? 'mt-2 text-4xl font-black text-white xl:text-5xl 2xl:text-6xl'
    : 'mt-1 text-2xl font-black text-white';

  return (
    <section className={`min-h-0 overflow-y-auto ${shellClassName} ${themeClassName}`}>
      <div
        className={`rounded-[28px] border-4 border-slate-900 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)] ${heroPaddingClassName} ${heroCardClassName}`}
      >
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">
          Atleta {side}
        </p>
        <h3 className={athleteTitleClassName}>{name}</h3>
        <p className={academyClassName}>{academy}</p>

        <div
          className={`rounded-[24px] border-4 border-white/60 bg-slate-950/35 text-center text-white backdrop-blur-sm ${scoreCardPaddingClassName}`}
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Pontos
          </p>
          <p className={totalPointsClassName}>{totalPoints(score)}</p>
          <div className={`grid grid-cols-2 text-left ${statsGridClassName}`}>
            <div
              className={`rounded-2xl border border-white/25 bg-white/10 ${statCardClassName}`}
            >
              <p className={statLabelClassName}>Vantagem</p>
              <p className={statValueClassName}>{score.advantage}</p>
            </div>
            <div
              className={`rounded-2xl border border-white/25 bg-white/10 ${statCardClassName}`}
            >
              <p className={statLabelClassName}>Punição</p>
              <p className={statValueClassName}>{score.punishment}</p>
            </div>
          </div>
        </div>
      </div>

      {interactive ? (
        <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4">
          {pointRules.map((rule) => (
            <article
              key={rule.key}
              className={`rounded-[24px] border-4 px-4 py-4 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)] transition ${
                lastScoreChange?.side === side &&
                lastScoreChange.key === rule.key
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-slate-900 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-black text-slate-950">
                      {rule.label}
                    </p>
                    <div className="rounded-full border-2 border-slate-900 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700">
                      {rule.points} {rule.points > 1 ? 'pts' : 'pt'}
                    </div>
                    <ShortcutPill
                      label={resolveScoreShortcutLabel(side, rule.key)}
                      className="border-slate-900/20 bg-slate-900 text-white"
                    />
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs leading-4 text-slate-500">
                    {rule.description}
                  </p>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-2">
                  {lastScoreChange?.side === side &&
                  lastScoreChange.key === rule.key ? (
                    <span
                      className={`min-w-10 text-center text-sm font-black ${
                        lastScoreChange.delta > 0
                          ? 'text-emerald-700'
                          : 'text-red-700'
                      }`}
                    >
                      {lastScoreChange.delta > 0
                        ? `+${rule.points}`
                        : `-${rule.points}`}
                    </span>
                  ) : (
                    <span className="min-w-10 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                      Ação
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 min-w-9 rounded-xl border-2 border-slate-900 px-0 text-lg font-black"
                  onClick={() => onChangeScore(side, rule.key, -rule.points)}
                >
                  -
                </Button>
                <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 px-3 py-1.5 text-center">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Atual
                    </p>
                    <p className="mt-1 text-3xl font-black leading-none text-slate-950">
                      {score[rule.key]}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  className="h-9 min-w-9 rounded-xl px-0 text-lg font-black"
                  onClick={() => onChangeScore(side, rule.key, rule.points)}
                >
                  +
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SponsorSlot({
  sponsor,
  variant,
  compact = false,
}: {
  sponsor?: { title: string; imageUrl?: string };
  variant: 'left' | 'center' | 'right';
  compact?: boolean;
}) {
  if (!sponsor) {
    return null;
  }

  const toneClassName =
    variant === 'left'
      ? 'from-amber-50 via-white to-orange-50'
      : variant === 'right'
        ? 'from-sky-50 via-white to-blue-50'
        : 'from-slate-50 via-white to-slate-100';

  return (
    <div
      className={`rounded-[24px] border-4 border-dashed border-slate-400 bg-gradient-to-r ${toneClassName} ${
        compact ? 'min-h-[5.5rem] px-4 py-3' : 'min-h-[7rem] px-5 py-4'
      } text-center shadow-[6px_6px_0_0_rgba(15,23,42,0.16)]`}
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {sponsor.title}
      </p>
      {sponsor.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sponsor.imageUrl}
          alt={sponsor.title}
          className={`mx-auto mt-3 object-contain ${
            compact ? 'max-h-10' : 'max-h-16'
          }`}
        />
      ) : (
        <p
          className={`mt-2 font-semibold text-slate-700 ${
            compact ? 'text-sm' : 'text-base'
          }`}
        >
          Banner configurado sem imagem
        </p>
      )}
    </div>
  );
}

function PublicIdleState() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div className="max-w-4xl rounded-[32px] border-4 border-slate-900 bg-white px-10 py-12 text-center shadow-[10px_10px_0_0_rgba(15,23,42,0.95)]">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
          Aguardando chamada
        </p>
        <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
          A próxima luta iniciará em instantes
        </h2>
      </div>
    </div>
  );
}

function TimerHero({
  remainingSeconds,
  durationSeconds,
}: {
  remainingSeconds: number;
  durationSeconds: number;
}) {
  return (
    <div className="rounded-[32px] border-4 border-amber-300 bg-amber-50 px-5 py-10 text-center text-slate-950 shadow-[0_20px_48px_rgba(245,158,11,0.24)] xl:px-6 xl:py-12 2xl:px-7 2xl:py-14">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500 xl:text-base">
        Tempo restante
      </p>
      <p className="mt-5 font-mono text-[6rem] font-black leading-none tracking-[-0.08em] sm:text-[7.5rem] xl:text-[8.5rem] 2xl:text-[10rem]">
        {formatTime(remainingSeconds)}
      </p>
      <p className="mt-5 text-base font-semibold text-slate-500 xl:text-lg 2xl:text-xl">
        Duração configurada: {formatTime(durationSeconds)}
      </p>
    </div>
  );
}

function WinnerOverlay({
  isVisible,
  toneClassName,
  winnerName,
  reason,
}: {
  isVisible: boolean;
  toneClassName: string;
  winnerName: string;
  reason: string;
}) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center px-6 text-white ${toneClassName}`}
    >
      <div className="w-full max-w-4xl animate-[overlayReveal_700ms_ease-out_forwards] rounded-[36px] border-4 border-white/60 bg-slate-950/55 px-8 py-10 text-center shadow-[0_30px_120px_rgba(15,23,42,0.55)] backdrop-blur-md">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-white/75">
          Resultado Final
        </p>
        <h2 className="mt-5 animate-[winnerPulse_1300ms_ease-in-out_infinite] text-5xl font-black tracking-tight sm:text-7xl">
          {winnerName}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/85 sm:text-2xl">
          {reason}
        </p>
      </div>
    </div>
  );
}

function WinnerOverlayStyles() {
  return (
    <style jsx>{`
      @keyframes overlayReveal {
        0% {
          opacity: 0;
          transform: scale(0.88) translateY(28px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      @keyframes winnerPulse {
        0%,
        100% {
          transform: scale(1);
          text-shadow: 0 0 0 rgba(255, 255, 255, 0);
        }
        50% {
          transform: scale(1.035);
          text-shadow: 0 0 28px rgba(255, 255, 255, 0.35);
        }
      }
    `}</style>
  );
}

function resolveScoreShortcutLabel(side: 'A' | 'B', key: ScoreKey) {
  const shortcut = operatorScoreShortcuts.find(
    (item) => item.side === side && item.scoreKey === key,
  );
  return shortcut?.label ?? '-';
}

function ShortcutPill({
  label,
  className = '',
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex min-h-8 items-center justify-center rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-950 shadow-[2px_2px_0_0_rgba(15,23,42,0.18)] ${className}`}
    >
      {label}
    </span>
  );
}

function QuickActionCard({
  title,
  subtitle,
  shortcut,
  onClick,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  shortcut: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-[20px] border-2 border-slate-700 bg-slate-900 px-4 py-4 text-left transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">{title}</p>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
        <ShortcutPill label={shortcut} />
      </div>
    </button>
  );
}

function ShortcutLegend({
  shortcut,
  description,
}: {
  shortcut: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-900 bg-white px-3 py-2 shadow-[3px_3px_0_0_rgba(15,23,42,0.16)]">
      <p className="text-base font-black text-slate-950">{shortcut}</p>
      <p className="mt-1 text-xs leading-4 text-slate-700">{description}</p>
    </div>
  );
}
