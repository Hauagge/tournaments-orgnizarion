export const athleteImportCsvColumns = [
  'Nome',
  'Faixa',
  'Peso',
  'Equipe',
  'Idade',
  'Sexo',
  'Data de Nasc',
] as const;

export type AthleteImportPreviewRow = {
  line: number;
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
};

export type AthleteImportSummary = {
  imported: number;
  failed: number;
  reasons: string[];
};

type PreviewResponse =
  | {
      rows?: unknown[];
      data?: unknown[] | { rows?: unknown[] };
      preview?: unknown[];
      validCount?: number;
      invalidCount?: number;
    }
  | unknown[];

type ImportResponse = {
  imported?: number;
  successCount?: number;
  created?: number;
  failed?: number;
  failureCount?: number;
  rejected?: number;
  reasons?: unknown[];
  errors?: unknown[];
  failures?: unknown[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function readRecordValue(
  record: Record<string, unknown>,
  keys: readonly string[],
) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
  }

  return '';
}

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function normalizeRowData(record: Record<string, unknown>) {
  const dataCandidate = isObject(record.data)
    ? record.data
    : isObject(record.raw)
      ? record.raw
      : isObject(record.row)
        ? record.row
        : isObject(record.values)
          ? record.values
          : record;

  return athleteImportCsvColumns.reduce<Record<string, string>>((acc, key) => {
    switch (key) {
      case 'Nome':
        acc[key] = readRecordValue(dataCandidate, ['Nome', 'nome']);
        break;
      case 'Faixa':
        acc[key] = readRecordValue(dataCandidate, ['Faixa', 'faixa']);
        break;
      case 'Peso':
        acc[key] = readRecordValue(dataCandidate, ['Peso', 'peso']);
        break;
      case 'Equipe':
        acc[key] = readRecordValue(dataCandidate, ['Equipe', 'equipe']);
        break;
      case 'Idade':
        acc[key] = readRecordValue(dataCandidate, ['Idade', 'idade']);
        break;
      case 'Sexo':
        acc[key] = readRecordValue(dataCandidate, ['Sexo', 'sexo']);
        break;
      case 'Data de Nasc':
        acc[key] = readRecordValue(dataCandidate, [
          'Data de Nasc',
          'datadenasc',
          'dataDeNasc',
          'dataNascimento',
        ]);
        break;
      default:
        acc[key] = readString(dataCandidate[key]);
    }

    return acc;
  }, {});
}

function normalizeRow(input: unknown, index: number): AthleteImportPreviewRow {
  const record = isObject(input) ? input : {};
  const errorsRaw = Array.isArray(record.errors)
    ? record.errors
    : Array.isArray(record.issues)
      ? record.issues
      : Array.isArray(record.messages)
        ? record.messages
        : [];

  const errors = errorsRaw
    .map((item) => {
      if (typeof item === 'string') return item;
      if (isObject(item)) return readString(item.message);
      return '';
    })
    .filter(Boolean);

  const explicitValid =
    typeof record.isValid === 'boolean'
      ? record.isValid
      : typeof record.valid === 'boolean'
        ? record.valid
        : undefined;

  return {
    line: readNumber(
      record.line,
      readNumber(record.lineNumber, readNumber(record.rowNumber, index + 1)),
    ),
    data: normalizeRowData(record),
    errors,
    isValid: explicitValid ?? errors.length === 0,
  };
}

export function normalizePreviewResponse(
  response: PreviewResponse,
): AthleteImportPreviewRow[] {
  const nestedData =
    isObject(response) && isObject(response.data) ? response.data : null;

  const rows = Array.isArray(response)
    ? response
    : nestedData && Array.isArray(nestedData.rows)
      ? nestedData.rows
      : isObject(response) && Array.isArray(response.rows)
        ? response.rows
        : isObject(response) && Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.preview)
            ? response.preview
            : [];

  return rows.map(normalizeRow);
}

export function normalizeImportSummary(
  response: ImportResponse,
): AthleteImportSummary {
  const reasonsRaw = Array.isArray(response.reasons)
    ? response.reasons
    : Array.isArray(response.errors)
      ? response.errors
      : Array.isArray(response.failures)
        ? response.failures
        : [];

  const reasons = reasonsRaw
    .map((item) => {
      if (typeof item === 'string') return item;
      if (isObject(item)) {
        return readString(item.reason) || readString(item.message);
      }
      return '';
    })
    .filter(Boolean);

  return {
    imported:
      readNumber(response.imported) ||
      readNumber(response.successCount) ||
      readNumber(response.created),
    failed:
      readNumber(response.failed) ||
      readNumber(response.failureCount) ||
      readNumber(response.rejected),
    reasons,
  };
}
