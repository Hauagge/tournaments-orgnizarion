export const weighInStatusOptions = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const;

export type WeighInStatus = (typeof weighInStatusOptions)[number];

export type Athlete = {
  id: string;
  name: string;
  belt: string;
  birthDate: string | null;
  age: number | null;
  declaredWeight: number | null;
  realWeightGrams: number | null;
  teamId: string | null;
  team: string;
  weighInStatus: string;
};

export type AthletePayload = {
  name: string;
  belt: string;
  birthDate: string;
  declaredWeight: number;
  team: string;
  weighInStatus?: WeighInStatus;
};

export type AthleteUpdatePayload = Partial<AthletePayload>;

export type AthleteApiResponse =
  | unknown[]
  | {
      data?: unknown[];
      athletes?: unknown[];
      items?: unknown[];
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

function readNullableString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
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

function gramsToKilograms(value: number | null) {
  if (value === null) return null;
  return value / 1000;
}

function readTeamLabel(record: Record<string, unknown>, teamId: string | null) {
  const explicitTeam = readString(record, [
    'team',
    'teamName',
    'academy',
    'equipe',
  ]);

  if (explicitTeam) {
    return explicitTeam;
  }

  if (teamId) {
    return `Equipe #${teamId}`;
  }

  return '';
}

export function calculateAge(date: string | null) {
  if (!date) return null;

  const birthDate = new Date(date);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function normalizeAthlete(input: unknown): Athlete {
  const record = isObject(input) ? input : {};
  const birthDate = readNullableString(record, [
    'birthDate',
    'dateOfBirth',
    'dob',
    'dataNascimento',
  ]);
  const rawAge = readNumber(record, ['age', 'idade']);
  const declaredWeightGrams = readNumber(record, [
    'declaredWeightGrams',
    'pesoDeclaradoGramas',
  ]);
  const teamId = readIdentifier(record, ['teamId']);

  return {
    id: readIdentifier(record, ['id', '_id']) || crypto.randomUUID(),
    name: readString(record, ['name', 'nome', 'fullName']),
    belt: readString(record, ['belt', 'faixa']),
    birthDate,
    age: calculateAge(birthDate) ?? rawAge,
    declaredWeight:
      readNumber(record, ['declaredWeight', 'weight', 'pesoDeclarado', 'peso']) ??
      gramsToKilograms(declaredWeightGrams),
    realWeightGrams: readNumber(record, [
      'realWeightGrams',
      'actualWeightGrams',
      'weightInGrams',
      'pesoRealGramas',
      'pesoAferidoGramas',
    ]),
    teamId,
    team: readTeamLabel(record, teamId),
    weighInStatus:
      readString(record, [
        'weighInStatus',
        'weighingStatus',
        'statusPesagem',
        'status',
      ]) || 'PENDING',
  };
}

export function normalizeAthletesResponse(
  response: AthleteApiResponse,
): Athlete[] {
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.athletes)
    ? response.athletes
    : Array.isArray(response?.items)
    ? response.items
    : [];

  return items.map(normalizeAthlete);
}

export function getWeighInStatusLabel(status: string) {
  switch (status) {
    case 'APPROVED':
      return 'Aprovada';
    case 'REJECTED':
      return 'Reprovada';
    case 'PENDING':
      return 'Pendente';
    default:
      return status;
  }
}
