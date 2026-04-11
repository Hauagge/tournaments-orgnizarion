import { Athlete, normalizeAthlete } from '@/features/athletes/types/athlete';

export const fightStatusOptions = [
  'SCHEDULED',
  'IN_PROGRESS',
  'FINISHED',
] as const;

export type FightStatus = (typeof fightStatusOptions)[number];

export type FightParticipant = Athlete | null;

export type Fight = {
  id: string;
  status: FightStatus;
  areaId: string | null;
  areaName: string;
  categoryName: string;
  categoryId: string | null;
  order: number | null;
  winType: string;
  winnerId: string | null;
  athleteA: FightParticipant;
  athleteB: FightParticipant;
  keyGroupId: string | null;
  keyGroupName: string;
  teamMatchId: string | null;
  teamMatchName: string;
  teamAName: string;
  teamBName: string;
  scheduledAt: string | null;
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

export type HighlightedFight = {
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


type FightApiItem = {
  id?: string | number | null;
  competitionId?: string | number | null;
  categoryId?: string | number | null;
  categoryName?: string | null;
  keyGroupId?: string | number | null;
  keyGroupName?: string | null;
  areaId?: string | number | null;
  areaName?: string | null;
  status?: string | null;
  athleteAId?: string | number | null;
  athleteAName?: string | null;
  academyAName?: string | null;
  athleteBId?: string | number | null;
  athleteBName?: string | null;
  academyBName?: string | null;
  winnerId?: string | number | null;
  winnerAthleteId?: string | number | null;
  winnerAthleteName?: string | null;
  winType?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  scheduledAt?: string | null;
  orderIndex?: number | string | null;
};

export type FightApiResponse = {
  data?: FightApiItem[];
  error?: unknown;
};

export type FinishFightPayload = {
  winnerId: string;
  winType: string;
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
    case 'IN_PROGRESS':
    case 'RUNNING':
      return 'IN_PROGRESS';
    case 'FINISHED':
    case 'DONE':
    case 'COMPLETED':
      return 'FINISHED';
    default:
      return 'SCHEDULED';
  }
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
    status: normalizeFightStatus(readString(record, ['status', 'fightStatus'])),
    areaId: readIdentifier(record, ['areaId']),
    areaName: readString(record, ['areaName', 'area', 'matName']),
    categoryName: readString(record, [
      'categoryName',
      'category',
      'divisionName',
    ]),
    categoryId: readIdentifier(record, ['categoryId']),
    order: readNumber(record, ['order', 'orderIndex', 'fightOrder', 'sequence']),
    winType: readString(record, ['winType', 'victoryType', 'resultType']),
    winnerId: readIdentifier(record, ['winnerId', 'winnerAthleteId']),
    athleteA,
    athleteB,
    keyGroupId,
    keyGroupName:
      readString(record, [
        'keyGroupName',
        'bracketName',
        'bracketGroupName',
        'podName',
        'groupName',
      ]) || (keyGroupId ? `Chave ${keyGroupId}` : ''),
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
    scheduledAt:
      readString(record, ['scheduledAt', 'startedAt', 'date', 'startsAt']) || null,
  };
}

export function normalizeFightsResponse(response: FightApiResponse): Fight[] {
  const items = Array.isArray(response?.data) ? response.data : [];

  return items.map(normalizeFight);
}

export function getFightStatusLabel(status: FightStatus) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'Em andamento';
    case 'FINISHED':
      return 'Finalizada';
    default:
      return 'Agendada';
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
