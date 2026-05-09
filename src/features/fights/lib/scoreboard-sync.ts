'use client';

import { Fight } from '@/features/fights/types/fight';

export type PlayerScore = {
  mounted: number;
  guard: number;
  overthrow: number;
  advantage: number;
  punishment: number;
};

export type ScoreboardState = {
  durationSeconds: number;
  remainingSeconds: number;
  running: boolean;
  playerA: PlayerScore;
  playerB: PlayerScore;
};

export type FightSnapshot = {
  id: string;
  athleteAName: string;
  athleteAAcademy: string;
  athleteBName: string;
  athleteBAcademy: string;
  categoryName: string;
  areaId: string | null;
  areaName: string;
};

export type StoredScoreboardPayload = {
  version: number;
  fight: FightSnapshot | null;
  scoreboard: ScoreboardState;
};

export type WinnerAnnouncement = {
  winner: 'A' | 'B' | null;
  reason: string;
};

export type AreaScoreboardPayload = {
  version: number;
  areaId: string;
  status: 'IDLE' | 'ACTIVE';
  fight: FightSnapshot | null;
  scoreboard: ScoreboardState | null;
  announcement?: WinnerAnnouncement | null;
};

export const FIGHT_STORAGE_KEY_PREFIX = 'fight-scoreboard';
export const AREA_STORAGE_KEY_PREFIX = 'area-scoreboard';
export const SCOREBOARD_CHANNEL_NAME = 'fight-scoreboard-sync';

export function buildEmptyPlayerScore(): PlayerScore {
  return {
    mounted: 0,
    guard: 0,
    overthrow: 0,
    advantage: 0,
    punishment: 0,
  };
}

export function buildInitialScoreboardState(
  durationSeconds: number,
): ScoreboardState {
  return {
    durationSeconds,
    remainingSeconds: durationSeconds,
    running: false,
    playerA: buildEmptyPlayerScore(),
    playerB: buildEmptyPlayerScore(),
  };
}

export function buildFightSnapshot(fight: Fight | null): FightSnapshot | null {
  if (!fight) {
    return null;
  }

  return {
    id: fight.id,
    athleteAName: fight.athleteA?.name || 'Atleta A',
    athleteAAcademy: fight.athleteA?.academy || 'Sem academia',
    athleteBName: fight.athleteB?.name || 'Atleta B',
    athleteBAcademy: fight.athleteB?.academy || 'Sem academia',
    categoryName: fight.categoryName || 'Categoria não informada',
    areaId: fight.areaId,
    areaName: fight.areaName || 'Área não informada',
  };
}

export function readFightStorageKey(fightId: string) {
  return `${FIGHT_STORAGE_KEY_PREFIX}:${fightId}`;
}

export function readAreaStorageKey(areaId: string) {
  return `${AREA_STORAGE_KEY_PREFIX}:${areaId}`;
}

export function clearAreaScoreboardState(areaId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: AreaScoreboardPayload = {
    version: Date.now(),
    areaId,
    status: 'IDLE',
    fight: null,
    scoreboard: null,
    announcement: null,
  };

  window.localStorage.setItem(readAreaStorageKey(areaId), JSON.stringify(payload));

  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel(SCOREBOARD_CHANNEL_NAME);
    channel.postMessage({
      source: 'operator',
      areaId,
      payload,
    });
    channel.close();
  }
}
