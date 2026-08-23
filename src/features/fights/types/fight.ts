import { Athlete, normalizeAthlete } from '@/features/athletes/types/athlete';

export const fightStatusOptions = [
  'PENDING',
  'IN_PROGRESS',
  'FINISHED',
] as const;

export type FightStatus = (typeof fightStatusOptions)[number];
export type FightParticipant = Athlete | null;
export type FightSlot = 'A' | 'B';

export type Fight = {
  id: string;
  competitionId: string | null;
  status: FightStatus;
  categoryId: string | null;
  categoryName: string;
  keyGroupId: string | null;
  keyGroupName: string;
  round: number | null;
  order: number | null;
  areaId: string | null;
  areaName: string;
  athleteA: FightParticipant;
  athleteB: FightParticipant;
  winner: FightParticipant;
  winnerId: string | null;
  loser: FightParticipant;
  loserId: string | null;
  winType: string;
  nextFightId: string | null;
  nextFightSlot: FightSlot | null;
  createdManually: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  teamMatchId: string | null;
  teamMatchName: string;
  teamAName: string;
  teamBName: string;
};

export type FightFilters = {
  search?: string;
  categoryId?: string;
  status?: FightStatus;
  round?: number;
  areaId?: string;
};

export type CreateFightPayload = {
  categoryId?: string | null;
  categoryName?: string;
  keyGroupId?: string | null;
  round: number | null;
  order: number | null;
  areaId?: string | null;
  athleteAId?: string | null;
  athleteBId?: string | null;
  createdManually?: boolean;
  nextFightId?: string | null;
  nextFightSlot?: FightSlot | null;
};

export type UpdateFightPayload = Partial<CreateFightPayload> & {
  status?: FightStatus;
};

export type FinishFightPayload = {
  winnerId: string;
  winType: string;
  allowOverride?: boolean;
};

export type FightOrderItem = {
  fightId: number;
  orderIndex: number;
};

export type UpdateFightOrderPayload = {
  items: FightOrderItem[];
};

export type UpdateFightOrderResponse = {
  competitionId: string;
  totalUpdated: number;
  items: FightOrderItem[];
};

export type QueueFight = {
  queueItemId: number;
  fightId: number;
  position: number;
  queueStatus: string;
  fightStatus: string;
  athleteAId: number;
  athleteAName: string;
  athleteBId: number;
  athleteBName: string;
  keyGroupId: number;
  orderIndex: number;
};

export type HighlightedFight = QueueFight;

type FightApiItem = {
  id?: string | number | null;
  _id?: string | number | null;
  competitionId?: string | number | null;
  categoryId?: string | number | null;
  categoryName?: string | null;
  keyGroupId?: string | number | null;
  keyGroupName?: string | null;
  areaId?: string | number | null;
  areaName?: string | null;
  area?: string | null;
  status?: string | null;
  athleteAId?: string | number | null;
  athleteAName?: string | null;
  academyAName?: string | null;
  athleteBId?: string | number | null;
  athleteBName?: string | null;
  academyBName?: string | null;
  winnerId?: string | number | null;
  winnerAthleteId?: string | number | null;
  winnerName?: string | null;
  winnerAthleteName?: string | null;
  loserId?: string | number | null;
  loserAthleteId?: string | number | null;
  loserName?: string | null;
  loserAthleteName?: string | null;
  winType?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  scheduledAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  orderIndex?: number | string | null;
  round?: number | string | null;
  roundNumber?: number | string | null;
  sequence?: number | string | null;
  nextFightId?: string | number | null;
  nextMatchId?: string | number | null;
  nextFightSlot?: string | null;
  nextSlot?: string | null;
  slot?: string | null;
  createdManually?: boolean | null;
  manual?: boolean | null;
  isWo?: boolean | null;
  athleteA?: unknown;
  athleteB?: unknown;
  winner?: unknown;
  loser?: unknown;
  teamMatchId?: string | number | null;
  matchId?: string | number | null;
  groupId?: string | number | null;
  confrontationId?: string | number | null;
  teamMatchName?: string | null;
  matchName?: string | null;
  confrontationName?: string | null;
  teamAName?: string | null;
  teamBName?: string | null;
};

