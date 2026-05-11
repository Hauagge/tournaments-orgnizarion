import { calculateAge } from '@/features/athletes/lib/calculate-age';

export const weighInStatusOptions = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const;

export type WeighInStatus = (typeof weighInStatusOptions)[number];

export const paymentStatusOptions = [
  'PAID',
  'PENDING',
  'EXEMPT',
] as const;

export type PaymentStatus = (typeof paymentStatusOptions)[number];

export type Athlete = {
  id: string;
  name: string;
  documentNumber: string;
  belt: string;
  birthDate: string | null;
  age: number | null;
  declaredWeight: number | null;
  realWeightGrams: number | null;
  academyId: string | null;
  academy: string;
  teamId: string | null;
  team: string;
  weighInStatus: string;
  paymentStatus: PaymentStatus;
};

export type AthletePayload = {
  fullName: string;
  documentNumber: string;
  belt: string;
  birthDate: string;
  declaredWeight: number;
  team: string;
  weighInStatus?: WeighInStatus;
  paymentStatus?: PaymentStatus;
};

export type AthleteUpdatePayload = Partial<AthletePayload>;

export type AthleteApiResponse =
  | unknown[]
  | {
      data?: unknown[];
      athletes?: unknown[];
      items?: unknown[];
    };

type AthleteDetailResponse =
  | unknown
  | {
      data?: unknown;
      athlete?: unknown;
      item?: unknown;
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

function normalizeWeightToKilograms(value: number | null) {
  if (value === null) return null;

  // Values above 100000 are most likely stored in milligrams.
  if (value >= 100000) {
    return value / 1_000_000;
  }

  // Values above a realistic athlete weight are most likely stored in grams.
  if (value > 250) {
    return value / 1000;
  }

  return value;
}

function readAcademyLabel(
  record: Record<string, unknown>,
  academyId: string | null,
) {
  const explicitAcademy = readString(record, [
    'academy',
    'academyName',
    'team',
    'teamName',
    'equipe',
  ]);

  if (explicitAcademy) {
    return explicitAcademy;
  }

  if (academyId) {
    return `Academia #${academyId}`;
  }

  return '';
}

function normalizePaymentStatus(value: string): PaymentStatus {
  if (value === 'PAID' || value === 'PENDING' || value === 'EXEMPT') {
    return value;
  }

  return 'PENDING';
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
  const academyId =
    readIdentifier(record, ['academyId', 'teamId']) ??
    readIdentifier(record, ['teamId']);
  const academy = readAcademyLabel(record, academyId);

  return {
    id: readIdentifier(record, ['id', '_id', 'athleteId']) || crypto.randomUUID(),
    name: readString(record, ['name', 'nome', 'fullName']),
    documentNumber: readString(record, [
      'documentNumber',
      'document',
      'rg',
      'documento',
    ]),
    belt: readString(record, ['belt', 'faixa']),
    birthDate,
    age: calculateAge(birthDate) ?? rawAge,
    declaredWeight: normalizeWeightToKilograms(
      readNumber(record, [
        'declaredWeight',
        'weight',
        'pesoDeclarado',
        'peso',
      ]) ?? gramsToKilograms(declaredWeightGrams),
    ),
    realWeightGrams: readNumber(record, [
      'realWeightGrams',
      'actualWeightGrams',
      'weightInGrams',
      'pesoRealGramas',
      'pesoAferidoGramas',
    ]),
    academyId,
    academy,
    teamId: academyId,
    team: academy,
    weighInStatus:
      readString(record, [
        'weighInStatus',
        'weighingStatus',
        'statusPesagem',
        'status',
      ]) || 'PENDING',
    paymentStatus: normalizePaymentStatus(
      readString(record, [
        'paymentStatus',
        'registrationPaymentStatus',
        'statusPagamento',
      ]) || 'PENDING',
    ),
  };
}

export function normalizeAthleteDetail(response: AthleteDetailResponse): Athlete {
  const record = isObject(response) ? response : {};

  if (isObject(record.data)) {
    return normalizeAthlete(record.data);
  }

  if (isObject(record.athlete)) {
    return normalizeAthlete(record.athlete);
  }

  if (isObject(record.item)) {
    return normalizeAthlete(record.item);
  }

  return normalizeAthlete(response);
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

export function getPaymentStatusLabel(status: string) {
  switch (status) {
    case 'PAID':
      return 'PAGO';
    case 'EXEMPT':
      return 'ISENTO';
    case 'PENDING':
      return 'PENDENTE';
    default:
      return status;
  }
}
