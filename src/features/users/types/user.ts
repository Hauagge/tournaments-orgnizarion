export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'USER';

export type SystemUser = {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  role: UserRole | string;
  createdAt?: string;
  updatedAt?: string;
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
  const value = readString(record, keys);
  return value || null;
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

function normalizeRole(rawRole: string): UserRole | string {
  const normalized = rawRole.trim().toUpperCase();

  if (normalized === 'ADMIN') return 'ADMIN';
  if (normalized === 'MANAGER') return 'MANAGER';
  if (normalized === 'STAFF') return 'STAFF';
  if (normalized === 'USER') return 'USER';

  return normalized || 'USER';
}

function extractItems(input: unknown): unknown[] {
  if (Array.isArray(input)) {
    return input;
  }

  if (!isObject(input)) {
    return [];
  }

  if (Array.isArray(input.data)) {
    return input.data;
  }

  if (isObject(input.data) && Array.isArray(input.data.items)) {
    return input.data.items;
  }

  if (Array.isArray(input.items)) {
    return input.items;
  }

  if (Array.isArray(input.users)) {
    return input.users;
  }

  return [];
}

export function normalizeUser(input: unknown): SystemUser {
  const record = isObject(input) ? input : {};

  return {
    id: readIdentifier(record, ['id', '_id', 'userId']) || crypto.randomUUID(),
    name:
      readString(record, ['name', 'fullName', 'userName', 'username', 'login']) ||
      'Usuário sem nome',
    email: readNullableString(record, ['email']),
    username: readNullableString(record, ['username', 'userName', 'login']),
    role: normalizeRole(readString(record, ['role', 'profile', 'type']) || 'USER'),
    createdAt: readString(record, ['createdAt']) || undefined,
    updatedAt: readString(record, ['updatedAt']) || undefined,
  };
}

export function normalizeUsersResponse(input: unknown) {
  return extractItems(input).map(normalizeUser);
}

export function getUserRoleLabel(role: string) {
  switch (role.toUpperCase()) {
    case 'ADMIN':
      return 'Administrador';
    case 'MANAGER':
      return 'Gestor';
    case 'STAFF':
      return 'Equipe';
    default:
      return 'Usuário';
  }
}
