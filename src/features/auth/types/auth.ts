export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResult = {
  token: string;
  username: string;
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

export function normalizeLoginResponse(response: unknown): LoginResult {
  const root = isObject(response) ? response : {};
  const data = isObject(root.data) ? root.data : root;
  const token = readString(data, ['token', 'accessToken', 'jwt']);
  const username = readString(data, ['username', 'userName', 'login', 'name']) || 'Usuário';

  if (!token) {
    throw new Error('Resposta de login inválida: token não encontrado.');
  }

  return { token, username };
}
