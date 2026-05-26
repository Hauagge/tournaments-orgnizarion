import { Fight, FightParticipant, FightSlot } from '@/features/fights/types/fight';

type AdvanceWinnerOptions = {
  fightId: string;
  winnerId: string;
  allowOverride?: boolean;
  winType?: string;
};

function cloneParticipant(participant: FightParticipant): FightParticipant {
  if (!participant) {
    return null;
  }

  return { ...participant };
}

function cloneFight(fight: Fight): Fight {
  return {
    ...fight,
    athleteA: cloneParticipant(fight.athleteA),
    athleteB: cloneParticipant(fight.athleteB),
    winner: cloneParticipant(fight.winner),
    loser: cloneParticipant(fight.loser),
  };
}

function getParticipantById(fight: Fight, athleteId: string) {
  if (fight.athleteA?.id === athleteId) {
    return fight.athleteA;
  }

  if (fight.athleteB?.id === athleteId) {
    return fight.athleteB;
  }

  return null;
}

function getOpponentByWinnerId(fight: Fight, athleteId: string) {
  if (fight.athleteA?.id === athleteId) {
    return fight.athleteB;
  }

  if (fight.athleteB?.id === athleteId) {
    return fight.athleteA;
  }

  return null;
}

function upsertParticipantAtSlot(
  fight: Fight,
  slot: FightSlot,
  participant: FightParticipant,
) {
  if (slot === 'A') {
    fight.athleteA = cloneParticipant(participant);
    return;
  }

  fight.athleteB = cloneParticipant(participant);
}

function removeParticipantIfMatches(fight: Fight, participantId: string | null) {
  if (!participantId) {
    return;
  }

  if (fight.athleteA?.id === participantId) {
    fight.athleteA = null;
  }

  if (fight.athleteB?.id === participantId) {
    fight.athleteB = null;
  }
}

function deriveNextFightSlot(order: number | null): FightSlot {
  if (!order || order % 2 === 1) {
    return 'A';
  }

  return 'B';
}

function deriveNextFightIdentity(fight: Fight) {
  if (fight.round === null || fight.order === null) {
    return null;
  }

  return {
    round: fight.round + 1,
    order: Math.ceil(fight.order / 2),
    slot: deriveNextFightSlot(fight.order),
  };
}

function ensureNextFight(
  fights: Fight[],
  currentFight: Fight,
) {
  if (currentFight.nextFightId) {
    return fights.find((fight) => fight.id === currentFight.nextFightId) ?? null;
  }

  const derived = deriveNextFightIdentity(currentFight);
  if (!derived) {
    return null;
  }

  const existing = fights.find(
    (fight) =>
      fight.categoryId === currentFight.categoryId &&
      fight.keyGroupId === currentFight.keyGroupId &&
      fight.round === derived.round &&
      fight.order === derived.order,
  );

  if (existing) {
    currentFight.nextFightId = existing.id;
    currentFight.nextFightSlot = derived.slot;

    const siblingOrder =
      derived.slot === 'A' ? (currentFight.order ?? 0) + 1 : (currentFight.order ?? 0) - 1;
    const sibling = fights.find(
      (fight) =>
        fight.id !== currentFight.id &&
        fight.categoryId === currentFight.categoryId &&
        fight.keyGroupId === currentFight.keyGroupId &&
        fight.round === currentFight.round &&
        fight.order === siblingOrder,
    );
    if (sibling) {
      sibling.nextFightId = existing.id;
      sibling.nextFightSlot = sibling.order && sibling.order % 2 === 1 ? 'A' : 'B';
    }

    return existing;
  }

  const newFight: Fight = {
    ...cloneFight(currentFight),
    id: crypto.randomUUID(),
    status: 'PENDING',
    round: derived.round,
    order: derived.order,
    athleteA: null,
    athleteB: null,
    winner: null,
    winnerId: null,
    loser: null,
    loserId: null,
    winType: '',
    nextFightId: null,
    nextFightSlot: null,
    createdManually: false,
    createdAt: currentFight.updatedAt ?? currentFight.createdAt ?? null,
    updatedAt: currentFight.updatedAt ?? currentFight.createdAt ?? null,
    startedAt: null,
    finishedAt: null,
    scheduledAt: null,
  };

  fights.push(newFight);
  currentFight.nextFightId = newFight.id;
  currentFight.nextFightSlot = derived.slot;

  const siblingOrder =
    derived.slot === 'A' ? (currentFight.order ?? 0) + 1 : (currentFight.order ?? 0) - 1;
  const sibling = fights.find(
    (fight) =>
      fight.id !== currentFight.id &&
      fight.categoryId === currentFight.categoryId &&
      fight.keyGroupId === currentFight.keyGroupId &&
      fight.round === currentFight.round &&
      fight.order === siblingOrder,
  );
  if (sibling) {
    sibling.nextFightId = newFight.id;
    sibling.nextFightSlot = sibling.order && sibling.order % 2 === 1 ? 'A' : 'B';
  }

  return newFight;
}