export type FightApiResponse = {
  data?: FightApiItem[];
  error?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return '';
}

function readIdentifier(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readBoolean(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return false;
}

function readObject(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (isObject(value)) {
      return value;
    }
  }

  return null;
}

function normalizeFightStatus(rawStatus: string): FightStatus {
  switch (rawStatus.toUpperCase()) {
    case 'STARTED':
    case 'RUNNING':
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'FINISHED':
    case 'DONE':
    case 'COMPLETED':
      return 'FINISHED';
    default:
      return 'PENDING';
  }
}

function normalizeFightSlot(value: string): FightSlot | null {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'A' || normalized === 'B') {
    return normalized;
  }

  return null;
}

function normalizeParticipant(
  record: Record<string, unknown>,
  objectKeys: string[],
  idKeys: string[],
  nameKeys: string[],
  academyKeys: string[],
): FightParticipant {
  const nestedObject = readObject(record, objectKeys);
  if (nestedObject) {
    return normalizeAthlete(nestedObject);
  }

  const name = readString(record, nameKeys);
  const id = readIdentifier(record, idKeys);
  const academy = readString(record, academyKeys);

  if (!name && !id && !academy) {
    return null;
  }

  return normalizeAthlete({
    id: id || crypto.randomUUID(),
    name: name || 'Atleta',
    academy,
    academyName: academy,
    team: academy,
    teamName: academy,
  });
}

function resolveParticipantById(
  participantA: FightParticipant,
  participantB: FightParticipant,
  winnerId: string | null,
  fallback: FightParticipant,
) {
  if (!winnerId) {
    return fallback;
  }

  if (participantA?.id === winnerId) {
    return participantA;
  }

  if (participantB?.id === winnerId) {
    return participantB;
  }

  return fallback;
}

function resolveLoser(
  athleteA: FightParticipant,
  athleteB: FightParticipant,
  winnerId: string | null,
  fallbackLoser: FightParticipant,
) {
  if (!winnerId) {
    return fallbackLoser;
  }

  if (athleteA?.id === winnerId) {
    return athleteB;
  }

  if (athleteB?.id === winnerId) {
    return athleteA;
  }

  return fallbackLoser;
}

export function normalizeFight(input: unknown): Fight {
  const record = isObject(input) ? input : {};
  const athleteA = normalizeParticipant(
    record,
    ['athleteA', 'fighterA', 'redAthlete', 'homeAthlete'],
    ['athleteAId', 'fighterAId', 'redAthleteId', 'homeAthleteId'],
    ['athleteAName', 'fighterAName', 'redAthleteName', 'homeAthleteName'],
    ['academyAName', 'athleteAAcademy', 'fighterAAcademy', 'redAthleteAcademy'],
  );
  const athleteB = normalizeParticipant(
    record,
    ['athleteB', 'fighterB', 'blueAthlete', 'awayAthlete'],
    ['athleteBId', 'fighterBId', 'blueAthleteId', 'awayAthleteId'],
    ['athleteBName', 'fighterBName', 'blueAthleteName', 'awayAthleteName'],
    ['academyBName', 'athleteBAcademy', 'fighterBAcademy', 'blueAthleteAcademy'],
  );
  const winnerId = readIdentifier(record, ['winnerId', 'winnerAthleteId']);
  const loserId = readIdentifier(record, ['loserId', 'loserAthleteId']);
  const winnerFallback = normalizeParticipant(
    record,
    ['winner'],
    ['winnerId', 'winnerAthleteId'],
    ['winnerName', 'winnerAthleteName'],
    [],
  );
  const loserFallback = normalizeParticipant(
    record,
    ['loser'],
    ['loserId', 'loserAthleteId'],
    ['loserName', 'loserAthleteName'],
    [],
  );
  const teamMatchId = readIdentifier(record, [
    'teamMatchId',
    'matchId',
    'groupId',
    'confrontationId',
  ]);
  const keyGroupId =
    readIdentifier(record, [
      'keyGroupId',
      'bracketId',
      'bracketGroupId',
      'podId',
      'groupId',
    ]) || teamMatchId;

  return {
    id: readIdentifier(record, ['id', '_id']) || crypto.randomUUID(),
    competitionId: readIdentifier(record, ['competitionId']),
    status: normalizeFightStatus(readString(record, ['status', 'fightStatus'])),
    categoryId: readIdentifier(record, ['categoryId']),
    categoryName: readString(record, [
      'categoryName',
      'category',
      'divisionName',
    ]),
    keyGroupId,
    keyGroupName:
      readString(record, [
        'keyGroupName',
        'bracketName',
        'bracketGroupName',
        'podName',
        'groupName',
      ]) || (keyGroupId ? `Chave ${keyGroupId}` : ''),
    round: readNumber(record, ['round', 'roundNumber']),
    order: readNumber(record, ['order', 'orderIndex', 'fightOrder', 'sequence']),
    areaId: readIdentifier(record, ['areaId']),
    areaName: readString(record, ['areaName', 'area', 'matName']),
    athleteA,
    athleteB,
    winner: resolveParticipantById(athleteA, athleteB, winnerId, winnerFallback),
    winnerId,
    loser: resolveLoser(athleteA, athleteB, winnerId, loserFallback),
    loserId,
    winType: readString(record, ['winType', 'victoryType', 'resultType']),
    nextFightId: readIdentifier(record, ['nextFightId', 'nextMatchId']),
    nextFightSlot: normalizeFightSlot(
      readString(record, ['nextFightSlot', 'nextSlot', 'slot']),
    ),
    createdManually: readBoolean(record, ['createdManually', 'manual']),
    createdAt: readString(record, ['createdAt']) || null,
    updatedAt: readString(record, ['updatedAt']) || null,
    scheduledAt:
      readString(record, ['scheduledAt', 'date', 'startsAt']) || null,
    startedAt: readString(record, ['startedAt']) || null,
    finishedAt: readString(record, ['finishedAt']) || null,
    teamMatchId,
    teamMatchName:
      readString(record, ['teamMatchName', 'matchName', 'confrontationName']) ||
      (teamMatchId ? `Confronto ${teamMatchId}` : ''),
    teamAName:
      readString(record, ['teamAName', 'homeTeamName', 'academyAName']) ||
      athleteA?.team ||
      athleteA?.academy ||
      '-',
    teamBName:
      readString(record, ['teamBName', 'awayTeamName', 'academyBName']) ||
      athleteB?.team ||
      athleteB?.academy ||
      '-',
  };
}

export function normalizeFightsResponse(response: FightApiResponse): Fight[] {
  const items = Array.isArray(response?.data) ? response.data : [];
  return items.map(normalizeFight);
}

export function normalizeUpdateFightOrderResponse(
  response: unknown,
): UpdateFightOrderResponse {
  const record = isObject(response) ? response : {};
  const data = readObject(record, ['data']) ?? {};
  const items = Array.isArray(data.items) ? data.items : [];

  return {
    competitionId:
      readIdentifier(data, ['competitionId', 'competition_id']) || '',
    totalUpdated: readNumber(data, ['totalUpdated']) ?? 0,
    items: items.map((item) => {
      const itemRecord = isObject(item) ? item : {};

      return {
        fightId: readNumber(itemRecord, ['fightId', 'fight_id']) ?? 0,
        orderIndex: readNumber(itemRecord, ['orderIndex', 'order']) ?? 0,
      };
    }),
  };
}

export function getFightStatusLabel(status: FightStatus) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'Em andamento';
    case 'FINISHED':
      return 'Finalizada';
    default:
      return 'Pendente';
  }
}

export function getFightStatusBadgeClassName(status: FightStatus) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'inline-flex rounded-full border-2 border-blue-900 bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-blue-900';
    case 'FINISHED':
      return 'inline-flex rounded-full border-2 border-emerald-900 bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-900';
    default:
      return 'inline-flex rounded-full border-2 border-amber-900 bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-900';
  }
}

export function getFightRoundLabel(round: number | null) {
  if (round === null || round < 1) {
    return 'Sem rodada';
  }

  if (round === 1) {
    return 'Rodada 1';
  }

  return `Rodada ${round}`;
}

export function resolveFightWinnerName(fight: Fight) {
  return fight.winner?.name || '-';
}

export function resolveFightLabel(fight: Fight) {
  return `${fight.athleteA?.name || 'A definir'} vs ${fight.athleteB?.name || 'A definir'}`;
}