export function canFightBeFinished(fight: Fight) {
  return Boolean(fight.athleteA && fight.athleteB);
}

export function canFightAdvanceByWalkover(fight: Fight) {
  return Boolean((fight.athleteA && !fight.athleteB) || (!fight.athleteA && fight.athleteB));
}

export function advanceWinnerThroughBracket(
  fights: Fight[],
  options: AdvanceWinnerOptions,
) {
  const nextFights = fights.map(cloneFight);
  const currentFight = nextFights.find((fight) => fight.id === options.fightId);

  if (!currentFight) {
    throw new Error('Luta não encontrada para avanço de chave.');
  }

  const winner = getParticipantById(currentFight, options.winnerId);
  if (!winner) {
    throw new Error('O vencedor selecionado não participa desta luta.');
  }

  const hadPreviousWinner =
    currentFight.status === 'FINISHED' &&
    currentFight.winnerId &&
    currentFight.winnerId !== options.winnerId;

  if (hadPreviousWinner && !options.allowOverride) {
    throw new Error('A luta já está finalizada. Confirmação é obrigatória para alterar o vencedor.');
  }

  const previousWinnerId = currentFight.winnerId;
  const previousWinner = currentFight.winner;
  const loser = getOpponentByWinnerId(currentFight, options.winnerId);

  currentFight.status = 'FINISHED';
  currentFight.winnerId = winner.id;
  currentFight.winner = cloneParticipant(winner);
  currentFight.loserId = loser?.id ?? null;
  currentFight.loser = cloneParticipant(loser);
  currentFight.winType = options.winType ?? currentFight.winType;
  currentFight.finishedAt = currentFight.finishedAt ?? new Date().toISOString();
  currentFight.updatedAt = new Date().toISOString();

  const nextFight =
    ensureNextFight(nextFights, currentFight);
  const targetSlot = currentFight.nextFightSlot ?? deriveNextFightIdentity(currentFight)?.slot ?? null;

  if (!nextFight || !targetSlot) {
    return nextFights;
  }

  if (previousWinnerId && previousWinnerId !== winner.id) {
    removeParticipantIfMatches(nextFight, previousWinnerId);
  } else if (previousWinner?.id && previousWinner.id !== winner.id) {
    removeParticipantIfMatches(nextFight, previousWinner.id);
  }

  upsertParticipantAtSlot(nextFight, targetSlot, winner);
  nextFight.updatedAt = new Date().toISOString();

  if (nextFight.status === 'FINISHED') {
    const nextWinnerStillPresent =
      nextFight.winnerId &&
      (nextFight.athleteA?.id === nextFight.winnerId ||
        nextFight.athleteB?.id === nextFight.winnerId);
    if (!nextWinnerStillPresent) {
      nextFight.status = 'PENDING';
      nextFight.winner = null;
      nextFight.winnerId = null;
      nextFight.loser = null;
      nextFight.loserId = null;
      nextFight.finishedAt = null;
    }
  }

  return nextFights;
}
